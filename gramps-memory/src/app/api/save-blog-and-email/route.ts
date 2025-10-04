import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '@/utils/email';

export interface SaveBlogAndEmailRequest {
  conversationId: string;
  title: string;
  userId: string;
  senderName: string;
}

export async function POST(request: NextRequest) {
  try {
    const { conversationId, title, userId, senderName }: SaveBlogAndEmailRequest = await request.json();

    if (!conversationId || !title || !userId || !senderName) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationId, title, userId, senderName' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Environment check:', { 
      hasSupabaseUrl: !!supabaseUrl, 
      hasSupabaseKey: !!supabaseKey,
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing'
    });
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
      return NextResponse.json(
        { 
          error: 'Database configuration not found. Please check your environment variables.',
          details: 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get conversation details
    console.log('Looking up conversation:', { conversationId, userId });
    
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    console.log('Conversation lookup result:', { conversation, conversationError });

    if (conversationError) {
      console.error('Conversation lookup error:', conversationError);
      return NextResponse.json(
        { error: `Conversation lookup failed: ${conversationError.message}` },
        { status: 500 }
      );
    }

    if (!conversation) {
      console.error('Conversation not found:', { conversationId, userId });
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Get all messages from the conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json(
        { error: 'Failed to fetch conversation messages' },
        { status: 500 }
      );
    }

    // Format messages into blog content
    const blogContent = formatMessagesAsBlog(messages || [], conversation.topic);

    // Create blog post in database
    const { data: blogPost, error: blogError } = await supabase
      .from('blog_posts')
      .insert([
        {
          title,
          content: blogContent,
          user_id: userId,
          published: true,
        },
      ])
      .select()
      .single();

    if (blogError) {
      return NextResponse.json(
        { error: 'Failed to save blog post' },
        { status: 500 }
      );
    }

    // Get family members
    const { data: familyMembers, error: familyError } = await supabase
      .from('family_members')
      .select('*')
      .eq('user_id', userId);

    if (familyError) {
      return NextResponse.json(
        { error: 'Failed to fetch family members' },
        { status: 500 }
      );
    }

    if (!familyMembers || familyMembers.length === 0) {
      return NextResponse.json({
        success: true,
        blogPost,
        message: 'Blog post saved successfully, but no family members found to email.',
        sent: 0,
        failed: 0,
      });
    }

    // Send emails to family members
    const emailResult = await EmailService.sendBlogToFamily(
      {
        title,
        content: blogContent,
        authorName: senderName,
        topic: conversation.topic,
        created_at: blogPost.created_at,
      },
      familyMembers,
      senderName
    );

    // Log email results in database
    for (let i = 0; i < familyMembers.length; i++) {
      const member = familyMembers[i];
      const emailStatus = i < emailResult.sent ? 'sent' : 'failed';
      const errorMessage = emailResult.errors && emailResult.errors[i] ? emailResult.errors[i] : null;

      await supabase
        .from('email_logs')
        .insert([
          {
            blog_post_id: blogPost.id,
            family_member_id: member.id,
            user_id: userId,
            email_status: emailStatus,
            sent_at: emailStatus === 'sent' ? new Date().toISOString() : null,
            error_message: errorMessage,
          },
        ]);
    }

    return NextResponse.json({
      success: true,
      blogPost,
      emailResult,
      message: `Blog post saved and emails sent to ${emailResult.sent} family members.`,
    });

  } catch (error) {
    console.error('Save blog and email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatMessagesAsBlog(messages: Array<{role: string, content: string, created_at: string}>, topic: string): string {
  let blogContent = `${topic}\n\n`;
  blogContent += `This memory was captured through conversation and preserved for future generations.\n\n`;
  blogContent += `---\n\n`;

  let currentSpeaker = '';
  let conversationText = '';

  for (const message of messages) {
    const speaker = message.role === 'user' ? 'Family Member' : 'AI Assistant';
    // const timestamp = new Date(message.created_at).toLocaleString();
    
    if (speaker !== currentSpeaker) {
      if (currentSpeaker) {
        conversationText += '\n\n';
      }
      conversationText += `${speaker}:\n`;
      currentSpeaker = speaker;
    }
    
    conversationText += `${message.content}\n`;
  }

  blogContent += conversationText;
  
  blogContent += `\n\n---\n\n`;
  blogContent += `This conversation was preserved on ${new Date().toLocaleDateString()} using Gramps Memory, a platform designed to help families preserve their stories and wisdom for future generations.`;

  return blogContent;
}
