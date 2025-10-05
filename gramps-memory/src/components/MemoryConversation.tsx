'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import BlogPostViewer from './BlogPostViewer';
import FamilyMembers from './FamilyMembers';
import Dialog from './Dialog';
import { GroqService, GroqMessage } from '../utils/groq';
import { EmailService, FamilyMember } from '../utils/email';
import { getDailyConversationTopics, ConversationTopic } from '../utils/conversationTopics';
import { StreakService } from '../utils/streak';
import { XPService } from '../utils/xpService';

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
  const [showBlogPosts, setShowBlogPosts] = useState(false);
  const [showFamilyMembers, setShowFamilyMembers] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [streakNotification, setStreakNotification] = useState<string | null>(null);
  const [xpNotification, setXPNotification] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const { user, refreshXP } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


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
      fetchFamilyMembers();
    }
  }, [user, fetchFamilyMembers]);

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
        // Update streak after successful memory save
        let updatedStreak = null;
        try {
          updatedStreak = await StreakService.updateStreak(user.id);
          if (updatedStreak) {
            // Show streak notification
            if (updatedStreak.current_streak === 1) {
              setStreakNotification("🎉 First conversation started! Your journey begins!");
            } else if (updatedStreak.current_streak === 7) {
              setStreakNotification("🔥 Amazing! 7 days in a row! You're on fire!");
            } else if (updatedStreak.current_streak === 30) {
              setStreakNotification("💪 Incredible! 30 days straight! You're a memory champion!");
            } else if (updatedStreak.current_streak > 1) {
              setStreakNotification(`🔥 ${updatedStreak.current_streak} days in a row! Keep it up!`);
            }
            
            // Clear notification after 5 seconds
            setTimeout(() => setStreakNotification(null), 5000);
          }
        } catch (streakError) {
          console.error('Error updating streak:', streakError);
          // Don't fail the memory save if streak update fails
        }

        // Award XP for message sent
        try {
          const xpResult = await XPService.awardMessageXP(user.id, 'text');

          if (xpResult.success && xpResult.xpAwarded > 0) {
            // Show XP notification
            if (xpResult.leveledUp && xpResult.newLevel) {
              setXPNotification(`🎉 Level Up! You're now ${xpResult.newLevel.title} ${xpResult.newLevel.icon}! +${xpResult.xpAwarded} XP`);
            } else {
              setXPNotification(`+${xpResult.xpAwarded} XP earned!`);
            }
            
            // Clear XP notification after 4 seconds
            setTimeout(() => setXPNotification(null), 4000);
          }

          // Award streak XP if applicable
          if (updatedStreak && updatedStreak.current_streak > 1) {
            const streakXPResult = await XPService.awardStreakXP(user.id, updatedStreak.current_streak);
            if (streakXPResult.success && streakXPResult.xpAwarded > 0) {
              // Show streak XP notification (replace or combine with existing)
              if (streakXPResult.leveledUp && streakXPResult.newLevel) {
                const level = streakXPResult.newLevel;
                setTimeout(() => {
                  setXPNotification(`🎉 Level Up! You're now ${level.title} ${level.icon}! +${streakXPResult.xpAwarded} streak XP`);
                  setTimeout(() => setXPNotification(null), 4000);
                }, 1000);
              } else {
                setTimeout(() => {
                  setXPNotification(`+${streakXPResult.xpAwarded} streak XP bonus!`);
                  setTimeout(() => setXPNotification(null), 3000);
                }, 1000);
              }
            }
          }
        } catch (xpError) {
          console.error('Error awarding XP:', xpError);
          // Don't fail the memory save if XP awarding fails
        }

        // Refresh XP data in navbar
        await refreshXP();
        
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
        showDialog('Error', 'Error creating blog post. Please try again.', 'error');
        return;
      }

      // Award XP for blog post creation
      try {
        const xpResult = await XPService.awardBlogXP(user.id, blogPost.id);

        if (xpResult.success && xpResult.xpAwarded > 0) {
          // Show XP notification
          if (xpResult.leveledUp && xpResult.newLevel) {
            setXPNotification(`🎉 Level Up! You're now ${xpResult.newLevel.title} ${xpResult.newLevel.icon}! +${xpResult.xpAwarded} XP for creating a blog post!`);
          } else {
            setXPNotification(`+${xpResult.xpAwarded} XP for creating a blog post! 📝`);
          }
          
          // Clear notification after 5 seconds
          setTimeout(() => setXPNotification(null), 5000);
        }
      } catch (xpError) {
        console.error('Error awarding XP for blog post:', xpError);
        // Don't fail the blog post creation if XP awarding fails
      }

      // Refresh XP data in navbar
      await refreshXP();

      // Update blog post count for achievements
      try {
        await StreakService.updateBlogPostCount(user.id);
      } catch (streakError) {
        console.error('Error updating blog post count:', streakError);
        // Don't fail the blog post creation if streak update fails
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
          showDialog('Success', `Blog post created and sent to ${emailResult.sent} family member(s)! ${emailResult.failed > 0 ? `${emailResult.failed} failed to send.` : ''}`, 'success');
        } else {
          showDialog('Warning', 'Blog post created, but failed to send emails to family members.', 'warning');
        }
      } else {
        showDialog('Success', 'Blog post created successfully! Add family members to automatically share future posts.', 'success');
      }

      return blogPost;
    } catch (error) {
      console.error('Error creating blog post from conversation:', error);
      showDialog('Error', `Failed to create blog post: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsLoading(false);
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
            story += `Hi there ${content.toLowerCase()}!\n\n`;
          } else if (topic.toLowerCase().includes('family')) {
            story += `Hi there ${content.toLowerCase()}!\n\n`;
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

  const showDialog = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setDialog({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
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
              onClick={() => { setShowBlogPosts(false); setShowFamilyMembers(true); }}
              className="px-4 py-2 btn-secondary"
            >
              Family Members
            </button>
            <Link
              href="/streak"
              className="px-4 py-2 btn-secondary"
            >
              My Progress
            </Link>
          </div>
        </div>
        <BlogPostViewer />
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
          <Link
            href="/streak"
            className="px-6 py-3 btn-primary inline-block"
          >
            My Progress
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Streak Notification */}
      {streakNotification && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-pulse">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{streakNotification}</p>
            </div>
          </div>
        </div>
      )}

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
            {isLoading ? 'Creating...' : 'Create Blog Post'}
          </button>
          <button
            onClick={() => setShowBlogPosts(true)}
            className="px-4 py-2 btn-primary"
          >
            View Blog Posts
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

      {/* Notifications */}
      {streakNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in">
          <div className="flex items-center">
            <span className="mr-2">🔥</span>
            <span>{streakNotification}</span>
          </div>
        </div>
      )}

      {xpNotification && (
        <div className="fixed top-16 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in">
          <div className="flex items-center">
            <span className="mr-2">⭐</span>
            <span>{xpNotification}</span>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
      />
    </div>
  );
}
