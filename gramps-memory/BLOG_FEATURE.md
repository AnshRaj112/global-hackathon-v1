# Blog Saving and Email Feature

## Overview

This feature allows users to save their conversations as blog posts and automatically email them to family members. The system uses the environment variables `FROM_EMAIL` and `GOOGLE_APP_PASSWORD` for Gmail authentication.

## Features

### 1. Save Conversations as Blogs
- **Text Conversations**: Click "📝 Save as Blog" button in the conversation header
- **Voice Conversations**: Click "📝 Save as Blog" button in the conversation header
- Users are prompted to enter a custom title for the blog post
- The entire conversation is formatted into a readable blog post

### 2. Automatic Email Distribution
- Blog posts are automatically emailed to all family members
- Uses Gmail SMTP with app-specific password authentication
- Tracks email delivery status in the database
- Provides feedback on successful sends and failures

### 3. Email Template
- Beautiful HTML email template with professional styling
- Includes conversation content formatted for readability
- Personalized greeting for each family member
- Footer with platform information

## Environment Variables Required

```bash
FROM_EMAIL=your-email@gmail.com
GOOGLE_APP_PASSWORD=your-16-character-app-password
```

## Database Schema

The feature uses the following existing tables:
- `conversations`: Stores conversation metadata
- `messages`: Stores individual conversation messages
- `blog_posts`: Stores generated blog posts
- `family_members`: Stores family member contact information
- `email_logs`: Tracks email delivery status

## API Endpoints

### POST /api/save-blog-and-email

Saves a conversation as a blog post and emails it to family members.

**Request Body:**
```json
{
  "conversationId": "uuid",
  "title": "Blog Post Title",
  "userId": "uuid",
  "senderName": "User Name"
}
```

**Response:**
```json
{
  "success": true,
  "blogPost": { ... },
  "emailResult": {
    "success": true,
    "sent": 2,
    "failed": 0
  },
  "message": "Blog post saved and emails sent to 2 family members."
}
```

### POST /api/send-email

Sends blog posts to family members (used internally).

**Request Body:**
```json
{
  "blogPost": {
    "title": "Blog Post Title",
    "content": "Blog content...",
    "authorName": "Author Name",
    "topic": "conversation topic",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "familyMembers": [
    {
      "id": "uuid",
      "name": "Family Member Name",
      "email": "email@example.com",
      "relationship": "relationship",
      "user_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "senderName": "Sender Name"
}
```

## Usage Instructions

1. **Set up environment variables** in your `.env.local` file:
   ```bash
   FROM_EMAIL=your-email@gmail.com
   GOOGLE_APP_PASSWORD=your-16-character-app-password
   ```

2. **Add family members** through the Family Members interface

3. **Start a conversation** (text or voice) on any topic

4. **Click "📝 Save as Blog"** when you want to preserve the conversation

5. **Enter a title** for your blog post when prompted

6. **The system will**:
   - Format the conversation into a blog post
   - Save it to the database
   - Email it to all family members
   - Provide feedback on the results

## Email Configuration

### Gmail App Password Setup

1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings > Security
3. Under "2-Step Verification", click "App passwords"
4. Generate a new app password for "Mail"
5. Use this 16-character password as `GOOGLE_APP_PASSWORD`

### Email Template Features

- Responsive design that works on all devices
- Professional typography using Georgia serif font
- Personalized greeting for each recipient
- Clean formatting of conversation content
- Platform branding and information
- Date stamping

## Error Handling

The system handles various error scenarios:

- **Missing environment variables**: Clear error message with setup instructions
- **Database connection issues**: Graceful fallback with user notification
- **Email delivery failures**: Individual tracking with detailed error messages
- **Invalid conversation data**: Validation with helpful error messages
- **Network issues**: Retry logic and user-friendly error messages

## Security Features

- Row Level Security (RLS) policies ensure users can only access their own data
- Email credentials stored as environment variables
- Input validation and sanitization
- SQL injection prevention through parameterized queries
- XSS protection in email templates

## Monitoring and Logging

- All email attempts are logged in the `email_logs` table
- Success/failure tracking for each family member
- Error messages stored for debugging
- Timestamp tracking for audit trails
