import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WhisperTranscriptionResult {
  text: string;
  duration: number;
  language: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

interface UseWhisperTranscriptionReturn {
  transcribe: (audioBlob: Blob) => Promise<WhisperTranscriptionResult | null>;
  isTranscribing: boolean;
  error: string | null;
  progress: string;
}

export function useWhisperTranscription(): UseWhisperTranscriptionReturn {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const transcribe = useCallback(async (audioBlob: Blob): Promise<WhisperTranscriptionResult | null> => {
    if (!audioBlob || audioBlob.size === 0) {
      setError('No audio data to transcribe');
      return null;
    }

    setIsTranscribing(true);
    setError(null);
    setProgress('Preparing audio...');

    try {
      // Get the file extension based on MIME type
      const mimeType = audioBlob.type;
      let extension = 'webm';
      if (mimeType.includes('mp4')) extension = 'mp4';
      else if (mimeType.includes('mp3')) extension = 'mp3';
      else if (mimeType.includes('wav')) extension = 'wav';
      else if (mimeType.includes('ogg')) extension = 'ogg';

      // Create FormData with the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, `recording.${extension}`);
      formData.append('language', 'en');

      setProgress('Sending to Whisper AI...');

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whisper-transcribe`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait and try again.');
        }
        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your OpenAI API key.');
        }
        if (response.status === 402) {
          throw new Error('Usage limit reached. Please add credits to continue.');
        }
        
        throw new Error(errorData.error || `Transcription failed (${response.status})`);
      }

      setProgress('Processing transcription...');
      const data = await response.json();

      if (!data.text) {
        throw new Error('No transcription received from Whisper');
      }

      setProgress('Complete!');
      
      return {
        text: data.text,
        duration: data.duration || 0,
        language: data.language || 'en',
        segments: data.segments || [],
      };

    } catch (err) {
      console.error('Whisper transcription error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to transcribe audio';
      setError(errorMessage);
      return null;
    } finally {
      setIsTranscribing(false);
      setTimeout(() => setProgress(''), 2000);
    }
  }, []);

  return {
    transcribe,
    isTranscribing,
    error,
    progress,
  };
}
