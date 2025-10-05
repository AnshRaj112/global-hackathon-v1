// XP Service for managing XP awarding and tracking
import { supabase } from './supabase';
import { 
  UserXP, 
  LevelInfo,
  calculateLevel, 
  calculateXPProgress, 
  checkLevelUp,
  XP_REWARDS,
  calculateMessageXP,
  calculateBlogXP,
  calculateStreakXP
} from './xp';

export interface XPTransaction {
  id: string;
  user_id: string;
  xp_amount: number;
  transaction_type: string;
  description: string;
  memory_id?: string;
  created_at: string;
}

export class XPService {
  /**
   * Award XP to a user and update their level
   */
  static async awardXP(
    userId: string, 
    xpAmount: number, 
    transactionType: string, 
    description: string,
    memoryId?: string
  ): Promise<{ success: boolean; leveledUp?: boolean; newLevel?: LevelInfo | null; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      // Get current XP data
      const { data: currentXP, error: fetchError } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching XP data:', fetchError);
        return { success: false, error: 'Failed to fetch XP data' };
      }

      const oldTotalXP = currentXP?.total_xp || 0;
      const newTotalXP = oldTotalXP + xpAmount;

      // Calculate new level
      const newLevelInfo = calculateLevel(newTotalXP);
      const xpProgress = calculateXPProgress(newTotalXP, newLevelInfo);

      // Check if user leveled up
      const levelUpResult = checkLevelUp(oldTotalXP, newTotalXP);

      // Upsert XP data
      const xpData = {
        user_id: userId,
        total_xp: newTotalXP,
        current_level: newLevelInfo.level,
        xp_to_next_level: xpProgress.xpToNextLevel,
        updated_at: new Date().toISOString()
      };

      const { error: upsertError } = await supabase
        .from('user_xp')
        .upsert(xpData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error('Error updating XP data:', upsertError);
        return { success: false, error: 'Failed to update XP data' };
      }

      // Record XP transaction
      const { error: transactionError } = await supabase
        .from('xp_transactions')
        .insert([{
          user_id: userId,
          xp_amount: xpAmount,
          transaction_type: transactionType,
          description: description,
          memory_id: memoryId
        }]);

      if (transactionError) {
        console.error('Error recording XP transaction:', transactionError);
        // Don't fail the XP award if transaction recording fails
      }

      return {
        success: true,
        leveledUp: levelUpResult.leveledUp,
        newLevel: levelUpResult.leveledUp ? levelUpResult.newLevel : null
      };

    } catch (error) {
      console.error('Error awarding XP:', error);
      return { success: false, error: 'Failed to award XP' };
    }
  }

  /**
   * Award XP for message sent (text or voice)
   */
  static async awardMessageXP(
    userId: string,
    messageType: 'text' | 'voice' = 'text'
  ): Promise<{ success: boolean; xpAwarded: number; leveledUp?: boolean; newLevel?: LevelInfo | null; error?: string }> {
    const xpAmount = calculateMessageXP();
    
    const result = await this.awardXP(
      userId,
      xpAmount,
      'message_sent',
      `Sent a ${messageType} message`,
      undefined
    );

    return {
      ...result,
      xpAwarded: xpAmount
    };
  }

  /**
   * Award XP for streak milestones
   */
  static async awardStreakXP(
    userId: string,
    streakCount: number
  ): Promise<{ success: boolean; xpAwarded: number; leveledUp?: boolean; newLevel?: LevelInfo | null; error?: string }> {
    const xpAmount = calculateStreakXP(streakCount);
    
    if (xpAmount === 0) {
      return { success: true, xpAwarded: 0 };
    }

    const result = await this.awardXP(
      userId,
      xpAmount,
      'streak_bonus',
      `${streakCount} day streak bonus`,
      undefined
    );

    return {
      ...result,
      xpAwarded: xpAmount
    };
  }

  /**
   * Award XP for achievements
   */
  static async awardAchievementXP(
    userId: string,
    achievementTitle: string
  ): Promise<{ success: boolean; xpAwarded: number; leveledUp?: boolean; newLevel?: LevelInfo | null; error?: string }> {
    const result = await this.awardXP(
      userId,
      XP_REWARDS.ACHIEVEMENT_UNLOCKED,
      'achievement',
      `Achievement unlocked: ${achievementTitle}`,
      undefined
    );

    return {
      ...result,
      xpAwarded: XP_REWARDS.ACHIEVEMENT_UNLOCKED
    };
  }

  /**
   * Award XP for blog post creation
   */
  static async awardBlogXP(
    userId: string,
    blogPostId: string
  ): Promise<{ success: boolean; xpAwarded: number; leveledUp?: boolean; newLevel?: LevelInfo | null; error?: string }> {
    const xpAmount = calculateBlogXP();
    
    const result = await this.awardXP(
      userId,
      xpAmount,
      'blog_created',
      'Created a blog post',
      blogPostId
    );

    return {
      ...result,
      xpAwarded: xpAmount
    };
  }

  /**
   * Award XP for family sharing
   */
  static async awardFamilyShareXP(
    userId: string,
    familyMemberCount: number
  ): Promise<{ success: boolean; xpAwarded: number; leveledUp?: boolean; newLevel?: LevelInfo | null; error?: string }> {
    const xpAmount = XP_REWARDS.FAMILY_SHARE * familyMemberCount;
    
    const result = await this.awardXP(
      userId,
      xpAmount,
      'family_share',
      `Shared with ${familyMemberCount} family member(s)`,
      undefined
    );

    return {
      ...result,
      xpAwarded: xpAmount
    };
  }

  /**
   * Award XP for voice recording
   */
  static async awardVoiceXP(
    userId: string,
    recordingDuration?: number
  ): Promise<{ success: boolean; xpAwarded: number; leveledUp?: boolean; newLevel?: LevelInfo | null; error?: string }> {
    let xpAmount = XP_REWARDS.VOICE_RECORDING;
    
    // Bonus for longer recordings
    if (recordingDuration && recordingDuration > 60) {
      xpAmount += 25; // Bonus for recordings over 1 minute
    }
    
    const result = await this.awardXP(
      userId,
      xpAmount,
      'voice_recording',
      recordingDuration && recordingDuration > 60 
        ? 'Voice recording (bonus for length)' 
        : 'Voice recording',
      undefined
    );

    return {
      ...result,
      xpAwarded: xpAmount
    };
  }

  /**
   * Get user's XP data
   */
  static async getUserXP(userId: string): Promise<{ success: boolean; data?: UserXP; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user XP:', error);
        return { success: false, error: 'Failed to fetch XP data' };
      }

      return { success: true, data: data || null };
    } catch (error) {
      console.error('Error fetching user XP:', error);
      return { success: false, error: 'Failed to fetch XP data' };
    }
  }

  /**
   * Get user's recent XP transactions
   */
  static async getUserXPTransactions(
    userId: string, 
    limit: number = 10
  ): Promise<{ success: boolean; data?: XPTransaction[]; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('xp_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching XP transactions:', error);
        return { success: false, error: 'Failed to fetch XP transactions' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching XP transactions:', error);
      return { success: false, error: 'Failed to fetch XP transactions' };
    }
  }

  /**
   * Initialize XP data for a new user
   */
  static async initializeUserXP(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('user_xp')
        .insert([{
          user_id: userId,
          total_xp: 0,
          current_level: 1,
          xp_to_next_level: 50
        }]);

      if (error) {
        console.error('Error initializing user XP:', error);
        return { success: false, error: 'Failed to initialize XP data' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error initializing user XP:', error);
      return { success: false, error: 'Failed to initialize XP data' };
    }
  }
}
