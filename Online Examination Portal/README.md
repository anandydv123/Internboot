# Online Examination Portal 🎓

A modern, highly interactive full-stack web application designed for educational institutions to conduct exams, manage academic submissions, and generate question sets using AI. Built on React 19, Tailwind CSS, Express, and Google Gemini AI.

---

## 🚀 Key Features

### 👤 Multi-Role Portals
- **Student Portal**:
  - Secure registration and login.
  - Interactive dashboard showing available exams, active status, and historic attempts.
  - Live Exam Session with real-time timers and **auto-submit** functionality upon expiration.
  - Comprehensive **Academic Records Management** to submit, update, and manage certificates, transcripts, or supporting documents.
- **Instructor (Admin) Portal**:
  - Full CRUD operations on exams and exam questions.
  - **AI-Powered Question Generator**: Automatic generation of relevant multiple-choice questions powered by Google Gemini, tailored to specific subjects and difficulty levels.
  - Interactive **Analytics Dashboard**: Performance metrics, average scores, pass rates, and registration counts visualized elegantly.

### 🔐 Smooth Registration & Auth Flow
- Registration options tailored for both **Students** and **Instructors**.
- Intuitive user feedback upon successful registration with automatic redirection to the login portal.
- Secure token-based session validation.

### 🧠 Gemini AI Integration
- Uses the modern `@google/genai` SDK on the server-side.
- Instantly creates balanced multiple-choice questions with customized distractors and correct answer flags.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Motion, Lucide React |
| **Backend** | Node.js, Express, `tsx` (TypeScript Execute) |
| **Database** | Lightweight, high-performance JSON Database (`db.json` with a robust model manager) |
| **AI Integration** | Google Gemini Developer SDK (`@google/genai`) |
| **Build System** | Vite 6, `esbuild` (bundler compiling CJS for production containers) |

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Create a `.env` file in the root directory (based on `.env.example` if available) and add your secret credentials:
```env
# Google Gemini API Key for question drafting
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run the Development Server
Starts the full-stack server using `tsx` on port `3000`:
```bash
npm run dev
```

### 4. Build for Production
Compiles the client-side files and bundles the Express server to a optimized CommonJS file inside `dist/`:
```bash
npm run build
```

### 5. Start in Production Mode
Launches the built app:
```bash
npm run start
```

---

## 📂 Project Structure

```text
├── assets/                  # App configurations and system files
├── src/
│   ├── components/          # Portal views and modular components
│   │   ├── AcademicRecordsView.tsx  # Document upload and feedback
│   │   ├── AdminExamView.tsx        # Exam authoring and AI gen
│   │   ├── AnalyticsDashboard.tsx   # Scoring metrics and charts
│   │   ├── AuthView.tsx             # Redirection-friendly login/signup
│   │   ├── DashboardView.tsx        # Primary student space
│   │   └── TakeExamView.tsx         # Active timed test layout
│   ├── db/
│   │   └── json-db.ts       # Database accessors and helper models
│   ├── App.tsx              # Main orchestrator (routing/role state)
│   ├── index.css            # Global styling with Tailwind
│   ├── main.tsx             # Application entry point
│   └── types.ts             # Global TypeScript type definitions
├── db.json                  # Persistent local database state
├── server.ts                # Express backend & Gemini API proxies
├── vite.config.ts           # Vite bundler options
└── package.json             # App scripts and dependency manifest
```

---

## 🔐 Security & Reliability
- **Server-Side API Keys**: The Gemini API key remains strictly server-side (`server.ts`) to ensure browser clients cannot access or intercept secret tokens.
- **Benign WebSocket Handling**: Configured with automated interception for Vite development servers to suppress network frame rejections gracefully.
