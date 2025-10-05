// XP and Leveling System for Gramps Memory
// This file contains all XP calculation logic and level management

export interface UserXP {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  created_at: string;
  updated_at: string;
}

export interface LevelInfo {
  level: number;
  minXP: number;
  maxXP: number;
  xpRequired: number;
  title: string;
  description: string;
  color: string;
  icon: string;
}

// XP rewards for different activities
export const XP_REWARDS = {
  MESSAGE_SENT: 2, // Per message sent in text or voice
  BLOG_POST_CREATED: 10, // Per blog post sent
  DAILY_STREAK_1: 25, // First day
  DAILY_STREAK_3: 50, // 3 days
  DAILY_STREAK_7: 100, // Week
  DAILY_STREAK_14: 150, // 2 weeks
  DAILY_STREAK_30: 250, // Month
  DAILY_STREAK_100: 500, // 100 days
  ACHIEVEMENT_UNLOCKED: 100,
  FAMILY_SHARE: 50,
  VOICE_RECORDING: 75,
} as const;

// Level definitions with increasing XP requirements
export const LEVELS: LevelInfo[] = [
  { level: 1, minXP: 0, maxXP: 49, xpRequired: 50, title: "Memory Keeper", description: "Just starting your journey", color: "gray", icon: "🌱" },
  { level: 2, minXP: 50, maxXP: 119, xpRequired: 70, title: "Story Teller", description: "Learning to share memories", color: "blue", icon: "📝" },
  { level: 3, minXP: 120, maxXP: 219, xpRequired: 100, title: "Memory Collector", description: "Building your collection", color: "green", icon: "📚" },
  { level: 4, minXP: 220, maxXP: 359, xpRequired: 140, title: "Family Historian", description: "Preserving family stories", color: "purple", icon: "📖" },
  { level: 5, minXP: 360, maxXP: 539, xpRequired: 180, title: "Memory Master", description: "Expert at capturing moments", color: "orange", icon: "🎯" },
  { level: 6, minXP: 540, maxXP: 759, xpRequired: 220, title: "Legacy Builder", description: "Creating lasting memories", color: "red", icon: "🏗️" },
  { level: 7, minXP: 760, maxXP: 1019, xpRequired: 260, title: "Memory Champion", description: "A true memory expert", color: "yellow", icon: "🥇" },
  { level: 8, minXP: 1020, maxXP: 1319, xpRequired: 300, title: "Family Guardian", description: "Protector of family heritage", color: "indigo", icon: "🛡️" },
  { level: 9, minXP: 1320, maxXP: 1659, xpRequired: 340, title: "Memory Legend", description: "Legendary memory keeper", color: "pink", icon: "⭐" },
  { level: 10, minXP: 1660, maxXP: 2039, xpRequired: 380, title: "Grandmaster", description: "The ultimate memory keeper", color: "gold", icon: "👑" },
  { level: 11, minXP: 2040, maxXP: 2459, xpRequired: 420, title: "Memory Sage", description: "Wisdom keeper of memories", color: "emerald", icon: "🧙‍♂️" },
  { level: 12, minXP: 2460, maxXP: 2919, xpRequired: 460, title: "Eternal Keeper", description: "Guardian of timeless stories", color: "violet", icon: "🌟" },
  { level: 13, minXP: 2920, maxXP: 3419, xpRequired: 500, title: "Memory Deity", description: "Divine memory preserver", color: "rainbow", icon: "✨" },
];

/**
 * Calculate level based on total XP
 */
export function calculateLevel(totalXP: number): LevelInfo {
  const level = LEVELS.find(l => totalXP >= l.minXP && totalXP < l.maxXP) || LEVELS[LEVELS.length - 1];
  return level;
}

/**
 * Calculate XP progress within current level
 */
export function calculateXPProgress(totalXP: number, levelInfo: LevelInfo): {
  currentLevelXP: number;
  xpToNextLevel: number;
  progressPercentage: number;
} {
  const currentLevelXP = totalXP - levelInfo.minXP;
  const xpToNextLevel = levelInfo.xpRequired - currentLevelXP;
  const progressPercentage = (currentLevelXP / levelInfo.xpRequired) * 100;

  return {
    currentLevelXP,
    xpToNextLevel,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage))
  };
}

/**
 * Calculate XP to award for message sent (text or voice)
 */
export function calculateMessageXP(): number {
  return XP_REWARDS.MESSAGE_SENT;
}

/**
 * Calculate XP to award for blog post creation
 */
export function calculateBlogXP(): number {
  return XP_REWARDS.BLOG_POST_CREATED;
}

/**
 * Calculate XP for streak milestones
 */
export function calculateStreakXP(streakCount: number): number {
  if (streakCount === 1) return XP_REWARDS.DAILY_STREAK_1;
  if (streakCount === 3) return XP_REWARDS.DAILY_STREAK_3;
  if (streakCount === 7) return XP_REWARDS.DAILY_STREAK_7;
  if (streakCount === 14) return XP_REWARDS.DAILY_STREAK_14;
  if (streakCount === 30) return XP_REWARDS.DAILY_STREAK_30;
  if (streakCount === 100) return XP_REWARDS.DAILY_STREAK_100;
  if (streakCount > 100 && streakCount % 50 === 0) return 100;
  return 0;
}

/**
 * Get next level info
 */
export function getNextLevel(currentLevel: number): LevelInfo | null {
  const nextLevelIndex = LEVELS.findIndex(l => l.level === currentLevel) + 1;
  return nextLevelIndex < LEVELS.length ? LEVELS[nextLevelIndex] : null;
}

/**
 * Check if user leveled up
 */
export function checkLevelUp(oldXP: number, newXP: number): {
  leveledUp: boolean;
  newLevel: LevelInfo;
  oldLevel: LevelInfo;
} {
  const oldLevel = calculateLevel(oldXP);
  const newLevel = calculateLevel(newXP);
  
  return {
    leveledUp: newLevel.level > oldLevel.level,
    newLevel,
    oldLevel
  };
}

/**
 * Get level benefits/unlocks (cosmetic only - no actual feature restrictions)
 */
export function getLevelBenefits(level: number): string[] {
  const benefits: { [key: number]: string[] } = {
    1: ["🌱 Just starting your memory journey"],
    2: ["📝 Learning to share your stories"],
    3: ["📚 Building your memory collection"],
    4: ["📖 Becoming a family historian"],
    5: ["🎯 Mastering memory capture"],
    6: ["🏗️ Building lasting legacies"],
    7: ["🥇 A true memory champion"],
    8: ["🛡️ Guardian of family heritage"],
    9: ["⭐ Legendary memory keeper"],
    10: ["👑 The ultimate memory keeper"],
    11: ["🧙‍♂️ Wise keeper of memories"],
    12: ["🌟 Guardian of timeless stories"],
    13: ["✨ Divine memory preserver"]
  };
  
  return benefits[level] || ["🏆 Memory master"];
}

/**
 * Format XP number with commas
 */
export function formatXP(xp: number): string {
  return xp.toLocaleString();
}

/**
 * Get motivational message based on level progress
 */
export function getMotivationalMessage(levelInfo: LevelInfo, progressPercentage: number): string {
  const messages = {
    early: [
      "Every memory counts! Keep going! 🌱",
      "You're building something beautiful! 📝",
      "Each story matters! 📚"
    ],
    mid: [
      "You're making great progress! 📖",
      "Keep preserving those precious moments! 🎯",
      "Your dedication is inspiring! 🏗️"
    ],
    late: [
      "Almost there! You're doing amazing! 🥇",
      "The finish line is in sight! 🛡️",
      "You're a true memory champion! ⭐"
    ],
    complete: [
      "Congratulations! Level up! 🎉",
      "Amazing achievement! 🏆",
      "You're unstoppable! 👑"
    ]
  };
  
  if (progressPercentage >= 100) {
    return messages.complete[Math.floor(Math.random() * messages.complete.length)];
  } else if (progressPercentage >= 75) {
    return messages.late[Math.floor(Math.random() * messages.late.length)];
  } else if (progressPercentage >= 50) {
    return messages.mid[Math.floor(Math.random() * messages.mid.length)];
  } else {
    return messages.early[Math.floor(Math.random() * messages.early.length)];
  }
}
