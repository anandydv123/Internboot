/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BookOpen, LogOut, Shield, Award, Sparkles, Activity, FileText, CheckCircle2, Trophy, Clock, HelpCircle, ArrowLeft } from 'lucide-react';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import TakeExamView from './components/TakeExamView';
import AdminExamView from './components/AdminExamView';
import AcademicRecordsView from './components/AcademicRecordsView';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { Exam, Question } from './types';

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('edutest_token'));
  const [user, setUser] = useState<{ id: string; email: string; name: string; role: 'student' | 'admin' } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeExam, setActiveExam] = useState<(Exam & { questions: Question[] }) | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Authenticate using stored token on boot
  useEffect(() => {
    const storedToken = localStorage.getItem('edutest_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${storedToken}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error('Session invalid');
        return res.json();
      })
      .then(data => {
        setUser(data.user);
        setToken(storedToken);
      })
      .catch(() => {
        localStorage.removeItem('edutest_token');
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleAuthSuccess = (newToken: string, newUser: any) => {
    localStorage.setItem('edutest_token', newToken);
    setToken(newToken);
    setUser(newUser);
    // Set default tab based on role
    setActiveTab(newUser.role === 'admin' ? 'exams' : 'dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('edutest_token');
    setToken(null);
    setUser(null);
    setActiveExam(null);
    setSubmissionResult(null);
  };

  const handleTakeExam = async (exam: Exam) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/exams/${exam.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Could not fetch exam questions');
      const data = await response.json();
      setActiveExam(data);
    } catch (err: any) {
      alert(err.message || 'Error launching exam');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-bold text-sm">Synchronizing Portal Context...</p>
        </div>
      </div>
    );
  }

  // Not Authenticated -> Show Auth screen
  if (!token || !user) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  // ACTIVE TIMED EXAM SESSION LAYOUT (distraction-free, hides top navigation header)
  if (activeExam) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TakeExamView
          exam={activeExam}
          token={token}
          onFinished={(result) => {
            setSubmissionResult(result);
            setActiveExam(null);
          }}
          onCancel={() => {
            setActiveExam(null);
          }}
        />
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* GLOBAL SYSTEM BRAND HEADER */}
      <header className="bg-white border-b border-slate-200/80 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Branding - mimicking the sleek aside style in smaller header format */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-md">
                <span className="text-indigo-400 font-bold font-display text-xl">X</span>
              </div>
              <div>
                <h1 className="text-base font-bold font-display text-slate-900 tracking-tight leading-none">
                  ExamPortal <span className="text-indigo-600 font-light">Pro</span>
                </h1>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Secure Assessment Suite</span>
              </div>
            </div>

            {/* Profile desk */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800">{user.name}</span>
                <span className="text-[10px] font-extrabold uppercase text-indigo-600 flex items-center gap-1 justify-end">
                  {isAdmin ? (
                    <>
                      <Shield className="h-3 w-3" />
                      Instructor
                    </>
                  ) : (
                    <>
                      <Activity className="h-3 w-3" />
                      Student
                    </>
                  )}
                </span>
              </div>

              <button
                id="header_logout_btn"
                onClick={handleLogout}
                className="p-2.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all duration-150"
                title="Sign out of portal"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* CORE NAVIGATION BAR - Pill buttons container */}
      <div className="bg-slate-100/50 border-b border-slate-200/80 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap gap-2 items-center">
            {isAdmin ? (
              <>
                <button
                  onClick={() => { setActiveTab('exams'); setSubmissionResult(null); }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    activeTab === 'exams'
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                      : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  📝 Exam Management
                </button>
                <button
                  onClick={() => { setActiveTab('records'); setSubmissionResult(null); }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    activeTab === 'records'
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                      : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  👨‍🎓 Student Records & AI Grader
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setActiveTab('dashboard'); setSubmissionResult(null); }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    activeTab === 'dashboard'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10'
                      : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  📝 Exam Center
                </button>
                <button
                  onClick={() => { setActiveTab('records'); setSubmissionResult(null); }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    activeTab === 'records'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10'
                      : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  🤖 AI Assignment Grader
                </button>
              </>
            )}

            <button
              onClick={() => { setActiveTab('analytics'); setSubmissionResult(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'analytics'
                  ? isAdmin ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10'
                  : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              📊 Performance Insights
            </button>
          </nav>
        </div>
      </div>

      {/* CORE DESKTOP VIEWPORT AREA */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* POST-EXAM RESULTS BRIEFING REPORT DISPLAY */}
        {submissionResult ? (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden animate-scale-up space-y-6">
            
            {/* Banner top */}
            <div className="bg-gradient-to-r from-emerald-600 to-indigo-600 text-white p-8 text-center space-y-2">
              <div className="h-16 w-16 bg-white/20 text-white rounded-2xl mx-auto flex items-center justify-center backdrop-blur-md">
                <Trophy className="h-9 w-9 text-amber-300" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">Assessment Completed!</h3>
              <p className="text-emerald-100 text-sm font-medium">Your examination sheet has been graded automatically</p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Report stats grid */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score Achieved</div>
                  <div className="text-2xl font-black text-indigo-600 mt-1">
                    {submissionResult.score} <span className="text-xs text-slate-400">/ {submissionResult.totalMarks}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Overall Accuracy</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">{submissionResult.accuracy}%</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Time Taken</div>
                  <div className="text-2xl font-black text-slate-700 mt-1">
                    {Math.floor(submissionResult.durationTakenSeconds / 60)}m {submissionResult.durationTakenSeconds % 60}s
                  </div>
                </div>
              </div>

              {/* Constructive feedback messages */}
              <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 space-y-2">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Performance Evaluation
                </h4>
                <p className="text-sm text-emerald-700 font-medium leading-relaxed">
                  {submissionResult.accuracy >= 80 
                    ? "Exceptional performance! You have demonstrated a high degree of mastery over the examined syllabus content. Keep up the phenomenal work."
                    : submissionResult.accuracy >= 50 
                    ? "Solid effort! You passed the majority of the criteria. Review your weakest areas and leverage study guides to target full mastery."
                    : "Room for improvement. We recommend reviewing fundamental lectures, re-reading the syllabus textbooks, and attempting the examination again."}
                </p>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => {
                    setSubmissionResult(null);
                    setActiveTab(isAdmin ? 'exams' : 'dashboard');
                  }}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition shadow-md shadow-indigo-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Return to Dashboard
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* REGULAR TAB DISPLAYS */
          <div>
            {activeTab === 'dashboard' && !isAdmin && (
              <DashboardView
                user={user}
                token={token}
                onTakeExam={handleTakeExam}
              />
            )}

            {activeTab === 'exams' && isAdmin && (
              <AdminExamView token={token} />
            )}

            {activeTab === 'records' && (
              <AcademicRecordsView user={user} token={token} />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsDashboard token={token} />
            )}
          </div>
        )}

      </main>

      {/* FOOTER COLO-BAR */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 EduTest Portal Suite. Built for secure full-stack examinations with Gemini AI integration.</p>
        </div>
      </footer>

    </div>
  );
}
