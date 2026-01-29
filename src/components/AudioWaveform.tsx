import { useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';

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
        
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
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

          // Clear canvas with dark background
          ctx.fillStyle = 'hsl(var(--card))';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const radius = Math.min(centerX, centerY) * 0.6;
          
          // Calculate average volume
          const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
          const normalizedAvg = average / 255;

          // Draw outer pulsing ring
          const pulseRadius = radius + 20 + normalizedAvg * 30;
          ctx.beginPath();
          ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(0, 85%, 55%, ${0.2 + normalizedAvg * 0.3})`;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw middle ring
          const middleRadius = radius + 10 + normalizedAvg * 15;
          ctx.beginPath();
          ctx.arc(centerX, centerY, middleRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(0, 85%, 55%, ${0.3 + normalizedAvg * 0.4})`;
          ctx.lineWidth = 3;
          ctx.stroke();

          // Draw circular waveform bars
          const barCount = 32;
          for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * bufferLength / barCount);
            const value = dataArray[dataIndex] / 255;
            const barHeight = 8 + value * 40;
            
            const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
            const innerRadius = radius - 5;
            const outerRadius = radius + barHeight;
            
            const x1 = centerX + Math.cos(angle) * innerRadius;
            const y1 = centerY + Math.sin(angle) * innerRadius;
            const x2 = centerX + Math.cos(angle) * outerRadius;
            const y2 = centerY + Math.sin(angle) * outerRadius;

            // Create gradient for each bar
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, `hsla(0, 85%, 55%, 0.8)`);
            gradient.addColorStop(1, `hsla(0, 85%, 65%, ${0.4 + value * 0.6})`);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.stroke();
          }

          // Draw center circle with mic icon background
          const centerRadius = radius * 0.5 + normalizedAvg * 5;
          const centerGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, centerRadius
          );
          centerGradient.addColorStop(0, 'hsla(0, 85%, 55%, 0.9)');
          centerGradient.addColorStop(0.7, 'hsla(0, 85%, 45%, 0.8)');
          centerGradient.addColorStop(1, 'hsla(0, 85%, 35%, 0.6)');
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
          ctx.fillStyle = centerGradient;
          ctx.fill();

          // Draw mic icon in center
          ctx.fillStyle = 'white';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🎙️', centerX, centerY);
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
    ctx.fillStyle = 'hsl(var(--card))';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.6;

    // Draw static outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 20, 0, Math.PI * 2);
    ctx.strokeStyle = 'hsla(var(--primary), 0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw static middle ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'hsla(var(--primary), 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw static bars
    const barCount = 32;
    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
      const innerRadius = radius - 5;
      const outerRadius = radius + 8;
      
      const x1 = centerX + Math.cos(angle) * innerRadius;
      const y1 = centerY + Math.sin(angle) * innerRadius;
      const x2 = centerX + Math.cos(angle) * outerRadius;
      const y2 = centerY + Math.sin(angle) * outerRadius;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'hsla(var(--primary), 0.3)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Draw center circle
    const centerGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius * 0.5
    );
    centerGradient.addColorStop(0, 'hsla(var(--primary), 0.3)');
    centerGradient.addColorStop(1, 'hsla(var(--primary), 0.1)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = centerGradient;
    ctx.fill();
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
    <div className="relative overflow-hidden rounded-2xl bg-card p-1 shadow-lg border border-border/50">
      <div className="relative h-48 w-full overflow-hidden rounded-xl bg-card">
        <canvas
          ref={canvasRef}
          width={400}
          height={192}
          className="h-full w-full"
        />
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-recording/20 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-recording opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-recording"></span>
            </span>
            <span className="text-xs font-semibold text-recording">REC</span>
          </div>
        )}

        {/* Center mic icon when idle */}
        {!isRecording && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-primary/10 p-6 backdrop-blur-sm">
              <Mic className="h-10 w-10 text-primary" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
