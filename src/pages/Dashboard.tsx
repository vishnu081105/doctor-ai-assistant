import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { AudioWaveform } from '@/components/AudioWaveform';
import { ReportTypeSelector } from '@/components/ReportTypeSelector';
import { TranscriptionEditor } from '@/components/TranscriptionEditor';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useWhisperTranscription } from '@/hooks/useWhisperTranscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Sparkles, Loader2, Save, RotateCcw, AlertCircle, Edit, Wand2, Users, Play, Pause, Volume2, Zap } from 'lucide-react';
import { ReportType, saveReport, getSetting, updateReport } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const [reportType, setReportType] = useState<ReportType>('general');
  const [generatedReport, setGeneratedReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isEditingTranscription, setIsEditingTranscription] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState('');
  const [patientId, setPatientId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enableDiarization, setEnableDiarization] = useState(true);
  const [detectedSpeakers, setDetectedSpeakers] = useState<string[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [whisperTranscript, setWhisperTranscript] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const {
    isListening,
    transcript: liveTranscript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error: speechError,
  } = useSpeechRecognition();

  const {
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    resetRecording,
    uploadRecording,
    error: recordingError,
  } = useAudioRecording();

  const {
    transcribe: whisperTranscribe,
    isTranscribing: isWhisperTranscribing,
    error: whisperError,
    progress: whisperProgress,
  } = useWhisperTranscription();

  // Use Whisper transcript if available, otherwise fall back to live transcript
  const transcript = whisperTranscript || liveTranscript;

  // Load doctor name from settings
  useEffect(() => {
    const loadDoctorName = async () => {
      const name = await getSetting<string>('doctorName');
      if (name) setDoctorName(name);
    };
    loadDoctorName();
  }, []);

  // Sync edited transcript with live transcript
  useEffect(() => {
    if (!isEditingTranscription && !editedTranscript) {
      setEditedTranscript(transcript);
    }
  }, [transcript, isEditingTranscription, editedTranscript]);

  // Recording timer
  useEffect(() => {
    if (isListening) {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isListening]);

  const handleStartRecording = async () => {
    setRecordingDuration(0);
    setGeneratedReport('');
    setIsEditingTranscription(false);
    setEditedTranscript('');
    setDetectedSpeakers([]);
    setWhisperTranscript('');
    
    // Start both speech recognition (for live preview) and audio recording (for Whisper)
    await startRecording();
    startListening();
  };

  const handleStopRecording = async () => {
    stopListening();
    const recordedBlob = await stopRecording();
    
    // Automatically transcribe with Whisper after recording stops
    if (recordedBlob && recordedBlob.size > 0) {
      toast({
        title: 'Processing with Whisper AI',
        description: 'Transcribing your recording with OpenAI Whisper...',
      });
      
      const result = await whisperTranscribe(recordedBlob);
      if (result && result.text) {
        setWhisperTranscript(result.text);
        setEditedTranscript(result.text);
        toast({
          title: 'Whisper Transcription Complete',
          description: `Transcribed ${Math.round(result.duration)}s of audio with high accuracy.`,
        });
      } else if (whisperError) {
        toast({
          variant: 'destructive',
          title: 'Whisper Transcription Failed',
          description: whisperError || 'Falling back to live transcription.',
        });
      }
    }
  };

  const handleReset = () => {
    resetTranscript();
    resetRecording();
    setGeneratedReport('');
    setRecordingDuration(0);
    setIsEditingTranscription(false);
    setEditedTranscript('');
    setPatientId('');
    setDetectedSpeakers([]);
    setWhisperTranscript('');
  };

  const handleSaveTranscriptionEdit = (text: string) => {
    setEditedTranscript(text);
    setIsEditingTranscription(false);
    toast({ 
      title: 'Transcription saved',
      description: 'Your edits have been saved successfully.'
    });
  };

  const handleEnhanceTranscription = async () => {
    const textToEnhance = editedTranscript || transcript;
    if (!textToEnhance.trim()) {
      toast({
        variant: 'destructive',
        title: 'No transcription',
        description: 'Please record some audio first.',
      });
      return;
    }

    setIsEnhancing(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-transcription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            transcription: textToEnhance,
            enableDiarization,
            enhanceTerminology: true,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (response.status === 402) {
          throw new Error('AI usage limit reached. Please add credits to continue.');
        }
        throw new Error(`Enhancement failed (${response.status})`);
      }

      const data = await response.json();
      
      if (data.processed) {
        setEditedTranscript(data.processed);
        if (data.speakers && data.speakers.length > 0) {
          setDetectedSpeakers(data.speakers);
        }
        toast({
          title: enableDiarization ? 'Transcription Enhanced with Speaker Labels' : 'Transcription Enhanced',
          description: enableDiarization 
            ? `Detected speakers: ${data.speakers?.join(', ') || 'None identified'}`
            : 'Medical terminology and grammar have been corrected.',
        });
      }
    } catch (err) {
      console.error('Enhancement error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to enhance transcription';
      toast({
        variant: 'destructive',
        title: 'Enhancement failed',
        description: errorMessage,
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handlePlayAudio = () => {
    if (!audioUrl) return;
    
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlayingAudio(false);
    }
    
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const currentTranscript = editedTranscript || transcript;
  const wordCount = (currentTranscript + ' ' + interimTranscript).trim().split(/\s+/).filter(Boolean).length;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fallback report generation when Edge Function is not available
  const generateFallbackReport = async (transcription: string, reportType: string) => {
    console.log('Generating fallback report for type:', reportType);
    
    const generateContent = () => {
      const patientIdMatch = transcription.match(/Patient ID:\s*([^\n]+)/);
      const doctorMatch = transcription.match(/Attending Physician:\s*([^\n]+)/);
      
      const patientIdVal = patientIdMatch ? patientIdMatch[1] : 'Not specified';
      const doctorNameVal = doctorMatch ? doctorMatch[1] : 'Not specified';
      
      let report = '';
      
      switch (reportType) {
        case 'general':
          report = `MEDIVOICE HOSPITAL

COMPREHENSIVE DIAGNOSTIC REPORT

PATIENT INFORMATION
- Patient ID: ${patientIdVal}

ATTENDING PHYSICIAN
${doctorNameVal}

BACKGROUND & MANIFESTATIONS
${transcription.replace(/Patient ID:[^\n]+\n\n/, '').replace(/Attending Physician:[^\n]+\n\n/, '')}

TESTS ADMINISTERED AND RESULTS OBTAINED
- Information not provided in transcription

OBSERVATIONS
- Clinical observations not detailed in transcription

SUMMARY / DIAGNOSIS
- Diagnosis information not available in transcription

RECOMMENDATION
- Treatment recommendations not specified in transcription

Note: This is a basic template generated from your transcription. For comprehensive AI-powered reports, please deploy the Supabase Edge Function.`;
          break;
          
        case 'soap':
          report = `MEDIVOICE HOSPITAL

COMPREHENSIVE DIAGNOSTIC REPORT

PATIENT INFORMATION
- Patient ID: ${patientIdVal}

ATTENDING PHYSICIAN
${doctorNameVal}

S (Subjective)
${transcription.replace(/Patient ID:[^\n]+\n\n/, '').replace(/Attending Physician:[^\n]+\n\n/, '')}

O (Objective)
- Vital signs: Not specified
- Physical examination: Not detailed in transcription

A (Assessment)
- Primary diagnosis: Not specified in transcription

P (Plan)
- Treatment plan: Not specified in transcription

RECOMMENDATION
- Follow-up recommendations not available

Note: This is a basic SOAP template generated from your transcription. For comprehensive AI-powered reports, please deploy the Supabase Edge Function.`;
          break;
          
        case 'diagnostic':
          report = `MEDIVOICE HOSPITAL

COMPREHENSIVE DIAGNOSTIC REPORT

PATIENT INFORMATION
- Patient ID: ${patientIdVal}
- Age, Gender: Not specified
- Date of specimen collection: Not specified

ATTENDING PHYSICIAN
${doctorNameVal}

SPECIMEN INFORMATION
- Specimen type: Not specified in transcription
- Collection details: Not available

GROSS DESCRIPTION
- Gross findings: Not described in transcription

MICROSCOPIC DESCRIPTION
- Microscopic findings: Not detailed in transcription

DIAGNOSIS
- Pathologic diagnosis: Not specified in transcription

COMMENT
- Additional comments: Not provided

Note: This is a basic diagnostic template generated from your transcription. For comprehensive AI-powered reports, please deploy the Supabase Edge Function.`;
          break;
          
        default:
          report = `MEDIVOICE HOSPITAL

BASIC TRANSCRIPTION SUMMARY

Patient ID: ${patientIdVal}
Attending Physician: ${doctorNameVal}

TRANSCRIPTION:
${transcription.replace(/Patient ID:[^\n]+\n\n/, '').replace(/Attending Physician:[^\n]+\n\n/, '')}

Note: This is a basic summary. For comprehensive AI-powered reports, please deploy the Supabase Edge Function.`;
      }
      
      return report;
    };

    const fullReport = generateContent();
    const words = fullReport.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += words[i] + ' ';
      setGeneratedReport(currentText);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    toast({
      title: 'Report Generated',
      description: 'Basic report created. Deploy Edge Function for AI-powered reports.',
    });
  };

  const generateReport = async () => {
    const textToProcess = editedTranscript || transcript;
    if (!textToProcess.trim()) {
      toast({
        variant: 'destructive',
        title: 'No transcription',
        description: 'Please record some audio first.',
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedReport('');

    let enhancedTranscription = textToProcess;
    if (patientId) {
      enhancedTranscription = `Patient ID: ${patientId}\n\n${enhancedTranscription}`;
    }
    if (doctorName) {
      enhancedTranscription = `Attending Physician: ${doctorName}\n\n${enhancedTranscription}`;
    }

    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        throw new Error('Supabase is not configured. Please check your environment variables.');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            transcription: enhancedTranscription,
            reportType,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 404 || response.status >= 500) {
          console.log('Edge Function not available, using fallback generation');
          await generateFallbackReport(enhancedTranscription, reportType);
          return;
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (response.status === 402) {
          throw new Error('AI usage limit reached. Please add credits to continue.');
        }
        throw new Error(`Failed to generate report (${response.status})`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let reportText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        const lines = textBuffer.split('\n');
        // Keep the last incomplete line in the buffer
        textBuffer = lines.pop() || '';

        for (const rawLine of lines) {
          const line = rawLine.replace(/\r$/, '');
          // Skip SSE comments (like ": OPENROUTER PROCESSING") and empty lines
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              const cleanContent = content.replace(/\*+/g, '').replace(/#+/g, '');
              reportText += cleanContent;
              setGeneratedReport(reportText);
            }
          } catch (e) {
            // Skip malformed JSON lines instead of re-buffering
            console.warn('Skipping malformed SSE chunk:', jsonStr?.slice(0, 100));
          }
        }
      }

      // Process any remaining buffer
      if (textBuffer.trim() && textBuffer.startsWith('data: ') && textBuffer.slice(6).trim() !== '[DONE]') {
        try {
          const parsed = JSON.parse(textBuffer.slice(6).trim());
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            reportText += content.replace(/\*+/g, '').replace(/#+/g, '');
            setGeneratedReport(reportText);
          }
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error('Report generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      
      if (errorMessage.includes('fetch') || errorMessage.includes('Supabase') || errorMessage.includes('Failed to generate report')) {
        console.log('Network error, using fallback generation');
        await generateFallbackReport(enhancedTranscription, reportType);
        return;
      }
      
      toast({
        variant: 'destructive',
        title: 'Generation failed',
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveReport = async () => {
    if (!generatedReport.trim()) {
      toast({
        variant: 'destructive',
        title: 'No report to save',
        description: 'Please generate a report first.',
      });
      return;
    }

    try {
      const report = {
        transcription: editedTranscript || transcript,
        reportContent: generatedReport,
        reportType,
        duration: recordingDuration,
        wordCount,
        patientId: patientId || undefined,
        doctorName: doctorName || undefined,
        audioUrl: undefined as string | undefined,
      };

      // Save report first to get the ID
      const reportId = await saveReport(report);
      
      // Upload audio recording if available
      if (audioBlob && reportId) {
        toast({
          title: 'Uploading recording...',
          description: 'Saving audio file to storage.',
        });
        
        const uploadedUrl = await uploadRecording(reportId);
        if (uploadedUrl) {
          // Update report with audio URL
          await updateReport(reportId, { audioUrl: uploadedUrl });
          toast({
            title: 'Recording saved!',
            description: 'Audio recording has been uploaded.',
          });
        }
      }
      
      toast({
        title: 'Report saved!',
        description: 'Your report has been saved to history.',
      });

      handleReset();
    } catch (err) {
      console.error('Save error:', err);
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: 'Failed to save report.',
      });
    }
  };

  const error = speechError || recordingError;

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-4xl py-8">
          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold">Speech Recognition Not Supported</h2>
              <p className="text-center text-muted-foreground max-w-md">
                Your browser doesn't support speech recognition. Please try using Chrome, Edge, or Safari for the best experience.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-4xl py-8">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">Voice Recording</h1>
            <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
              <Zap className="h-3 w-3" />
              Whisper AI
            </Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            Record your medical notes and generate AI-powered reports with OpenAI Whisper
          </p>
        </div>

        <div className="space-y-6">
          {/* Recording Section */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Recording
                    {isWhisperTranscribing && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {whisperProgress}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {isListening 
                      ? 'Listening to your voice...' 
                      : isWhisperTranscribing 
                        ? 'Processing with Whisper AI...'
                        : 'Click the microphone to start recording'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={cn(
                      "text-2xl font-mono font-bold tabular-nums",
                      isListening && "text-recording"
                    )}>
                      {formatDuration(recordingDuration)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {wordCount} words
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <AudioWaveform isRecording={isListening} />

              <div className="flex justify-center gap-4">
                {!isListening ? (
                  <Button
                    size="lg"
                    onClick={handleStartRecording}
                    className="h-16 w-16 rounded-full bg-gradient-to-br from-recording to-recording/80 hover:from-recording/90 hover:to-recording/70 shadow-lg shadow-recording/25 transition-all hover:scale-105"
                  >
                    <Mic className="h-7 w-7" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={handleStopRecording}
                    className={cn(
                      'h-16 w-16 rounded-full bg-gradient-to-br from-recording to-recording/80',
                      'shadow-lg shadow-recording/25',
                      'animate-pulse-recording'
                    )}
                  >
                    <Square className="h-6 w-6" />
                  </Button>
                )}
                
                {(transcript || interimTranscript || editedTranscript) && !isListening && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleReset}
                    className="h-16 w-16 rounded-full transition-all hover:scale-105"
                  >
                    <RotateCcw className="h-6 w-6" />
                  </Button>
                )}
              </div>

              {/* Audio Playback */}
              {audioUrl && !isListening && (
                <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Recording available</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePlayAudio}
                    className="gap-2"
                  >
                    {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isPlayingAudio ? 'Pause' : 'Play'}
                  </Button>
                </div>
              )}

              {error && (
                <p className="text-center text-sm text-destructive">{error}</p>
              )}
            </CardContent>
          </Card>

          {/* Transcription Display / Editor */}
          {(transcript || interimTranscript || editedTranscript) && !isListening && (
            isEditingTranscription ? (
              <TranscriptionEditor
                transcription={editedTranscript || transcript}
                onSave={handleSaveTranscriptionEdit}
                onCancel={() => setIsEditingTranscription(false)}
              />
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <CardTitle>Transcription</CardTitle>
                      {detectedSpeakers.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
                          <Users className="h-3 w-3 text-primary" />
                          <span className="text-xs text-primary font-medium">
                            {detectedSpeakers.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <div className="flex items-center gap-2 mr-2">
                        <Switch
                          id="diarization"
                          checked={enableDiarization}
                          onCheckedChange={setEnableDiarization}
                        />
                        <Label htmlFor="diarization" className="text-xs cursor-pointer">
                          Speaker Labels
                        </Label>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEnhanceTranscription}
                        disabled={isEnhancing}
                        className="gap-2"
                      >
                        {isEnhancing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4" />
                            {enableDiarization ? 'Enhance & Identify Speakers' : 'Enhance with AI'}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingTranscription(true)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-40 rounded-lg border bg-secondary/30 p-4">
                    <div className="whitespace-pre-wrap space-y-2">
                      {(editedTranscript || transcript).split('\n').map((line, index) => {
                        const isDoctor = line.startsWith('DOCTOR:');
                        const isPatient = line.startsWith('PATIENT:');
                        
                        if (isDoctor || isPatient) {
                          return (
                            <p key={index} className={cn(
                              "rounded px-2 py-1",
                              isDoctor && "bg-primary/10 border-l-2 border-primary",
                              isPatient && "bg-secondary border-l-2 border-muted-foreground"
                            )}>
                              <span className={cn(
                                "font-semibold",
                                isDoctor && "text-primary",
                                isPatient && "text-muted-foreground"
                              )}>
                                {isDoctor ? 'DOCTOR:' : 'PATIENT:'}
                              </span>
                              <span>{line.replace(/^(DOCTOR:|PATIENT:)/, '')}</span>
                            </p>
                          );
                        }
                        return line ? <p key={index}>{line}</p> : null;
                      })}
                      {interimTranscript && (
                        <span className="text-muted-foreground">{interimTranscript}</span>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )
          )}

          {/* Live transcription during recording */}
          {isListening && (transcript || interimTranscript) && (
            <Card className="border-recording/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-recording opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-recording"></span>
                  </span>
                  Live Transcription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40 rounded-lg border bg-secondary/30 p-4">
                  <p className="whitespace-pre-wrap">
                    {transcript}
                    {interimTranscript && (
                      <span className="text-muted-foreground italic">{interimTranscript}</span>
                    )}
                  </p>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Patient Info & Report Type Selection */}
          {(transcript || editedTranscript) && !isListening && !isEditingTranscription && (
            <Card>
              <CardHeader>
                <CardTitle>Report Information</CardTitle>
                <CardDescription>Enter patient details and select report format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Patient ID Input */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="patientId">Patient ID</Label>
                    <Input
                      id="patientId"
                      placeholder="Enter patient ID (e.g., MV-2024-001)"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Attending Physician</Label>
                    <Input
                      value={doctorName}
                      disabled
                      className="bg-secondary/50"
                      placeholder="Set in profile settings"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <ReportTypeSelector
                    selectedType={reportType}
                    onSelect={setReportType}
                  />
                </div>
                
                <Button
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="w-full gap-2 h-12 text-base btn-glow"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate AI Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Generated Report */}
          {generatedReport && (
            <Card className="border-primary/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Generated Report</CardTitle>
                  </div>
                  <Button onClick={handleSaveReport} className="gap-2 btn-glow">
                    <Save className="h-4 w-4" />
                    Save Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80 rounded-lg border bg-secondary/30 p-4">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap dark:prose-invert">
                    {generatedReport}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
