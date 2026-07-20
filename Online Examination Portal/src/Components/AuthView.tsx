/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, User, Lock, Mail, ChevronRight, UserCheck, Shield } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthViewProps {
  onAuthSuccess: (token: string, user: { id: string; email: string; name: string; role: 'student' | 'admin' }) => void;
}

export default function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { email, password, name, role };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (!isLogin) {
        const roleLabel = role === 'admin' ? 'Instructor' : 'Student';
        setSuccessMessage(`${roleLabel} account registered successfully! Please log in.`);
        setIsLogin(true);
        setPassword('');
      } else {
        onAuthSuccess(data.token, data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleType: 'student' | 'admin') => {
    if (roleType === 'student') {
      setEmail('student@exam.com');
      setPassword('studentpassword');
    } else {
      setEmail('admin@exam.com');
      setPassword('adminpassword');
    }
    setIsLogin(true);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div id="auth_view_container" className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-200/80">
        
        {/* Header Branding */}
        <div className="text-center">
          <div className="mx-auto h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <span className="text-indigo-400 font-bold font-display text-2xl">X</span>
          </div>
          <h2 id="portal_title" className="mt-6 text-3xl font-bold font-display text-slate-900 tracking-tight">
            ExamPortal <span className="text-indigo-600 font-light">Pro</span>
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-normal">
            {isLogin ? 'Sign in to access exams & records' : 'Register your institutional account'}
          </p>
        </div>

        {/* Quick Access Presets */}
        <div className="bg-slate-100/60 p-4 rounded-xl border border-slate-200/60 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
            Quick Explorer Logins
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="quick_student_login"
              type="button"
              onClick={() => handleQuickLogin('student')}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200/60 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
              Student Portal
            </button>
            <button
              id="quick_admin_login"
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200/60 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              <Shield className="h-3.5 w-3.5 text-amber-600" />
              Instructor Portal
            </button>
          </div>
        </div>
        {error && (
          <div id="auth_error_box" className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-medium flex items-start gap-2 animate-pulse">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        {successMessage && (
          <div id="auth_success_box" className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-medium flex items-start gap-2 animate-fade-in">
            <span className="font-bold">Success:</span> {successMessage}
          </div>
        )}

        <form id="auth_form" className="mt-4 space-y-5" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="h-5 w-5" />
                  </span>
                  <input
                    id="input_fullname"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Institutional Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="role_student_btn"
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 px-4 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition ${
                      role === 'student'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    Student
                  </button>
                  <button
                    id="role_admin_btn"
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-2 px-4 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition ${
                      role === 'admin'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    Instructor
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-5 w-5" />
              </span>
              <input
                id="input_email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-5 w-5" />
              </span>
              <input
                id="input_password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <div>
            <button
              id="submit_auth"
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150 shadow-md hover:shadow-lg"
            >
              {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <ChevronRight className="h-4 w-4" />
              </span>
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <button
            id="toggle_auth_mode"
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccessMessage(null);
            }}
            className="font-semibold text-indigo-600 hover:text-indigo-500 transition"
          >
            {isLogin ? "Don't have an account? Register here" : 'Already registered? Sign in here'}
          </button>
        </div>
      </div>
    </div>
  );
}
