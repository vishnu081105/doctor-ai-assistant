# Doctor AI Assistant

A comprehensive web application designed to assist medical professionals with audio transcription, report generation, and patient documentation. This AI-powered tool streamlines the medical documentation process by converting voice recordings into structured medical reports.

## 🌟 Features

### Core Functionality
- **Audio Recording & Transcription**: Record medical consultations and automatically transcribe them to text
- **AI-Powered Report Generation**: Generate professional medical reports in multiple formats:
  - General Clinical Notes
  - SOAP Notes (Subjective, Objective, Assessment, Plan)
  - Diagnostic Pathology Reports
- **Real-time Processing**: Streamlined report generation with live updates
- **Multi-format Export**: Export reports as PDF documents

### User Management
- **Secure Authentication**: User registration and login system
- **Profile Management**: Update personal information and preferences
- **Role-based Access**: Different access levels for medical professionals

### Dashboard & History
- **Interactive Dashboard**: Overview of all transcriptions and reports
- **History Tracking**: Complete audit trail of all medical documentation
- **Report Management**: Edit, delete, and organize generated reports
- **Search & Filter**: Quickly find specific transcriptions or reports

### Advanced Features
- **Template System**: Customizable report templates for different medical specialties
- **Theme Support**: Light and dark mode for comfortable viewing
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Offline Capability**: Basic functionality available without internet connection

## 🚀 Technology Stack

### Frontend
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe JavaScript for better development experience
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Beautiful and accessible UI components built on Radix UI
- **React Router**: Client-side routing for single-page application
- **React Hook Form**: Performant forms with easy validation
- **Zod**: TypeScript-first schema validation

### Backend & Database
- **Supabase**: Open-source Firebase alternative
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication system
  - Edge Functions (serverless)
- **Edge Functions**: Serverless functions written in TypeScript/Deno

### AI & ML
- **Google Gemini AI**: Advanced language model for medical report generation
- **Speech Recognition API**: Browser-based audio transcription
- **Natural Language Processing**: Medical terminology understanding

### Development Tools
- **ESLint**: Code linting and formatting
- **Vitest**: Unit testing framework
- **React Testing Library**: Component testing utilities
- **TypeScript**: Static type checking
- **PostCSS**: CSS processing and optimization

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **Supabase CLI** (optional, for local development)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd doctor-ai-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Run the database migrations:
   ```bash
   supabase db reset
   ```
3. Deploy the edge functions:
   ```bash
   supabase functions deploy
   ```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📖 Usage Guide

### Getting Started
1. **Sign Up**: Create an account with your medical credentials
2. **Complete Profile**: Add your professional information
3. **Start Recording**: Use the audio recording feature for patient consultations

### Recording Audio
- Click the microphone button to start recording
- Speak clearly and use medical terminology
- Click stop when finished
- The system will automatically transcribe your audio

### Generating Reports
1. Select the type of report (General, SOAP, or Diagnostic)
2. Review the transcription for accuracy
3. Click "Generate Report" to create the AI-powered document
4. Edit the report as needed
5. Export as PDF or save to your history

### Managing Reports
- Access all reports from the Dashboard
- Use search and filters to find specific documents
- Edit existing reports
- Delete outdated records

## 🏗️ Project Structure

```
doctor-ai-assistant/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # shadcn/ui components
│   │   └── ...            # Custom components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── integrations/      # External service integrations
│   └── utils/             # Helper functions
├── supabase/
│   ├── functions/         # Edge Functions
│   └── migrations/        # Database migrations
├── test/                  # Test files
└── docs/                  # Documentation
```

## 🔧 API Documentation

### Edge Functions

#### `generate-report`
Generates AI-powered medical reports from transcriptions.

**Endpoint**: `POST /functions/v1/generate-report`

**Request Body**:
```json
{
  "transcription": "Patient presented with...",
  "reportType": "general" | "soap" | "diagnostic"
}
```

**Response**: Streaming text response with the generated report

#### `enhance-transcription`
Improves transcription quality using AI.

**Endpoint**: `POST /functions/v1/enhance-transcription`

#### `process-transcription`
Processes and formats raw transcriptions.

**Endpoint**: `POST /functions/v1/process-transcription`

### Database Schema

The application uses the following main tables:
- `profiles`: User profile information
- `transcriptions`: Audio transcription records
- `reports`: Generated medical reports
- `templates`: Custom report templates

## 🧪 Testing

Run the test suite:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Deploy to Supabase

1. Push your changes to the main branch
2. The application will auto-deploy via Supabase's CI/CD

### Environment Variables for Production

Ensure these environment variables are set in your Supabase project:

```
LOVABLE_API_KEY=your_ai_service_api_key
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Ensure code passes linting: `npm run lint`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Contact

For support, please:
- Check the [Issues](https://github.com/your-repo/issues) page
- Create a new issue with detailed information
- Contact the development team at support@doctoraiassistant.com

## 🔒 Security

This application handles sensitive medical data. Please ensure:
- All data is encrypted in transit and at rest
- User authentication is required for all operations
- Regular security audits are performed
- Compliance with HIPAA and relevant medical data regulations

## 📊 Performance

The application is optimized for:
- Fast loading times (< 3 seconds)
- Efficient audio processing
- Real-time report generation
- Mobile responsiveness

## 🗺️ Roadmap

### Upcoming Features
- [ ] Voice commands for hands-free operation
- [ ] Integration with EHR systems
- [ ] Multi-language support
- [ ] Advanced AI diagnostics assistance
- [ ] Team collaboration features

### Known Issues
- Audio recording may have latency on slower devices
- Large transcriptions may take longer to process

---

**Built with ❤️ for healthcare professionals**
