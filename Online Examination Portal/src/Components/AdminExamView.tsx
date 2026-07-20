/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash, Edit3, BookOpen, Clock, Sparkles, Check, ChevronRight, RefreshCw, X, AlertCircle } from 'lucide-react';
import { Exam, Question } from '../types';

interface AdminExamViewProps {
  token: string;
}

export default function AdminExamView({ token }: AdminExamViewProps) {
  const [exams, setExams] = useState<(Exam & { questionCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Selected Exam (to view/manage questions)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Create/Update Exam Form State
  const [showExamModal, setShowExamModal] = useState(false);
  const [examIdToEdit, setExamIdToEdit] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [examDesc, setExamDesc] = useState('');
  const [examDuration, setExamDuration] = useState(15);

  // Add Question Form State
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrectIdx, setQCorrectIdx] = useState(0);
  const [qMarks, setQMarks] = useState(10);

  // AI Question Generator Form State
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(3);
  const [generatingAI, setGeneratingAI] = useState(false);

  const fetchExams = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/exams', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to retrieve exams');
      const data = await response.json();
      setExams(data);
    } catch (err: any) {
      setError(err.message || 'Error loading exams list');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (examId: string) => {
    setLoadingQuestions(true);
    try {
      const response = await fetch(`/api/exams/${examId}/questions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to load questions');
      const data = await response.json();
      setQuestions(data);
    } catch (err) {
      console.error('Questions fetch error:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [token]);

  const handleSelectExam = (exam: Exam) => {
    setSelectedExam(exam);
    fetchQuestions(exam.id);
    setShowAddQuestion(false);
    setShowAIGenerator(false);
  };

  // Create or Update Exam
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle || !examDuration) return;

    const url = examIdToEdit ? `/api/exams/${examIdToEdit}` : '/api/exams';
    const method = examIdToEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: examTitle,
          description: examDesc,
          durationMinutes: Number(examDuration),
        }),
      });

      if (!response.ok) throw new Error('Failed to save exam');
      
      // Clean states
      setShowExamModal(false);
      setExamIdToEdit(null);
      setExamTitle('');
      setExamDesc('');
      setExamDuration(15);

      await fetchExams();
    } catch (err: any) {
      alert(err.message || 'Error saving exam');
    }
  };

  const handleDeleteExam = async (examId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this exam? All associated questions and student submissions will be permanently deleted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Delete failed');
      
      if (selectedExam?.id === examId) {
        setSelectedExam(null);
        setQuestions([]);
      }
      await fetchExams();
    } catch (err: any) {
      alert(err.message || 'Error deleting exam');
    }
  };

  // Add Question Manually
  const handleAddQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    if (!qText || qOptions.some(o => !o) || qMarks <= 0) {
      alert('Please complete all question options and fields.');
      return;
    }

    try {
      const response = await fetch(`/api/exams/${selectedExam.id}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: qText,
          options: qOptions,
          correctAnswerIndex: Number(qCorrectIdx),
          marks: Number(qMarks),
        }),
      });

      if (!response.ok) throw new Error('Failed to add question');

      // Clear states
      setQText('');
      setQOptions(['', '', '', '']);
      setQCorrectIdx(0);
      setQMarks(10);
      setShowAddQuestion(false);

      // Refresh list
      await fetchQuestions(selectedExam.id);
      await fetchExams(); // to update marks or question count
    } catch (err: any) {
      alert(err.message || 'Error adding question');
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (qId: string) => {
    if (!selectedExam) return;
    if (!confirm('Delete this question?')) return;

    try {
      const response = await fetch(`/api/questions/${qId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Delete question failed');
      
      await fetchQuestions(selectedExam.id);
      await fetchExams();
    } catch (err: any) {
      alert(err.message || 'Error deleting question');
    }
  };

  // AI Generate Questions
  const handleAIGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam || !aiTopic) return;

    setGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: aiTopic,
          examId: selectedExam.id,
          count: Number(aiCount),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI generation failed');

      alert(`AI successfully generated ${aiCount} questions on "${aiTopic}"!`);
      
      setAiTopic('');
      setShowAIGenerator(false);
      
      await fetchQuestions(selectedExam.id);
      await fetchExams();
    } catch (err: any) {
      alert(err.message || 'AI Question Generation failed. Ensure your Gemini API Key is configured.');
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            Exam Management Console
          </h2>
          <p className="text-xs text-slate-500 font-normal">Create academic exams, add questions, or use AI auto-generation</p>
        </div>
        <button
          onClick={() => {
            setExamIdToEdit(null);
            setExamTitle('');
            setExamDesc('');
            setExamDuration(15);
            setShowExamModal(true);
          }}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-md"
        >
          <Plus className="h-4 w-4" />
          Create New Exam
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* EXAMS DIRECTORY COLUMN (5/12 space) */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Exam Index</h3>
          
          <div className="space-y-3">
            {exams.map(exam => {
              const isSelected = selectedExam?.id === exam.id;
              return (
                <div
                  key={exam.id}
                  onClick={() => handleSelectExam(exam)}
                  className={`p-5 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-indigo-50/20 border-indigo-400 shadow-sm ring-1 ring-indigo-100/50' 
                      : 'bg-white border-slate-200/60 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 line-clamp-1 font-display tracking-tight">{exam.title}</h4>
                      <p className="text-xs text-slate-400 font-normal line-clamp-2 mt-1">{exam.description || 'No description provided'}</p>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isSelected ? 'translate-x-1 text-indigo-600' : ''}`} />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 border-t border-slate-100 pt-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {exam.durationMinutes} mins
                    </span>
                    <span>
                      {exam.questionCount} Questions ({exam.totalMarks} Marks)
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end gap-2 text-[10px] uppercase font-bold">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExamIdToEdit(exam.id);
                        setExamTitle(exam.title);
                        setExamDesc(exam.description);
                        setExamDuration(exam.durationMinutes);
                        setShowExamModal(true);
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 border border-slate-200 text-indigo-600 rounded flex items-center gap-1 transition"
                    >
                      <Edit3 className="h-2.5 w-2.5" />
                      Edit Details
                    </button>
                    <button
                      onClick={(e) => handleDeleteExam(exam.id, e)}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded flex items-center gap-1 transition"
                    >
                      <Trash className="h-2.5 w-2.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}

            {exams.length === 0 && !loading && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/60 p-6">
                <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 text-sm font-semibold font-display">No academic exams hosted yet.</p>
                <button
                  onClick={() => setShowExamModal(true)}
                  className="mt-3 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg"
                >
                  Create One Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* QUESTIONS DRAWER & GENERATORS COLUMN (7/12 space) */}
        <div className="lg:col-span-7">
          {selectedExam ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 sm:p-8 space-y-6">
              
              {/* Drawer Header info */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-display tracking-tight">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                    {selectedExam.title} Questions
                  </h3>
                  <p className="text-xs text-slate-400 font-normal">Manage assessment objectives for this test</p>
                </div>
                
                {/* Operations Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowAIGenerator(false);
                      setShowAddQuestion(!showAddQuestion);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                  >
                    {showAddQuestion ? 'Close Add' : '+ Add Question'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddQuestion(false);
                      setShowAIGenerator(!showAIGenerator);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1 transition"
                  >
                    <Sparkles className="h-3 w-3 animate-pulse text-indigo-600" />
                    AI Write Questions
                  </button>
                </div>
              </div>

              {/* AI GENERATOR FORM DRAWER */}
              {showAIGenerator && (
                <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 space-y-4 animate-fade-in">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <h4 className="text-xs font-black text-indigo-800 uppercase tracking-wider">Gemini Question Generator</h4>
                  </div>
                  <form onSubmit={handleAIGenerateQuestions} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-7">
                      <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-1">Topic Subject / Course Area</label>
                      <input
                        type="text"
                        required
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder="e.g. React hook lifecycle, basic SQL queries, binary search"
                        className="block w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-1">Target Count</label>
                      <select
                        value={aiCount}
                        onChange={(e) => setAiCount(Number(e.target.value))}
                        className="block w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                      >
                        <option value={3}>3 Questions</option>
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <button
                        type="submit"
                        disabled={generatingAI || !aiTopic}
                        className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition shadow"
                      >
                        {generatingAI ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Generate'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ADD QUESTION MANUAL FORM */}
              {showAddQuestion && (
                <form onSubmit={handleAddQuestionSubmit} className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4 animate-fade-in">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Configure Custom Question</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Question Stem Text</label>
                      <input
                        type="text"
                        required
                        value={qText}
                        onChange={(e) => setQText(e.target.value)}
                        placeholder="Type the question query..."
                        className="block w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {qOptions.map((opt, oIdx) => (
                        <div key={oIdx}>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Option {String.fromCharCode(65 + oIdx)}</label>
                          <input
                            type="text"
                            required
                            value={opt}
                            onChange={(e) => {
                              const updated = [...qOptions];
                              updated[oIdx] = e.target.value;
                              setQOptions(updated);
                            }}
                            placeholder={`Option ${oIdx + 1} text...`}
                            className="block w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Correct Answer index</label>
                        <select
                          value={qCorrectIdx}
                          onChange={(e) => setQCorrectIdx(Number(e.target.value))}
                          className="block w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                        >
                          <option value={0}>Option A</option>
                          <option value={1}>Option B</option>
                          <option value={2}>Option C</option>
                          <option value={3}>Option D</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Question Marks</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={qMarks}
                          onChange={(e) => setQMarks(Number(e.target.value))}
                          className="block w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition"
                  >
                    Save Question
                  </button>
                </form>
              )}

              {/* QUESTIONS LIST */}
              <div className="space-y-4">
                {questions.map((question, qIdx) => (
                  <div key={question.id} className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 relative group hover:border-slate-300 transition-colors">
                    <div className="flex justify-between items-start pb-2 border-b border-slate-200/50">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        Question {qIdx + 1} ({question.marks} Marks)
                      </span>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition opacity-0 group-hover:opacity-100"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-800 mt-3 leading-snug font-display">{question.text}</h4>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-semibold">
                      {question.options.map((opt, oIdx) => {
                        const isCorrect = oIdx === question.correctAnswerIndex;
                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
                              isCorrect 
                                ? 'bg-emerald-50/50 border-emerald-300 text-emerald-800 font-bold font-display' 
                                : 'bg-white border-slate-200/60 text-slate-600'
                            }`}
                          >
                            <span className={`h-4 w-4 rounded-full text-[9px] flex items-center justify-center border font-mono ${
                              isCorrect ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="truncate">{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {questions.length === 0 && !loadingQuestions && (
                  <p className="text-xs text-slate-400 text-center py-8 font-medium">This exam currently does not have any questions. Use the manual form or AI generator above to add some!</p>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center text-slate-400 space-y-4">
              <div className="h-12 w-12 bg-slate-100/80 text-slate-400 rounded-full mx-auto flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
              <p className="text-xs font-normal text-slate-500 max-w-sm mx-auto font-display">Select any hosted exam from the left directories to edit details, manage question indexes, or write questions with AI.</p>
            </div>
          )}
        </div>

      </div>

      {/* EXAM CREATION / DETAILS DIALOG MODAL */}
      {showExamModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="text-base font-black text-slate-800 uppercase tracking-wider">
                {examIdToEdit ? 'Modify Exam Details' : 'Design New Exam'}
              </h4>
              <button
                onClick={() => setShowExamModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Exam Title</label>
                <input
                  type="text"
                  required
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="e.g. Physics Core, Web Frameworks, CS-101"
                  className="block w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Assessment Description</label>
                <textarea
                  rows={3}
                  value={examDesc}
                  onChange={(e) => setExamDesc(e.target.value)}
                  placeholder="Provide brief context or guidelines for students..."
                  className="block w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  required
                  value={examDuration}
                  onChange={(e) => setExamDuration(Number(e.target.value))}
                  className="block w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow"
                >
                  Save Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
