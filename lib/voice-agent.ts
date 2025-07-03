import { toast } from 'sonner';

interface OrderItem {
  name: string;
  quantity: number;
  status: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    status: 'pending' | 'fulfilled';
  }>;
}

interface OrderCommand {
  action: 'update_status' | 'list_orders' | 'help' | 'unknown';
  orderNumber?: string;
  status?: 'pending' | 'preparing' | 'ready' | 'complete';
  confidence: number;
  response?: string;
  itemName?: string;
}

interface VoiceCommand {
  type: 'status_update' | 'list_orders' | 'unknown';
  orderNumber?: number;
  status?: 'ready' | 'completed' | 'preparing';
  confidence: number;
}

class VoiceAgent {
  private audioContext: AudioContext | null = null;
  private audioQueue: string[] = [];
  private isPlaying: boolean = false;
  private lastResponseTime: number = 0;
  private readonly RESPONSE_COOLDOWN = 2000; // 2 seconds cooldown between responses
  private isActive: boolean = false;
  private availableItems: string[] = [];
  private orderNumberMap: { [key: string]: number } = {};
  private recognition: any;
  private synth: SpeechSynthesis;
  private wakeWord: string = 'hey kitchen';
  private commandTimeout: number = 10000; // 10 seconds
  private lastCommandTime: number = 0;
  private wakeWordDetected: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    this.synth = window.speechSynthesis;
    this.initializeSpeechRecognition();
    this.loadAvailableItems();
  }

  private async loadAvailableItems(): Promise<void> {
    try {
      const response = await fetch('/api/restaurant/kitchen/orders');
      const data = await response.json();

      if (!data.success) {
        throw new Error('Failed to load available items');
      }
let items: any[] = [];

// Loop over each order and parse its items
data.orders.forEach((orderObj: any) => {
  const rawItems = orderObj.order?.items;
  try {
    const parsedItems = JSON.parse(rawItems); // because items is a JSON string
    if (Array.isArray(parsedItems)) {
      items.push(...parsedItems);
    }
  } catch (e) {
    console.error('Failed to parse items for order:', orderObj.orderId, e);
  }
});

// Map to lowercase names
this.availableItems = items.map((item: any) => item.name.toLowerCase());
    } catch (error) {
      console.error('Error loading available items:', error);
      this.availableItems = []; // Set empty array on error
    }
  }

  private initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = this.handleSpeechResult.bind(this);
      this.recognition.onerror = this.handleSpeechError.bind(this);
      this.recognition.onend = this.handleSpeechEnd.bind(this);
    }
  }

  public async activate() {
    this.isActive = true;
    this.startListening();
    await this.speak("Voice commands activated. Say 'hey kitchen' to begin.");
  }

  public deactivate() {
    this.isActive = false;
    this.stopListening();
    this.speak("Voice commands deactivated.");
  }

  public updateOrderNumbers(orders: Order[]) {
    this.orderNumberMap = {};
    let currentNumber = 1;

    // First add preparing orders
    orders
      .filter(order => order.status === 'preparing')
      .forEach(order => {
        this.orderNumberMap[order.id] = currentNumber++;
      });

    // Then add pending orders
    orders
      .filter(order => order.status === 'pending')
      .forEach(order => {
        this.orderNumberMap[order.id] = currentNumber++;
      });
  }

  private getOrderIdByNumber(number: number): string | undefined {
    return Object.entries(this.orderNumberMap).find(([_, num]) => num === number)?.[0];
  }

  private async processCommand(text: string): Promise<VoiceCommand> {
    try {
      const response = await fetch('/api/voice/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          orderNumberMap: this.orderNumberMap
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process command');
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing command:', error);
      return {
        type: 'unknown',
        confidence: 0
      };
    }
  }

  private async handleSpeechResult(event: any) {
    if (!this.isActive) return;

    const transcript = Array.from(event.results)
      .map((result: any) => result[0])
      .map((result: any) => result.transcript)
      .join('')
      .toLowerCase()
      .trim();

    // Check for wake word
    if (transcript.includes(this.wakeWord)) {
      this.wakeWordDetected = true;
      this.lastCommandTime = Date.now();
      await this.speak("Yes, how can I help you?");
      return;
    }

    // If wake word not detected and not in active state, ignore command
    if (!this.wakeWordDetected) return;

    // Reset wake word detection after timeout
    if (Date.now() - this.lastCommandTime > this.commandTimeout) {
      this.wakeWordDetected = false;
      return;
    }

    // Process the command
    const command = await this.processCommand(transcript);
    
    if (command.confidence < 0.7) {
      await this.speak("I'm not sure about that. Could you please try again?");
      return;
    }

    // Handle the command
    switch (command.type) {
      case 'status_update':
        if (command.orderNumber && command.status) {
          const orderId = this.getOrderIdByNumber(command.orderNumber);
          if (orderId) {
            // Confirm the action
            await this.speak(`Confirming: Mark order ${command.orderNumber} as ${command.status}?`);
            // Wait for confirmation
            const confirmation = await this.waitForConfirmation();
            if (confirmation) {
              await this.updateOrderStatus(orderId, command.status);
              await this.speak(`Order ${command.orderNumber} marked as ${command.status}`);
            } else {
              await this.speak("Action cancelled");
            }
          } else {
            await this.speak(`I couldn't find order number ${command.orderNumber}`);
          }
        }
        break;

      case 'list_orders':
        await this.listOrders();
        break;

      default:
        await this.speak("I'm not sure what you want me to do. Could you please try again?");
    }

    this.lastCommandTime = Date.now();
  }

  private async waitForConfirmation(): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000);
      
      const confirmationHandler = (event: any) => {
        const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
        if (text.includes('yes') || text.includes('confirm')) {
          clearTimeout(timeout);
          this.recognition.removeEventListener('result', confirmationHandler);
          resolve(true);
        }
      };

      this.recognition.addEventListener('result', confirmationHandler);
    });
  }

  private async updateOrderStatus(orderId: string, status: string) {
    try {
      const response = await fetch(`/api/restaurant/kitchen/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  private async listOrders() {
    const preparingOrders = Object.entries(this.orderNumberMap)
      .filter(([_, num]) => num <= Object.keys(this.orderNumberMap).length)
      .map(([_, num]) => num);

    let response = '';
    if (preparingOrders.length > 0) {
      response += `You have ${preparingOrders.length} active orders: `;
      response += preparingOrders.map(num => `Order ${num}`).join(', ');
    } else {
      response = "You have no active orders at the moment.";
    }
    await this.speak(response);
  }

  private handleSpeechError(event: any) {
    console.error('Speech recognition error:', event.error);
    if (event.error === 'not-allowed') {
      this.deactivate();
    }
  }

  private handleSpeechEnd() {
    if (this.isActive) {
      this.startListening();
    }
  }

  private startListening() {
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  }

  private stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  }

  public async speak(text: string) {
    try {
      // Try ElevenLabs first
      const response = await fetch('/api/voice/elevenlabs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('ElevenLabs API failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      // Fallback to browser's speech synthesis
      if (this.synth) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        this.synth.speak(utterance);
      }
    }
  }

  async processCommand(text: string, onStatusUpdate: (orderNumber: string, status: string) => void): Promise<void> {
    if (!this.isActive) return;

    try {
      // Check for gratitude
      if (text.toLowerCase().includes('thank you') || text.toLowerCase().includes('thanks')) {
        await this.speak("You're welcome! Let me know if you need anything else.");
        this.isActive = false;
        return;
      }

      // Check for item-based commands
      const lowerText = text.toLowerCase();
      if (lowerText.includes('ready') || lowerText.includes('complete')) {
        const orders = await this.fetchOrders();
        const preparingOrders = orders.filter(order => order.status === 'preparing' && order.order?.status === 'preparing');
        
        if (preparingOrders.length === 0) {
            await this.speak("There are no orders currently being prepared.");
            return;
          }

        // List available items
        const itemsList = preparingOrders
        .flatMap(order => {
          try {
            return JSON.parse(order.order.items); // parse the string
          } catch (e) {
            return []; // skip invalid
          }
        })
        .map(item => item.name)
        .filter((name, index, self) => self.indexOf(name) === index)
        .join(', ');

        await this.speak(`I found these items being prepared: ${itemsList}. Which one is ready?`);

        const response = await fetch('/api/voice/gemini', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error('Failed to process command');
        }

        const command = await response.json() as OrderCommand;

        if (command.confidence < 0.7) {
          await this.speak("I'm not sure about that. Could you please try again?");
          return;
        }

        if (command.itemName) {
          const matchingOrders = preparingOrders.filter(order => 
            order.items.some(item => 
              item.name.toLowerCase().includes(command.itemName!.toLowerCase())
            )
          );
          
          if (matchingOrders.length > 0) {
            for (const order of matchingOrders) {
              onStatusUpdate(order.orderNumber, 'ready');
            }
            await this.speak(`All ${command.itemName} orders have been marked as ready.`);
          } else {
            await this.speak(`I couldn't find any ${command.itemName} orders being prepared.`);
          }
        } else {
          await this.speak("I couldn't understand which item is ready. Please try again.");
        }
        return;
      }

      const response = await fetch('/api/voice/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to process command');
      }

      const command = await response.json() as OrderCommand;

      if (command.confidence < 0.7) {
        await this.speak("I'm not sure about that. Could you please try again?");
        return;
      }

      // Use the AI's response if available, otherwise use default responses
      const responseText = command.response || this.getDefaultResponse(command);

      switch (command.action) {
        case 'update_status':
          if (command.orderNumber && command.status) {
            onStatusUpdate(command.orderNumber, command.status);
            await this.speak(responseText);
          } else {
            await this.speak("I couldn't understand which order or status you want to update. Please try again.");
          }
          break;

        case 'list_orders':
          await this.speak(responseText);
          break;

        case 'help':
          await this.speak(responseText);
          break;

        default:
          await this.speak("I'm not sure what you want me to do. Could you please try again?");
      }
    } catch (error) {
      console.error('Command processing error:', error);
      await this.speak("Sorry, I had trouble processing your command. Please try again.");
    }
  }

  private async fetchOrders(): Promise<Order[]> {
    try {
      const response = await fetch('/api/restaurant/kitchen/orders');
      const data = await response.json();
      return data.orders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }


  private getDefaultResponse(command: OrderCommand): string {
    switch (command.action) {
      case 'update_status':
        if (command.itemName) {
          return `All ${command.itemName} orders have been marked as ${command.status}`;
        }
        return `Order ${command.orderNumber} has been marked as ${command.status}`;
      case 'list_orders':
        return "Here are all the current orders.";
      case 'help':
        return "You can say things like: mark order 1 as ready, show all orders, or help me with the commands.";
      default:
        return "I'm not sure what you want me to do. Could you please try again?";
    }
  }

  async acknowledgeCommand(): Promise<void> {
    if (!this.isActive) return;
    await this.speak("I'm listening.");
  }

  async acknowledgeError(): Promise<void> {
    if (!this.isActive) return;
    await this.speak("I didn't catch that. Could you please repeat?");
  }
}

export default VoiceAgent; 