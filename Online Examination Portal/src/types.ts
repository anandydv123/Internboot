/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  password?: string; // Excluded from client responses for security
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  createdAt: string;
  createdBy: string; // adminId
}

export interface Question {
  id: string;
  examId: string;
  text: string;
  options: string[]; // 4 options
  correctAnswerIndex: number; // 0-3
  marks: number;
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  examId: string;
  examTitle: string;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  score: number;
  totalMarks: number;
  accuracy: number; // percentage
  submittedAt: string;
  durationTakenSeconds: number;
}

export interface AcademicRecord {
  id: string;
  studentId: string;
  studentName: string;
  fileName: string;
  fileType: string;
  fileContent: string; // Base64 or Text representation
  comments: string;
  uploadedAt: string;
  status: 'pending' | 'graded';
  grade: string; // Automated grade by Gemini or manual override
  feedback: string; // Automated feedback by Gemini or manual comments
  gradedAt?: string;
}

export interface AnalyticsSummary {
  totalStudents: number;
  totalExams: number;
  totalSubmissions: number;
  averageScore: number;
  averageAccuracy: number;
  examStats: {
    examId: string;
    examTitle: string;
    attempts: number;
    avgScore: number;
    highestScore: number;
  }[];
  studentStats: {
    studentId: string;
    studentName: string;
    examsAttempted: number;
    avgScore: number;
    avgAccuracy: number;
    rank?: number;
  }[];
}
