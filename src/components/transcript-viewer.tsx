'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useMeetingStore } from '@/lib/store';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TranscriptSegment } from '@/types';

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
}

export function TranscriptViewer({ segments }: TranscriptViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const { player } = useMeetingStore();
  const [autoScroll, setAutoScroll] = useState(true);

  // Find current active segment
  const activeSegmentIdx = segments.findIndex(
    (seg) => player.currentTime >= seg.start && player.currentTime < seg.end
  );

  // Auto-scroll to active segment
  useEffect(() => {
    if (autoScroll && activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeSegmentIdx, autoScroll]);

  // Detect manual scroll to disable auto-scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      setAutoScroll(false);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setAutoScroll(true), 5000);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const handleSegmentClick = (start: number) => {
    const seekFn = ((window as unknown as Record<string, unknown>)).__echolens_seek as ((t: number) => void) | undefined;
    const playFn = ((window as unknown as Record<string, unknown>)).__echolens_play as (() => void) | undefined;
    seekFn?.(start);
    playFn?.();
  };

  if (segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p className="text-sm">No transcript available yet.</p>
        <p className="text-xs mt-1">Process the recording to generate a transcript.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh-380px)] min-h-[300px] overflow-y-auto space-y-1 pr-2 no-scrollbar"
    >
      {segments.map((segment, idx) => {
        const isActive = idx === activeSegmentIdx;
        const isPast = activeSegmentIdx >= 0 && idx < activeSegmentIdx;

        return (
          <motion.div
            key={segment.id}
            ref={isActive ? activeRef : undefined}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(idx * 0.02, 0.5) }}
            onClick={() => handleSegmentClick(segment.start)}
            className={cn(
              "group flex gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
              isActive
                ? "bg-primary/10 ring-1 ring-primary/20"
                : "hover:bg-secondary/50",
              isPast && !isActive && "opacity-60"
            )}
          >
            {/* Timestamp */}
            <button
              className="shrink-0 text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors tabular-nums pt-0.5"
            >
              {formatTime(segment.start)}
            </button>

            {/* Speaker color bar */}
            <div
              className="w-0.5 shrink-0 rounded-full mt-1 mb-1"
              style={{ backgroundColor: segment.speakerColor }}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <span
                className="text-xs font-semibold tracking-wide uppercase"
                style={{ color: segment.speakerColor }}
              >
                {segment.speaker}
              </span>
              <p className={cn(
                "text-sm leading-relaxed mt-0.5",
                isActive ? "text-foreground" : "text-foreground/80"
              )}>
                {segment.text}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
