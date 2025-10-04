/**
 * Test script to verify email configuration
 * Run with: node test-email-config.js
 */

const nodemailer = require('nodemailer');

async function testEmailConfiguration() {
  console.log('🧪 Testing email configuration...\n');

  // Check environment variables
  const fromEmail = process.env.FROM_EMAIL;
  const appPassword = process.env.GOOGLE_APP_PASSWORD;

  console.log('📧 Environment Variables:');
  console.log(`FROM_EMAIL: ${fromEmail ? '✅ Set' : '❌ Missing'}`);
  console.log(`GOOGLE_APP_PASSWORD: ${appPassword ? '✅ Set' : '❌ Missing'}\n`);

  if (!fromEmail || !appPassword) {
    console.log('❌ Missing required environment variables!');
    console.log('Please set the following in your .env.local file:');
    console.log('FROM_EMAIL=your-email@gmail.com');
    console.log('GOOGLE_APP_PASSWORD=your-16-character-app-password\n');
    console.log('For Gmail App Password setup:');
    console.log('1. Enable 2-factor authentication on your Gmail account');
    console.log('2. Go to Google Account settings > Security');
    console.log('3. Under "2-Step Verification", click "App passwords"');
    console.log('4. Generate a new app password for "Mail"');
    console.log('5. Use this 16-character password as GOOGLE_APP_PASSWORD');
    return;
  }

  // Test email transporter
  try {
    console.log('🔧 Creating email transporter...');
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: fromEmail,
        pass: appPassword,
      },
    });

    console.log('✅ Email transporter created successfully');

    // Test connection
    console.log('🔌 Testing connection to Gmail...');
    await transporter.verify();
    console.log('✅ Connection to Gmail successful!\n');

    console.log('🎉 Email configuration is working correctly!');
    console.log('You can now use the blog saving and email feature.');

  } catch (error) {
    console.log('❌ Email configuration test failed:');
    console.log(`Error: ${error.message}\n`);
    
    if (error.message.includes('Invalid login')) {
      console.log('💡 This usually means:');
      console.log('- The app password is incorrect');
      console.log('- 2-factor authentication is not enabled');
      console.log('- The email address is incorrect\n');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('💡 Network connection issue. Please check your internet connection.\n');
    } else {
      console.log('💡 Please check your Gmail settings and app password configuration.\n');
    }
  }
}

// Load environment variables from .env.local if it exists
try {
  require('dotenv').config({ path: '.env.local' });
} catch (error) {
  // dotenv not available, that's okay
}

testEmailConfiguration();
