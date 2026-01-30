import { cn } from '@/lib/utils';

interface AudioWaveformProps {
  isRecording: boolean;
}

export function AudioWaveform({ isRecording }: AudioWaveformProps) {
  if (!isRecording) {
    return (
      <div className="flex items-center justify-center h-12 rounded-lg bg-secondary/50">
        <p className="text-sm text-muted-foreground">Click the microphone to start recording</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1.5 h-12 rounded-lg bg-recording/10 border border-recording/20">
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-recording rounded-full transition-all"
          )}
          style={{
            height: `${12 + Math.sin(Date.now() / 200 + i) * 8}px`,
            animation: `pulse 0.6s ease-in-out infinite`,
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
      <span className="ml-3 text-sm font-medium text-recording">Recording...</span>
    </div>
  );
}