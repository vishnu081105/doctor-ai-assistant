# 🏥 Doctor AI Assistant - Medical Voice-to-Report Platform

A comprehensive AI-powered medical documentation platform that transforms voice recordings into structured clinical reports. Built for healthcare professionals at **PSG Hospital** to streamline patient documentation workflows.

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ECF8E?logo=supabase)

---

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Authentication](#-authentication)
- [Usage Guide](#-usage-guide)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎤 Voice Recording & Transcription
- **OpenAI Whisper Integration**: Industry-leading speech-to-text with the Whisper Large-v3 model
  - Best accuracy for natural dialogue
  - Handles accents, interruptions, and fast speech
  - Very low hallucination rate
  - Strong medical terminology recognition
- **Real-time Preview**: Browser-based Web Speech API provides live transcription preview while recording
- **Audio Recording**: Capture consultation audio with MediaRecorder API
- **Audio Playback**: Listen to recorded consultations anytime
- **Cloud Storage**: Secure audio file storage in Supabase Storage buckets

### 🤖 AI-Powered Enhancements
- **Medical Terminology Correction**: AI fixes speech recognition errors for medical terms
- **Speaker Diarization**: Automatically identifies and labels DOCTOR/PATIENT dialogue
- **Grammar Enhancement**: Corrects punctuation, capitalization, and formatting

### 📝 Report Generation
Three professional report formats powered by **Google Gemini AI**:

| Report Type | Description |
|-------------|-------------|
| **General Clinical Notes** | Comprehensive patient visit documentation |
| **SOAP Notes** | Subjective, Objective, Assessment, Plan format |
| **Surgical Pathology Reports** | SONOMAWORKS LEAP format with structured sections |

### 📊 Dashboard & History
- **Interactive Dashboard**: Record, transcribe, enhance, and generate reports
- **Report History**: Complete audit trail of all generated reports
- **Search & Filter**: Find reports by date, type, or patient ID
- **PDF Export**: Download reports as professional PDF documents

### 👤 User Management
- **Secure Authentication**: Email/password with Supabase Auth
- **Profile Management**: Store doctor name, specialty, and preferences
- **Password Recovery**: Forgot password flow with email verification

### 🎨 UI/UX
- **Dark/Light Mode**: Theme toggle for comfortable viewing
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Real-time Waveform**: Visual audio feedback during recording
- **Loading States**: Smooth transitions and skeleton loaders

---

## 🛠 Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with hooks and concurrent features |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Fast build tool and dev server |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Accessible UI components (Radix UI) |
| **React Router v6** | Client-side routing |
| **React Hook Form + Zod** | Form validation |
| **Recharts** | Data visualization |
| **Framer Motion** | Animations (via Tailwind) |
| **Sonner** | Toast notifications |

### Backend (Lovable Cloud)
| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend-as-a-Service |
| **PostgreSQL** | Relational database |
| **Row Level Security** | Data access policies |
| **Edge Functions** | Serverless TypeScript/Deno |
| **Supabase Storage** | File storage for audio |
| **Supabase Auth** | Authentication system |

### AI Services
| Service | Purpose |
|---------|---------|
| **OpenAI Whisper** | High-accuracy speech-to-text transcription |
| **Lovable AI Gateway** | Managed AI API access |
| **Google Gemini 3 Flash** | Report generation & text processing |
| **Web Speech API** | Browser-based live transcription preview |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Pages     │  │  Components │  │    Hooks    │              │
│  │ - Dashboard │  │ - Header    │  │ - useAuth   │              │
│  │ - History   │  │ - AudioWave │  │ - useSpeech │              │
│  │ - Profile   │  │ - ReportCard│  │ - useAudio  │              │
│  │ - Login     │  │ - Editor    │  │ - useWhisper│              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOVABLE CLOUD (Supabase)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │   PostgreSQL     │  │  Edge Functions  │                     │
│  │ ──────────────── │  │ ──────────────── │                     │
│  │ • reports        │  │ • generate-report│                     │
│  │ • templates      │  │ • enhance-trans  │                     │
│  │ • settings       │  │ • process-trans  │                     │
│  │                  │  │ • whisper-trans  │                     │
│  └──────────────────┘  └────────┬─────────┘                     │
│                                 │                                │
│  ┌──────────────────┐           │                                │
│  │  Storage Buckets │           ▼                                │
│  │ ──────────────── │  ┌──────────────────┐                     │
│  │ • recordings     │  │  Lovable AI API  │                     │
│  └──────────────────┘  │ (Gemini 3 Flash) │                     │
│                        └──────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **npm** or **bun** package manager
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/doctor-ai-assistant.git
   cd doctor-ai-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Environment setup**
   
   The project uses Lovable Cloud, which auto-configures environment variables:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   VITE_SUPABASE_PROJECT_ID=your-project-id
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 📁 Project Structure

```
doctor-ai-assistant/
├── public/                      # Static assets
│   ├── image.png               # App logo
│   └── robots.txt              # SEO configuration
│
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── AudioWaveform.tsx   # Recording visualization
│   │   ├── Header.tsx          # Navigation header
│   │   ├── ReportCard.tsx      # Report list item
│   │   ├── ReportTypeSelector.tsx
│   │   ├── TemplateManager.tsx
│   │   ├── TranscriptionEditor.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   ├── pages/                  # Route pages
│   │   ├── Dashboard.tsx       # Main recording/report page
│   │   ├── History.tsx         # Report history list
│   │   ├── ReportDetail.tsx    # Single report view
│   │   ├── Profile.tsx         # User profile settings
│   │   ├── Settings.tsx        # App settings
│   │   ├── Login.tsx           # Authentication
│   │   ├── ForgotPassword.tsx
│   │   ├── ResetPassword.tsx
│   │   └── NotFound.tsx
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.tsx         # Authentication context
│   │   ├── useSpeechRecognition.ts
│   │   ├── useAudioRecording.ts
│   │   ├── use-toast.ts
│   │   └── use-mobile.tsx
│   │
│   ├── lib/                    # Utility libraries
│   │   ├── db.ts               # Database operations
│   │   └── utils.ts            # Helper functions
│   │
│   ├── integrations/           # External integrations
│   │   └── supabase/
│   │       ├── client.ts       # Supabase client (auto-generated)
│   │       └── types.ts        # Database types (auto-generated)
│   │
│   ├── utils/
│   │   └── pdfExport.ts        # PDF generation utility
│   │
│   ├── App.tsx                 # Root component
│   ├── App.css                 # Global styles
│   ├── index.css               # Tailwind imports
│   └── main.tsx                # App entry point
│
├── supabase/
│   ├── functions/              # Edge Functions
│   │   ├── generate-report/    # AI report generation
│   │   │   └── index.ts
│   │   ├── enhance-transcription/
│   │   │   └── index.ts        # Medical terminology fix
│   │   └── process-transcription/
│   │       └── index.ts        # Speaker diarization
│   │
│   ├── migrations/             # Database migrations
│   └── config.toml             # Supabase configuration
│
├── .env                        # Environment variables
├── tailwind.config.ts          # Tailwind configuration
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

---

## 📡 API Documentation

### Edge Functions

#### 1. Generate Report
Creates AI-powered medical reports from transcriptions.

**Endpoint:** `POST /functions/v1/generate-report`

**Request:**
```json
{
  "transcription": "Patient presented with severe headache...",
  "reportType": "general" | "soap" | "diagnostic"
}
```

**Response:** Server-Sent Events (SSE) stream with report content

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <access_token>
```

---

#### 2. Enhance Transcription
Improves transcription quality with medical terminology corrections.

**Endpoint:** `POST /functions/v1/enhance-transcription`

**Request:**
```json
{
  "transcription": "The patient has my oh cardial infarction..."
}
```

**Response:**
```json
{
  "enhanced": "The patient has myocardial infarction...",
  "original": "The patient has my oh cardial infarction..."
}
```

---

#### 3. Process Transcription (Speaker Diarization)
Identifies and labels speakers in medical conversations.

**Endpoint:** `POST /functions/v1/process-transcription`

**Request:**
```json
{
  "transcription": "Good morning, what brings you in today? I've been having headaches.",
  "enableDiarization": true,
  "enhanceTerminology": true
}
```

**Response:**
```json
{
  "processed": "DOCTOR: Good morning, what brings you in today?\nPATIENT: I've been having headaches.",
  "speakers": ["Doctor", "Patient"],
  "hasDiarization": true,
  "hasEnhancement": true
}
```

---

#### 4. Whisper Transcribe
High-accuracy speech-to-text using OpenAI Whisper Large-v3 model.

**Endpoint:** `POST /functions/v1/whisper-transcribe`

**Request:** `multipart/form-data`
```
audio: <audio_file> (webm, mp3, wav, ogg, mp4)
language: "en" (optional, ISO 639-1)
```

**Response:**
```json
{
  "text": "The patient presented with severe headaches lasting for three days...",
  "duration": 45.6,
  "language": "en",
  "segments": [
    { "start": 0.0, "end": 3.5, "text": "The patient presented..." }
  ]
}
```

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Features:**
- Best accuracy for natural medical dialogue
- Handles accents, interruptions, and fast speech
- Very low hallucination rate
- Strong medical terminology recognition

---

## 🗄 Database Schema

### Tables

#### `reports`
Stores generated medical reports.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner reference |
| `transcription` | TEXT | Original/edited transcription |
| `report_content` | TEXT | Generated report |
| `report_type` | TEXT | 'general', 'soap', or 'diagnostic' |
| `duration` | INTEGER | Recording duration (seconds) |
| `word_count` | INTEGER | Transcription word count |
| `patient_id` | TEXT | Optional patient identifier |
| `doctor_name` | TEXT | Attending physician |
| `audio_url` | TEXT | Storage URL for recording |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

#### `templates`
Custom report templates.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner reference |
| `name` | TEXT | Template name |
| `content` | TEXT | Template content |
| `category` | TEXT | Template category |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `settings`
User preferences and configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner reference |
| `key` | TEXT | Setting key |
| `value` | JSONB | Setting value |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Row Level Security (RLS)

All tables have RLS enabled with user-scoped policies:

```sql
-- Users can only access their own data
CREATE POLICY "Users can view their own reports"
ON reports FOR SELECT
USING (auth.uid() = user_id);
```

---

## 🔐 Authentication

The application uses **Supabase Auth** with email/password authentication.

### Auth Flow

1. **Sign Up**: Create account with email verification
2. **Sign In**: Email/password login
3. **Password Reset**: Email-based recovery
4. **Session Management**: JWT tokens with auto-refresh

### Protected Routes

All authenticated routes are wrapped with `ProtectedRoute`:

```tsx
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/history" element={<History />} />
  // ...
</Route>
```

---

## 📖 Usage Guide

### Recording a Consultation

1. **Start Recording**: Click the microphone button
2. **Speak Clearly**: The system transcribes in real-time
3. **Stop Recording**: Click the stop button
4. **Review**: Check the transcription for accuracy

### Enhancing Transcription

1. **Enable Speaker Diarization**: Toggle for DOCTOR/PATIENT labels
2. **Click "Enhance with AI"**: Fixes medical terminology and grammar
3. **Edit if Needed**: Make manual corrections

### Generating Reports

1. **Select Report Type**: General, SOAP, or Diagnostic
2. **Add Patient Info**: Enter Patient ID and Doctor Name
3. **Click "Generate Report"**: AI creates the report
4. **Review & Save**: Edit if needed, then save

### Exporting Reports

1. **Open Report**: From history or after generation
2. **Click "Export PDF"**: Downloads formatted document
3. **Play Audio**: Listen to original recording

---

## 🚀 Deployment

### Lovable Cloud (Recommended)

The project is pre-configured for Lovable Cloud deployment:

1. **Click "Publish"** in the Lovable editor
2. **Frontend**: Automatically deployed to `*.lovable.app`
3. **Backend**: Edge Functions deploy automatically on save

### Custom Domain

1. Go to **Project Settings → Domains**
2. Add your custom domain
3. Configure DNS as instructed
4. SSL certificate is provisioned automatically

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `LOVABLE_API_KEY` | AI Gateway key (auto-configured) |

---

## 🔒 Security

### Data Protection
- **Encryption in Transit**: All data transmitted over HTTPS
- **Row Level Security**: Database-level access control
- **JWT Authentication**: Secure session management
- **CORS Configuration**: Restricted cross-origin requests

### Medical Data Compliance
- **HIPAA Considerations**: Designed with privacy in mind
- **Data Isolation**: Users can only access their own records
- **Audit Trail**: Complete history of all reports

### Best Practices
- Never share API keys or secrets
- Use strong passwords
- Enable email verification
- Regularly review access logs

---

## 🧪 Testing

### Run Tests
```bash
npm run test
```

### Test Files
- `src/test/example.test.ts` - Example test setup
- Uses **Vitest** with React Testing Library

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 📞 Support

- **Documentation**: This README
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Community**: [Lovable Discord](https://discord.gg/lovable)

---

## 🗺 Roadmap

- [ ] Voice commands for hands-free operation
- [ ] EHR/EMR integration
- [ ] Multi-language transcription support
- [ ] Team collaboration features
- [ ] Advanced AI diagnostics assistance
- [ ] Mobile app (React Native)

---

<div align="center">

**Built with ❤️ for Healthcare Professionals**

[PSG Hospital](https://psgimsr.ac.in) • [Lovable](https://lovable.dev)

</div>
