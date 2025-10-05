'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { EmailService, FamilyMember } from '../utils/email';
import { getDailyConversationTopics, ConversationTopic } from '../utils/conversationTopics';
import { XPService } from '../utils/xpService';
import { calculateLevel, formatXP } from '../utils/xp';
import Dialog from './Dialog';

interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isVoice?: boolean;
}

interface VoiceConversation {
  id: string;
  topic: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Get daily conversation topics
const getConversationTopics = () => getDailyConversationTopics();

export default function VoiceConversation() {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [currentTopic, setCurrentTopic] = useState<ConversationTopic | null>(null);
  const [currentConversation, setCurrentConversation] = useState<VoiceConversation | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showFamilyMembers, setShowFamilyMembers] = useState(false);
  const [showBlogPosts, setShowBlogPosts] = useState(false);
  const [conversationText, setConversationText] = useState('');
  const [recordingTimeout, setRecordingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [recognitionState, setRecognitionState] = useState<'idle' | 'starting' | 'running' | 'stopping'>('idle');
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
  
  const { user, userXP, refreshXP } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  // Cleanup timeout and recognition on unmount
  useEffect(() => {
    return () => {
      if (recordingTimeout) {
        clearTimeout(recordingTimeout);
      }
      
      // Cleanup speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log('Error stopping recognition on cleanup:', error);
        }
      }
      
      // Cleanup speech synthesis
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      synthesisRef.current = null;
    };
  }, [recordingTimeout]);

  const generateAIResponse = useCallback(async (userMessage: string): Promise<string> => {
    try {
      // Use Groq for generating AI responses (faster and more reliable)
      const groqMessages = [
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: userMessage
        }
      ];

      const userContext = user?.user_metadata?.full_name ? 
        `You are talking to ${user.user_metadata.full_name}` : 
        undefined;

      const response = await fetch('/api/groq-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: groqMessages,
          topic: currentTopic?.title || 'general conversation',
          userContext
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      const fallbackResponses = [
        "That's wonderful! Tell me more about that.",
        "I can see this memory means a lot to you. What was the most special part?",
        "That sounds like it was very meaningful to you. How did it make you feel?",
        "What a beautiful story! Can you share more details about what happened?",
        "I love hearing about this! What other memories does this bring to mind?",
        "That's such an important memory. How did it shape who you are today?",
        "What a wonderful experience! Tell me more about the people involved.",
        "That sounds like it was very special to you. What made it memorable?",
        "I'm so glad you're sharing this with me. What was the best part of that time?",
        "That's fascinating! What else do you remember about that period?"
      ];
      
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  }, [messages, user, currentTopic]);

  const handleVoiceInput = useCallback(async (transcript: string) => {
    if (!transcript.trim() || !currentConversation) return;

    const userMessage: VoiceMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: transcript,
      timestamp: new Date().toISOString(),
      isVoice: true
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Save user message to database if Supabase is available and conversation is real
      if (supabase && !currentConversation.id.startsWith('temp-')) {
        const { error: userMessageError } = await supabase
          .from('messages')
          .insert([
            {
              conversation_id: currentConversation.id,
              role: 'user',
              content: transcript,
            },
          ]);
        
        if (userMessageError) {
          console.error('Error saving user message:', userMessageError);
        }
      }

      // Generate AI response using Gemini
      const aiResponse = await generateAIResponse(transcript);
      
      const aiMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
        isVoice: true
      };

      setMessages(prev => [...prev, aiMessage]);
      speakText(aiResponse);

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

      // Update conversation text for blog generation
      setConversationText(prev => {
        const conversationContent = [...messages, userMessage, aiMessage]
          .filter(m => m.role === 'user')
          .map(m => m.content)
          .join(' ');
        return conversationContent;
      });

      // Award XP for voice message sent
      if (user) {
        try {
          const xpResult = await XPService.awardMessageXP(user.id, 'voice');
          if (xpResult.success && xpResult.xpAwarded > 0) {
            if (xpResult.leveledUp && xpResult.newLevel) {
              setXPNotification(`🎉 Level Up! You're now ${xpResult.newLevel.title} ${xpResult.newLevel.icon}! +${xpResult.xpAwarded} XP`);
            } else {
              setXPNotification(`+${xpResult.xpAwarded} XP for voice message!`);
            }
            setTimeout(() => setXPNotification(null), 4000);
          }
        } catch (xpError) {
          console.error('Error awarding voice XP:', xpError);
        }

        // Refresh XP data in navbar
        await refreshXP();
      }

    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [currentConversation, supabase, generateAIResponse]);

  const stopRecording = useCallback(() => {
    console.log('Stopping voice recording...');
    
    if (recognitionRef.current && recognitionState === 'running') {
      setRecognitionState('stopping');
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        setRecognitionState('idle');
        setIsRecording(false);
      }
    }
    
    // Clear the timeout
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      setRecordingTimeout(null);
    }
    
    setIsRecording(false);
  }, [recognitionState, recordingTimeout]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        console.log('Initializing speech recognition...');
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true; // Allow continuous speech recognition
        recognitionRef.current.interimResults = true; // Get interim results to detect ongoing speech
        recognitionRef.current.lang = 'en-US';


        recognitionRef.current.onresult = (event) => {
          console.log('Speech recognition result:', event);
          
          // Get the latest result
          const latestResult = event.results[event.results.length - 1];
          const transcript = latestResult[0].transcript;
          const isFinal = latestResult.isFinal;
          
          console.log('Transcribed text:', transcript, 'isFinal:', isFinal);
          
          // If this is a final result and we have text, process it
          if (isFinal && transcript.trim()) {
            // Clear the timeout since we got a final result
            if (recordingTimeout) {
              clearTimeout(recordingTimeout);
              setRecordingTimeout(null);
            }
            handleVoiceInput(transcript);
          } else if (!isFinal && transcript.trim()) {
            // This is interim results - user is still speaking
            // Reset the timeout to give them more time
            if (recordingTimeout) {
              clearTimeout(recordingTimeout);
              // Set a new 30-second timeout from now
              const newTimeout = setTimeout(() => {
                console.log('Recording timeout reached (30 seconds of silence), stopping...');
                stopRecording();
              }, 30000);
              setRecordingTimeout(newTimeout);
            }
            console.log('User is still speaking, extending recording time...');
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error, event.message);
          setIsRecording(false);
          setRecognitionState('idle');
          
          // Clear timeout on error
          if (recordingTimeout) {
            clearTimeout(recordingTimeout);
            setRecordingTimeout(null);
          }
          
          // Show user-friendly error messages
          switch (event.error) {
            case 'no-speech':
              showDialog('No Speech Detected', 'No speech detected. Please try speaking again.', 'warning');
              break;
            case 'audio-capture':
              showDialog('Microphone Access', 'Microphone not accessible. Please check your microphone permissions.', 'error');
              break;
            case 'not-allowed':
              showDialog('Permission Denied', 'Microphone access denied. Please allow microphone access and try again.', 'error');
              break;
            case 'network':
              showDialog('Network Error', 'Network error occurred. Please check your internet connection.', 'error');
              break;
            case 'aborted':
              // Don't show dialog for aborted - this is usually intentional
              console.log('Speech recognition was aborted (likely intentional)');
              break;
            case 'service-not-allowed':
              showDialog('Service Unavailable', 'Speech recognition service not available. Please try again later.', 'error');
              break;
            default:
              showDialog('Speech Recognition Error', `Speech recognition error: ${event.error}. Please try again.`, 'error');
          }
        };

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          setIsRecording(false);
          setRecognitionState('idle');
        };

      } else {
        console.error('Speech recognition not supported in this browser');
      }
    }
  }, [handleVoiceInput, stopRecording, recordingTimeout]);

  const startVoiceConversation = async (topic: ConversationTopic) => {
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
        setCurrentConversation({
          id: 'temp-' + Date.now(),
          topic: topic.title,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } else {
      setCurrentConversation({
        id: 'temp-' + Date.now(),
        topic: topic.title,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // Create initial assistant message
    const initialMessage: VoiceMessage = {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm here to help you preserve your memories about ${topic.title.toLowerCase()}. ${topic.description}\n\nLet's start with this question: ${topic.prompts[0]}`,
      timestamp: new Date().toISOString(),
      isVoice: true
    };

    setMessages([initialMessage]);
    speakText(initialMessage.content);
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      showDialog('Browser Not Supported', 'Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.', 'error');
      return;
    }

    // Prevent multiple recognition instances
    if (recognitionState !== 'idle') {
      console.log('Speech recognition already running, ignoring start request');
      return;
    }

    console.log('Starting voice recording...');
    setIsRecording(true);
    setRecognitionState('starting');
    
    // Set a timeout to automatically stop recording after 30 seconds
    const timeout = setTimeout(() => {
      console.log('Recording timeout reached (30 seconds), stopping...');
      stopRecording();
    }, 30000);
    setRecordingTimeout(timeout);
    
    try {
      recognitionRef.current.start();
      // Set running state after successful start
      setTimeout(() => {
        setRecognitionState('running');
      }, 100);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsRecording(false);
      setRecognitionState('idle');
      if (recordingTimeout) {
        clearTimeout(recordingTimeout);
        setRecordingTimeout(null);
      }
      showDialog('Recording Error', 'Error starting voice recording. Please try again.', 'error');
    }
  };




  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Stop any current speech
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Enhanced voice configuration for better speech quality
      utterance.rate = 0.75; // Slightly slower for elderly users
      utterance.pitch = 0.9; // Slightly lower pitch for warmth
      utterance.volume = 0.9; // Higher volume for clarity
      utterance.lang = 'en-US';
      
      // Wait for voices to load if they're not available yet
      const selectVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          // Voices not loaded yet, wait a bit and try again
          setTimeout(selectVoice, 100);
          return;
        }
        
        const preferredVoices = voices.filter(voice => 
          voice.lang.startsWith('en') && 
          (voice.name.includes('Google') || 
           voice.name.includes('Microsoft') || 
           voice.name.includes('Natural') ||
           voice.name.includes('Enhanced'))
        );
        
        if (preferredVoices.length > 0) {
          utterance.voice = preferredVoices[0];
          console.log('Using voice:', preferredVoices[0].name);
        } else {
          console.log('Using default voice');
        }
        
        // Start speaking after voice is selected
        try {
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.error('Error starting speech synthesis:', error);
          setIsSpeaking(false);
          synthesisRef.current = null;
        }
      };
      
      // Select voice and start speaking
      selectVoice();
      
      utterance.onstart = () => {
        console.log('Speech started');
        setIsSpeaking(true);
      };
      
      utterance.onend = () => {
        console.log('Speech ended');
        setIsSpeaking(false);
        synthesisRef.current = null;
      };
      
      utterance.onerror = (event) => {
        // Handle specific error types without logging as errors for normal cases
        switch (event.error) {
          case 'interrupted':
            // This is normal when speech is intentionally stopped
            console.log('Speech was interrupted');
            setIsSpeaking(false);
            synthesisRef.current = null;
            break;
          case 'canceled':
            console.log('Speech was canceled');
            setIsSpeaking(false);
            synthesisRef.current = null;
            break;
          case 'not-allowed':
            console.warn('Speech synthesis not allowed - check browser permissions');
            setIsSpeaking(false);
            synthesisRef.current = null;
            break;
          default:
            console.error('Speech synthesis error:', event.error);
            setIsSpeaking(false);
            synthesisRef.current = null;
        }
      };
      
      synthesisRef.current = utterance;
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      synthesisRef.current = null;
    }
  };

  const generateBlogPost = async () => {
    if (!supabase || !user || !messages.length) return;

    try {
      // Format the actual conversation as a blog post
      const blogPostContent = formatConversationAsBlog(messages, currentTopic?.title || 'Voice Memory');

      const { data: blogData, error } = await supabase
        .from('blog_posts')
        .insert([
          {
            title: `${currentTopic?.title} Memory - ${new Date().toLocaleDateString()}`,
            content: blogPostContent,
            user_id: user.id,
            published: true,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating blog post:', error);
        showDialog('Error', 'Error creating blog post. Please try again.', 'error');
        return;
      }

      // Award XP for blog post creation
      try {
        const xpResult = await XPService.awardBlogXP(user.id, blogData.id);
        if (xpResult.success && xpResult.xpAwarded > 0) {
          if (xpResult.leveledUp && xpResult.newLevel) {
            setXPNotification(`🎉 Level Up! You're now ${xpResult.newLevel.title} ${xpResult.newLevel.icon}! +${xpResult.xpAwarded} XP`);
          } else {
            setXPNotification(`+${xpResult.xpAwarded} XP for creating blog post!`);
          }
          setTimeout(() => setXPNotification(null), 4000);
        }
      } catch (xpError) {
        console.error('Error awarding blog XP:', xpError);
      }

      // Refresh XP data in navbar
      await refreshXP();

      // Send email to family members if any exist
      if (familyMembers.length > 0) {
        const emailResult = await EmailService.sendBlogToFamily(
          {
            title: `${currentTopic?.title} Memory - ${new Date().toLocaleDateString()}`,
            content: blogPostContent,
            authorName: user.user_metadata?.full_name || 'Family Member',
            topic: currentTopic?.category || 'memory',
            created_at: new Date().toISOString()
          },
          familyMembers,
          user.user_metadata?.full_name || 'Family Member'
        );

        if (emailResult.success) {
          // Award XP for family sharing
          try {
            const shareXPResult = await XPService.awardFamilyShareXP(user.id, emailResult.sent);
            if (shareXPResult.success && shareXPResult.xpAwarded > 0) {
              setTimeout(() => {
                if (shareXPResult.leveledUp && shareXPResult.newLevel) {
                  setXPNotification(`🎉 Level Up! You're now ${shareXPResult.newLevel.title} ${shareXPResult.newLevel.icon}! +${shareXPResult.xpAwarded} sharing XP`);
                } else {
                  setXPNotification(`+${shareXPResult.xpAwarded} XP for sharing with family!`);
                }
                setTimeout(() => setXPNotification(null), 4000);
              }, 1000);
            }
          } catch (shareXPError) {
            console.error('Error awarding family share XP:', shareXPError);
          }

          // Refresh XP data in navbar after family share XP
          await refreshXP();

          showDialog('Success', `Blog post created and sent to ${emailResult.sent} family member(s)! ${emailResult.failed > 0 ? `${emailResult.failed} failed to send.` : ''}`, 'success');
        } else {
          showDialog('Warning', 'Blog post created, but failed to send emails to family members.', 'warning');
        }
      } else {
        showDialog('Success', 'Blog post created successfully! Add family members to automatically share future posts.', 'success');
      }

      return blogData;
    } catch (error) {
      console.error('Error creating blog post:', error);
      showDialog('Error', 'Error creating blog post. Please try again.', 'error');
    }
  };

  const formatConversationAsBlog = (messages: VoiceMessage[], topic: string): string => {
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
              Back to Voice Chat
            </button>
          </div>
        </div>
        <div className="text-center py-8 text-secondary">
          <p>Family members will receive your voice conversation blog posts via email.</p>
          <p className="text-sm mt-2">Add family members in the main conversation area.</p>
        </div>
      </div>
    );
  }

  if (showBlogPosts) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-main">Voice Conversation Blog Posts</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowBlogPosts(false)}
              className="px-4 py-2 btn-primary"
            >
              Back to Voice Chat
            </button>
          </div>
        </div>
        <div className="text-center py-8 text-secondary">
          <p>Your voice conversations will be automatically converted to blog posts.</p>
          <p className="text-sm mt-2">Start a voice conversation to create your first blog post!</p>
        </div>
      </div>
    );
  }

  if (!currentTopic) {
    return (
      <div className="space-y-6">
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
              onClick={() => startVoiceConversation(topic)}
            >
              <h3 className="text-xl font-semibold text-main mb-2">{topic.title}</h3>
              <p className="text-secondary mb-4">{topic.description}</p>
              <div className="text-sm text-primary font-medium">
                Start Voice Chat →
              </div>
            </div>
          ))}
        </div>

        <div className="text-center space-x-4">
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
          {/* XP Level Display */}
          {userXP && (
            <div className="mt-2 flex items-center space-x-2">
              <div className="bg-blue-50 px-3 py-1 rounded-lg flex items-center space-x-2">
                <span className="text-blue-600 font-bold text-lg">
                  {calculateLevel(userXP.total_xp).icon}
                </span>
                <span className="text-blue-800 text-sm font-medium">
                  Level {userXP.current_level} • {formatXP(userXP.total_xp)} XP
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {calculateLevel(userXP.total_xp).title}
              </span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentTopic(null)}
            className="px-4 py-2 btn-primary"
          >
            Back to Topics
          </button>
          {conversationText.trim() && (
            <button
              onClick={generateBlogPost}
              className="px-4 py-2 btn-primary"
              title="This will create a blog post from your actual voice conversation"
            >
              Create Blog Post
            </button>
          )}
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
          <h3 className="font-semibold text-main">Voice Conversation</h3>
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
                    ? 'voice-bubble-user'
                    : 'voice-bubble-ai'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                  {message.isVoice && ' (Voice)'}
                </p>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="voice-bubble-ai">
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
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || recognitionState === 'starting' || recognitionState === 'stopping'}
              className={`px-6 py-3 rounded-full text-white font-medium transition-all ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'btn-primary'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {recognitionState === 'starting' ? 'Starting...' : 
               recognitionState === 'stopping' ? 'Stopping...' :
               isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="px-4 py-2 btn-primary"
              >
                Stop Speaking
              </button>
            )}
          </div>
          
          {isRecording && (
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Listening... Speak now or click Stop Recording</span>
              </div>
              <p className="text-xs text-secondary mt-1">Recording will automatically stop after 30 seconds of silence</p>
              <p className="text-xs text-primary mt-1">Keep speaking - recording will extend as long as you&apos;re talking!</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-primary mb-2">Voice Conversation Tips:</h4>
        <ul className="text-sm text-primary space-y-1">
          <li>• Click the microphone button to start recording your voice</li>
          <li>• Speak clearly and take your time - you have up to 30 seconds</li>
          <li>• Keep talking! Recording extends automatically while you&apos;re speaking</li>
          <li>• I&apos;ll respond with my voice using enhanced speech synthesis</li>
          <li>• AI responses are generated by Groq for speed and reliability</li>
          <li>• Your conversation will be automatically saved</li>
          <li>• Create a blog post anytime to share with family members</li>
        </ul>
      </div>

      {/* XP Notifications */}
      {xpNotification && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in">
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

