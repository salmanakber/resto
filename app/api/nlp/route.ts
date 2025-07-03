import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Define the types for our API
type OrderStatus = "pending" | "preparing" | "ready" | "complete";

type CommandResult = {
  action: "update_status" | "update_all_preparing" | "update_all_ready" | "complete_all" | "list_orders" | "new_order" | "help" | "unknown" | "show_all_day" | "show_recently_completed" | "redo" | "filter_by_status";
  order_number: number | null;
  status: OrderStatus | null;
  view: "default" | "allDay" | "recentlyCompleted" | null;
  filter: "preparing" | "ready" | "completed" | null;
  confidence: number;
  original_text: string;
};

/**
 * Process natural language using Google Gemini
 */
async function processWithGemini(text: string, apiKey: string): Promise<CommandResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `You are a natural language processing system for a restaurant order management system.
Your task is to understand user commands and convert them into structured actions.

Available actions:
1. update_status: Change the status of an order
2. list_orders: List all orders
3. create_order: Create a new order
4. show_all_day: Show grouped items for preparing orders
5. show_recently_completed: Show recently completed orders
6. redo: Undo the last action
7. filter_by_status: Filter orders by status

Command variations for status updates:
- "Order [number] is ready"
- "Order [number] ready"
- "[number] ready"
- "Order [number] is done"
- "[number] done"
- "Order [number] is finished"
- "[number] finished"
- "Order [number] is complete"
- "[number] complete"
- "Order [number] is preparing"
- "[number] preparing"
- "Order [number] is pending"
- "[number] pending"

Command variations for view changes:
- "Show all day view"
- "Show all day"
- "Show preparing items"
- "Show grouped items"
- "Show recently completed"
- "Show completed orders"
- "Show finished orders"
- "Show done orders"
- "Redo last action"
- "Undo last action"
- "Go back one step"

Command variations for status filtering:
- "Show preparing orders"
- "Show ready orders"
- "Show completed orders"
- "Filter by preparing"
- "Filter by ready"
- "Filter by completed"
- "Show only preparing"
- "Show only ready"
- "Show only completed"

Command variations for listing orders:
- "List all orders"
- "Show all orders"
- "Display orders"
- "What are the orders"
- "Show me the orders"

Command variations for creating orders:
- "Create new order"
- "Add new order"
- "Make new order"
- "Start new order"

Help commands:
- "Help"
- "What can I say"
- "Show commands"
- "What commands"
- "Available commands"

For status updates, extract the order number and new status.
For view changes, determine which view to show.
For filtering, determine which status to filter by.
For redo, simply return the redo action.

Return a JSON object with:
{
  "action": "action_name",
  "order_number": number or null,
  "status": "pending" | "preparing" | "ready" | "complete" or null,
  "view": "default" | "allDay" | "recentlyCompleted" or null,
  "filter": "preparing" | "ready" | "completed" or null,
  "confidence": number between 0 and 1
}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1];
      
      return JSON.parse(jsonStr);
    }
    
    throw new Error("No JSON found in response");
  } catch (error: any) {
    console.error("Error processing with Gemini:", error);
    
    // Check if it's a quota error
    if (error.message?.includes('quota') || error.message?.includes('429') || 
        error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('insufficient_quota')) {
      
      return parseCommandLocally(text);
    }
    
    // For other errors, also fall back to local processing
    console.log("Falling back to local processing due to error:", error.message);
    return parseCommandLocally(text);
  }
}

/**
 * Simple command parser without external API
 * This provides a fallback when AI APIs are not available
 */
function parseCommandLocally(text: string): CommandResult {
  // Convert text to lowercase and clean
  const cleanText = text.toLowerCase().trim();
  
  // Default result
  const result: CommandResult = {
    action: "unknown",
    order_number: null,
    status: null,
    view: null,
    filter: null,
    confidence: 0.6,
    original_text: text
  };

  // Map of number words to digits
  const numberWords: { [key: string]: number } = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
  };

  // First try to match simple patterns with number words
  const numberWordPattern = new RegExp(`^(${Object.keys(numberWords).join('|')})\\s+(ready|complete|preparing|pending)$`);
  const numberWordMatch = cleanText.match(numberWordPattern);
  
  if (numberWordMatch) {
    const [, numberWord, status] = numberWordMatch;
    result.order_number = numberWords[numberWord];
    result.action = "update_status";
    result.status = status as OrderStatus;
    result.confidence = 0.95; // High confidence for exact matches
    return result;
  }
  
  // Then try to match patterns with "order" keyword and number words
  const orderNumberWordPattern = new RegExp(`order\\s+(${Object.keys(numberWords).join('|')})\\s+(ready|complete|preparing|pending)`);
  const orderNumberWordMatch = cleanText.match(orderNumberWordPattern);
  
  if (orderNumberWordMatch) {
    const [, numberWord, status] = orderNumberWordMatch;
    result.order_number = numberWords[numberWord];
    result.action = "update_status";
    result.status = status as OrderStatus;
    result.confidence = 0.9;
    return result;
  }
  
  // First try to match simple patterns like "5 ready", "4 complete", etc.
  const simplePattern = /^(\d+)\s+(ready|complete|preparing|pending)$/;
  const simpleMatch = cleanText.match(simplePattern);
  
  if (simpleMatch) {
    const [, orderNumber, status] = simpleMatch;
    result.order_number = parseInt(orderNumber, 10);
    result.action = "update_status";
    result.status = status as OrderStatus;
    result.confidence = 0.95; // High confidence for exact matches
    return result;
  }
  
  // Then try to match patterns with "order" keyword
  const orderPattern = /order\s+(\d+)\s+(ready|complete|preparing|pending)/;
  const orderMatch = cleanText.match(orderPattern);
  
  if (orderMatch) {
    const [, orderNumber, status] = orderMatch;
    result.order_number = parseInt(orderNumber, 10);
    result.action = "update_status";
    result.status = status as OrderStatus;
    result.confidence = 0.9;
    return result;
  }
  
  // Extract order number if present (including number words)
  const numberWordsPattern = new RegExp(`(${Object.keys(numberWords).join('|')})`);
  const numberWordsMatch = cleanText.match(numberWordsPattern);
  
  if (numberWordsMatch) {
    const numberWord = numberWordsMatch[1];
    result.order_number = numberWords[numberWord];
    result.action = "update_status";
    result.confidence = 0.8;
    
    // Try to determine status
    if (cleanText.includes("ready")) {
      result.status = "ready";
      result.confidence = 0.9;
    } 
    else if (cleanText.includes("complete") || cleanText.includes("done") || cleanText.includes("finish")) {
      result.status = "complete";
      result.confidence = 0.9;
    }
    else if (cleanText.includes("prepar") || cleanText.includes("making") || cleanText.includes("cook")) {
      result.status = "preparing";
      result.confidence = 0.9;
    }
    else if (cleanText.includes("pending") || cleanText.includes("wait") || cleanText.includes("new")) {
      result.status = "pending";
      result.confidence = 0.9;
    }
    else {
      // Default to ready if no status specified
      result.status = "ready";
      result.confidence = 0.7;
    }
    
    return result;
  }
  
  // Extract numeric order number if present
  const numbers = cleanText.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    result.order_number = parseInt(numbers[0], 10);
    result.action = "update_status";
    result.confidence = 0.8;
    
    // Try to determine status
    if (cleanText.includes("ready")) {
      result.status = "ready";
      result.confidence = 0.9;
    } 
    else if (cleanText.includes("complete") || cleanText.includes("done") || cleanText.includes("finish")) {
      result.status = "complete";
      result.confidence = 0.9;
    }
    else if (cleanText.includes("prepar") || cleanText.includes("making") || cleanText.includes("cook")) {
      result.status = "preparing";
      result.confidence = 0.9;
    }
    else if (cleanText.includes("pending") || cleanText.includes("wait") || cleanText.includes("new")) {
      result.status = "pending";
      result.confidence = 0.9;
    }
    else {
      // Default to ready if no status specified
      result.status = "ready";
      result.confidence = 0.7;
    }
    
    return result;
  }
  
  // Check for bulk update commands
  if (cleanText.includes("all preparing") && cleanText.includes("ready")) {
    result.action = "update_all_preparing";
    result.confidence = 0.9;
    return result;
  }
  
  if (cleanText.includes("all ready") && cleanText.includes("complete")) {
    result.action = "update_all_ready";
    result.confidence = 0.9;
    return result;
  }
  
  if (cleanText.includes("all orders") && cleanText.includes("complete")) {
    result.action = "complete_all";
    result.confidence = 0.9;
    return result;
  }
  
  // Check for list orders command
  if (cleanText.includes("list") || cleanText.includes("show") || 
      (cleanText.includes("how") && cleanText.includes("many")) || 
      cleanText.includes("all orders")) {
    result.action = "list_orders";
    result.confidence = 0.85;
    return result;
  }
  
  // Check for new order command
  if ((cleanText.includes("add") || cleanText.includes("new") || cleanText.includes("create")) && 
      cleanText.includes("order")) {
    result.action = "new_order";
    result.confidence = 0.85;
    return result;
  }
  
  // Check for help command
  if (cleanText.includes("help") || cleanText.includes("what can") || cleanText.includes("command")) {
    result.action = "help";
    result.confidence = 0.9;
    return result;
  }
  
  // If nothing matched
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, apiKey } = body;
    
    // Validate input
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid text parameter' }, { status: 400 });
    }
    
    let result: CommandResult;
    
    // If API key is provided, try Gemini first
    if (apiKey && typeof apiKey === 'string') {
      try {
        result = await processWithGemini(text, apiKey);
      } catch (error) {
        console.error('Error with Gemini API, falling back to local processing:', error);
        result = parseCommandLocally(text);
      }
    } else {
      // Otherwise, use local processing
      result = parseCommandLocally(text);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 