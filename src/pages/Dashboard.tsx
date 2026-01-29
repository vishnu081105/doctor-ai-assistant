import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { AudioWaveform } from '@/components/AudioWaveform';
import { ReportTypeSelector } from '@/components/ReportTypeSelector';
import { TranscriptionEditor } from '@/components/TranscriptionEditor';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, Square, Sparkles, Loader2, Save, RotateCcw, AlertCircle, Edit } from 'lucide-react';
import { ReportType, saveReport, generateId } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [reportType, setReportType] = useState<ReportType>('general');
  const [generatedReport, setGeneratedReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isEditingTranscription, setIsEditingTranscription] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
  } = useSpeechRecognition();

  // Sync edited transcript with live transcript
  useEffect(() => {
    if (!isEditingTranscription) {
      setEditedTranscript(transcript);
    }
  }, [transcript, isEditingTranscription]);

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

  const handleStartRecording = () => {
    setRecordingDuration(0);
    setGeneratedReport('');
    setIsEditingTranscription(false);
    startListening();
  };

  const handleStopRecording = () => {
    stopListening();
  };

  const handleReset = () => {
    resetTranscript();
    setGeneratedReport('');
    setRecordingDuration(0);
    setIsEditingTranscription(false);
    setEditedTranscript('');
  };

  const handleSaveTranscriptionEdit = (text: string) => {
    setEditedTranscript(text);
    setIsEditingTranscription(false);
    toast({ title: 'Transcription updated' });
  };

  const currentTranscript = isEditingTranscription ? editedTranscript : (editedTranscript || transcript);
  const wordCount = (currentTranscript + ' ' + interimTranscript).trim().split(/\s+/).filter(Boolean).length;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            transcription: textToProcess,
            reportType,
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
        throw new Error('Failed to generate report');
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

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              // Remove any asterisks from the content
              const cleanContent = content.replace(/\*+/g, '');
              reportText += cleanContent;
              setGeneratedReport(reportText);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error('Report generation error:', err);
      toast({
        variant: 'destructive',
        title: 'Generation failed',
        description: err instanceof Error ? err.message : 'Failed to generate report',
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
        id: generateId(),
        transcription: editedTranscript || transcript,
        reportContent: generatedReport,
        reportType,
        createdAt: new Date(),
        updatedAt: new Date(),
        duration: recordingDuration,
        wordCount,
      };

      await saveReport(report);
      
      toast({
        title: 'Report saved!',
        description: 'Your report has been saved to history.',
      });

      // Reset for new recording
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
          <h1 className="text-3xl font-bold">Voice Recording</h1>
          <p className="mt-2 text-muted-foreground">
            Record your medical notes and generate AI-powered reports
          </p>
        </div>

        <div className="space-y-6">
          {/* Recording Section */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recording</CardTitle>
                  <CardDescription>
                    {isListening ? 'Listening to your voice...' : 'Click the microphone to start recording'}
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
                  <div className="flex items-center justify-between">
                    <CardTitle>Transcription</CardTitle>
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
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-40 rounded-lg border bg-secondary/30 p-4">
                    <p className="whitespace-pre-wrap">
                      {editedTranscript || transcript}
                      {interimTranscript && (
                        <span className="text-muted-foreground">{interimTranscript}</span>
                      )}
                    </p>
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

          {/* Report Type Selection */}
          {(transcript || editedTranscript) && !isListening && !isEditingTranscription && (
            <Card>
              <CardHeader>
                <CardTitle>Report Format</CardTitle>
                <CardDescription>Select the type of report to generate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReportTypeSelector
                  selectedType={reportType}
                  onSelect={setReportType}
                />
                
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
