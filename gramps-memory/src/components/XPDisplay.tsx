'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserXP, 
  LevelInfo,
  calculateLevel, 
  calculateXPProgress, 
  getNextLevel, 
  formatXP,
  getMotivationalMessage,
  getLevelBenefits
} from '../utils/xp';

interface XPTransaction {
  id: string;
  xp_amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

export default function XPDisplay() {
  const { user } = useAuth();
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<XPTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel] = useState<LevelInfo | null>(null);

  const fetchXPData = async () => {
    if (!supabase || !user) return;

    try {
      // Fetch or create user XP data
      const { data: xpData, error: xpError } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      let currentXP = xpData;

      if (xpError && xpError.code === 'PGRST116') {
        // Create XP record if it doesn't exist
        const { data: newXP, error: createError } = await supabase
          .from('user_xp')
          .insert([{ user_id: user.id }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating XP record:', createError);
          return;
        }
        currentXP = newXP;
      } else if (xpError) {
        console.error('Error fetching XP data:', xpError.code, xpError.message, xpError);
        return;
      }

      setUserXP(currentXP);

      // Fetch recent XP transactions
      const { data: transactions, error: transError } = await supabase
        .from('xp_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transError) {
        console.error('Error fetching XP transactions:', transError);
      } else {
        setRecentTransactions(transactions || []);
      }

    } catch (error) {
      console.error('Error fetching XP data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchXPData();
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

  if (!userXP) {
    return null;
  }

  const levelInfo = calculateLevel(userXP.total_xp);
  const xpProgress = calculateXPProgress(userXP.total_xp, levelInfo);
  const nextLevel = getNextLevel(levelInfo.level);
  const motivationalMessage = getMotivationalMessage(levelInfo, xpProgress.progressPercentage);
  const levelBenefits = getLevelBenefits(levelInfo.level);

  const getLevelColor = (color: string) => {
    const colors: { [key: string]: string } = {
      gray: 'bg-gray-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      indigo: 'bg-indigo-500',
      pink: 'bg-pink-500',
      gold: 'bg-yellow-600',
      emerald: 'bg-emerald-500',
      violet: 'bg-violet-500',
      rainbow: 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500'
    };
    return colors[color] || 'bg-gray-500';
  };

  const getLevelGradient = (color: string) => {
    const gradients: { [key: string]: string } = {
      gray: 'from-gray-100 to-gray-200',
      blue: 'from-blue-100 to-blue-200',
      green: 'from-green-100 to-green-200',
      purple: 'from-purple-100 to-purple-200',
      orange: 'from-orange-100 to-orange-200',
      red: 'from-red-100 to-red-200',
      yellow: 'from-yellow-100 to-yellow-200',
      indigo: 'from-indigo-100 to-indigo-200',
      pink: 'from-pink-100 to-pink-200',
      gold: 'from-yellow-200 to-yellow-300',
      emerald: 'from-emerald-100 to-emerald-200',
      violet: 'from-violet-100 to-violet-200',
      rainbow: 'from-purple-100 via-pink-100 to-red-100'
    };
    return gradients[color] || 'from-gray-100 to-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Main XP Display */}
      <div className={`bg-gradient-to-r ${getLevelGradient(levelInfo.color)} p-6 rounded-lg shadow border`}>
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 ${getLevelColor(levelInfo.color)} rounded-full flex items-center justify-center text-2xl text-white shadow-lg`}>
              {levelInfo.icon}
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-main mb-2">
            Level {levelInfo.level} - {levelInfo.title}
          </h3>
          <p className="text-secondary mb-4">{levelInfo.description}</p>
          
          {/* XP Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-secondary mb-2">
              <span>{formatXP(userXP.total_xp)} XP</span>
              <span>{xpProgress.progressPercentage.toFixed(1)}%</span>
              {nextLevel && (
                <span>{formatXP(nextLevel.minXP)} XP for Level {nextLevel.level}</span>
              )}
            </div>
            <div className="w-full bg-white rounded-full h-4 shadow-inner">
              <div
                className={`${getLevelColor(levelInfo.color)} h-4 rounded-full transition-all duration-500 ease-out relative`}
                style={{ width: `${xpProgress.progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-white bg-opacity-30 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <p className="text-sm text-secondary italic">{motivationalMessage}</p>
          
          {/* Level Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white bg-opacity-50 p-3 rounded-lg shadow-sm">
              <div className="text-lg font-bold text-main">{levelInfo.level}</div>
              <div className="text-xs text-secondary">Current Level</div>
            </div>
            <div className="bg-white bg-opacity-50 p-3 rounded-lg shadow-sm">
              <div className="text-lg font-bold text-main">{formatXP(userXP.total_xp)}</div>
              <div className="text-xs text-secondary">Total XP</div>
            </div>
            <div className="bg-white bg-opacity-50 p-3 rounded-lg shadow-sm">
              <div className="text-lg font-bold text-main">{xpProgress.xpToNextLevel > 0 ? formatXP(xpProgress.xpToNextLevel) : 'MAX'}</div>
              <div className="text-xs text-secondary">To Next Level</div>
            </div>
          </div>
        </div>
      </div>

      {/* Level Status */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h4 className="text-xl font-bold text-main mb-4 flex items-center">
          <span className="mr-2">🏆</span>
          Level Status
        </h4>
        
        <div className="space-y-2">
          {levelBenefits.map((benefit, index) => (
            <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-600 mr-3">✨</span>
              <span className="text-sm text-blue-800">{benefit}</span>
            </div>
          ))}
        </div>

        {nextLevel && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h5 className="font-semibold text-purple-800 mb-2">
              Next Level: {nextLevel.title} {nextLevel.icon}
            </h5>
            <p className="text-sm text-purple-700 mb-2">{nextLevel.description}</p>
            <div className="text-xs text-purple-600 italic">
              {getLevelBenefits(nextLevel.level)[0]}
            </div>
          </div>
        )}
      </div>

      {/* Recent XP Transactions */}
      {recentTransactions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h4 className="text-xl font-bold text-main mb-4 flex items-center">
            <span className="mr-2">📈</span>
            Recent XP Activity
          </h4>
          
          <div className="space-y-3">
            {recentTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-600 text-sm">+</span>
                  </div>
                  <div>
                    <div className="font-medium text-main">{transaction.description}</div>
                    <div className="text-xs text-secondary">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-green-600 font-bold">
                  +{transaction.xp_amount} XP
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Level Up Animation Modal */}
      {showLevelUp && newLevel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">{newLevel.icon}</div>
            <h2 className="text-3xl font-bold text-main mb-2">Level Up!</h2>
            <h3 className="text-xl text-primary mb-4">{newLevel.title}</h3>
            <p className="text-secondary mb-6">{newLevel.description}</p>
            <button
              onClick={() => setShowLevelUp(false)}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
