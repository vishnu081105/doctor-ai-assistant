import { useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface AudioWaveformProps {
  isRecording: boolean;
}

export function AudioWaveform({ isRecording }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isRecording) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // Draw idle state
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawIdleWaveform(ctx, canvas.width, canvas.height);
        }
      }
      return;
    }

    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);
        analyserRef.current = analyser;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
          if (!isRecording) return;
          
          animationRef.current = requestAnimationFrame(draw);
          analyser.getByteFrequencyData(dataArray);

          // Clear with gradient background
          const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          bgGradient.addColorStop(0, 'hsl(220, 20%, 13%)');
          bgGradient.addColorStop(0.5, 'hsl(220, 25%, 15%)');
          bgGradient.addColorStop(1, 'hsl(220, 20%, 13%)');
          ctx.fillStyle = bgGradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const centerY = canvas.height / 2;
          const barCount = 64;
          const barWidth = canvas.width / barCount * 0.6;
          const gap = canvas.width / barCount * 0.4;

          for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * bufferLength / barCount);
            const value = dataArray[dataIndex] / 255;
            const barHeight = Math.max(4, value * canvas.height * 0.4);
            
            const x = i * (barWidth + gap) + gap / 2;
            
            // Create gradient for bars
            const gradient = ctx.createLinearGradient(x, centerY - barHeight, x, centerY + barHeight);
            const intensity = value > 0.5 ? 1 : value * 2;
            gradient.addColorStop(0, `hsla(0, 85%, ${50 + intensity * 15}%, ${0.3 + intensity * 0.7})`);
            gradient.addColorStop(0.5, `hsla(0, 90%, ${55 + intensity * 20}%, 1)`);
            gradient.addColorStop(1, `hsla(0, 85%, ${50 + intensity * 15}%, ${0.3 + intensity * 0.7})`);
            
            ctx.fillStyle = gradient;
            
            // Draw rounded bars mirrored from center
            ctx.beginPath();
            ctx.roundRect(x, centerY - barHeight, barWidth, barHeight * 2, barWidth / 2);
            ctx.fill();

            // Add glow effect for active bars
            if (value > 0.3) {
              ctx.shadowColor = 'hsl(0, 85%, 55%)';
              ctx.shadowBlur = 10 * value;
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          }

          // Draw center line
          ctx.strokeStyle = 'hsla(0, 0%, 100%, 0.1)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, centerY);
          ctx.lineTo(canvas.width, centerY);
          ctx.stroke();
        };

        draw();
      } catch (err) {
        console.error('Failed to access microphone:', err);
      }
    };

    initAudio();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording]);

  const drawIdleWaveform = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const bgGradient = ctx.createLinearGradient(0, 0, width, 0);
    bgGradient.addColorStop(0, 'hsl(220, 20%, 10%)');
    bgGradient.addColorStop(0.5, 'hsl(220, 25%, 12%)');
    bgGradient.addColorStop(1, 'hsl(220, 20%, 10%)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    const centerY = height / 2;
    const barCount = 64;
    const barWidth = width / barCount * 0.6;
    const gap = width / barCount * 0.4;

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + gap) + gap / 2;
      const barHeight = 4;
      
      ctx.fillStyle = 'hsla(210, 50%, 50%, 0.3)';
      ctx.beginPath();
      ctx.roundRect(x, centerY - barHeight, barWidth, barHeight * 2, barWidth / 2);
      ctx.fill();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && !isRecording) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawIdleWaveform(ctx, canvas.width, canvas.height);
      }
    }
  }, [isRecording]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-secondary/30 p-1 shadow-lg">
      <div className="relative h-32 w-full overflow-hidden rounded-xl">
        <canvas
          ref={canvasRef}
          width={800}
          height={128}
          className="h-full w-full"
        />
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-recording opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-recording"></span>
            </span>
            <span className="text-xs font-medium text-recording">RECORDING</span>
          </div>
        )}

        {/* Center icon */}
        {!isRecording && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Mic className="h-8 w-8 text-primary/50" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
