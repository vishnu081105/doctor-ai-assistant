import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { AudioWaveform } from '@/components/AudioWaveform';
import { ReportTypeSelector } from '@/components/ReportTypeSelector';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, Square, Sparkles, Loader2, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { ReportType, saveReport, generateId } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [reportType, setReportType] = useState<ReportType>('general');
  const [generatedReport, setGeneratedReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
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
    startListening();
  };

  const handleStopRecording = () => {
    stopListening();
  };

  const handleReset = () => {
    resetTranscript();
    setGeneratedReport('');
    setRecordingDuration(0);
  };

  const wordCount = (transcript + ' ' + interimTranscript).trim().split(/\s+/).filter(Boolean).length;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateReport = async () => {
    if (!transcript.trim()) {
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
            transcription: transcript,
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
              reportText += content;
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
        transcription: transcript,
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
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Speech Recognition Not Supported</h2>
              <p className="text-center text-muted-foreground">
                Your browser doesn't support speech recognition. Please try using Chrome, Edge, or Safari.
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recording</CardTitle>
                  <CardDescription>
                    {isListening ? 'Listening...' : 'Click to start recording'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-mono font-bold tabular-nums">
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
                    className="h-16 w-16 rounded-full bg-recording hover:bg-recording/90"
                  >
                    <Mic className="h-6 w-6" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={handleStopRecording}
                    className={cn(
                      'h-16 w-16 rounded-full bg-recording hover:bg-recording/90',
                      'animate-pulse-recording'
                    )}
                  >
                    <Square className="h-6 w-6" />
                  </Button>
                )}
                
                {(transcript || interimTranscript) && !isListening && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleReset}
                    className="h-16 w-16 rounded-full"
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

          {/* Transcription Display */}
          {(transcript || interimTranscript) && (
            <Card>
              <CardHeader>
                <CardTitle>Live Transcription</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40 rounded-md border p-4">
                  <p className="whitespace-pre-wrap">
                    {transcript}
                    {interimTranscript && (
                      <span className="text-muted-foreground">{interimTranscript}</span>
                    )}
                  </p>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Report Type Selection */}
          {transcript && !isListening && (
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
                  className="w-full gap-2"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Generated Report */}
          {generatedReport && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Report</CardTitle>
                  <Button onClick={handleSaveReport} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80 rounded-md border p-4">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
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
