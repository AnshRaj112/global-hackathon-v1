'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import BlogPostViewer from './BlogPostViewer';

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

interface ConversationTopic {
  id: string;
  title: string;
  description: string;
  prompts: string[];
  category: string;
}

const CONVERSATION_TOPICS: ConversationTopic[] = [
  {
    id: 'childhood',
    title: 'Childhood Memories',
    description: 'Share stories from your early years',
    category: 'childhood',
    prompts: [
      "Tell me about your childhood home. What was it like?",
      "What games did you play as a child?",
      "Who were your best friends growing up?",
      "What was your favorite subject in school?",
      "Tell me about a special holiday or celebration from your childhood."
    ]
  },
  {
    id: 'family',
    title: 'Family Stories',
    description: 'Preserve your family history',
    category: 'family',
    prompts: [
      "Tell me about your parents. What were they like?",
      "Do you have any siblings? What was your relationship like?",
      "Tell me about your grandparents. What stories did they share with you?",
      "What family traditions do you remember?",
      "Tell me about a family vacation or trip that was special."
    ]
  },
  {
    id: 'career',
    title: 'Career & Work',
    description: 'Share your professional journey',
    category: 'career',
    prompts: [
      "What was your first job? How did you get it?",
      "Tell me about your career path. How did you choose your profession?",
      "What was your favorite job and why?",
      "Tell me about a challenging project or achievement at work.",
      "What advice would you give to someone starting their career?"
    ]
  },
  {
    id: 'love',
    title: 'Love & Relationships',
    description: 'Stories of love and friendship',
    category: 'love',
    prompts: [
      "How did you meet your spouse/partner?",
      "Tell me about your wedding day.",
      "What's the secret to a long-lasting relationship?",
      "Tell me about your closest friends throughout life.",
      "What's the most romantic thing that ever happened to you?"
    ]
  },
  {
    id: 'adventures',
    title: 'Adventures & Travel',
    description: 'Your life adventures and travels',
    category: 'adventures',
    prompts: [
      "What's the most exciting trip you've ever taken?",
      "Tell me about a place you've always wanted to visit.",
      "What's the most interesting person you've met while traveling?",
      "Tell me about a time you tried something new or adventurous.",
      "What's your favorite place in the world and why?"
    ]
  },
  {
    id: 'wisdom',
    title: 'Life Lessons & Wisdom',
    description: 'Share the wisdom you\'ve gained',
    category: 'wisdom',
    prompts: [
      "What's the most important lesson life has taught you?",
      "If you could give advice to your younger self, what would it be?",
      "What values are most important to you?",
      "Tell me about a time you overcame a difficult challenge.",
      "What makes you most proud in life?"
    ]
  }
];

export default function MemoryConversation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTopic, setCurrentTopic] = useState<ConversationTopic | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showMemories, setShowMemories] = useState(false);
  const [showBlogPosts, setShowBlogPosts] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      fetchMemories();
    }
  }, [user]);

  const fetchMemories = async () => {
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
  };

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
    // Simulate AI response generation
    // In a real implementation, this would call an AI API
    const responses = [
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
    
    // Add some context-aware responses based on current topic
    if (currentTopic?.category === 'childhood') {
      responses.push("What a lovely childhood memory! What was your favorite part of being a child?");
    } else if (currentTopic?.category === 'family') {
      responses.push("Family stories are so precious. What made your family special?");
    } else if (currentTopic?.category === 'career') {
      responses.push("That's a great work story! What did you learn from that experience?");
    }

    return responses[Math.floor(Math.random() * responses.length)];
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

  const generateBlogPost = async (memory: Memory) => {
    if (!supabase || !user) return;

    // Generate blog post content
    const blogPostContent = `# ${memory.title}

*Originally shared on ${new Date(memory.created_at).toLocaleDateString()}*

${memory.content}

---

*This memory was captured through our interactive conversation system, designed to preserve family stories and wisdom for future generations.*`;

    try {
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
        return;
      }

      alert('Blog post created successfully!');
      return data;
    } catch (error) {
      console.error('Error creating blog post:', error);
    }
  };

  const getDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.full_name || user.email || 'User';
  };

  if (showBlogPosts) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Your Blog Posts</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowBlogPosts(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Conversations
            </button>
            <button
              onClick={() => { setShowBlogPosts(false); setShowMemories(true); }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              View Memories
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
          <h2 className="text-2xl font-bold text-gray-900">Your Memories</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowMemories(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Conversations
            </button>
            <button
              onClick={() => { setShowMemories(false); setShowBlogPosts(true); }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              View Blog Posts
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {memories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No memories yet. Start a conversation to create your first memory!
            </div>
          ) : (
            memories.map((memory) => (
              <div key={memory.id} className="bg-white p-6 rounded-lg shadow border">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{memory.title}</h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
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
                  <p className="mt-1">You can still use the conversation feature, but memories won't be saved until the database is set up.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome, {getDisplayName()}!
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Let's preserve your precious memories together. Choose a topic to start our conversation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CONVERSATION_TOPICS.map((topic) => (
            <div
              key={topic.id}
              className="bg-white p-6 rounded-lg shadow border hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => startConversation(topic)}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{topic.title}</h3>
              <p className="text-gray-600 mb-4">{topic.description}</p>
              <div className="text-sm text-indigo-600 font-medium">
                Start Conversation →
              </div>
            </div>
          ))}
        </div>

        <div className="text-center space-x-4">
          <button
            onClick={() => setShowMemories(true)}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            View My Memories ({memories.length})
          </button>
          <button
            onClick={() => setShowBlogPosts(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
          <h2 className="text-2xl font-bold text-gray-900">{currentTopic.title}</h2>
          <p className="text-gray-600">{currentTopic.description}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentTopic(null)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Topics
          </button>
          <button
            onClick={() => setShowMemories(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            My Memories
          </button>
          <button
            onClick={() => setShowBlogPosts(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Blog Posts
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border h-96 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Conversation</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-black'
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
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-black-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Share your memory..."
              className="flex-1 px-3 py-2 border border-black-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => {
                console.log('Send button clicked:', { userInput, isLoading, currentConversation: !!currentConversation });
              }}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Conversation Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Take your time and share as much detail as you'd like</li>
          <li>• Don't worry about perfect grammar or structure</li>
          <li>• Feel free to go off-topic if a memory leads you somewhere else</li>
          <li>• Your memories will be automatically saved as you share them</li>
        </ul>
      </div>
    </div>
  );
}
