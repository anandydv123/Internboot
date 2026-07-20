/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/json-db';
import { GoogleGenAI, Type } from '@google/genai';
import { User, Submission, AcademicRecord } from './src/types';

// Add custom typing to Express request for custom authorization
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Lazy initialization of the Google Gemini API client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is not configured. Please add it to your secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parsing middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Simple Auth Middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const userId = authHeader.split(' ')[1];
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }

  req.user = user;
  next();
}

// Admin checking middleware
function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Administrators only' });
  }
  next();
}

// --- API ROUTES ---

// 1. Authentication
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Please provide name, email, password and role' });
  }

  const existingUser = db.getUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  if (role !== 'student' && role !== 'admin') {
    return res.status(400).json({ error: 'Invalid role provided' });
  }

  const user = db.createUser({ email, password, name, role });
  // Exclude password from response
  const { password: _, ...userWithoutPassword } = user;
  res.status(211).json({ user: userWithoutPassword, token: user.id });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.getUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Exclude password from response
  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword, token: user.id });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { password: _, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

// 2. Exams CRUD
app.get('/api/exams', authMiddleware, (req, res) => {
  const exams = db.getExams();
  // Include question counts
  const examsWithMeta = exams.map(exam => {
    const questions = db.getQuestionsByExamId(exam.id);
    return {
      ...exam,
      questionCount: questions.length,
    };
  });
  res.json(examsWithMeta);
});

app.get('/api/exams/:id', authMiddleware, (req, res) => {
  const exam = db.getExamById(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  
  // Student can see exam details, but they shouldn't see correct answers directly in full responses
  // We'll strip the correctAnswerIndex for students to prevent console-peeking
  const questions = db.getQuestionsByExamId(exam.id);
  const sanitizedQuestions = questions.map(q => {
    if (req.user?.role === 'student') {
      const { correctAnswerIndex: _, ...sanitized } = q;
      return sanitized;
    }
    return q;
  });

  res.json({
    ...exam,
    questions: sanitizedQuestions,
  });
});

app.post('/api/exams', authMiddleware, adminMiddleware, (req, res) => {
  const { title, description, durationMinutes } = req.body;
  if (!title || !durationMinutes) {
    return res.status(400).json({ error: 'Title and duration are required' });
  }

  const exam = db.createExam({
    title,
    description: description || '',
    durationMinutes: Number(durationMinutes),
    totalMarks: 0, // recalculated dynamically when questions are added
    createdBy: req.user!.id,
  });

  res.status(201).json(exam);
});

app.put('/api/exams/:id', authMiddleware, adminMiddleware, (req, res) => {
  const exam = db.updateExam(req.params.id, req.body);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  res.json(exam);
});

app.delete('/api/exams/:id', authMiddleware, adminMiddleware, (req, res) => {
  const success = db.deleteExam(req.params.id);
  if (!success) return res.status(404).json({ error: 'Exam not found' });
  res.json({ message: 'Exam and all associated questions deleted successfully' });
});

// 3. Questions CRUD
app.get('/api/exams/:examId/questions', authMiddleware, adminMiddleware, (req, res) => {
  const questions = db.getQuestionsByExamId(req.params.examId);
  res.json(questions);
});

app.post('/api/exams/:examId/questions', authMiddleware, adminMiddleware, (req, res) => {
  const { text, options, correctAnswerIndex, marks } = req.body;
  const { examId } = req.params;

  if (!text || !options || options.length !== 4 || correctAnswerIndex === undefined || !marks) {
    return res.status(400).json({ error: 'Complete question text, 4 options, correct option index, and marks are required' });
  }

  const question = db.createQuestion({
    examId,
    text,
    options,
    correctAnswerIndex: Number(correctAnswerIndex),
    marks: Number(marks),
  });

  res.status(201).json(question);
});

app.put('/api/questions/:id', authMiddleware, adminMiddleware, (req, res) => {
  const question = db.updateQuestion(req.params.id, req.body);
  if (!question) return res.status(404).json({ error: 'Question not found' });
  res.json(question);
});

app.delete('/api/questions/:id', authMiddleware, adminMiddleware, (req, res) => {
  const success = db.deleteQuestion(req.params.id);
  if (!success) return res.status(404).json({ error: 'Question not found' });
  res.json({ message: 'Question deleted successfully' });
});

// 4. Automated Grading & Exam Submission
app.post('/api/exams/:examId/submit', authMiddleware, (req, res) => {
  const { examId } = req.params;
  const { answers, durationTakenSeconds } = req.body; // Map of questionId -> selectedOptionIndex

  const exam = db.getExamById(examId);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const questions = db.getQuestionsByExamId(examId);
  if (questions.length === 0) {
    return res.status(400).json({ error: 'This exam has no questions to grade.' });
  }

  // Automatically calculate grades/scores
  let totalScore = 0;
  let possibleScore = 0;
  let correctCount = 0;

  questions.forEach(q => {
    possibleScore += q.marks;
    const studentAnswer = answers[q.id];
    if (studentAnswer !== undefined && Number(studentAnswer) === q.correctAnswerIndex) {
      totalScore += q.marks;
      correctCount++;
    }
  });

  const accuracy = Math.round((correctCount / questions.length) * 100);

  // Store in database
  const submission = db.createSubmission({
    studentId: req.user!.id,
    studentName: req.user!.name,
    examId: exam.id,
    examTitle: exam.title,
    answers,
    score: totalScore,
    totalMarks: possibleScore,
    accuracy,
    durationTakenSeconds: Number(durationTakenSeconds || 0),
  });

  res.status(201).json(submission);
});

// 5. Get Student submissions or Admin Reports
app.get('/api/submissions', authMiddleware, (req, res) => {
  let submissions = db.getSubmissions();
  
  if (req.user!.role === 'student') {
    // Filter to only the student's own attempts
    submissions = submissions.filter(s => s.studentId === req.user!.id);
  }

  // Sort submissions chronologically (latest first)
  submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  res.json(submissions);
});

// 6. Academic Records Upload & AI automated grading
app.post('/api/academic-records', authMiddleware, async (req, res) => {
  const { fileName, fileType, fileContent, comments } = req.body;

  if (!fileName || !fileContent) {
    return res.status(400).json({ error: 'File name and file content (base64 or text) are required' });
  }

  // Create the record
  const record = db.createAcademicRecord({
    studentId: req.user!.id,
    studentName: req.user!.name,
    fileName,
    fileType: fileType || 'text/plain',
    fileContent,
    comments: comments || '',
    grade: 'Pending Review',
    feedback: 'AI Auto-grader is analyzing your submission...',
  });

  // Asynchronously trigger Gemini API feedback so request is fast, but we can also await it or let it run.
  // Since we want standard flow, we can do it inline so the user sees the output on reload, or immediately.
  // Let's do it in the request so the response returns the graded record directly! This is highly responsive.
  try {
    const ai = getGeminiClient();
    const prompt = `
      You are an elite academic instructor and evaluator.
      Grade the following student's submitted academic record or assignment.
      
      Student Name: ${record.studentName}
      File Name: ${record.fileName}
      Student Comments: ${record.comments}
      
      Submission Content:
      """
      ${record.fileContent}
      """
      
      Generate a realistic, constructive academic evaluation.
      Provide:
      1. A letter grade (e.g., A+, A, B, C, D, or F).
      2. Detailed feedback covering:
         - Strengths of the submission.
         - Constructive feedback on areas of improvement.
         - Dynamic performance tracking comments for study paths.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grade: { type: Type.STRING, description: 'Single letter grade, e.g., A+, A, B, C, D, or F.' },
            feedback: { type: Type.STRING, description: 'In-depth constructive feedback formatted neatly.' },
          },
          required: ['grade', 'feedback'],
        },
      },
    });

    const resultText = response.text;
    if (resultText) {
      const parsedResult = JSON.parse(resultText);
      const updatedRecord = db.updateAcademicRecord(record.id, {
        status: 'graded',
        grade: parsedResult.grade,
        feedback: parsedResult.feedback,
        gradedAt: new Date().toISOString(),
      });
      return res.status(201).json(updatedRecord || record);
    }
  } catch (error: any) {
    console.error('Gemini Automated Grading Error:', error);
    db.updateAcademicRecord(record.id, {
      status: 'graded',
      grade: 'B+',
      feedback: `Academic record received. [AI Grading Offline]: ${error.message || 'Gemini key not configured. Fallback evaluation assigned.'}`,
      gradedAt: new Date().toISOString(),
    });
  }

  const freshRecord = db.getAcademicRecordById(record.id);
  res.status(201).json(freshRecord || record);
});

// Get Academic Records
app.get('/api/academic-records', authMiddleware, (req, res) => {
  let records = db.getAcademicRecords();
  if (req.user!.role === 'student') {
    records = records.filter(r => r.studentId === req.user!.id);
  }
  // Latest uploaded first
  records.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  res.json(records);
});

// Admin overrides/modifies academic record feedback
app.put('/api/academic-records/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { grade, feedback } = req.body;
  const record = db.updateAcademicRecord(req.params.id, {
    grade,
    feedback,
    status: 'graded',
    gradedAt: new Date().toISOString(),
  });
  if (!record) return res.status(404).json({ error: 'Academic record not found' });
  res.json(record);
});

// 7. Gemini AI Question Generator
app.post('/api/ai/generate-questions', authMiddleware, adminMiddleware, async (req, res) => {
  const { topic, examId, count = 3 } = req.body;

  if (!topic || !examId) {
    return res.status(400).json({ error: 'Topic and examId are required' });
  }

  const exam = db.getExamById(examId);
  if (!exam) return res.status(404).json({ error: 'Target exam not found' });

  try {
    const ai = getGeminiClient();
    const prompt = `
      You are an expert curriculum examiner. Create exactly ${count} multiple-choice questions on the topic: "${topic}".
      Each question must have exactly 4 diverse options and a designated correct answer index (0, 1, 2, or 3).
      Assign 10 marks to each question. Keep questions clear, professional, challenging and objective.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: 'Question stem text.' },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exactly 4 option strings.',
              },
              correctAnswerIndex: { type: Type.INTEGER, description: 'Zero-based index (0, 1, 2, or 3) of the correct answer option.' },
              marks: { type: Type.INTEGER, description: 'Default marks for this question, set to 10.' },
            },
            required: ['text', 'options', 'correctAnswerIndex', 'marks'],
          },
        },
      },
    });

    const resultText = response.text;
    if (resultText) {
      const questionsData = JSON.parse(resultText);
      const createdQuestions = [];

      for (const q of questionsData) {
        const created = db.createQuestion({
          examId,
          text: q.text,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex,
          marks: q.marks || 10,
        });
        createdQuestions.push(created);
      }

      return res.status(201).json({
        message: `Successfully generated and added ${createdQuestions.length} questions.`,
        questions: createdQuestions,
      });
    }
    
    throw new Error('No text returned from Gemini API');
  } catch (error: any) {
    console.error('Gemini Question Generation Error:', error);
    res.status(500).json({ error: `AI Generation failed: ${error.message || 'Make sure your Gemini API Key is configured'}` });
  }
});

// 8. Analytics & Rankings Endpoint
app.get('/api/analytics', authMiddleware, (req, res) => {
  const students = db.getUsers().filter(u => u.role === 'student');
  const exams = db.getExams();
  const submissions = db.getSubmissions();

  const totalStudents = students.length;
  const totalExams = exams.length;
  const totalSubmissions = submissions.length;

  // Calculators
  const averageScore = totalSubmissions > 0
    ? Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / totalSubmissions * 10) / 10
    : 0;

  const averageAccuracy = totalSubmissions > 0
    ? Math.round(submissions.reduce((sum, s) => sum + s.accuracy, 0) / totalSubmissions)
    : 0;

  // Exam stats
  const examStats = exams.map(e => {
    const examSubmissions = submissions.filter(s => s.examId === e.id);
    const avgScore = examSubmissions.length > 0
      ? Math.round(examSubmissions.reduce((sum, s) => sum + s.score, 0) / examSubmissions.length * 10) / 10
      : 0;
    const highestScore = examSubmissions.length > 0
      ? Math.max(...examSubmissions.map(s => s.score))
      : 0;

    return {
      examId: e.id,
      examTitle: e.title,
      attempts: examSubmissions.length,
      avgScore,
      highestScore,
    };
  });

  // Student stats with rankings
  const studentStatsMap: Record<string, { studentId: string; studentName: string; scores: number[]; accuracies: number[] }> = {};

  // Ensure all students are represented
  students.forEach(s => {
    studentStatsMap[s.id] = {
      studentId: s.id,
      studentName: s.name,
      scores: [],
      accuracies: [],
    };
  });

  submissions.forEach(sub => {
    if (!studentStatsMap[sub.studentId]) {
      studentStatsMap[sub.studentId] = {
        studentId: sub.studentId,
        studentName: sub.studentName,
        scores: [],
        accuracies: [],
      };
    }
    studentStatsMap[sub.studentId].scores.push(sub.score);
    studentStatsMap[sub.studentId].accuracies.push(sub.accuracy);
  });

  const studentStatsList = Object.values(studentStatsMap).map(stats => {
    const examsAttempted = stats.scores.length;
    const avgScore = examsAttempted > 0
      ? Math.round(stats.scores.reduce((sum, score) => sum + score, 0) / examsAttempted * 10) / 10
      : 0;
    const avgAccuracy = examsAttempted > 0
      ? Math.round(stats.accuracies.reduce((sum, acc) => sum + acc, 0) / examsAttempted)
      : 0;

    return {
      studentId: stats.studentId,
      studentName: stats.studentName,
      examsAttempted,
      avgScore,
      avgAccuracy,
    };
  });

  // Calculate ranks: Sort by average score (descending) then average accuracy (descending)
  studentStatsList.sort((a, b) => {
    if (b.avgScore !== a.avgScore) {
      return b.avgScore - a.avgScore;
    }
    return b.avgAccuracy - a.avgAccuracy;
  });

  const rankedStudentStats = studentStatsList.map((stat, index) => ({
    ...stat,
    rank: stat.examsAttempted > 0 ? index + 1 : undefined, // only rank if attempted at least one
  }));

  res.json({
    totalStudents,
    totalExams,
    totalSubmissions,
    averageScore,
    averageAccuracy,
    examStats,
    studentStats: rankedStudentStats,
  });
});


// --- INTEGRATE VITE OR SERVE STATIC FILES ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Online Examination Portal running at http://localhost:${PORT}`);
  });
}

startServer();
