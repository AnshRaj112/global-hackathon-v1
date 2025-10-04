'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_memories: number;
  created_at: string;
  updated_at: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

export default function StreakDisplay() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStreakData = async () => {
    if (!supabase || !user) return;

    try {
      // Fetch or create user streak
      const { data: initialStreakData, error: streakError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      let streakData = initialStreakData;

      if (streakError && streakError.code === 'PGRST116') {
        // Create streak if it doesn't exist
        const { data: newStreak, error: createError } = await supabase
          .from('user_streaks')
          .insert([{ user_id: user.id }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating streak:', createError);
          return;
        }
        streakData = newStreak;
      } else if (streakError) {
        console.error('Error fetching streak:', streakError);
        return;
      }

      setStreak(streakData);
      generateAchievements(streakData);
    } catch (error) {
      console.error('Error fetching streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAchievements = (streakData: UserStreak) => {
    const achievements: Achievement[] = [
      {
        id: 'first_memory',
        title: 'First Memory Recorded',
        description: 'Record your very first memory',
        icon: '🎉',
        unlocked: streakData.total_memories >= 1,
        progress: Math.min(streakData.total_memories, 1),
        target: 1
      },
      {
        id: 'week_streak',
        title: '7 Days in a Row',
        description: 'Record memories for 7 consecutive days',
        icon: '🔥',
        unlocked: streakData.current_streak >= 7,
        progress: Math.min(streakData.current_streak, 7),
        target: 7
      },
      {
        id: 'month_streak',
        title: '30 Days in a Row',
        description: 'Record memories for 30 consecutive days',
        icon: '💪',
        unlocked: streakData.current_streak >= 30,
        progress: Math.min(streakData.current_streak, 30),
        target: 30
      },
      {
        id: 'hundred_memories',
        title: '100 Memories Saved',
        description: 'Save 100 precious memories',
        icon: '📚',
        unlocked: streakData.total_memories >= 100,
        progress: Math.min(streakData.total_memories, 100),
        target: 100
      },
      {
        id: 'five_hundred_memories',
        title: '500 Memories Saved',
        description: 'Save 500 precious memories',
        icon: '🏆',
        unlocked: streakData.total_memories >= 500,
        progress: Math.min(streakData.total_memories, 500),
        target: 500
      },
      {
        id: 'thousand_memories',
        title: '1000 Memories Saved',
        description: 'Save 1000 precious memories',
        icon: '👑',
        unlocked: streakData.total_memories >= 1000,
        progress: Math.min(streakData.total_memories, 1000),
        target: 1000
      }
    ];

    setAchievements(achievements);
  };

  useEffect(() => {
    if (user) {
      fetchStreakData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!streak) {
    return null;
  }

  const getStreakMessage = () => {
    if (streak.current_streak === 0) {
      return "Start your memory journey today!";
    } else if (streak.current_streak === 1) {
      return "Great start! Keep it going!";
    } else if (streak.current_streak < 7) {
      return `${streak.current_streak} days in a row! You're building momentum!`;
    } else if (streak.current_streak < 30) {
      return `${streak.current_streak} days in a row! Amazing dedication!`;
    } else {
      return `${streak.current_streak} days in a row! You're a memory champion!`;
    }
  };

  const getStreakEmoji = () => {
    if (streak.current_streak === 0) return "🌱";
    if (streak.current_streak < 7) return "🔥";
    if (streak.current_streak < 30) return "💪";
    return "👑";
  };

  return (
    <div className="space-y-6">
      {/* Main Streak Display */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg shadow border">
        <div className="text-center">
          <div className="text-6xl mb-4">{getStreakEmoji()}</div>
          <h3 className="text-2xl font-bold text-main mb-2">
            {streak.current_streak} Day{streak.current_streak !== 1 ? 's' : ''} in a Row
          </h3>
          <p className="text-secondary mb-4">{getStreakMessage()}</p>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-primary">{streak.total_memories}</div>
              <div className="text-sm text-secondary">Total Memories</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-primary">{streak.longest_streak}</div>
              <div className="text-sm text-secondary">Best Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h4 className="text-xl font-bold text-main mb-4 flex items-center">
          <span className="mr-2">🏆</span>
          Achievements
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                achievement.unlocked
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{achievement.icon}</span>
                  <div>
                    <h5 className={`font-semibold ${
                      achievement.unlocked ? 'text-green-800' : 'text-gray-600'
                    }`}>
                      {achievement.title}
                    </h5>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </div>
                </div>
                {achievement.unlocked && (
                  <span className="text-green-600 text-xl">✓</span>
                )}
              </div>
              
              {!achievement.unlocked && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                  ></div>
                </div>
              )}
              
              {!achievement.unlocked && (
                <div className="text-xs text-gray-500 mt-1">
                  {achievement.progress} / {achievement.target}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
