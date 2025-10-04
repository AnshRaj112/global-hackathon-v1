import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatRequest {
  messages: GroqMessage[];
  topic: string;
  userContext?: string;
}

export interface GroqBlogRequest {
  memory: string;
  topic: string;
  userContext?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, topic, userContext }: GroqChatRequest = await request.json();

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      console.error('Groq API key not configured properly');
      console.log('Current GROQ_API_KEY value:', process.env.GROQ_API_KEY ? 'Set but invalid' : 'Not set');
      
      // Return fallback response instead of error
      const fallbackResponses = [
        "That's wonderful! Tell me more about that.",
        "I can see this memory means a lot to you. What happened next?",
        "That sounds like a special moment. How did it make you feel?",
        "What a beautiful story! Can you share more details?",
        "That's fascinating! What else do you remember about that time?",
        "I love hearing about this! What was the most memorable part?",
        "That's such an important memory. How did it shape who you are today?",
        "What a wonderful experience! Tell me more about the people involved.",
        "That sounds like it was very meaningful to you. What made it special?",
        "I'm so glad you're sharing this with me. What other memories does this bring up?"
      ];
      
      const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      return NextResponse.json({ response: fallbackResponse });
    }

    console.log('Using Groq API with key:', process.env.GROQ_API_KEY.substring(0, 10) + '...');

    const systemPrompt = `You are a compassionate AI assistant designed to help elderly people preserve their precious memories and life stories. Your role is to:

1. **Listen actively and empathetically** - Show genuine interest in their stories
2. **Ask thoughtful follow-up questions** - Help them elaborate on important details
3. **Be patient and encouraging** - Some memories might be difficult to share
4. **Focus on the topic**: ${topic}
5. **Preserve family history** - Help capture details that family members would treasure
6. **Be conversational and warm** - Use a friendly, respectful tone
7. **Ask about emotions and feelings** - Not just facts, but how experiences felt
8. **Encourage storytelling** - Help them paint a vivid picture with their words

Current conversation topic: ${topic}
${userContext ? `User context: ${userContext}` : ''}

Keep responses conversational, warm, and encouraging. Ask one focused question at a time to avoid overwhelming them.`;

    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages
    ];

    console.log('Full conversation context:', JSON.stringify(chatMessages, null, 2));

    console.log('Sending request to Groq with messages:', chatMessages.length);
    
    const completion = await groq.chat.completions.create({
      messages: chatMessages,
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 500,
      stream: false,
    });

    console.log('Groq response received:', completion.choices[0]?.message?.content?.substring(0, 100) + '...');
    
    const response = completion.choices[0]?.message?.content || 'I apologize, I had trouble processing that. Could you please tell me more about your experience?';

    return NextResponse.json({ response });

  } catch (error) {
    console.error('Groq API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Fallback responses if Groq fails
    const fallbackResponses = [
      "That's wonderful! Tell me more about that.",
      "I can see this memory means a lot to you. What happened next?",
      "That sounds like a special moment. How did it make you feel?",
      "What a beautiful story! Can you share more details?",
      "That's fascinating! What else do you remember about that time?",
      "I love hearing about this! What was the most memorable part?",
      "That's such an important memory. How did it shape who you are today?",
      "What a wonderful experience! Tell me more about the people involved.",
      "That sounds like it was very meaningful to you. What made it special?",
      "I'm so glad you're sharing this with me. What other memories does this bring up?"
    ];
    
    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return NextResponse.json({ response: fallbackResponse });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { memory, topic, userContext }: GroqBlogRequest = await request.json();

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      console.error('Groq API key not configured properly for blog generation');
      console.log('Current GROQ_API_KEY value:', process.env.GROQ_API_KEY ? 'Set but invalid' : 'Not set');
      
      // Return fallback blog post instead of error
      const fallbackBlog = generateFallbackBlogPost(memory, topic);
      return NextResponse.json({ response: fallbackBlog });
    }

    console.log('Generating blog post with Groq for topic:', topic);

    const systemPrompt = `You are a professional writer specializing in family history and memoir writing. Your task is to transform a raw memory conversation into a beautiful, engaging blog post that family members will treasure.

Guidelines:
1. **Create an engaging title** that captures the essence of the memory
2. **Write in a warm, personal tone** that honors the storyteller
3. **Structure the content** with clear paragraphs and good flow
4. **Include emotional details** and personal insights
5. **Make it family-friendly** - something that can be shared and cherished
6. **Add a meaningful conclusion** that ties the story together
7. **Use markdown formatting** for better readability

Topic: ${topic}
${userContext ? `Context: ${userContext}` : ''}

Transform this memory into a beautiful blog post:`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: memory }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.8,
      max_tokens: 1000,
      stream: false,
    });

    const response = completion.choices[0]?.message?.content || generateFallbackBlogPost(memory, topic);

    return NextResponse.json({ response });

  } catch (error) {
    console.error('Groq blog generation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    const fallbackBlog = generateFallbackBlogPost('', 'memory');
    return NextResponse.json({ response: fallbackBlog });
  }
}

function generateFallbackBlogPost(memory: string, topic: string): string {
  return `# A ${topic} Memory

*Captured on ${new Date().toLocaleDateString()}*

${memory}

---

*This memory was lovingly preserved through our interactive conversation system, designed to help families treasure their stories across generations.*`;
}
