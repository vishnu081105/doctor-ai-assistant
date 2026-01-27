
# MediVoice Pro - Medical Transcription App

## Overview
A complete medical voice transcription application for doctors with authentication, AI-powered report generation using Lovable AI, and local IndexedDB storage.

---

## Features

### 1. Login & Authentication
- Clean email/password login page
- Session management to protect the app
- Doctor must be logged in to access voice recording and all features
- Logout functionality in header/sidebar

### 2. Dashboard (Main Workspace)
- Modern minimal design with clean white/blue accents
- Top header with user info and logout
- Quick access to start new recording or view history

### 3. Voice Recording (Protected)
- Large, prominent "Start Recording" button
- Real-time audio waveform visualization
- Live transcription display as doctor speaks
- Recording timer and word count
- Stop recording button
- Only accessible when logged in

### 4. AI Report Generation (Lovable AI)
- Three report format options:
  - **General Clinical Note** - Standard medical transcription
  - **SOAP Notes** - Subjective, Objective, Assessment, Plan
  - **Diagnostic Report** - Focused findings format
- Format selector before processing
- "Generate Report" button after transcription
- Streaming AI response display
- Uses Lovable AI gateway (no API key needed from doctor)

### 5. Report Management & IndexedDB Storage
- All reports saved locally in IndexedDB
- Report cards showing:
  - Date/time
  - Report type (General/SOAP/Diagnostic)
  - Preview of content
- View full report details
- Edit saved reports
- Download as PDF or text file
- Delete functionality

### 6. History Page
- List of all saved transcriptions and reports
- Search/filter by date or content
- Sort by newest/oldest
- Quick actions (view, edit, download, delete)

### 7. Settings Page
- Report configuration preferences
- Speech recognition language options
- Display settings (font size, timestamps)
- Clear all data option

---

## User Flow

```
Login Page → Dashboard → Start Recording → 
Stop Recording → Select Report Format → 
Generate AI Report → Save to IndexedDB → 
View in History / Download
```

---

## Technical Approach

### Frontend
- React with TypeScript
- Modern minimal UI with shadcn/ui components
- IndexedDB for local storage (using idb library)
- Web Speech API for voice recognition
- Streaming AI responses for smooth UX

### Backend (Lovable Cloud)
- Edge function for AI report generation
- Uses Lovable AI gateway with Gemini model
- Secure API key handling (no doctor input needed)

---

## Pages Structure

1. **`/login`** - Email/password authentication
2. **`/`** - Dashboard with recording controls
3. **`/history`** - Saved transcriptions list
4. **`/settings`** - App configuration
5. **`/report/:id`** - View/edit individual report
