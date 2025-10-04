'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { signUp, signInWithGoogle } = useAuth();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during sign up');
    } else {
      setMessage('Check your email for the confirmation link!');
    }
    
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');

    const { error } = await signInWithGoogle();
    
    if (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during Google sign up');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="auth-card max-w-md w-full p-5 space-y-4">
        <div>
          <h2 className="auth-title text-center text-2xl">
            Create your account
          </h2>
          <p className="auth-subtitle mt-2 text-center text-sm">
            Join us today! Create your account to get started.
            <br />
            <Link href="/login" className="auth-link">
              Already have an account? Sign in here
            </Link>
          </p>
        </div>
        
        <form className="mt-4 space-y-3" onSubmit={handleEmailSignup}>
          <div className="space-y-2">
            <div>
              <label htmlFor="fullName" className="block text-xs font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                className="auth-input block w-full py-3 px-4 text-sm"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="auth-input block w-full py-3 px-4 text-sm"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="auth-input block w-full py-3 px-4 text-sm"
                placeholder="Create a password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="auth-input block w-full py-3 px-4 text-sm"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {message && (
            <div className="success-message">{message}</div>
          )}

          <div className="mt-3">
            <button
              type="submit"
              disabled={loading}
              className="auth-button w-full py-3 text-sm"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="divider my-3">
            <span className="divider-text text-xs">Or continue with</span>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="google-button w-full inline-flex justify-center items-center py-3 text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="ml-2">Sign up with Google</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
