/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, Clock, Sparkles, RefreshCw, Send, Trash, Edit3, MessageSquare } from 'lucide-react';
import { AcademicRecord, User } from '../types';

interface AcademicRecordsViewProps {
  user: User;
  token: string;
}

export default function AcademicRecordsView({ user, token }: AcademicRecordsViewProps) {
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileType, setFileType] = useState('text/plain');
  const [comments, setComments] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);

  // Editing state for Admin override
  const [editingRecord, setEditingRecord] = useState<AcademicRecord | null>(null);
  const [overrideGrade, setOverrideGrade] = useState('');
  const [overrideFeedback, setOverrideFeedback] = useState('');

  // Selected Record to view full feedback
  const [selectedRecord, setSelectedRecord] = useState<AcademicRecord | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/academic-records', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to retrieve academic records');
      const data = await response.json();
      setRecords(data);
    } catch (err: any) {
      setError(err.message || 'Error loading records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [token]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setFileType(file.type || 'text/plain');

    const reader = new FileReader();
    // For text/code files, read as plain string. For PDF/binary, read as Base64 or string representation.
    if (file.type.startsWith('text/') || file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.py') || file.name.endsWith('.java') || file.name.endsWith('.json') || file.name.endsWith('.html') || file.name.endsWith('.css') || file.name.endsWith('.md')) {
      reader.readAsText(file);
      reader.onload = () => {
        setFileContent(reader.result as string);
      };
    } else {
      // Base64 encoding for general documents/images
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1] || '';
        setFileContent(`[Base64 Encoded File content: ${file.name}]\\n` + base64String);
      };
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !fileContent) {
      alert('Please select or type a record to upload.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await fetch('/api/academic-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName,
          fileType,
          fileContent,
          comments,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Clean form state
      setFileName('');
      setFileContent('');
      setComments('');
      
      // Auto-view the newly generated feedback
      setSelectedRecord(data);
      
      await fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Upload and AI evaluation failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAdminOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      const response = await fetch(`/api/academic-records/${editingRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          grade: overrideGrade,
          feedback: overrideFeedback,
        }),
      });

      if (!response.ok) throw new Error('Override failed');
      const data = await response.json();
      
      setEditingRecord(null);
      if (selectedRecord?.id === data.id) {
        setSelectedRecord(data);
      }
      await fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Override evaluation failed');
    }
  };

  const getGradeBg = (grade: string) => {
    if (!grade) return 'bg-slate-100 text-slate-700';
    if (grade.startsWith('A')) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (grade.startsWith('B')) return 'bg-indigo-50 border-indigo-200 text-indigo-700';
    if (grade.startsWith('C')) return 'bg-amber-50 border-amber-200 text-amber-700';
    if (grade.startsWith('D') || grade.startsWith('F')) return 'bg-rose-50 border-rose-200 text-rose-700';
    return 'bg-blue-50 border-blue-200 text-blue-700';
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-600" />
            Academic Records & AI Grader
          </h2>
          <p className="text-xs text-slate-500 font-normal">
            {isAdmin 
              ? 'Evaluate student homework, custom code, essay entries and assign custom reviews'
              : 'Submit academic files and homework for instant automated feedback and grading'}
          </p>
        </div>
        <button
          onClick={fetchRecords}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reload List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COMPONENT: ADMIN REVIEWS / STUDENT SUBMISSIONS (5/12 space) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* File Upload Box (Only for Students) */}
          {!isAdmin && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">Submit New Assignment</h3>
              
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                
                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    isDragActive 
                      ? 'border-indigo-600 bg-indigo-50/20' 
                      : fileName 
                      ? 'border-emerald-300 bg-emerald-50/10' 
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50'
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload-input"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="file-upload-input" className="cursor-pointer space-y-2 block">
                    <div className="mx-auto h-10 w-10 text-slate-400 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm">
                      {fileName ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <Upload className="h-5 w-5 text-slate-500" />}
                    </div>
                    <div className="text-xs font-bold text-slate-700 font-display">
                      {fileName ? 'File selected:' : 'Drag & Drop your homework or click to browse'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {fileName ? `${fileName} (${fileType})` : 'Supports essay entries, TXT, PDF, Word, or Code files'}
                    </div>
                  </label>
                </div>

                {/* Plain-text entry fallback / textarea */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-display">
                    Or Paste/Write Assignment Text Directly
                  </label>
                  <textarea
                    rows={4}
                    value={fileContent}
                    onChange={(e) => {
                      setFileContent(e.target.value);
                      if (!fileName) {
                        setFileName('draft-submission.txt');
                        setFileType('text/plain');
                      }
                    }}
                    placeholder="Type or paste your homework/response text here..."
                    className="block w-full p-3 bg-slate-50 hover:bg-slate-100/30 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
                  />
                </div>

                {/* Comments box */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-display">
                    Comments / Special Instructions
                  </label>
                  <input
                    type="text"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="e.g. Please check my logic in section 2..."
                    className="block w-full p-3 bg-slate-50 hover:bg-slate-100/30 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading || !fileContent}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-indigo-100"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      AI Evaluating & Grading...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit to AI Grader
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Academic Records List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">
              {isAdmin ? 'Student Submissions' : 'Submission History'}
            </h3>

            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {records.map(record => {
                const isActive = selectedRecord?.id === record.id;
                return (
                  <div
                    key={record.id}
                    onClick={() => {
                      setSelectedRecord(record);
                      setEditingRecord(null);
                    }}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-indigo-50/20 border-indigo-400 shadow-sm' 
                        : 'bg-white border-slate-200/60 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 line-clamp-1 font-display tracking-tight">{record.fileName}</h4>
                          <p className="text-[10px] text-slate-400 font-normal">
                            {isAdmin ? `By ${record.studentName}` : 'Self submission'} • {new Date(record.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Grade Badge */}
                      <span className={`px-2.5 py-0.5 border text-[10px] font-black rounded-full font-mono ${getGradeBg(record.grade)}`}>
                        {record.grade}
                      </span>
                    </div>

                    {record.comments && (
                      <p className="mt-2 text-xs text-slate-500 font-medium line-clamp-1 italic">
                        "${record.comments}"
                      </p>
                    )}

                    <div className="mt-2 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                      <span className="flex items-center gap-1">
                        {record.status === 'graded' ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                            Graded
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 text-amber-500 animate-pulse" />
                            Evaluating
                          </>
                        )}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRecord(record);
                            setOverrideGrade(record.grade);
                            setOverrideFeedback(record.feedback);
                          }}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 border border-slate-200 text-indigo-600 rounded flex items-center gap-1 transition"
                        >
                          <Edit3 className="h-2.5 w-2.5" />
                          Review/Override
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {records.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-8">No academic records uploaded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT: DETAILED EVALUATION & OVERRIDE DESK (7/12 space) */}
        <div className="lg:col-span-7">
          
          {/* Admin Override Desk */}
          {isAdmin && editingRecord && (
            <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-md space-y-4 mb-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-indigo-600" />
                  Override Grader Desk
                </h3>
                <button
                  onClick={() => setEditingRecord(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1 text-xs">
                <div><span className="font-bold text-slate-500">Student:</span> {editingRecord.studentName}</div>
                <div><span className="font-bold text-slate-500">Assignment File:</span> {editingRecord.fileName}</div>
              </div>

              <form onSubmit={handleAdminOverrideSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Letter Grade
                    </label>
                    <input
                      type="text"
                      required
                      value={overrideGrade}
                      onChange={(e) => setOverrideGrade(e.target.value)}
                      placeholder="e.g. A+"
                      className="block w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Grading Status
                    </label>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4" />
                      Manual override will update evaluation metrics
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Instructor Review / Feedback
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={overrideFeedback}
                    onChange={(e) => setOverrideFeedback(e.target.value)}
                    placeholder="Provide qualitative feedback..."
                    className="block w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition"
                >
                  Save Evaluation Override
                </button>
              </form>
            </div>
          )}

          {/* Active Record Detail display */}
          {selectedRecord ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              
              {/* Top Meta info */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-display tracking-tight">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    {selectedRecord.fileName}
                  </h3>
                  <p className="text-xs text-slate-400 font-normal">
                    Uploaded by <span className="font-semibold text-slate-600">{selectedRecord.studentName}</span> on {new Date(selectedRecord.uploadedAt).toLocaleString()}
                  </p>
                </div>
                
                {/* Grade Block */}
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-display">Academic Grade</div>
                  <span className={`px-4 py-1.5 border text-sm font-black rounded-full font-mono ${getGradeBg(selectedRecord.grade)}`}>
                    {selectedRecord.grade}
                  </span>
                </div>
              </div>

              {/* Submited Content Preview */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Submitted Homework Code/Text</h4>
                <div className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto max-h-[160px] whitespace-pre-wrap border border-slate-900 shadow-inner">
                  {selectedRecord.fileContent}
                </div>
              </div>

              {/* Automated Feedback & Evaluation Report */}
              <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 font-display">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    Instructor Feedback & Performance Report
                  </h4>
                  {selectedRecord.gradedAt && (
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      Graded {new Date(selectedRecord.gradedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="text-sm text-slate-700 leading-relaxed space-y-4 whitespace-pre-wrap font-sans font-normal">
                  {selectedRecord.feedback}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center text-slate-400 space-y-4">
              <div className="h-12 w-12 bg-slate-50 text-slate-400 rounded-full mx-auto flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <p className="text-xs font-normal text-slate-500 max-w-sm mx-auto font-display">
                Select any academic record submission on the left to review automated grades, feedback, and performance tracking.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
