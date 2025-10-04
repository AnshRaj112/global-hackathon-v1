# Gramps Memory - Interactive AI Memory Preservation

## 🎯 Overview

Gramps Memory is an interactive AI conversation system designed to help grandparents preserve their life memories and turn them into beautiful blog posts for family members. Think Duolingo, but for preserving family stories and wisdom.

## ✨ Key Features

### 1. Interactive AI Conversations
- **6 Conversation Topics**: Childhood, Family, Career, Love & Relationships, Adventures & Travel, Life Lessons & Wisdom
- **Smart Prompts**: Each topic includes carefully crafted questions to guide meaningful conversations
- **AI Responses**: Context-aware responses that encourage deeper sharing and follow-up questions
- **Real-time Chat**: Smooth, responsive chat interface with typing indicators

### 2. Memory Preservation
- **Automatic Saving**: Conversations are automatically saved as memories in the database
- **Categorized Storage**: Memories are organized by topic (childhood, family, career, etc.)
- **Rich Content**: Full conversation history preserved with timestamps
- **Memory Gallery**: Easy-to-browse collection of all captured memories

### 3. Blog Post Generation
- **One-Click Creation**: Transform any memory into a beautifully formatted blog post
- **Markdown Formatting**: Professional formatting with titles, dates, and content structure
- **Export Options**: Copy to clipboard, download as Markdown file
- **Blog Management**: View, edit, and delete blog posts

### 4. User-Friendly Design
- **Senior-Friendly Interface**: Large text, clear buttons, intuitive navigation
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Accessibility**: High contrast, readable fonts, keyboard navigation
- **Progress Tracking**: Visual indicators of conversation progress and memory count

## 🛠️ Technical Implementation

### Database Schema
- **memories**: Store captured memories with titles, content, categories, and user association
- **blog_posts**: Generated blog posts linked to original memories
- **conversations**: Track conversation sessions by topic
- **messages**: Individual chat messages with role (user/assistant) and content
- **Row Level Security**: All data is protected with user-specific access controls

### AI Integration
- **Simulated AI Responses**: Context-aware responses based on conversation topic
- **Memory Triggers**: Automatic memory creation when sufficient content is shared
- **Topic-Aware Prompts**: Different conversation starters for each life category

### Authentication
- **Supabase Auth**: Secure user authentication with email/password and Google OAuth
- **User Sessions**: Persistent login state with automatic session management
- **Profile Management**: User metadata including full names and preferences

## 🚀 Getting Started

### Prerequisites
1. Node.js 18+ installed
2. Supabase account and project
3. Environment variables configured

### Setup Instructions
1. **Database Setup**: Run the SQL schema in `database-schema.sql` in your Supabase SQL editor
2. **Environment Variables**: Configure your Supabase URL and API key
3. **Install Dependencies**: `npm install`
4. **Start Development**: `npm run dev`

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 User Experience

### For Grandparents
1. **Sign Up/Login**: Simple authentication process
2. **Choose Topic**: Select from 6 life categories
3. **Start Chatting**: Answer AI prompts and share memories naturally
4. **View Memories**: Browse captured memories in organized gallery
5. **Create Blog Posts**: Transform memories into shareable blog posts
6. **Export & Share**: Copy or download blog posts to share with family

### For Family Members
1. **Access Blog Posts**: View generated blog posts from grandparents
2. **Download Content**: Save blog posts as Markdown files
3. **Share Stories**: Copy content to share on social media or family websites

## 🎨 Design Philosophy

### Duolingo-Inspired Learning
- **Gamified Experience**: Progress tracking and achievement-like memory counts
- **Bite-sized Sessions**: Short, focused conversation topics
- **Encouraging Feedback**: Positive AI responses that motivate continued sharing
- **Visual Progress**: Clear indicators of conversation progress and memory collection

### Senior-Friendly Design
- **Large Touch Targets**: Easy-to-tap buttons and interactive elements
- **High Contrast**: Clear visual hierarchy and readable text
- **Simple Navigation**: Intuitive flow with clear back buttons
- **Error Prevention**: Confirmation dialogs for destructive actions

## 🔮 Future Enhancements

### Planned Features
- **Real AI Integration**: Connect to OpenAI or similar for more sophisticated responses
- **Photo Integration**: Allow photo uploads to accompany memories
- **Family Sharing**: Invite family members to view specific memories
- **Memory Timeline**: Visual timeline of life events and memories
- **Voice Recording**: Audio capture for memories and blog posts
- **Print Options**: Generate PDF versions of blog posts for physical keepsakes

### Technical Improvements
- **Offline Support**: PWA capabilities for offline memory capture
- **Advanced Search**: Search through memories by keywords, dates, or topics
- **Memory Tags**: Custom tagging system for better organization
- **Export Formats**: Additional export options (PDF, Word, etc.)

## 🤝 Contributing

This project was built for the ACTA Global Hackathon 2024. Contributions and feedback are welcome!

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for preserving family memories and wisdom across generations.**
