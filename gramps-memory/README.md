# Gramps Memory - AI-Powered Memory Preservation Platform

A Next.js application that helps elderly users preserve and share their precious memories through AI-powered conversations, featuring both text and voice interactions with automatic blog post generation and family sharing.

## Features

- 🔐 **Authentication System**
  - Email/password signup and login
  - Google OAuth integration
  - Protected routes
  - Session management

- 💬 **AI Memory Conversations**
  - Text-based conversations with Groq AI
  - Voice conversations with Google Gemini AI
  - Intelligent follow-up questions
  - Memory categorization and organization

- 🎤 **Voice Features**
  - Speech-to-text using Web Speech API
  - Text-to-speech responses
  - Natural voice conversations
  - Hands-free memory sharing

- 📝 **Blog Post Generation**
  - Automatic conversion of conversations to blog posts
  - Beautiful formatting with markdown
  - AI-enhanced storytelling
  - Professional presentation

- 👨‍👩‍👧‍👦 **Family Sharing**
  - Add family members with contact information
  - Automatic email distribution of blog posts
  - Relationship categorization
  - Privacy controls

- 🎨 **Modern UI**
  - Responsive design with Tailwind CSS
  - Clean, professional interface
  - Loading states and error handling
  - Tabbed interface for different conversation types

## Prerequisites

- Node.js 18+ 
- A Supabase account and project
- A Google AI Studio account (for Gemini API)
- A Groq account (for text conversations)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd gramps-memory
npm install
```

### 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to **Settings** > **API**
3. Copy your project URL and anon key

### 3. Environment Variables

Create a `.env.local` file in the `gramps-memory` directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Groq API Configuration (for text conversations)
GROQ_API_KEY=your_groq_api_key_here

# Gemini API Configuration (for voice conversations)
GEMINI_API_KEY=your_gemini_api_key_here

# Email Configuration (for sending blog posts to family)
SMTP_HOST=your_smtp_host_here
SMTP_PORT=587
SMTP_USER=your_smtp_username_here
SMTP_PASS=your_smtp_password_here
SMTP_FROM=your_from_email_here
```

#### Getting API Keys

**Groq API Key:**
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key

**Gemini API Key:**
1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 4. Database Setup

In your Supabase dashboard, go to **SQL Editor** and run the database schema from `database-schema.sql`. This will create all necessary tables for memories, conversations, blog posts, and family members.

### 5. Quick Setup Script

Run the voice feature setup script to get started quickly:

```bash
node setup-voice-feature.js
```

This will create your `.env.local` file with the correct structure and guide you through API key setup.

### 6. Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)
6. Copy the Client ID and Client Secret
7. In Supabase dashboard, go to **Authentication** > **Providers** > **Google**
8. Enable Google provider and add your Client ID and Client Secret

### 7. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
gramps-memory/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts          # OAuth callback handler
│   │   ├── login/
│   │   │   └── page.tsx              # Login page
│   │   ├── signup/
│   │   │   └── page.tsx              # Signup page
│   │   ├── layout.tsx                # Root layout with AuthProvider
│   │   └── page.tsx                  # Main page with todos
│   ├── contexts/
│   │   └── AuthContext.tsx           # Authentication context
│   └── utils/
│       └── supabase.ts               # Supabase client configuration
├── package.json
└── README.md
```

## Usage

### Authentication Flow

1. **Sign Up**: Users can create accounts with email/password or Google OAuth
2. **Sign In**: Existing users can sign in with their credentials
3. **Protected Routes**: The main page shows different content based on authentication status
4. **Sign Out**: Users can sign out from the main page

### Memory Conversations

The application offers two types of AI-powered conversations:

#### Text Conversations
- Choose from predefined topics (Childhood, Family, Career, etc.)
- Type responses to AI questions
- Automatic memory saving
- Blog post generation

#### Voice Conversations
- Click the microphone button to start recording
- Speak naturally about your memories
- AI responds with voice
- Automatic transcription and blog post creation

### Family Sharing

1. **Add Family Members**: Enter names, emails, and relationships
2. **Automatic Sharing**: Blog posts are automatically emailed to family members
3. **Privacy Control**: Only share what you want with whom you want

### Blog Post Generation

- Conversations are automatically converted to beautiful blog posts
- AI-enhanced storytelling and formatting
- Professional presentation for family sharing
- Markdown formatting for easy reading

## Customization

### Styling
The app uses Tailwind CSS. You can customize the design by modifying the className attributes in the components.

### Database Schema
Modify the SQL schema in step 4 to match your application's data requirements.

### Authentication Providers
Add more OAuth providers in Supabase dashboard and update the UI accordingly.

## Troubleshooting

### Common Issues

1. **Environment Variables**: Make sure your `.env.local` file is in the correct location and has the right variable names.

2. **CORS Issues**: Ensure your Supabase project allows requests from your domain.

3. **Google OAuth**: Verify your redirect URIs match exactly in both Google Cloud Console and Supabase.

4. **Database Permissions**: Check that RLS policies are correctly set up for your tables.

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

This project is open source and available under the [MIT License](LICENSE).