'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, User, Calendar, AlertTriangle, Flag, ChevronDown, ChevronUp, MessageSquare, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActionItem, Decision, KeyQuestion } from '@/types';
import { formatTime } from '@/lib/format';

interface ActionItemsPanelProps {
  actionItems: ActionItem[];
  decisions: Decision[];
  keyQuestions: KeyQuestion[];
  onToggleComplete?: (id: string) => void;
  onTimestampClick?: (time: number) => void;
}

const priorityConfig = {
  high: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'High' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Medium' },
  low: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Low' },
};

export function ActionItemsPanel({
  actionItems,
  decisions,
  keyQuestions,
  onToggleComplete,
  onTimestampClick,
}: ActionItemsPanelProps) {
  const [showDecisions, setShowDecisions] = useState(true);
  const [showQuestions, setShowQuestions] = useState(true);

  if (actionItems.length === 0 && decisions.length === 0 && keyQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No action items extracted yet.</p>
        <p className="text-xs mt-1">Process the recording to extract insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-380px)] min-h-[300px] overflow-y-auto pr-2 no-scrollbar">
      {/* Action Items */}
      {actionItems.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Flag className="h-4 w-4 text-primary" />
            Action Items
            <span className="text-xs font-normal text-muted-foreground">({actionItems.length})</span>
          </h3>
          <div className="space-y-2">
            <AnimatePresence>
              {actionItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "group flex gap-3 p-3 rounded-lg border border-border/50 transition-colors",
                    "hover:border-border hover:bg-secondary/30",
                    item.completed && "opacity-50"
                  )}
                >
                  <button
                    onClick={() => onToggleComplete?.(item.id)}
                    className="shrink-0 mt-0.5"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm leading-relaxed",
                      item.completed && "line-through"
                    )}>
                      {item.text}
                    </p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {item.assignee && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {item.assignee}
                        </span>
                      )}
                      {item.deadline && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {item.deadline}
                        </span>
                      )}
                      <span className={cn(
                        "inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded",
                        priorityConfig[item.priority].bg,
                        priorityConfig[item.priority].color
                      )}>
                        {priorityConfig[item.priority].label}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Decisions */}
      {decisions.length > 0 && (
        <div>
          <button
            onClick={() => setShowDecisions(!showDecisions)}
            className="flex items-center gap-2 w-full text-left mb-3"
          >
            <MessageSquare className="h-4 w-4 text-accent" />
            <h3 className="font-display text-sm font-semibold text-foreground">
              Decisions
            </h3>
            <span className="text-xs font-normal text-muted-foreground">({decisions.length})</span>
            {showDecisions ? <ChevronUp className="h-3.5 w-3.5 ml-auto text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {showDecisions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {decisions.map((decision, idx) => (
                  <motion.div
                    key={decision.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 rounded-lg border border-accent/20 bg-accent/5"
                  >
                    <p className="text-sm">{decision.text}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {decision.madeBy && (
                        <span className="text-xs text-muted-foreground">
                          by {decision.madeBy}
                        </span>
                      )}
                      <button
                        onClick={() => onTimestampClick?.(decision.timestamp)}
                        className="text-xs font-mono text-primary hover:underline"
                      >
                        {formatTime(decision.timestamp)}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Key Questions */}
      {keyQuestions.length > 0 && (
        <div>
          <button
            onClick={() => setShowQuestions(!showQuestions)}
            className="flex items-center gap-2 w-full text-left mb-3"
          >
            <HelpCircle className="h-4 w-4 text-chart-3" />
            <h3 className="font-display text-sm font-semibold text-foreground">
              Key Questions
            </h3>
            <span className="text-xs font-normal text-muted-foreground">({keyQuestions.length})</span>
            {showQuestions ? <ChevronUp className="h-3.5 w-3.5 ml-auto text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {showQuestions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {keyQuestions.map((q, idx) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 rounded-lg border border-border/50 bg-secondary/30"
                  >
                    <p className="text-sm font-medium">{q.question}</p>
                    {q.answer && (
                      <p className="text-xs text-muted-foreground mt-1">{q.answer}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {q.askedBy && (
                        <span className="text-xs text-muted-foreground">
                          asked by {q.askedBy}
                        </span>
                      )}
                      <button
                        onClick={() => onTimestampClick?.(q.timestamp)}
                        className="text-xs font-mono text-primary hover:underline"
                      >
                        {formatTime(q.timestamp)}
                      </button>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        q.answered ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-400"
                      )}>
                        {q.answered ? 'Answered' : 'Open'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
