'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import BlogPostViewer from './BlogPostViewer';
import FamilyMembers from './FamilyMembers';
import { GroqService, GroqMessage } from '../utils/groq';
import { EmailService, FamilyMember } from '../utils/email';
import { getDailyConversationTopics, ConversationTopic } from '../utils/conversationTopics';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  memory_id?: string;
}

interface Memory {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  user_id: string;
}

interface Conversation {
  id: string;
  topic: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Get daily conversation topics
const getConversationTopics = () => getDailyConversationTopics();

export default function MemoryConversation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTopic, setCurrentTopic] = useState<ConversationTopic | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showMemories, setShowMemories] = useState(false);
  const [showBlogPosts, setShowBlogPosts] = useState(false);
  const [showFamilyMembers, setShowFamilyMembers] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMemories = useCallback(async () => {
    if (!supabase) {
      console.log('Supabase not configured, skipping memory fetch');
      return;
    }
    
    if (!user) {
      console.log('User not authenticated, skipping memory fetch');
      return;
    }

    try {
      console.log('Fetching memories for user:', user.id);
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching memories:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // If table doesn't exist, show a helpful message
        if (error.code === 'PGRST116' || error.message.includes('relation "memories" does not exist')) {
          console.warn('Memories table does not exist. Please run the database schema in your Supabase SQL editor.');
          setDatabaseError('Database tables not found. Please run the database schema in your Supabase SQL editor.');
        }
        return;
      }

      console.log('Successfully fetched memories:', data?.length || 0);
      setMemories(data || []);
    } catch (error) {
      console.error('Error fetching memories:', error);
    }
  }, [user]);

  const fetchFamilyMembers = useCallback(async () => {
    if (!supabase || !user) return;

    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching family members:', error);
        return;
      }

      setFamilyMembers(data || []);
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      fetchMemories();
      fetchFamilyMembers();
    }
  }, [user, fetchMemories, fetchFamilyMembers]);

  const startConversation = async (topic: ConversationTopic) => {
    if (!user) {
      console.error('User not available');
      return;
    }

    setCurrentTopic(topic);
    
    // Create conversation in database
    if (supabase) {
      try {
        const { data: conversationData, error: conversationError } = await supabase
          .from('conversations')
          .insert([
            {
              topic: topic.title,
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (conversationError) {
          console.error('Error creating conversation:', conversationError);
          // Still allow conversation to start even if database fails
          setCurrentConversation({
            id: 'temp-' + Date.now(),
            topic: topic.title,
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } else {
          setCurrentConversation(conversationData);
        }
      } catch (error) {
        console.error('Error starting conversation:', error);
        // Create a temporary conversation to allow the user to continue
        setCurrentConversation({
          id: 'temp-' + Date.now(),
          topic: topic.title,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } else {
      // Supabase not available, create temporary conversation
      setCurrentConversation({
        id: 'temp-' + Date.now(),
        topic: topic.title,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // Create initial assistant message
    const initialMessage: Message = {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm here to help you preserve your memories about ${topic.title.toLowerCase()}. ${topic.description}\n\nLet's start with this question: ${topic.prompts[0]}`,
      timestamp: new Date().toISOString()
    };

    setMessages([initialMessage]);

    // Save initial message to database if Supabase is available and conversation is real
    if (supabase && currentConversation && !currentConversation.id.startsWith('temp-')) {
      try {
        const { error: messageError } = await supabase
          .from('messages')
          .insert([
            {
              conversation_id: currentConversation.id,
              role: 'assistant',
              content: initialMessage.content,
            },
          ]);
        
        if (messageError) {
          console.error('Error saving initial message:', messageError);
        }
      } catch (error) {
        console.error('Error saving initial message:', error);
      }
    }
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    try {
      // Convert messages to Groq format (including the current user message)
      const groqMessages: GroqMessage[] = [
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: userMessage
        }
      ];

      console.log('Sending to Groq:', {
        messages: groqMessages.length,
        topic: currentTopic?.title,
        userMessage: userMessage
      });

      const userContext = user?.user_metadata?.full_name ? 
        `You are talking to ${user.user_metadata.full_name}` : 
        undefined;

      // Use Groq AI for real conversation
      return await GroqService.generateResponse(
        groqMessages,
        currentTopic?.title || 'general conversation',
        userContext
      );
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Fallback responses if Groq fails
      const fallbackResponses = [
        "That's wonderful! Tell me more about that.",
        "I can see this memory means a lot to you. What happened next?",
        "That sounds like a special moment. How did it make you feel?",
        "What a beautiful story! Can you share more details?",
        "That's fascinating! What else do you remember about that time?",
        "I love hearing about this! What was the most memorable part?",
        "That's such an important memory. How did it shape who you are today?",
        "What a wonderful experience! Tell me more about the people involved.",
        "That sounds like it was very meaningful to you. What made it special?",
        "I'm so glad you're sharing this with me. What other memories does this bring up?"
      ];
      
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  };

  const saveMemory = async (content: string, category: string) => {
    if (!supabase || !user) return;

    try {
      const { data, error } = await supabase
        .from('memories')
        .insert([
          {
            title: `${category} Memory - ${new Date().toLocaleDateString()}`,
            content: content,
            category: category,
            user_id: user.id,
          },
        ])
        .select();

      if (error) {
        console.error('Error saving memory:', error);
        return;
      }

      if (data && data[0]) {
        setMemories([data[0], ...memories]);
        return data[0].id;
      }
    } catch (error) {
      console.error('Error saving memory:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !currentConversation) {
      console.log('Cannot send message:', { userInput: userInput.trim(), isLoading, currentConversation: !!currentConversation });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = userInput;
    setUserInput('');
    setIsLoading(true);

    try {
      // Save user message to database if Supabase is available and conversation is real
      if (supabase && !currentConversation.id.startsWith('temp-')) {
        const { error: userMessageError } = await supabase
          .from('messages')
          .insert([
            {
              conversation_id: currentConversation.id,
              role: 'user',
              content: currentInput,
            },
          ]);
        
        if (userMessageError) {
          console.error('Error saving user message:', userMessageError);
        }
      }

      // Generate AI response
      const aiResponse = await generateAIResponse(currentInput);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI message to database if Supabase is available and conversation is real
      if (supabase && !currentConversation.id.startsWith('temp-')) {
        const { error: aiMessageError } = await supabase
          .from('messages')
          .insert([
            {
              conversation_id: currentConversation.id,
              role: 'assistant',
              content: aiResponse,
            },
          ]);
        
        if (aiMessageError) {
          console.error('Error saving AI message:', aiMessageError);
        }
      }

      // Save memory if the conversation has enough content
      if (messages.length > 2) {
        const conversationContent = messages
          .filter(m => m.role === 'user')
          .map(m => m.content)
          .join(' ');
        
        if (conversationContent.length > 100) {
          await saveMemory(conversationContent, currentTopic?.category || 'general');
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateBlogPostFromConversation = async () => {
    if (!supabase || !user || !currentConversation || messages.length < 2) return;

    setIsLoading(true);
    try {
      // First, ensure conversation is saved to database
      if (currentConversation.id.startsWith('temp-')) {
        if (!supabase) {
          throw new Error('Database connection not available. Please try again.');
        }

        console.log('Saving temporary conversation to database...');

        const { data: savedConversation, error: conversationError } = await supabase
          .from('conversations')
          .insert([
            {
              topic: currentConversation.topic,
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (conversationError || !savedConversation) {
          throw new Error(`Failed to save conversation to database: ${conversationError?.message || 'No conversation returned'}`);
        }

        // Save all messages to the database
        const messageInserts = messages.map((message) => ({
          conversation_id: savedConversation.id,
          role: message.role,
          content: message.content,
          created_at: message.timestamp,
        }));

        const { error: messagesError } = await supabase
          .from('messages')
          .insert(messageInserts);

        if (messagesError) {
          console.error('Error saving messages:', messagesError);
        }

        // Update the current conversation with the real ID
        setCurrentConversation(savedConversation);
      }

      // Format the actual conversation as a blog post
      const blogPostContent = formatConversationAsBlog(messages, currentConversation.topic);

      // Create blog post in database
      const { data: blogPost, error: blogError } = await supabase
        .from('blog_posts')
        .insert([
          {
            title: `${currentConversation.topic} - ${new Date().toLocaleDateString()}`,
            content: blogPostContent,
            user_id: user.id,
            published: true,
          },
        ])
        .select()
        .single();

      if (blogError) {
        console.error('Error creating blog post:', blogError);
        alert('Error creating blog post. Please try again.');
        return;
      }

      // Send email to family members if any exist
      if (familyMembers.length > 0) {
        const emailResult = await EmailService.sendBlogToFamily(
          {
            title: `${currentConversation.topic} - ${new Date().toLocaleDateString()}`,
            content: blogPostContent,
            authorName: user.user_metadata?.full_name || 'Family Member',
            topic: currentConversation.topic,
            created_at: new Date().toISOString()
          },
          familyMembers,
          user.user_metadata?.full_name || 'Family Member'
        );

        if (emailResult.success) {
          alert(`Blog post created and sent to ${emailResult.sent} family member(s)! ${emailResult.failed > 0 ? `${emailResult.failed} failed to send.` : ''}`);
        } else {
          alert('Blog post created, but failed to send emails to family members.');
        }
      } else {
        alert('Blog post created successfully! Add family members to automatically share future posts.');
      }

      return blogPost;
    } catch (error) {
      console.error('Error creating blog post from conversation:', error);
      alert(`Failed to create blog post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateBlogPost = async (memory: Memory) => {
    if (!supabase || !user) return;

    try {
      // Use Groq AI to generate a beautiful blog post
      const userContext = user?.user_metadata?.full_name ? 
        `This memory belongs to ${user.user_metadata.full_name}` : 
        undefined;

      const blogPostContent = await GroqService.generateBlogPost(
        memory.content,
        memory.category,
        userContext
      );

      const { data, error } = await supabase
        .from('blog_posts')
        .insert([
          {
            title: memory.title,
            content: blogPostContent,
            memory_id: memory.id,
            user_id: user.id,
            published: true,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating blog post:', error);
        alert('Error creating blog post. Please try again.');
        return;
      }

      // Send email to family members if any exist
      if (familyMembers.length > 0) {
        const emailResult = await EmailService.sendBlogToFamily(
          {
            title: memory.title,
            content: blogPostContent,
            authorName: user.user_metadata?.full_name || 'Family Member',
            topic: memory.category,
            created_at: new Date().toISOString()
          },
          familyMembers,
          user.user_metadata?.full_name || 'Family Member'
        );

        if (emailResult.success) {
          alert(`Blog post created and sent to ${emailResult.sent} family member(s)! ${emailResult.failed > 0 ? `${emailResult.failed} failed to send.` : ''}`);
        } else {
          alert('Blog post created, but failed to send emails to family members.');
        }
      } else {
        alert('Blog post created successfully! Add family members to automatically share future posts.');
      }

      return data;
    } catch (error) {
      console.error('Error creating blog post:', error);
      alert('Error creating blog post. Please try again.');
    }
  };


  const formatConversationAsBlog = (messages: Message[], topic: string): string => {
    let blogContent = 'Dear Family,\n\n';
    
    // Extract only the family member's responses
    const familyMemberMessages = messages.filter(msg => msg.role === 'user');
    
    if (familyMemberMessages.length === 0) {
      return 'Dear Family,\n\nNo memories were shared in this conversation.';
    }
    
    // Create a narrative from the family member's responses
    let story = '';
    for (let i = 0; i < familyMemberMessages.length; i++) {
      const message = familyMemberMessages[i];
      const content = message.content.trim();
      
      if (content) {
        // If it's the first response, start with a topic-related sentence
        if (i === 0) {
          if (topic.toLowerCase().includes('childhood')) {
            story += `My childhood home was ${content.toLowerCase()}!\n\n`;
          } else if (topic.toLowerCase().includes('family')) {
            story += `My family was ${content.toLowerCase()}!\n\n`;
          } else {
            story += `${content}\n\n`;
          }
        } else {
          story += `${content}\n\n`;
        }
      }
    }
    
    blogContent += story.trim();
    return blogContent;
  };

  const getDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.full_name || user.email || 'User';
  };

  if (showFamilyMembers) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-main">Family Members</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFamilyMembers(false)}
              className="px-4 py-2 btn-primary"
            >
              Back to Conversations
            </button>
            <button
              onClick={() => { setShowFamilyMembers(false); setShowMemories(true); }}
              className="px-4 py-2 btn-primary"
            >
              View Memories
            </button>
            <button
              onClick={() => { setShowFamilyMembers(false); setShowBlogPosts(true); }}
              className="px-4 py-2 btn-primary"
            >
              View Blog Posts
            </button>
          </div>
        </div>
        <FamilyMembers />
      </div>
    );
  }

  if (showBlogPosts) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-main">Your Blog Posts</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowBlogPosts(false)}
              className="px-4 py-2 btn-primary"
            >
              Back to Conversations
            </button>
            <button
              onClick={() => { setShowBlogPosts(false); setShowMemories(true); }}
              className="px-4 py-2 btn-primary"
            >
              View Memories
            </button>
            <button
              onClick={() => { setShowBlogPosts(false); setShowFamilyMembers(true); }}
              className="px-4 py-2 btn-secondary"
            >
              Family Members
            </button>
          </div>
        </div>
        <BlogPostViewer />
      </div>
    );
  }

  if (showMemories) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-main">Your Memories</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowMemories(false)}
              className="px-4 py-2 btn-primary"
            >
              Back to Conversations
            </button>
            <button
              onClick={() => { setShowMemories(false); setShowBlogPosts(true); }}
              className="px-4 py-2 btn-primary"
            >
              View Blog Posts
            </button>
            <button
              onClick={() => { setShowMemories(false); setShowFamilyMembers(true); }}
              className="px-4 py-2 btn-secondary"
            >
              Family Members
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {memories.length === 0 ? (
            <div className="text-center py-8 text-secondary">
              No memories yet. Start a conversation to create your first memory!
            </div>
          ) : (
            memories.map((memory) => (
              <div key={memory.id} className="bg-white p-6 rounded-lg shadow border">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-main">{memory.title}</h3>
                  <span className="text-sm text-secondary bg-secondary bg-opacity-20 px-2 py-1 rounded">
                    {memory.category}
                  </span>
                </div>
                <p className="text-gray-700 mb-4">{memory.content}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => generateBlogPost(memory)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Generate Blog Post
                  </button>
                  <span className="text-xs text-gray-400 self-center">
                    {new Date(memory.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (!currentTopic) {
    return (
      <div className="space-y-6">
        {databaseError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Database Setup Required
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{databaseError}</p>
                  <p className="mt-1">You can still use the conversation feature, but memories won&apos;t be saved until the database is set up.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-main mb-4">
            Welcome, {getDisplayName()}!
          </h2>
          <p className="text-lg text-secondary mb-8">
            Let&apos;s preserve your precious memories together. Choose a topic to start our conversation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getConversationTopics().map((topic) => (
            <div
              key={topic.id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => startConversation(topic)}
            >
              <h3 className="text-xl font-semibold text-main mb-2">{topic.title}</h3>
              <p className="text-secondary mb-4">{topic.description}</p>
              <div className="text-sm text-primary font-medium flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Start Conversation
              </div>
            </div>
          ))}
        </div>

        <div className="text-center space-x-4">
          <button
            onClick={() => setShowFamilyMembers(true)}
            className="px-6 py-3 btn-secondary"
          >
            Family Members ({familyMembers.length})
          </button>
          <button
            onClick={() => setShowBlogPosts(true)}
            className="px-6 py-3 btn-primary"
          >
            View Blog Posts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-main">{currentTopic.title}</h2>
          <p className="text-secondary">{currentTopic.description}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentTopic(null)}
            className="px-4 py-2 btn-primary"
          >
            Back to Topics
          </button>
          <button
            onClick={generateBlogPostFromConversation}
            disabled={isLoading || !currentConversation || messages.length < 2}
            className="px-4 py-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            title="This will create a blog post from your actual conversation"
          >
            {isLoading ? 'Creating...' : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Create Blog Post
              </>
            )}
          </button>
          <button
            onClick={() => setShowBlogPosts(true)}
            className="px-4 py-2 btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            View Blog Posts
          </button>
          <button
            onClick={() => setShowFamilyMembers(true)}
            className="px-4 py-2 btn-secondary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Family ({familyMembers.length})
          </button>
        </div>
      </div>

      <div className="card h-96 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-main">Text Conversation</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md ${
                  message.role === 'user'
                    ? 'memory-bubble-user'
                    : 'memory-bubble-ai'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="memory-bubble-ai">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-secondary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage}>
            <div className="flex space-x-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Share your memory..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-main"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !userInput.trim()}
                className="px-6 py-3 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  console.log('Send button clicked:', { userInput, isLoading, currentConversation: !!currentConversation });
                }}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-primary mb-2">Text Conversation Tips:</h4>
        <ul className="text-sm text-primary space-y-1">
          <li>• Take your time and share as much detail as you&apos;d like</li>
          <li>• Don&apos;t worry about perfect grammar or structure</li>
          <li>• Feel free to go off-topic if a memory leads you somewhere else</li>
          <li>• Your memories will be automatically saved as you share them</li>
        </ul>
      </div>
    </div>
  );
}
