'use client';

import { motion } from 'motion/react';
import { BookOpen, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMeetingStore } from '@/lib/store';
import { formatTime } from '@/lib/format';
import type { Chapter } from '@/types';

interface ChapterBreakdownProps {
  chapters: Chapter[];
}

export function ChapterBreakdown({ chapters }: ChapterBreakdownProps) {
  const { player } = useMeetingStore();

  const activeChapterIdx = chapters.findIndex(
    (ch) => player.currentTime >= ch.start && player.currentTime < ch.end
  );

  const handleChapterClick = (start: number) => {
    const seekFn = ((window as unknown as Record<string, unknown>)).__echolens_seek as ((t: number) => void) | undefined;
    const playFn = ((window as unknown as Record<string, unknown>)).__echolens_play as (() => void) | undefined;
    seekFn?.(start);
    playFn?.();
  };

  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <BookOpen className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No chapters generated yet.</p>
        <p className="text-xs mt-1">Process the recording to generate chapters.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-380px)] min-h-[300px] overflow-y-auto space-y-2 pr-2 no-scrollbar">
      {chapters.map((chapter, idx) => {
        const isActive = idx === activeChapterIdx;
        const duration = chapter.end - chapter.start;

        return (
          <motion.div
            key={chapter.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => handleChapterClick(chapter.start)}
            className={cn(
              "group p-4 rounded-lg border cursor-pointer transition-all duration-200",
              isActive
                ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10"
                : "border-border/50 hover:border-border hover:bg-secondary/30"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 text-xs font-bold font-mono",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-display text-sm font-semibold truncate">
                    {chapter.title}
                  </h4>
                  <ChevronRight className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-transform",
                    isActive ? "text-primary rotate-90" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                  )} />
                </div>

                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {chapter.summary}
                </p>

                {chapter.keyPoints.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {chapter.keyPoints.slice(0, 3).map((point, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="mt-1 h-1 w-1 rounded-full bg-primary/50 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex items-center gap-3 mt-2">
                  <button
                    className="text-xs font-mono text-primary hover:underline"
                    onClick={(e) => { e.stopPropagation(); handleChapterClick(chapter.start); }}
                  >
                    {formatTime(chapter.start)}
                  </button>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            {isActive && (
              <div className="mt-3 h-0.5 w-full rounded-full bg-primary/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min(100, ((player.currentTime - chapter.start) / duration) * 100)}%`
                  }}
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
