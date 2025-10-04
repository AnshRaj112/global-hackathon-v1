export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class GroqService {
  static async generateResponse(
    messages: GroqMessage[],
    topic: string,
    userContext?: string
  ): Promise<string> {
    try {
      console.log('GroqService: Sending request to /api/groq-chat');
      const response = await fetch('/api/groq-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          topic,
          userContext,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API HTTP error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('GroqService: Received response:', data.response?.substring(0, 100) + '...');
      return data.response;
    } catch (error) {
      console.error('GroqService: API error:', error);
      
      // Fallback responses if Groq fails
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

  static async generateBlogPost(memory: string, topic: string, userContext?: string): Promise<string> {
    try {
      console.log('GroqService: Generating blog post for topic:', topic);
      const response = await fetch('/api/groq-chat', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memory,
          topic,
          userContext,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq blog API HTTP error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('GroqService: Blog post generated successfully');
      return data.response;
    } catch (error) {
      console.error('GroqService: Blog generation error:', error);
      return this.generateFallbackBlogPost(memory, topic);
    }
  }

  private static generateFallbackBlogPost(memory: string, topic: string): string {
    return `# A ${topic} Memory

*Captured on ${new Date().toLocaleDateString()}*

${memory}

---

*This memory was lovingly preserved through our interactive conversation system, designed to help families treasure their stories across generations.*`;
  }
}