#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎤 Setting up Voice Conversation Feature for Gramps Memory\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  
  let envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# Gemini API Configuration (Required for Voice Feature)
GEMINI_API_KEY=your_gemini_api_key_here

# Email Configuration (for sending blog posts to family)
SMTP_HOST=your_smtp_host_here
SMTP_PORT=587
SMTP_USER=your_smtp_username_here
SMTP_PASS=your_smtp_password_here
SMTP_FROM=your_from_email_here
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
} else {
  console.log('✅ .env.local file already exists');
}

// Check if Gemini API key is set
const envContent = fs.readFileSync(envPath, 'utf8');
if (envContent.includes('your_gemini_api_key_here')) {
  console.log('\n⚠️  IMPORTANT: You need to set up your Gemini API key!');
  console.log('\n📋 Steps to get your Gemini API key:');
  console.log('1. Go to https://makersuite.google.com/app/apikey');
  console.log('2. Sign in with your Google account');
  console.log('3. Click "Create API Key"');
  console.log('4. Copy the generated API key');
  console.log('5. Replace "your_gemini_api_key_here" in .env.local with your actual API key');
  console.log('\n🔧 After setting up the API key, restart your development server with: npm run dev');
} else {
  console.log('✅ Gemini API key appears to be configured');
}

console.log('\n🎉 Voice Feature Setup Complete!');
console.log('\n📚 Features available:');
console.log('• Voice conversations with Gemini AI');
console.log('• Automatic speech-to-text and text-to-speech');
console.log('• Blog post generation from conversations');
console.log('• Automatic sharing with family members');
console.log('\n🚀 Start the development server with: npm run dev');
console.log('📖 Read VOICE_FEATURE_SETUP.md for detailed instructions');
