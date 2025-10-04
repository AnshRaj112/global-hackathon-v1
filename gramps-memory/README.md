# Gramps Memory - Supabase Authentication App

A Next.js application with Supabase authentication, featuring login/signup pages with Google OAuth integration and a todos example.

## Features

- 🔐 **Authentication System**
  - Email/password signup and login
  - Google OAuth integration
  - Protected routes
  - Session management

- 📝 **Todos Example**
  - Display todos from Supabase database
  - User-specific data access

- 🎨 **Modern UI**
  - Responsive design with Tailwind CSS
  - Clean, professional interface
  - Loading states and error handling

## Prerequisites

- Node.js 18+ 
- A Supabase account and project

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
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

In your Supabase dashboard, go to **SQL Editor** and run this query to create the todos table:

```sql
-- Create todos table
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own todos
CREATE POLICY "Users can view their own todos" ON todos
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own todos
CREATE POLICY "Users can insert their own todos" ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own todos
CREATE POLICY "Users can update their own todos" ON todos
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own todos
CREATE POLICY "Users can delete their own todos" ON todos
  FOR DELETE USING (auth.uid() = user_id);
```

### 5. Google OAuth Setup (Optional)

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

### 6. Run the Application

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

### Todos Example

The main page demonstrates:
- Fetching data from Supabase
- User-specific data access
- Authentication state management

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