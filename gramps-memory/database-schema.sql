-- Database schema for Gramps Memory application
-- Run this in your Supabase SQL editor

-- Create memories table
CREATE TABLE IF NOT EXISTS memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  relationship TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_status TEXT NOT NULL CHECK (email_status IN ('sent', 'failed', 'pending')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_streaks table for tracking daily activity streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_memories INTEGER DEFAULT 0,
  total_blog_posts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create user_xp table for tracking XP points and levels
CREATE TABLE IF NOT EXISTS user_xp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  xp_to_next_level INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create xp_transactions table for tracking XP history
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('message_sent', 'blog_created', 'streak_bonus', 'achievement', 'family_share', 'voice_recording', 'bonus', 'other')),
  description TEXT NOT NULL,
  memory_id UUID REFERENCES memories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_activities table for tracking daily memory recording
CREATE TABLE IF NOT EXISTS daily_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  memories_recorded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

-- Enable Row Level Security (RLS)
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for memories
CREATE POLICY "Users can view their own memories" ON memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories" ON memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories" ON memories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" ON memories
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for blog_posts
CREATE POLICY "Users can view their own blog posts" ON blog_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blog posts" ON blog_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blog posts" ON blog_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blog posts" ON blog_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for messages
CREATE POLICY "Users can view messages from their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages from their conversations" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their conversations" ON messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- Create RLS policies for family_members
CREATE POLICY "Users can view their own family members" ON family_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family members" ON family_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family members" ON family_members
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family members" ON family_members
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for email_logs
CREATE POLICY "Users can view their own email logs" ON email_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email logs" ON email_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email logs" ON email_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email logs" ON email_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at);

CREATE INDEX IF NOT EXISTS idx_blog_posts_user_id ON blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_memory_id ON blog_posts(memory_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_email ON family_members(email);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_blog_post_id ON email_logs(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_family_member_id ON email_logs(family_member_id);

-- Create RLS policies for user_streaks
CREATE POLICY "Users can view their own streaks" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks" ON user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own streaks" ON user_streaks
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_xp
CREATE POLICY "Users can view their own XP data" ON user_xp
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP data" ON user_xp
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own XP data" ON user_xp
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own XP data" ON user_xp
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for xp_transactions
CREATE POLICY "Users can view their own XP transactions" ON xp_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP transactions" ON xp_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own XP transactions" ON xp_transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own XP transactions" ON xp_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for daily_activities
CREATE POLICY "Users can view their own daily activities" ON daily_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily activities" ON daily_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily activities" ON daily_activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily activities" ON daily_activities
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for streak tables
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activities_user_id ON daily_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activities_date ON daily_activities(activity_date);

-- Create indexes for XP tables
CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON user_xp(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_level ON user_xp(current_level);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_type ON xp_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON xp_transactions(created_at);
