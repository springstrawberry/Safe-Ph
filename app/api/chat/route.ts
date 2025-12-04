import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ Gemini API key is not configured in .env.local');
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    console.log('🤖 Processing chat request with', messages.length, 'messages');

    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemPrompt = `You are a disaster preparedness assistant for the Philippines. Your role is to provide clear, accurate, and actionable information about disaster preparedness, response, and recovery.

Focus on these disaster types common in the Philippines:
- Earthquakes
- Typhoons/Tropical Cyclones
- Floods
- Volcanic Eruptions
- Tsunamis
- Landslides

For each disaster type, provide information about:
1. BEFORE: Preparation steps, emergency kits, evacuation planning, early warning signs
2. DURING: Safety procedures, what to do and what to avoid, shelter guidelines
3. AFTER: Safety checks, damage assessment, recovery steps, when to seek help

Always provide:
- Clear, step-by-step instructions
- Specific information relevant to the Philippines
- Emergency contact information when relevant (NDRRMC: 911, Red Cross: 143)
- Culturally appropriate advice

Keep responses concise, practical, and easy to understand. Use bullet points when appropriate. Prioritize life safety above all else.`;

    // Build the conversation prompt
    const prompt = systemPrompt + '\n\n' + messages.map(
      (msg: { role: string; content: string }) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');

    console.log('🔑 Generating response with Gemini 2.5 Flash...');

    // Generate content using the correct API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const assistantMessage = response.text || 'I apologize, but I could not generate a response. Please try again.';

    console.log('✅ Chat response generated successfully');
    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error('❌ Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { error: `Failed to generate response: ${errorMessage}` },
      { status: 500 }
    );
  }
}

