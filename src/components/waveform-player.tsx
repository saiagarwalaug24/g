'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMeetingStore } from '@/lib/store';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';

interface WaveformPlayerProps {
  audioUrl: string;
  onTimeUpdate?: (time: number) => void;
}

export function WaveformPlayer({ audioUrl, onTimeUpdate }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<ReturnType<typeof import('wavesurfer.js').default.create> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const { player, setPlayerState, setPlaybackRate } = useMeetingStore();

  const initWavesurfer = useCallback(async () => {
    if (!containerRef.current) return;
    const WaveSurfer = (await import('wavesurfer.js')).default;

    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'oklch(0.40 0.06 270)',
      progressColor: 'oklch(0.68 0.20 265)',
      cursorColor: 'oklch(0.80 0.16 85)',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1.5,
      barRadius: 3,
      height: 72,
      normalize: true,
      url: audioUrl,
      backend: 'WebAudio',
    });

    ws.on('ready', () => {
      setIsReady(true);
      setPlayerState({ duration: ws.getDuration() });
    });

    ws.on('timeupdate', (time: number) => {
      setPlayerState({ currentTime: time });
      onTimeUpdate?.(time);
    });

    ws.on('play', () => setPlayerState({ isPlaying: true }));
    ws.on('pause', () => setPlayerState({ isPlaying: false }));
    ws.on('finish', () => setPlayerState({ isPlaying: false, currentTime: 0 }));

    wavesurferRef.current = ws;
    return () => { ws.destroy(); };
  }, [audioUrl, onTimeUpdate, setPlayerState]);

  useEffect(() => {
    initWavesurfer();
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [initWavesurfer]);

  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws || !isReady) return;
    const currentWsTime = ws.getCurrentTime();
    if (Math.abs(currentWsTime - player.currentTime) > 0.5) {
      ws.seekTo(player.currentTime / ws.getDuration());
    }
  }, [player.currentTime, isReady]);

  const togglePlayPause = () => { wavesurferRef.current?.playPause(); };

  const skip = (seconds: number) => {
    if (wavesurferRef.current) {
      const newTime = Math.max(0, wavesurferRef.current.getCurrentTime() + seconds);
      wavesurferRef.current.seekTo(newTime / wavesurferRef.current.getDuration());
    }
  };

  const toggleMute = () => {
    if (wavesurferRef.current) {
      const newMuted = !isMuted;
      wavesurferRef.current.setVolume(newMuted ? 0 : 1);
      setIsMuted(newMuted);
    }
  };

  const handleRateChange = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIdx = rates.indexOf(player.playbackRate);
    const nextRate = rates[(currentIdx + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(nextRate);
    }
  };

  const seekToTime = useCallback((time: number) => {
    if (wavesurferRef.current && isReady) {
      const duration = wavesurferRef.current.getDuration();
      if (duration > 0) {
        wavesurferRef.current.seekTo(time / duration);
      }
    }
  }, [isReady]);

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__echolens_seek = seekToTime;
    w.__echolens_play = () => {
      if (wavesurferRef.current && !player.isPlaying) {
        wavesurferRef.current.play();
      }
    };
    return () => {
      delete w.__echolens_seek;
      delete w.__echolens_play;
    };
  }, [seekToTime, player.isPlaying]);

  const progressPercent = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0;

  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Gradient top accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="p-5">
        {/* Mini equalizer + status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-0.5 h-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "w-[3px] rounded-full",
                    player.isPlaying ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                  animate={player.isPlaying ? {
                    height: [4, 14 + Math.random() * 6, 6, 16, 4],
                  } : { height: 6 }}
                  transition={player.isPlaying ? {
                    duration: 0.6 + Math.random() * 0.4,
                    repeat: Infinity,
                    delay: i * 0.08,
                  } : { duration: 0.3 }}
                />
              ))}
            </div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {player.isPlaying ? 'Playing' : isReady ? 'Ready' : 'Loading...'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground/60 tabular-nums">
            {formatTime(player.currentTime)} / {formatTime(player.duration)}
          </span>
        </div>

        {/* Waveform */}
        <div className="relative mb-4">
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-lg z-10">
              <div className="flex items-center gap-3">
                <motion.div className="flex gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {[...Array(7)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-[3px] bg-primary/40 rounded-full"
                      animate={{ height: [8, 24, 8] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </motion.div>
                <span className="text-sm text-muted-foreground">Loading waveform...</span>
              </div>
            </div>
          )}
          <div ref={containerRef} className="rounded-lg overflow-hidden" />
        </div>

        {/* Thin progress bar */}
        <div className="h-0.5 w-full rounded-full bg-secondary/50 mb-4 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-secondary/60" onClick={() => skip(-10)}>
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              className={cn(
                "h-11 w-11 rounded-xl transition-all duration-200",
                player.isPlaying
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:bg-primary/90"
                  : "bg-primary/10 text-primary hover:bg-primary/20 ring-1 ring-primary/20"
              )}
              onClick={togglePlayPause}
              disabled={!isReady}
            >
              {player.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </Button>

            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-secondary/60" onClick={() => skip(10)}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2.5 rounded-lg text-xs font-mono gap-1",
                player.playbackRate !== 1 && "bg-accent/10 text-accent ring-1 ring-accent/20"
              )}
              onClick={handleRateChange}
            >
              <Gauge className="h-3 w-3" />
              {player.playbackRate}x
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-secondary/60" onClick={toggleMute}>
              {isMuted ? <VolumeX className="h-3.5 w-3.5 text-muted-foreground" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
