/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BookOpen, Clock, Award, Activity, CheckCircle, ChevronRight, RefreshCw, Star } from 'lucide-react';
import { Exam, Submission } from '../types';

interface DashboardViewProps {
  user: { id: string; email: string; name: string; role: 'student' | 'admin' };
  token: string;
  onTakeExam: (exam: Exam) => void;
}

export default function DashboardView({ user, token, onTakeExam }: DashboardViewProps) {
  const [exams, setExams] = useState<(Exam & { questionCount: number })[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch available exams
      const examRes = await fetch('/api/exams', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!examRes.ok) throw new Error('Could not fetch exams');
      const examsData = await examRes.json();
      setExams(examsData);

      // 2. Fetch submissions history
      const subRes = await fetch('/api/submissions', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!subRes.ok) throw new Error('Could not fetch submissions');
      const subsData = await subRes.json();
      setSubmissions(subsData);

    } catch (err: any) {
      setError(err.message || 'Error syncing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Compute stats
  const totalAttempts = submissions.length;
  const bestScore = totalAttempts > 0 ? Math.max(...submissions.map(s => s.score)) : 0;
  const averageAccuracy = totalAttempts > 0 ? Math.round(submissions.reduce((sum, s) => sum + s.accuracy, 0) / totalAttempts) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 font-semibold gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
        Syncing exam portal data...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Dynamic Welcome Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-slate-800">
        <div className="relative z-10 space-y-3">
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold rounded-full uppercase tracking-widest border border-indigo-500/30 backdrop-blur-sm">
            Student Desktop
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Welcome back, {user.name}!</h2>
          <p className="text-slate-300 text-sm max-w-lg leading-relaxed font-normal">
            Explore active syllabus exams, attempt timed question assessments, or review your historical automated grading reports.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-y-6 translate-x-6">
          <BookOpen className="h-48 w-48 text-white" />
        </div>
      </div>

      {/* STATS HIGHLIGHT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:border-slate-300/80 transition-all flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-slate-900">{totalAttempts}</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Exams Attempted</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:border-slate-300/80 transition-all flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-slate-900">{bestScore} pts</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Highest Points Score</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:border-slate-300/80 transition-all flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-slate-900">{averageAccuracy}%</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Average Accuracy</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* AVAILABLE EXAMS SECTIONS (7/12 space) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 font-display">Available Exams</h3>
            <button
              onClick={fetchData}
              className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg transition"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {exams.map(exam => (
              <div
                key={exam.id}
                className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-indigo-200 hover:ring-1 hover:ring-indigo-100/50 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-slate-900 leading-snug font-display tracking-tight">{exam.title}</h4>
                  <p className="text-xs text-slate-500 font-normal leading-relaxed">{exam.description}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {exam.durationMinutes} mins
                    </span>
                    <span>
                      {exam.questionCount} Questions
                    </span>
                  </div>

                  <button
                    onClick={() => onTakeExam(exam)}
                    disabled={exam.questionCount === 0}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition shadow-md shadow-indigo-100"
                  >
                    Attempt Test
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {exams.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-12 bg-white rounded-2xl border border-slate-200/60 p-6">No exams are currently available. Please check back later!</p>
            )}
          </div>
        </div>

        {/* RECENT SUBMISSION ATTEMPTS REPORT (5/12 space) */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 font-display">My Evaluation History</h3>

          <div className="space-y-3">
            {submissions.map(sub => (
              <div key={sub.id} className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm space-y-3 hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 line-clamp-1 font-display">{sub.examTitle}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{new Date(sub.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-xs font-bold rounded">
                    Score: {sub.score}/{sub.totalMarks}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-medium border-t border-slate-100 pt-2.5 text-slate-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    Accuracy: {sub.accuracy}%
                  </span>
                  <span>
                    Time: {Math.floor(sub.durationTakenSeconds / 60)}m {sub.durationTakenSeconds % 60}s
                  </span>
                </div>
              </div>
            ))}
            {submissions.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/60 p-6">
                <p className="text-slate-400 text-sm">You haven't attempted any exams yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
