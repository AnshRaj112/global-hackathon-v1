import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

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

export class GeminiService {
  private static genAI: GoogleGenerativeAI | null = null;

  private static initializeGemini() {
    if (!this.genAI && process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return this.genAI;
  }

  static async generateVoiceResponse(
    messages: GeminiMessage[],
    topic: string,
    userContext?: string
  ): Promise<string> {
    try {
      const genAI = this.initializeGemini();
      if (!genAI) {
        throw new Error('Gemini API not configured');
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const systemPrompt = `You are a compassionate AI assistant designed to help elderly people preserve their precious memories and life stories through voice conversations. Your role is to:

1. **Listen actively and empathetically** - Show genuine interest in their stories
2. **Ask thoughtful follow-up questions** - Help them elaborate on important details
3. **Be patient and encouraging** - Some memories might be difficult to share
4. **Focus on the topic**: ${topic}
5. **Preserve family history** - Help capture details that family members would treasure
6. **Be conversational and warm** - Use a friendly, respectful tone
7. **Ask about emotions and feelings** - Not just facts, but how experiences felt
8. **Encourage storytelling** - Help them paint a vivid picture with their words
9. **Keep responses concise** - Since this is voice-based, keep responses under 100 words
10. **Use natural speech patterns** - Write as you would speak, not as formal text

Current conversation topic: ${topic}
${userContext ? `User context: ${userContext}` : ''}

Keep responses conversational, warm, and encouraging. Ask one focused question at a time to avoid overwhelming them.`;

      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }]
          },
          {
            role: 'model',
            parts: [{ text: 'Hello! I\'m here to help you share your precious memories. I\'m excited to hear your stories and help preserve them for your family. What would you like to tell me about?' }]
          }
        ]
      });

      const currentMessage = messages[messages.length - 1];
      
      const result = await chat.sendMessage(currentMessage.parts[0].text);
      const response = await result.response;
      const text = response.text();

      return text;
    } catch (error) {
      console.error('Gemini voice API error:', error);
      
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
      
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  }

  static async generateBlogFromConversation(
    conversation: string,
    topic: string,
    userContext?: string
  ): Promise<string> {
    try {
      const genAI = this.initializeGemini();
      if (!genAI) {
        throw new Error('Gemini API not configured');
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are a professional writer specializing in family history and memoir writing. Your task is to transform a voice conversation about memories into a beautiful, engaging blog post that family members will treasure.

Guidelines:
1. **Create an engaging title** that captures the essence of the memory
2. **Write in a warm, personal tone** that honors the storyteller
3. **Structure the content** with clear paragraphs and good flow
4. **Include emotional details** and personal insights
5. **Make it family-friendly** - something that can be shared and cherished
6. **Add a meaningful conclusion** that ties the story together
7. **Use markdown formatting** for better readability
8. **Preserve the conversational nature** while making it more polished
9. **Include specific details** that were shared in the conversation
10. **Make it feel like a personal story** rather than a formal document

Topic: ${topic}
${userContext ? `Context: ${userContext}` : ''}

Transform this voice conversation into a beautiful blog post:

${conversation}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text;
    } catch (error) {
      console.error('Gemini blog generation error:', error);
      return this.generateFallbackBlogPost(conversation, topic);
    }
  }

  private static generateFallbackBlogPost(conversation: string, topic: string): string {
    return `# A ${topic} Memory

*Captured on ${new Date().toLocaleDateString()}*

${conversation}

---

*This memory was lovingly preserved through our voice conversation system, designed to help families treasure their stories across generations.*`;
  }
}
