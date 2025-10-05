'use client';

import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import StreakDisplay from '../../components/StreakDisplay';
import XPDisplay from '../../components/XPDisplay';

export default function StreakPage() {
  const { user, signOut, loading } = useAuth();

  const getDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.full_name || user.email || 'User';
  };

  if (loading) {
    return (
      <div className="loading-container flex items-center justify-center">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="auth-card max-w-2xl w-full p-8 space-y-8 text-center">
          <div>
            <h2 className="auth-title text-center">
              Welcome to Gramps Memory
            </h2>
            <p className="auth-subtitle mt-4 text-center">
              Please sign in to view your progress
            </p>
          </div>
          <div className="space-y-4">
            <Link
              href="/login"
              className="auth-button w-full inline-block"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="auth-button-secondary w-full inline-block"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen main-content">
      <nav className="enhanced-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="nav-title">
                Gramps Memory
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="nav-user">Welcome, {getDisplayName()}</span>
              <button
                onClick={() => signOut()}
                className="nav-signout"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="content-card p-6">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-main">My Progress</h1>
                  <p className="text-lg text-secondary mt-2">
                    Track your memory recording journey and celebrate your achievements
                  </p>
                </div>
                <div className="flex space-x-4">
                  <Link
                    href="/"
                    className="px-6 py-3 btn-primary"
                  >
                    Back to Conversations
                  </Link>
                </div>
              </div>
            </div>

            {/* XP and Level Display */}
            <XPDisplay />

            {/* Streak Display */}
            <StreakDisplay />
          </div>
        </div>
      </main>
    </div>
  );
}
