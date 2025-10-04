import { supabase } from './supabase';

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_memories: number;
  created_at: string;
  updated_at: string;
}

export class StreakService {
  static async updateStreak(userId: string): Promise<UserStreak | null> {
    if (!supabase) {
      console.log('Supabase not configured, skipping streak update');
      return null;
    }

    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get or create user streak
      const { data: initialStreak, error: streakError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      let streak = initialStreak;

      if (streakError && streakError.code === 'PGRST116') {
        // Create streak if it doesn't exist
        const { data: newStreak, error: createError } = await supabase
          .from('user_streaks')
          .insert([{ user_id: userId }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating streak:', createError);
          return null;
        }
        streak = newStreak;
      } else if (streakError) {
        console.error('Error fetching streak:', streakError);
        return null;
      }

      // Check if user already recorded a memory today
      const { data: todayActivity, error: todayError } = await supabase
        .from('daily_activities')
        .select('*')
        .eq('user_id', userId)
        .eq('activity_date', today)
        .single();

      if (todayError && todayError.code !== 'PGRST116') {
        console.error('Error checking today activity:', todayError);
        return null;
      }

      // If already recorded today, just return current streak
      if (todayActivity) {
        return streak;
      }

      // Update daily activity
      const { error: activityError } = await supabase
        .from('daily_activities')
        .upsert([
          {
            user_id: userId,
            activity_date: today,
            memories_recorded: 1
          }
        ]);

      if (activityError) {
        console.error('Error updating daily activity:', activityError);
        return null;
      }

      // Calculate new streak
      let newCurrentStreak = 1;
      let newLongestStreak = streak.longest_streak;
      const newTotalMemories = streak.total_memories + 1;

      // If there was activity yesterday, continue the streak
      if (streak.last_activity_date === yesterday) {
        newCurrentStreak = streak.current_streak + 1;
      }
      // If last activity was more than 1 day ago, reset streak
      else if (streak.last_activity_date && streak.last_activity_date !== today) {
        newCurrentStreak = 1;
      }

      // Update longest streak if current is higher
      if (newCurrentStreak > newLongestStreak) {
        newLongestStreak = newCurrentStreak;
      }

      // Update streak record
      const { data: updatedStreak, error: updateError } = await supabase
        .from('user_streaks')
        .update({
          current_streak: newCurrentStreak,
          longest_streak: newLongestStreak,
          last_activity_date: today,
          total_memories: newTotalMemories,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating streak:', updateError);
        return null;
      }

      return updatedStreak;
    } catch (error) {
      console.error('Error updating streak:', error);
      return null;
    }
  }

  static async getStreak(userId: string): Promise<UserStreak | null> {
    if (!supabase) {
      console.log('Supabase not configured, skipping streak fetch');
      return null;
    }

    try {
      const { data: streak, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No streak exists yet, return null
          return null;
        }
        console.error('Error fetching streak:', error);
        return null;
      }

      return streak;
    } catch (error) {
      console.error('Error fetching streak:', error);
      return null;
    }
  }

  static async checkAndResetStreak(userId: string): Promise<UserStreak | null> {
    if (!supabase) {
      console.log('Supabase not configured, skipping streak check');
      return null;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get current streak
      const { data: streak, error: streakError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (streakError) {
        if (streakError.code === 'PGRST116') {
          // No streak exists, create one
          const { data: newStreak, error: createError } = await supabase
            .from('user_streaks')
            .insert([{ user_id: userId }])
            .select()
            .single();

          if (createError) {
            console.error('Error creating streak:', createError);
            return null;
          }
          return newStreak;
        }
        console.error('Error fetching streak:', streakError);
        return null;
      }

      // Check if streak needs to be reset (more than 1 day gap)
      if (streak.last_activity_date && 
          streak.last_activity_date !== today && 
          streak.last_activity_date !== yesterday) {
        
        // Reset streak
        const { data: updatedStreak, error: updateError } = await supabase
          .from('user_streaks')
          .update({
            current_streak: 0,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) {
          console.error('Error resetting streak:', updateError);
          return null;
        }

        return updatedStreak;
      }

      return streak;
    } catch (error) {
      console.error('Error checking streak:', error);
      return null;
    }
  }
}
