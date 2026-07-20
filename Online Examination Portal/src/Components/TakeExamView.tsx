/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Exam, Question } from '../types';

interface TakeExamViewProps {
  exam: Exam & { questions: Question[] };
  token: string;
  onFinished: (submissionResult: any) => void;
  onCancel: () => void;
}

export default function TakeExamView({ exam, token, onFinished, onCancel }: TakeExamViewProps) {
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examStarted, setExamStarted] = useState(false);

  // Time-spent tracker
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Start exam timer once student clicks 'Start'
  useEffect(() => {
    if (!examStarted) return;

    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time runs out
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted]);

  const questions = exam.questions;

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleAutoSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/exams/${exam.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers,
          durationTakenSeconds: secondsElapsed,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onFinished(data);
    } catch (err) {
      console.error('Auto submit error:', err);
      alert('Time ran out! Your progress was saved locally.');
      onCancel();
    }
  };

  const handleManualSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/exams/${exam.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers,
          durationTakenSeconds: secondsElapsed,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onFinished(data);
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft <= 60;

  if (!examStarted) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center space-y-6">
        <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center">
          <Clock className="h-9 w-9 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">{exam.title}</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">{exam.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 max-w-sm mx-auto text-left">
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase">Time Limit</div>
            <div className="text-base font-bold text-slate-800">{exam.durationMinutes} Minutes</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase">Questions</div>
            <div className="text-base font-bold text-slate-800">{questions.length} Items</div>
          </div>
        </div>
        <div className="pt-4 flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            Go Back
          </button>
          <button
            onClick={() => setExamStarted(true)}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition shadow-md shadow-indigo-100"
          >
            <Play className="h-4 w-4 fill-white" />
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[activeQuestionIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 p-4 sm:p-6 font-sans">
      
      {/* LEFT / NAVIGATION COLUMN (1/4 space on desktop) */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Timer Box */}
        <div className={`p-5 rounded-2xl shadow-sm border flex items-center justify-between transition-all ${
          isLowTime ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse' : 'bg-white border-slate-200/80 text-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${isLowTime ? 'text-rose-600' : 'text-slate-400'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Time Remaining</span>
          </div>
          <span className="text-xl font-bold font-mono">
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Progress Grid */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</span>
            <span className="text-xs font-semibold text-indigo-600">{answeredCount}/{totalQuestions} Answered</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            />
          </div>

          {/* Quick Navigator Grid */}
          <div className="grid grid-cols-5 gap-2 pt-2">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isActive = idx === activeQuestionIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionIdx(idx)}
                  className={`h-9 w-full font-mono text-xs font-semibold rounded-lg transition-all flex items-center justify-center border ${
                    isActive
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                      : isAnswered
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cancel/Exit button */}
        <button
          onClick={() => {
            if (confirm('Are you sure you want to exit? Your current test progress will be lost.')) {
              onCancel();
            }
          }}
          className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition text-center"
        >
          Quit Test (No Grade)
        </button>
      </div>

      {/* CORE QUESTION PANEL COLUMN (3/4 space on desktop) */}
      <div className="lg:col-span-3 space-y-6">
        {currentQuestion ? (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/80 space-y-6">
            
            {/* Header info */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded-full uppercase tracking-widest border border-indigo-100">
                Question {activeQuestionIdx + 1} of {totalQuestions}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {currentQuestion.marks} Marks
              </span>
            </div>

            {/* Question Stem Text */}
            <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 leading-snug tracking-tight">
              {currentQuestion.text}
            </h3>

            {/* Answer Options list */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, oIdx) => {
                const isSelected = answers[currentQuestion.id] === oIdx;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(currentQuestion.id, oIdx)}
                    className={`w-full p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all ${
                      isSelected
                        ? 'bg-indigo-50/20 border-indigo-600 shadow-sm'
                        : 'bg-white border-slate-200/60 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span className={`h-5 w-5 rounded-full flex items-center justify-center border font-mono text-xs font-extrabold mt-0.5 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-500'
                    }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className={`text-sm sm:text-base font-semibold ${
                      isSelected ? 'text-slate-900' : 'text-slate-700'
                    }`}>
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Nav Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                disabled={activeQuestionIdx === 0}
                onClick={() => setActiveQuestionIdx(prev => prev - 1)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-sm font-semibold rounded-xl flex items-center gap-1.5 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              {activeQuestionIdx < totalQuestions - 1 ? (
                <button
                  onClick={() => setActiveQuestionIdx(prev => prev + 1)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl flex items-center gap-1.5 transition"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmSubmit(true)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition"
                >
                  Finish & Submit Exam
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
            <p className="text-slate-500 font-bold">This exam doesn't contain any questions. Please contact your instructor.</p>
          </div>
        )}
      </div>

      {/* CONFIRM SUBMISSION OVERLAY DIALOG */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Submit your Exam?</h4>
              <p className="text-sm text-slate-500 mt-1">
                You have answered <span className="font-bold text-slate-800">{answeredCount} out of {totalQuestions}</span> questions.
                Once submitted, your responses will be evaluated instantly and your grade recorded.
              </p>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
              >
                Go Back
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleManualSubmit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition shadow-md shadow-indigo-100"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
