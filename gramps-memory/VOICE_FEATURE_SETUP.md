# Voice Conversation Feature Setup

This document explains how to set up and use the new voice conversation feature that allows users to have voice conversations with AI and automatically generate blog posts from their conversations.

## Features

- **Voice Conversations**: Users can speak directly to the AI using their microphone
- **Speech-to-Text**: Automatic transcription of voice input using Web Speech API
- **Text-to-Speech**: AI responses are spoken back using enhanced browser speech synthesis
- **Blog Post Generation**: Conversations are automatically converted to beautiful blog posts
- **Family Sharing**: Blog posts are automatically shared with family members via email
- **Hybrid AI Approach**: Uses Groq for fast AI responses + enhanced browser TTS for voice

## Setup Instructions

### 1. Environment Variables

Add the following environment variable to your `.env.local` file:

```bash
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Getting API Keys

**Groq API Key (Required for AI responses):**
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key

**Gemini API Key (Optional - for future voice features):**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add it to your `.env.local` file

### 3. Browser Compatibility

The voice feature requires a modern browser with Web Speech API support:

- **Chrome/Chromium**: Full support
- **Safari**: Full support
- **Firefox**: Limited support (may not work on all systems)
- **Edge**: Full support

### 4. Microphone Permissions

Users will need to grant microphone permissions when they first use the voice feature. The browser will prompt them automatically.

## How to Use

### Starting a Voice Conversation

1. Navigate to the main page
2. Click on the "🎤 Voice Conversations" tab
3. Choose a conversation topic (Childhood Memories, Family Stories, etc.)
4. Click the microphone button to start recording
5. Speak your memory or story
6. Click "Stop Recording" when finished
7. The AI will respond with voice and ask follow-up questions

### Creating Blog Posts

1. After having a conversation, click "📝 Create Blog Post"
2. The system will generate a beautiful blog post from your conversation
3. If you have family members added, they will automatically receive the blog post via email
4. The blog post will also be saved to your account

### Voice Controls

- **Start Recording**: Click the microphone button to begin speaking
- **Stop Recording**: Click the stop button or the AI will automatically stop after a pause
- **Stop Speaking**: Click the stop button if you want to interrupt the AI's response
- **Create Blog Post**: Generate a blog post from your conversation at any time

## Technical Details

### Components

- `VoiceConversation.tsx`: Main voice conversation component
- `gemini.ts`: Gemini AI service integration
- `gemini-voice/route.ts`: API route for Gemini voice conversations
- `speech.d.ts`: TypeScript declarations for Web Speech API

### API Integration

The voice feature uses:
- **Groq AI**: For fast and reliable AI response generation
- **Web Speech API**: For speech-to-text conversion
- **Browser Speech Synthesis**: For enhanced text-to-speech with voice selection
- **Supabase**: For storing conversations and blog posts
- **Email Service**: For sharing blog posts with family members

### Database Schema

The voice conversations use the same database tables as text conversations:
- `conversations`: Stores conversation metadata
- `messages`: Stores individual messages
- `blog_posts`: Stores generated blog posts
- `family_members`: Stores family member contact information

## Troubleshooting

### Voice Not Working

1. Check browser compatibility
2. Ensure microphone permissions are granted
3. Check that the microphone is working in other applications
4. Try refreshing the page

### API Errors

1. Verify the Gemini API key is correctly set in `.env.local`
2. Check that the API key has the necessary permissions
3. Ensure the API key is not expired

### Blog Post Generation Fails

1. Check that you have had a conversation with some content
2. Verify the Gemini API is working
3. Check the browser console for error messages

## Security Considerations

- Voice data is processed in real-time and not stored as audio files
- Only transcribed text is stored in the database
- All API communications are encrypted
- Family member email addresses are stored securely in Supabase

## Future Enhancements

Potential future improvements:
- Voice emotion detection
- Multiple language support
- Voice commands for navigation
- Audio file storage for special moments
- Voice-based memory search
- Integration with smart speakers
