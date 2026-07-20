/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { User, Exam, Question, Submission, AcademicRecord } from '../types';

interface Schema {
  users: User[];
  exams: Exam[];
  questions: Question[];
  submissions: Submission[];
  academicRecords: AcademicRecord[];
}

const DB_FILE = path.join(process.cwd(), 'db.json');

const DEFAULT_USERS: User[] = [
  {
    id: 'admin-1',
    email: 'admin@exam.com',
    password: 'adminpassword', // Simple text password for easier exploration, secure enough for local dev/preview
    name: 'Dr. Sarah Jenkins',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'student-1',
    email: 'student@exam.com',
    password: 'studentpassword',
    name: 'Alex Rivera',
    role: 'student',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_EXAMS: Exam[] = [
  {
    id: 'exam-cs-101',
    title: 'Introduction to Computer Science',
    description: 'A comprehensive entry-level assessment testing fundamental knowledge of programming, complexity theory, and databases.',
    durationMinutes: 10,
    totalMarks: 30,
    createdAt: new Date().toISOString(),
    createdBy: 'admin-1',
  },
  {
    id: 'exam-web-201',
    title: 'Web Technologies & Frameworks',
    description: 'Evaluates your understanding of core web principles: HTTP, Client-Server architecture, React fundamentals, and state management.',
    durationMinutes: 15,
    totalMarks: 20,
    createdAt: new Date().toISOString(),
    createdBy: 'admin-1',
  }
];

const DEFAULT_QUESTIONS: Question[] = [
  // CS 101 Questions (3 questions, 10 marks each)
  {
    id: 'q-cs-1',
    examId: 'exam-cs-101',
    text: 'What is the worst-case time complexity of searching in a balanced Binary Search Tree (BST)?',
    options: ['O(1)', 'O(N)', 'O(log N)', 'O(N log N)'],
    correctAnswerIndex: 2, // O(log N)
    marks: 10,
  },
  {
    id: 'q-cs-2',
    examId: 'exam-cs-101',
    text: 'Which data structure follows the Last-In, First-Out (LIFO) principle?',
    options: ['Queue', 'Stack', 'Linked List', 'Hash Map'],
    correctAnswerIndex: 1, // Stack
    marks: 10,
  },
  {
    id: 'q-cs-3',
    examId: 'exam-cs-101',
    text: 'In database systems, what property guarantees that a transaction is either fully completed or not executed at all?',
    options: ['Isolation', 'Consistency', 'Durability', 'Atomicity'],
    correctAnswerIndex: 3, // Atomicity
    marks: 10,
  },
  // Web 201 Questions (2 questions, 10 marks each)
  {
    id: 'q-web-1',
    examId: 'exam-web-201',
    text: 'What does the status code 403 represent in HTTP?',
    options: ['Not Found', 'Unauthorized', 'Forbidden', 'Bad Request'],
    correctAnswerIndex: 2, // Forbidden
    marks: 10,
  },
  {
    id: 'q-web-2',
    examId: 'exam-web-201',
    text: 'Which hook should be used in React to fetch data or trigger side effects?',
    options: ['useState', 'useRef', 'useMemo', 'useEffect'],
    correctAnswerIndex: 3, // useEffect
    marks: 10,
  }
];

const DEFAULT_SUBMISSIONS: Submission[] = [];
const DEFAULT_ACADEMIC_RECORDS: AcademicRecord[] = [];

class JsonDatabase {
  private data: Schema;

  constructor() {
    this.data = {
      users: [],
      exams: [],
      questions: [],
      submissions: [],
      academicRecords: [],
    };
    this.init();
  }

  private init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(content);
        // Ensure any missing root collections are defined
        if (!this.data.users) this.data.users = [];
        if (!this.data.exams) this.data.exams = [];
        if (!this.data.questions) this.data.questions = [];
        if (!this.data.submissions) this.data.submissions = [];
        if (!this.data.academicRecords) this.data.academicRecords = [];
      } else {
        // Seed initial data
        this.data = {
          users: DEFAULT_USERS,
          exams: DEFAULT_EXAMS,
          questions: DEFAULT_QUESTIONS,
          submissions: DEFAULT_SUBMISSIONS,
          academicRecords: DEFAULT_ACADEMIC_RECORDS,
        };
        this.save();
      }
    } catch (e) {
      console.error('Failed to initialize local JSON database, falling back to in-memory state:', e);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save to local database file:', e);
    }
  }

  // --- Users ---
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  // --- Exams ---
  getExams(): Exam[] {
    return this.data.exams;
  }

  getExamById(id: string): Exam | undefined {
    return this.data.exams.find(e => e.id === id);
  }

  createExam(exam: Omit<Exam, 'id' | 'createdAt'>): Exam {
    const newExam: Exam = {
      ...exam,
      id: 'exm_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    this.data.exams.push(newExam);
    this.save();
    return newExam;
  }

  updateExam(id: string, updates: Partial<Omit<Exam, 'id' | 'createdAt' | 'createdBy'>>): Exam | undefined {
    const examIndex = this.data.exams.findIndex(e => e.id === id);
    if (examIndex === -1) return undefined;

    this.data.exams[examIndex] = {
      ...this.data.exams[examIndex],
      ...updates,
    };
    this.save();
    return this.data.exams[examIndex];
  }

  deleteExam(id: string): boolean {
    const initialLength = this.data.exams.length;
    this.data.exams = this.data.exams.filter(e => e.id !== id);
    // Also delete associated questions and submissions to preserve cascade referential integrity
    this.data.questions = this.data.questions.filter(q => q.examId !== id);
    this.data.submissions = this.data.submissions.filter(s => s.examId !== id);
    this.save();
    return this.data.exams.length < initialLength;
  }

  // --- Questions ---
  getQuestions(): Question[] {
    return this.data.questions;
  }

  getQuestionsByExamId(examId: string): Question[] {
    return this.data.questions.filter(q => q.examId === examId);
  }

  createQuestion(question: Omit<Question, 'id'>): Question {
    const newQuestion: Question = {
      ...question,
      id: 'qst_' + Math.random().toString(36).substr(2, 9),
    };
    this.data.questions.push(newQuestion);
    
    // Recalculate exam total marks
    this.recalculateExamTotalMarks(question.examId);
    
    this.save();
    return newQuestion;
  }

  updateQuestion(id: string, updates: Partial<Omit<Question, 'id' | 'examId'>>): Question | undefined {
    const questionIndex = this.data.questions.findIndex(q => q.id === id);
    if (questionIndex === -1) return undefined;

    const oldExamId = this.data.questions[questionIndex].examId;
    this.data.questions[questionIndex] = {
      ...this.data.questions[questionIndex],
      ...updates,
    };
    
    this.recalculateExamTotalMarks(oldExamId);
    this.save();
    return this.data.questions[questionIndex];
  }

  deleteQuestion(id: string): boolean {
    const question = this.data.questions.find(q => q.id === id);
    if (!question) return false;
    
    const examId = question.examId;
    this.data.questions = this.data.questions.filter(q => q.id !== id);
    
    this.recalculateExamTotalMarks(examId);
    this.save();
    return true;
  }

  private recalculateExamTotalMarks(examId: string) {
    const exam = this.data.exams.find(e => e.id === examId);
    if (exam) {
      const examQuestions = this.data.questions.filter(q => q.examId === examId);
      exam.totalMarks = examQuestions.reduce((sum, q) => sum + q.marks, 0);
    }
  }

  // --- Submissions ---
  getSubmissions(): Submission[] {
    return this.data.submissions;
  }

  getSubmissionsByStudentId(studentId: string): Submission[] {
    return this.data.submissions.filter(s => s.studentId === studentId);
  }

  getSubmissionsByExamId(examId: string): Submission[] {
    return this.data.submissions.filter(s => s.examId === examId);
  }

  createSubmission(submission: Omit<Submission, 'id' | 'submittedAt'>): Submission {
    const newSubmission: Submission = {
      ...submission,
      id: 'sub_' + Math.random().toString(36).substr(2, 9),
      submittedAt: new Date().toISOString(),
    };
    this.data.submissions.push(newSubmission);
    this.save();
    return newSubmission;
  }

  // --- Academic Records ---
  getAcademicRecords(): AcademicRecord[] {
    return this.data.academicRecords;
  }

  getAcademicRecordsByStudentId(studentId: string): AcademicRecord[] {
    return this.data.academicRecords.filter(r => r.studentId === studentId);
  }

  getAcademicRecordById(id: string): AcademicRecord | undefined {
    return this.data.academicRecords.find(r => r.id === id);
  }

  createAcademicRecord(record: Omit<AcademicRecord, 'id' | 'uploadedAt' | 'status'>): AcademicRecord {
    const newRecord: AcademicRecord = {
      ...record,
      id: 'rec_' + Math.random().toString(36).substr(2, 9),
      uploadedAt: new Date().toISOString(),
      status: 'pending',
    };
    this.data.academicRecords.push(newRecord);
    this.save();
    return newRecord;
  }

  updateAcademicRecord(id: string, updates: Partial<Omit<AcademicRecord, 'id' | 'studentId' | 'uploadedAt'>>): AcademicRecord | undefined {
    const index = this.data.academicRecords.findIndex(r => r.id === id);
    if (index === -1) return undefined;

    this.data.academicRecords[index] = {
      ...this.data.academicRecords[index],
      ...updates,
    };
    this.save();
    return this.data.academicRecords[index];
  }

  deleteAcademicRecord(id: string): boolean {
    const initialLength = this.data.academicRecords.length;
    this.data.academicRecords = this.data.academicRecords.filter(r => r.id !== id);
    this.save();
    return this.data.academicRecords.length < initialLength;
  }
}

export const db = new JsonDatabase();
