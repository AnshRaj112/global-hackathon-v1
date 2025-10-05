import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export interface EmailBlogPost {
  title: string;
  content: string;
  authorName: string;
  topic: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  relationship: string;
  user_id: string;
  created_at: string;
}

export interface SendEmailRequest {
  blogPost: EmailBlogPost;
  familyMembers: FamilyMember[];
  senderName: string;
}

export async function POST(request: NextRequest) {
  try {
    const { blogPost, familyMembers, senderName }: SendEmailRequest = await request.json();

    if (!process.env.FROM_EMAIL || !process.env.GOOGLE_APP_PASSWORD) {
      return NextResponse.json(
        { error: 'Email configuration not found. Please set FROM_EMAIL and GOOGLE_APP_PASSWORD environment variables.' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.FROM_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD,
      },
    });

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const member of familyMembers) {
      try {
        const emailHtml = generateEmailTemplate(blogPost, member, senderName);
        
        await transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: member.email,
          subject: `New Family Memory: ${blogPost.title}`,
          html: emailHtml,
        });
        
        sent++;
      } catch (error) {
        console.error(`Failed to send email to ${member.email}:`, error);
        failed++;
        errors.push(`Failed to send to ${member.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: sent > 0,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    );
  }
}

function generateEmailTemplate(
  blogPost: EmailBlogPost,
  familyMember: FamilyMember,
  senderName: string
): string {
  // Extract the first user message to create a personalized greeting
  const contentLines = blogPost.content.split('\n');
  let firstUserMessage = '';
  let foundUserSection = false;
  
  for (const line of contentLines) {
    if (line.includes('Family Member:')) {
      foundUserSection = true;
      continue;
    }
    if (foundUserSection && line.trim() && !line.includes('AI Assistant:')) {
      firstUserMessage = line.trim();
      break;
    }
    if (line.includes('AI Assistant:')) {
      break;
    }
  }
  
  // Create a personalized greeting based on the actual conversation content
  const personalizedGreeting = firstUserMessage 
    ? `Dear ${familyMember.name},<br><br>I wanted to share a special memory with you. ${senderName} recently shared this story: "${firstUserMessage}"`
    : `Dear ${familyMember.name},<br><br>I wanted to share a special memory with you from ${senderName}.`;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${blogPost.title}</title>
    <style>
        body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title {
            color: #2c3e50;
            font-size: 28px;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #7f8c8d;
            font-size: 16px;
            font-style: italic;
        }
        .greeting {
            color: #2c3e50;
            font-size: 16px;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .content {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 30px;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #7f8c8d;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${blogPost.title}</h1>
            <p class="subtitle">A ${blogPost.topic} memory from ${senderName}</p>
        </div>
        
        <div class="greeting">
            ${personalizedGreeting}
        </div>
        
        <div class="content">
            ${blogPost.content.replace(/\n/g, '<br>')}
        </div>
        
        <div class="footer">
            <p>This memory was captured and shared through Gramps Memory, a platform designed to preserve family stories and wisdom for future generations.</p>
            <p>Sent on ${new Date().toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>`;
}
