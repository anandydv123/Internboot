/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Award, TrendingUp, Users, BookOpen, CheckCircle, RefreshCw, BarChart2 } from 'lucide-react';
import { AnalyticsSummary } from '../types';

interface AnalyticsDashboardProps {
  token: string;
}

export default function AnalyticsDashboard({ token }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const payload = await response.json();
      setData(payload);
    } catch (err: any) {
      setError(err.message || 'Error loading analytics dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 font-semibold gap-3">
        <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
        Generating real-time analytics data...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center bg-rose-50 rounded-xl border border-rose-100 text-rose-700 font-medium">
        Error loading analytics dashboard: {error || 'No analytics data available.'}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Top Title & Refresh */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-indigo-600" />
            Performance Insights
          </h2>
          <p className="text-xs text-slate-500 font-normal">Real-time stats and automated academic rankings</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* KPI CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Students</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold font-display text-slate-900">{data.totalStudents}</div>
            <div className="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-wider">Enrolled profiles</div>
          </div>
        </div>

        {/* Total Exams */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Exams</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold font-display text-slate-900">{data.totalExams}</div>
            <div className="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-wider">Assessments</div>
          </div>
        </div>

        {/* Total Submissions */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Submissions</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold font-display text-slate-900">{data.totalSubmissions}</div>
            <div className="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-wider">Evaluated</div>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Avg Score</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold font-display text-slate-900">{data.averageScore}</div>
            <div className="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-wider">Avg marks</div>
          </div>
        </div>

        {/* Average Accuracy */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col justify-between col-span-2 lg:col-span-1 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Avg Accuracy</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold font-display text-slate-900">{data.averageAccuracy}%</div>
            <div className="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-wider">Objective avg</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* STUDENT PERFORMANCE LEADERBOARD (2/3 space) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display tracking-tight">
              <Award className="h-5 w-5 text-indigo-600" />
              Dynamic Student Leaderboard
            </h3>
            <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded">
              Rankings
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="pb-3 text-center w-12">Rank</th>
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3 text-center">Exams Attempted</th>
                  <th className="pb-3 text-center">Avg Marks</th>
                  <th className="pb-3 text-right">Avg Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {data.studentStats.map((student, idx) => (
                  <tr key={student.studentId} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 text-center">
                      {student.rank ? (
                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold font-mono ${
                          student.rank === 1
                            ? 'bg-amber-100 text-amber-700'
                            : student.rank === 2
                            ? 'bg-slate-100 text-slate-700'
                            : student.rank === 3
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {student.rank}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3.5 font-bold text-slate-800 font-display">{student.studentName}</td>
                    <td className="py-3.5 text-center font-mono font-medium text-slate-600">{student.examsAttempted}</td>
                    <td className="py-3.5 text-center font-mono font-semibold text-indigo-600">{student.avgScore}</td>
                    <td className="py-3.5 text-right font-mono font-medium">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        student.avgAccuracy >= 80
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : student.avgAccuracy >= 50
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : student.avgAccuracy > 0
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-slate-50 text-slate-400'
                      }`}>
                        {student.avgAccuracy}%
                      </span>
                    </td>
                  </tr>
                ))}
                {data.studentStats.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No student records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* EXAM-SPECIFIC METRIC SUMMARY (1/3 space) */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display tracking-tight">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            Exam Analytics
          </h3>
          <p className="text-xs text-slate-400 font-normal">Performance summary sorted by average marks</p>

          <div className="space-y-5 pt-2">
            {data.examStats.map(exam => {
              const scorePercent = exam.highestScore > 0 ? (exam.avgScore / exam.highestScore) * 100 : 0;
              return (
                <div key={exam.examId} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1 font-display tracking-tight">{exam.examTitle}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{exam.attempts} Attempts evaluated</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-600">
                      Avg: {exam.avgScore}
                    </span>
                  </div>

                  {/* Horizontal Bar Chart representation */}
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-100">
                      <div
                        style={{ width: `${Math.min(100, Math.max(8, scorePercent))}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Highest score: {exam.highestScore}</span>
                  </div>
                </div>
              );
            })}
            {data.examStats.length === 0 && (
              <p className="text-sm text-center text-slate-400 py-6">No exam statistics recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
