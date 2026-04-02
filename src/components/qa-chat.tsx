'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Clock, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMeetingStore } from '@/lib/store';
import { formatTime, generateId } from '@/lib/format';
import { cn } from '@/lib/utils';
import { apiPost } from '@/lib/client-api';
import type { QAMessage, TranscriptSegment } from '@/types';

interface QAChatProps {
  meetingId: string;
  transcript: TranscriptSegment[];
}

const SUGGESTED_QUESTIONS = [
  "What were the main topics discussed?",
  "What action items were assigned?",
  "Were there any disagreements?",
  "Summarize the key decisions",
];

export function QAChat({ meetingId, transcript }: QAChatProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addQAMessage, getQAMessages } = useMeetingStore();

  const messages = getQAMessages(meetingId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (question?: string) => {
    const q = question || input.trim();
    if (!q || isLoading) return;

    const userMsg: QAMessage = {
      id: generateId(),
      role: 'user',
      content: q,
      timestamp: new Date().toISOString(),
    };
    addQAMessage(meetingId, userMsg);
    setInput('');
    setIsLoading(true);

    try {
      const res = await apiPost('/api/qa', {
        question: q,
        transcript: transcript.map(s => ({
          speaker: s.speaker,
          text: s.text,
          start: s.start,
          end: s.end,
        })),
        history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
      });

      if (!res.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await res.json();

      const assistantMsg: QAMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.answer,
        citations: data.citations || [],
        timestamp: new Date().toISOString(),
      };
      addQAMessage(meetingId, assistantMsg);
    } catch {
      const errorMsg: QAMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'Sorry, I could not process your question. Make sure your Groq API key is configured in Settings.',
        timestamp: new Date().toISOString(),
      };
      addQAMessage(meetingId, errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimestampClick = (time: number) => {
    const seekFn = ((window as unknown as Record<string, unknown>)).__echolens_seek as ((t: number) => void) | undefined;
    const playFn = ((window as unknown as Record<string, unknown>)).__echolens_play as (() => void) | undefined;
    seekFn?.(time);
    playFn?.();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-380px)] min-h-[300px]">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-sm font-semibold mb-1">Ask about this meeting</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Ask any question about the transcript and get cited answers.
              </p>

              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3",
                msg.role === 'user' ? "justify-end" : ""
              )}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className={cn(
                "max-w-[85%] rounded-xl px-4 py-2.5",
                msg.role === 'user'
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 border border-border/50"
              )}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
                    {msg.citations.map((cite, i) => (
                      <button
                        key={i}
                        onClick={() => handleTimestampClick(cite.start)}
                        className="flex items-start gap-2 text-xs text-muted-foreground hover:text-primary transition-colors w-full text-left"
                      >
                        <Clock className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>
                          <span className="font-mono text-primary">{formatTime(cite.start)}</span>
                          {' '}{cite.speaker}: &quot;{cite.text.slice(0, 80)}...&quot;
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary shrink-0">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="bg-secondary/50 border border-border/50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Searching transcript...</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question about this meeting..."
          className="flex-1 bg-secondary/50 border-border/50 focus-visible:ring-primary/30"
          disabled={isLoading || transcript.length === 0}
        />
        <Button
          size="icon"
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="shrink-0 bg-primary hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
