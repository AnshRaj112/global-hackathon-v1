import { NextRequest, NextResponse } from 'next/server';
import { GeminiService, GeminiMessage } from '../../../utils/gemini';

export interface GeminiVoiceRequest {
  messages: GeminiMessage[];
  topic: string;
  userContext?: string;
}

export interface GeminiBlogRequest {
  conversation: string;
  topic: string;
  userContext?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, topic, userContext }: GeminiVoiceRequest = await request.json();

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.error('Gemini API key not configured properly');
      console.log('Current GEMINI_API_KEY value:', process.env.GEMINI_API_KEY ? 'Set but invalid' : 'Not set');
      
      // Return fallback response instead of error
      const fallbackResponses = [
        "That's wonderful! Tell me more about that.",
        "I can see this memory means a lot to you. What was the most special part?",
        "That sounds like it was very meaningful to you. How did it make you feel?",
        "What a beautiful story! Can you share more details about what happened?",
        "I love hearing about this! What other memories does this bring to mind?",
        "That's such an important memory. How did it shape who you are today?",
        "What a wonderful experience! Tell me more about the people involved.",
        "That sounds like it was very special to you. What made it memorable?",
        "I'm so glad you're sharing this with me. What was the best part of that time?",
        "That's fascinating! What else do you remember about that period?"
      ];
      
      const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      return NextResponse.json({ response: fallbackResponse });
    }

    console.log('Using Gemini API with key:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');

    const response = await GeminiService.generateVoiceResponse(messages, topic, userContext);

    return NextResponse.json({ response });

  } catch (error) {
    console.error('Gemini voice API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Fallback responses if Gemini fails
    const fallbackResponses = [
      "That's wonderful! Tell me more about that.",
      "I can see this memory means a lot to you. What was the most special part?",
      "That sounds like it was very meaningful to you. How did it make you feel?",
      "What a beautiful story! Can you share more details about what happened?",
      "I love hearing about this! What other memories does this bring to mind?",
      "That's such an important memory. How did it shape who you are today?",
      "What a wonderful experience! Tell me more about the people involved.",
      "That sounds like it was very special to you. What made it memorable?",
      "I'm so glad you're sharing this with me. What was the best part of that time?",
      "That's fascinating! What else do you remember about that period?"
    ];
    
    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return NextResponse.json({ response: fallbackResponse });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { conversation, topic, userContext }: GeminiBlogRequest = await request.json();

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.error('Gemini API key not configured properly for blog generation');
      console.log('Current GEMINI_API_KEY value:', process.env.GEMINI_API_KEY ? 'Set but invalid' : 'Not set');
      
      // Return fallback blog post instead of error
      const fallbackBlog = generateFallbackBlogPost(conversation, topic);
      return NextResponse.json({ response: fallbackBlog });
    }

    console.log('Generating blog post with Gemini for topic:', topic);

    const response = await GeminiService.generateBlogFromConversation(conversation, topic, userContext);

    return NextResponse.json({ response });

  } catch (error) {
    console.error('Gemini blog generation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    const fallbackBlog = generateFallbackBlogPost('', 'memory');
    return NextResponse.json({ response: fallbackBlog });
  }
}

function generateFallbackBlogPost(conversation: string, topic: string): string {
  return `# A ${topic} Memory

*Captured on ${new Date().toLocaleDateString()}*

${conversation}

---

*This memory was lovingly preserved through our voice conversation system, designed to help families treasure their stories across generations.*`;
}
