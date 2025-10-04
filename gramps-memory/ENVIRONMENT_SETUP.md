# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the `gramps-memory` directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Groq AI Configuration
GROQ_API_KEY=your_groq_api_key

# Email Configuration (for sending blog posts to family)
# These are used server-side only in the API route
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

**Note**: Both email and Groq AI configurations are now handled server-side through API routes (`/api/send-email` and `/api/groq-chat`), so there are no client-side import issues or API key exposure risks.

## How to Get These Values

### 1. Supabase Configuration
1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy the "Project URL" and "anon public" key

### 2. Groq API Key
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Go to "API Keys" section
4. Create a new API key
5. Copy the key

### 3. Email Configuration (Gmail)
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click "Security" → "2-Step Verification" (enable if not already)
3. Go to "App passwords"
4. Generate a new app password for "Mail"
5. Use this password (not your regular Gmail password)

## Alternative Email Services

You can use other email services by changing the transporter configuration in `src/utils/email.ts`:

- **Outlook/Hotmail**: Use `service: 'hotmail'`
- **Yahoo**: Use `service: 'yahoo'`
- **Custom SMTP**: Configure with your own SMTP settings

## Testing Email Configuration

The app will automatically test the email configuration when it starts. Check the console for any error messages.

## API Routes

Both email and AI functionality are now handled through server-side API routes to prevent client-side issues and protect API keys.

### Email API (`/api/send-email`)
- Handles email sending server-side
- Uses nodemailer safely in a Node.js environment
- Returns detailed results about email delivery
- Includes proper error handling and logging

### Groq AI API (`/api/groq-chat`)
- Handles AI conversations server-side
- Protects Groq API key from client exposure
- Supports both chat responses and blog generation
- Includes fallback responses if AI is unavailable

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your API keys secure
- Use app passwords for email, not your regular password
- Consider using environment-specific configurations for production
