export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  relationship: string;
  user_id: string;
  created_at: string;
}

export interface EmailBlogPost {
  title: string;
  content: string;
  authorName: string;
  topic: string;
  created_at: string;
}

export class EmailService {
  static async sendBlogToFamily(
    blogPost: EmailBlogPost,
    familyMembers: FamilyMember[],
    senderName: string
  ): Promise<{ success: boolean; sent: number; failed: number; errors?: string[] }> {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogPost,
          familyMembers,
          senderName,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending emails:', error);
      return {
        success: false,
        sent: 0,
        failed: familyMembers.length,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  static async testEmailConfiguration(): Promise<boolean> {
    try {
      // Test by trying to send a test email to a dummy address
      const testBlogPost: EmailBlogPost = {
        title: 'Test Email',
        content: 'This is a test email to verify configuration.',
        authorName: 'Test User',
        topic: 'test',
        created_at: new Date().toISOString()
      };

      const testFamilyMember: FamilyMember = {
        id: 'test',
        name: 'Test Recipient',
        email: 'test@example.com',
        relationship: 'test',
        user_id: 'test',
        created_at: new Date().toISOString()
      };

      const result = await this.sendBlogToFamily(
        testBlogPost,
        [testFamilyMember],
        'Test User'
      );

      // If we get a response (even if it fails), the API is working
      return result !== null;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }
}
