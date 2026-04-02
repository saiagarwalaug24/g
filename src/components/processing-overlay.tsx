'use client';

import { motion } from 'motion/react';
import { AudioLines, Brain, Users, ListChecks, Database, CheckCircle2 } from 'lucide-react';
import type { ProcessingProgress } from '@/types';

const STAGES = [
  { key: 'uploading', label: 'Uploading file', icon: AudioLines, color: 'text-blue-400' },
  { key: 'transcribing', label: 'Transcribing with Whisper AI', icon: AudioLines, color: 'text-indigo-400' },
  { key: 'diarizing', label: 'Identifying speakers', icon: Users, color: 'text-violet-400' },
  { key: 'extracting', label: 'Extracting insights with GPT-4', icon: Brain, color: 'text-amber-400' },
  { key: 'embedding', label: 'Building search index', icon: Database, color: 'text-emerald-400' },
  { key: 'complete', label: 'Processing complete', icon: CheckCircle2, color: 'text-primary' },
] as const;

interface ProcessingOverlayProps {
  progress: ProcessingProgress;
}

export function ProcessingOverlay({ progress }: ProcessingOverlayProps) {
  const currentIndex = STAGES.findIndex(s => s.key === progress.stage);
  const overallProgress = ((currentIndex + (progress.progress / 100)) / STAGES.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Animated orb */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            {/* Outer rings */}
            <motion.div
              className="absolute inset-[-20px] rounded-full border border-primary/10"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute inset-[-40px] rounded-full border border-primary/5"
              animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
            <motion.div
              className="absolute inset-[-60px] rounded-full border border-primary/[0.03]"
              animate={{ scale: [1, 1.08, 1], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />

            {/* Orbiting dots */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 4 + i * 2, repeat: Infinity, ease: 'linear' }}
              >
                <div
                  className="absolute h-1.5 w-1.5 rounded-full bg-primary/60"
                  style={{ transform: `translateX(${32 + i * 14}px)` }}
                />
              </motion.div>
            ))}

            {/* Core orb */}
            <motion.div
              className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/15 ring-1 ring-primary/20"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Brain className="h-9 w-9 text-primary" />
              <div className="absolute inset-0 rounded-2xl bg-primary/5 animate-pulse" />
            </motion.div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="font-display text-xl font-bold">Processing your meeting</h2>
          <p className="text-sm text-muted-foreground mt-1.5">{progress.message}</p>
        </div>

        {/* Stage list */}
        <div className="space-y-2">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = idx === currentIndex;
            const isDone = idx < currentIndex;
            const isPending = idx > currentIndex;

            return (
              <motion.div
                key={stage.key}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                  ${isActive ? 'bg-primary/8 ring-1 ring-primary/20 shadow-sm' : ''}
                  ${isDone ? 'bg-secondary/40' : ''}
                  ${isPending ? 'opacity-30' : ''}
                `}
              >
                <div className={`
                  flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-all
                  ${isActive ? 'bg-primary/15' : ''}
                  ${isDone ? 'bg-primary/10' : ''}
                  ${isPending ? 'bg-secondary/60' : ''}
                `}>
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Icon className={`h-4 w-4 ${stage.color}`} />
                    </motion.div>
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground/50" />
                  )}
                </div>

                <span className={`text-sm font-medium flex-1 ${isActive ? 'text-foreground' : isDone ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                  {stage.label}
                </span>

                {isActive && (
                  <span className="text-xs font-mono text-primary tabular-nums">
                    {Math.round(progress.progress)}%
                  </span>
                )}
                {isDone && (
                  <span className="text-[10px] text-primary/60 font-medium">Done</span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Overall progress */}
        <div className="mt-6 h-1 w-full rounded-full bg-secondary/60 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent"
            animate={{ width: `${Math.min(overallProgress, 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-center text-[11px] text-muted-foreground/60 mt-2 font-mono">
          {Math.round(overallProgress)}% complete
        </p>
      </motion.div>
    </div>
  );
}
