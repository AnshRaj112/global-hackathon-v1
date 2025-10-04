'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import MemoryConversation from '../components/MemoryConversation';
import VoiceConversation from '../components/VoiceConversation';

export default function Home() {
  const { user, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'text' | 'voice'>('text');

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
              Preserve and share your precious memories with your family
            </p>
            <p className="auth-subtitle mt-4 text-center">
              Create, organize, and cherish your life&apos;s most important moments. 
              Share stories and memories with your loved ones in a beautiful, 
              easy-to-use platform designed for seniors.
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
              <h1 className="nav-title">Gramps Memory</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/streak"
                className="px-4 py-2 btn-secondary text-sm"
              >
                My Progress
              </Link>
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
            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('text')}
                    className={`py-4 px-6 border-b-2 font-medium text-lg min-h-[60px] ${
                      activeTab === 'text'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-secondary hover:text-main hover:border-gray-300'
                    }`}
                  >
                    Text Conversations
                  </button>
                  <button
                    onClick={() => setActiveTab('voice')}
                    className={`py-4 px-6 border-b-2 font-medium text-lg min-h-[60px] ${
                      activeTab === 'voice'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-secondary hover:text-main hover:border-gray-300'
                    }`}
                  >
                    Voice Conversations
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'text' ? <MemoryConversation /> : <VoiceConversation />}
          </div>
        </div>
      </main>
    </div>
  );
}
