export interface VoiceEngineConfig {
    accessKey: string
    wakeWord: string
    sensitivity: number
    endpointDurationSec: number
    requireEndpoint: boolean
  }
  
  export interface VoiceCommand {
    action: "change_status" | "show_all_day" | "show_recently_completed" | "list_orders"
    orderNumber?: number
    status?: string
    confidence: number
    transcript: string
  }
  
  export class VoiceEngine {
    private porcupine: any = null
    private webVoiceProcessor: any = null
    private recognition: SpeechRecognition | null = null
    private isInitialized = false
    private isListening = false
    private isWakeWordDetected = false
    private onWakeWordDetected?: () => void
    private onCommandReceived?: (command: VoiceCommand) => void
    private onError?: (error: string) => void
    private onStatusChange?: (status: string) => void
    private config: VoiceEngineConfig
    private audioContext: AudioContext | null = null
    private mediaStream: MediaStream | null = null
    private processor: ScriptProcessorNode | null = null
    private commandTimeout: NodeJS.Timeout | null = null
  
    constructor(config: VoiceEngineConfig) {
      this.config = config
    }
  
    async initialize(): Promise<boolean> {
      try {
        // Initialize Porcupine for wake word detection
        await this.initializePorcupine()
  
        // Initialize enhanced speech recognition
        await this.initializeSpeechRecognition()
  
        // Initialize audio processing pipeline
        await this.initializeAudioPipeline()
  
        this.isInitialized = true
        this.onStatusChange?.("Voice engine initialized successfully")
        return true
      } catch (error) {
        console.error("Failed to initialize voice engine:", error)
        this.onError?.(`Initialization failed: ${error.message}`)
        return false
      }
    }
  
    private async initializePorcupine() {
      try {
        // Dynamic import for Porcupine
        const { Porcupine } = await import("@picovoice/porcupine-web")
        const { PorcupineWorker } = await import("@picovoice/porcupine-web/dist/types/porcupine_worker")
  
        // Initialize Porcupine with custom wake word
        this.porcupine = await Porcupine.create(
          this.config.accessKey,
          [{ builtin: "Hey Google", sensitivity: this.config.sensitivity }], // You can train custom wake words
          (keywordIndex: number) => {
            if (keywordIndex === 0) {
              this.handleWakeWordDetected()
            }
          },
        )
  
        console.log("Porcupine initialized successfully")
      } catch (error) {
        console.warn("Porcupine initialization failed, falling back to Web Speech API:", error)
        // Fallback to enhanced Web Speech API wake word detection
        await this.initializeFallbackWakeWordDetection()
      }
    }
  
    private async initializeFallbackWakeWordDetection() {
      // Enhanced fallback using Web Speech API with continuous listening
      if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const wakeWordRecognition = new SpeechRecognition()
  
        wakeWordRecognition.continuous = true
        wakeWordRecognition.interimResults = false
        wakeWordRecognition.lang = "en-US"
        wakeWordRecognition.maxAlternatives = 1
  
        wakeWordRecognition.onresult = (event) => {
          const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim()
          if (transcript.includes(this.config.wakeWord.toLowerCase())) {
            this.handleWakeWordDetected()
          }
        }
  
        wakeWordRecognition.onerror = (event) => {
          console.error("Wake word detection error:", event.error)
          // Auto-restart on error
          setTimeout(() => {
            if (this.isListening) {
              try {
                wakeWordRecognition.start()
              } catch (e) {
                console.error("Failed to restart wake word detection:", e)
              }
            }
          }, 1000)
        }
  
        wakeWordRecognition.onend = () => {
          // Auto-restart continuous listening
          if (this.isListening && !this.isWakeWordDetected) {
            setTimeout(() => {
              try {
                wakeWordRecognition.start()
              } catch (e) {
                console.error("Failed to restart wake word detection:", e)
              }
            }, 100)
          }
        }
  
        this.porcupine = {
          start: () => wakeWordRecognition.start(),
          stop: () => wakeWordRecognition.stop(),
          release: () => wakeWordRecognition.abort(),
        }
      }
    }
  
    private async initializeSpeechRecognition() {
      if (typeof window === "undefined") return
  
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        throw new Error("Speech Recognition not supported")
      }
  
      this.recognition = new SpeechRecognition()
      this.recognition.continuous = false
      this.recognition.interimResults = true
      this.recognition.maxAlternatives = 3
      this.recognition.lang = "en-US"
  
      // Enhanced speech recognition with better accuracy
      this.recognition.onstart = () => {
        this.onStatusChange?.("Listening for command...")
      }
  
      this.recognition.onresult = (event) => {
        let finalTranscript = ""
        let interimTranscript = ""
  
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
  
        if (finalTranscript) {
          this.processCommand(finalTranscript, event.results[event.results.length - 1][0].confidence)
        } else if (interimTranscript) {
          this.onStatusChange?.(`Hearing: "${interimTranscript}"`)
        }
      }
  
      this.recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        this.onError?.(`Speech recognition error: ${event.error}`)
        this.resetToWakeWordListening()
      }
  
      this.recognition.onend = () => {
        this.resetToWakeWordListening()
      }
    }
  
    private async initializeAudioPipeline() {
      try {
        // Initialize Web Audio API for enhanced audio processing
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  
        // Request microphone access
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000,
          },
        })
  
        // Create audio processing pipeline
        const source = this.audioContext.createMediaStreamSource(this.mediaStream)
        this.processor = this.audioContext.createScriptProcessor(4096, 1, 1)
  
        // Enhanced audio processing for better voice detection
        this.processor.onaudioprocess = (event) => {
          const inputBuffer = event.inputBuffer.getChannelData(0)
  
          // Calculate RMS (Root Mean Square) for volume detection
          let sum = 0
          for (let i = 0; i < inputBuffer.length; i++) {
            sum += inputBuffer[i] * inputBuffer[i]
          }
          const rms = Math.sqrt(sum / inputBuffer.length)
  
          // Voice activity detection threshold
          const threshold = 0.01
          if (rms > threshold && this.isWakeWordDetected) {
            // Voice detected during command listening
            this.onStatusChange?.("Voice detected, processing...")
          }
        }
  
        source.connect(this.processor)
        this.processor.connect(this.audioContext.destination)
  
        console.log("Audio pipeline initialized successfully")
      } catch (error) {
        console.warn("Audio pipeline initialization failed:", error)
        // Continue without enhanced audio processing
      }
    }
  
    private handleWakeWordDetected() {
      if (this.isWakeWordDetected) return // Prevent multiple triggers
  
      this.isWakeWordDetected = true
      this.onWakeWordDetected?.()
      this.onStatusChange?.("Wake word detected! Listening for command...")
  
      // Stop wake word detection temporarily
      if (this.porcupine && this.porcupine.stop) {
        this.porcupine.stop()
      }
  
      // Start command recognition
      this.startCommandListening()
    }
  
    private startCommandListening() {
      if (!this.recognition) return
  
      try {
        this.recognition.start()
  
        // Set timeout for command listening
        this.commandTimeout = setTimeout(() => {
          this.onStatusChange?.("Command timeout, returning to wake word detection")
          this.resetToWakeWordListening()
        }, 10000) // 10 second timeout
      } catch (error) {
        console.error("Failed to start command listening:", error)
        this.resetToWakeWordListening()
      }
    }
  
    private resetToWakeWordListening() {
      this.isWakeWordDetected = false
  
      // Clear command timeout
      if (this.commandTimeout) {
        clearTimeout(this.commandTimeout)
        this.commandTimeout = null
      }
  
      // Stop command recognition
      if (this.recognition) {
        try {
          this.recognition.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
      }
  
      // Restart wake word detection
      if (this.isListening && this.porcupine && this.porcupine.start) {
        setTimeout(() => {
          try {
            this.porcupine.start()
            this.onStatusChange?.("Listening for wake word...")
          } catch (error) {
            console.error("Failed to restart wake word detection:", error)
          }
        }, 500)
      }
    }
  
    private async processCommand(transcript: string, confidence: number) {
      try {
        this.onStatusChange?.("Processing command...")
  
        // Enhanced command processing with NLP
        const command = await this.parseCommand(transcript, confidence)
  
        if (command.confidence > 0.7) {
          this.onCommandReceived?.(command)
          this.onStatusChange?.(`Command executed: ${command.action}`)
        } else {
          this.onError?.("Command not understood. Please try again.")
        }
      } catch (error) {
        console.error("Command processing error:", error)
        this.onError?.("Failed to process command")
      } finally {
        // Return to wake word listening after processing
        setTimeout(() => {
          this.resetToWakeWordListening()
        }, 2000)
      }
    }
  
    private async parseCommand(transcript: string, confidence: number): Promise<VoiceCommand> {
      const cleanText = transcript.toLowerCase().trim()
  
      // Enhanced command parsing with multiple patterns
      const patterns = {
        changeStatus: [
          /(?:mark|set|change)\s+order\s+(\d+)\s+(?:as|to)\s+(ready|preparing|completed?)/i,
          /order\s+(\d+)\s+(?:is\s+)?(?:ready|preparing|completed?)/i,
          /(\d+)\s+(?:ready|preparing|completed?)/i,
        ],
        showAllDay: [/show\s+all\s+day/i, /all\s+day\s+view/i, /daily\s+summary/i],
        showRecentlyCompleted: [/(?:show\s+)?recent(?:ly)?\s+completed?/i, /completed?\s+orders/i, /finished\s+orders/i],
        listOrders: [/(?:list|show)\s+(?:all\s+)?orders/i, /what\s+orders/i, /order\s+status/i],
      }
  
      // Check for status change commands
      for (const pattern of patterns.changeStatus) {
        const match = cleanText.match(pattern)
        if (match) {
          const orderNumber = Number.parseInt(match[1])
          const status = match[2] || match[0].split(" ").pop()
          return {
            action: "change_status",
            orderNumber,
            status: this.normalizeStatus(status),
            confidence: confidence * 0.9, // Slight confidence boost for exact matches
            transcript,
          }
        }
      }
  
      // Check for view commands
      if (patterns.showAllDay.some((pattern) => pattern.test(cleanText))) {
        return {
          action: "show_all_day",
          confidence: confidence * 0.95,
          transcript,
        }
      }
  
      if (patterns.showRecentlyCompleted.some((pattern) => pattern.test(cleanText))) {
        return {
          action: "show_recently_completed",
          confidence: confidence * 0.95,
          transcript,
        }
      }
  
      if (patterns.listOrders.some((pattern) => pattern.test(cleanText))) {
        return {
          action: "list_orders",
          confidence: confidence * 0.9,
          transcript,
        }
      }
  
      // Fallback with lower confidence
      return {
        action: "list_orders",
        confidence: confidence * 0.3,
        transcript,
      }
    }
  
    private normalizeStatus(status: string): string {
      const statusMap: { [key: string]: string } = {
        ready: "ready",
        preparing: "preparing",
        complete: "completed",
        completed: "completed",
        done: "completed",
        finished: "completed",
      }
  
      return statusMap[status.toLowerCase()] || status
    }
  
    async startListening(): Promise<boolean> {
      if (!this.isInitialized) {
        const initialized = await this.initialize()
        if (!initialized) return false
      }
  
      try {
        this.isListening = true
  
        // Resume audio context if suspended
        if (this.audioContext && this.audioContext.state === "suspended") {
          await this.audioContext.resume()
        }
  
        // Start wake word detection
        if (this.porcupine && this.porcupine.start) {
          this.porcupine.start()
        }
  
        this.onStatusChange?.("Voice engine started - listening for wake word")
        return true
      } catch (error) {
        console.error("Failed to start listening:", error)
        this.onError?.(`Failed to start: ${error.message}`)
        return false
      }
    }
  
    stopListening() {
      this.isListening = false
      this.isWakeWordDetected = false
  
      // Clear timeouts
      if (this.commandTimeout) {
        clearTimeout(this.commandTimeout)
        this.commandTimeout = null
      }
  
      // Stop all recognition
      if (this.porcupine && this.porcupine.stop) {
        this.porcupine.stop()
      }
  
      if (this.recognition) {
        try {
          this.recognition.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
      }
  
      this.onStatusChange?.("Voice engine stopped")
    }
  
    destroy() {
      this.stopListening()
  
      // Clean up audio resources
      if (this.processor) {
        this.processor.disconnect()
        this.processor = null
      }
  
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => track.stop())
        this.mediaStream = null
      }
  
      if (this.audioContext) {
        this.audioContext.close()
        this.audioContext = null
      }
  
      // Release Porcupine resources
      if (this.porcupine && this.porcupine.release) {
        this.porcupine.release()
        this.porcupine = null
      }
  
      this.isInitialized = false
    }
  
    // Event handlers
    onWakeWord(callback: () => void) {
      this.onWakeWordDetected = callback
    }
  
    onCommand(callback: (command: VoiceCommand) => void) {
      this.onCommandReceived = callback
    }
  
    onErrorOccurred(callback: (error: string) => void) {
      this.onError = callback
    }
  
    onStatusChanged(callback: (status: string) => void) {
      this.onStatusChange = callback
    }
  
    // Utility methods
    isCurrentlyListening(): boolean {
      return this.isListening
    }
  
    isWakeWordActive(): boolean {
      return this.isWakeWordDetected
    }
  
    getStatus(): string {
      if (!this.isInitialized) return "Not initialized"
      if (!this.isListening) return "Stopped"
      if (this.isWakeWordDetected) return "Listening for command"
      return "Listening for wake word"
    }
  }
  