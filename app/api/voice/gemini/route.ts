import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API with the correct model
const genAI = new GoogleGenerativeAI('AIzaSyChCl-rrTSknkBZmbl_ueFF5g6bYEq-n7Q');

interface OrderCommand {
  action: 'update_status' | 'list_orders' | 'help' | 'unknown';
  orderNumber?: string;
  status?: 'pending' | 'preparing' | 'ready' | 'complete';
  confidence: number;
  response?: string; // Add response field for conversational feedback
}

export async function POST(req: Request) {
  try {
    // Use gemini-1.0-pro model instead of gemini-pro
    const { text, orderNumberMap } = await req.json();
    console.log(text , "text dss 123 ss")

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a voice command processor for a restaurant kitchen system.
      Analyze the following voice command and extract the order number and action.
      
      Available order numbers: ${Object.values(orderNumberMap).join(', ')}
      
      Voice command: "${text}"
      
      Respond with a JSON object in this format:
      {
        "type": "status_update" | "list_orders" | "unknown",
        "orderNumber": number | undefined,
        "status": "ready" | "completed" | "preparing" | undefined,
        "confidence": number (0-1)
      }
      
      Examples:
      - For "order one ready" -> {"type": "status_update", "orderNumber": 1, "status": "ready", "confidence": 0.9}
      - For "list orders" -> {"type": "list_orders", "confidence": 0.9}
      - For unclear commands -> {"type": "unknown", "confidence": 0.3}
    `;


    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    
    const command = JSON.parse(jsonMatch[1]) as OrderCommand;
    return NextResponse.json(command);
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to process command' },
      { status: 500 }
    );
  }
} 