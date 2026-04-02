'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  AudioLines, Clock, FileAudio, Trash2, ChevronRight, Sparkles,
  Zap, BookOpen, MessageSquareText, Brain, Download, Users, ArrowRight,
  Play, CheckCircle2, CircleDot, Mic2
} from 'lucide-react';
import { Header } from '@/components/header';
import { UploadZone } from '@/components/upload-zone';
import { useMeetingStore } from '@/lib/store';
import { useMounted } from '@/hooks';
import { formatDuration, formatRelativeTime, formatFileSize } from '@/lib/format';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    icon: AudioLines,
    title: 'Waveform Sync',
    desc: 'Interactive waveform perfectly synced with every spoken word. Click anywhere to jump.',
    gradient: 'from-indigo-500/20 to-blue-500/10',
    iconColor: 'text-indigo-400',
  },
  {
    icon: Brain,
    title: 'AI Extraction',
    desc: 'Auto-generated action items with assignee detection, decisions, and key questions.',
    gradient: 'from-violet-500/20 to-purple-500/10',
    iconColor: 'text-violet-400',
  },
  {
    icon: BookOpen,
    title: 'Smart Chapters',
    desc: 'AI-generated topic chapters with summaries and one-click timestamp navigation.',
    gradient: 'from-amber-500/20 to-orange-500/10',
    iconColor: 'text-amber-400',
  },
  {
    icon: MessageSquareText,
    title: 'Ask Questions',
    desc: 'Semantic Q&A over your transcript. Get cited answers with exact timestamps.',
    gradient: 'from-emerald-500/20 to-teal-500/10',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Users,
    title: 'Speaker Detection',
    desc: 'AI-inferred speaker diarization with color-coded labels and conversation flow.',
    gradient: 'from-pink-500/20 to-rose-500/10',
    iconColor: 'text-pink-400',
  },
  {
    icon: Download,
    title: 'One-Click Export',
    desc: 'Export to Markdown, JSON, clipboard, or directly to Notion with structured formatting.',
    gradient: 'from-cyan-500/20 to-sky-500/10',
    iconColor: 'text-cyan-400',
  },
];

const STATS = [
  { label: 'Transcription', value: 'Whisper v3' },
  { label: 'Intelligence', value: 'LLaMA 3.1' },
  { label: 'Max Duration', value: '2 hours' },
  { label: 'File Limit', value: '100 MB' },
];

const DEMO_TRANSCRIPT = [
  { speaker: 'Sarah Chen', color: 'oklch(0.65 0.22 265)', time: '0:00', text: 'Alright everyone, let\'s kick off the Q3 planning session. We need to finalize the roadmap by end of week.' },
  { speaker: 'Marcus Reid', color: 'oklch(0.78 0.16 85)', time: '0:14', text: 'Agreed. I\'ve been looking at the metrics — our DAU is up 23% but retention at day 30 is still a problem. We\'re losing users before they hit the \'aha\' moment.' },
  { speaker: 'Sarah Chen', color: 'oklch(0.65 0.22 265)', time: '0:31', text: 'That\'s exactly why onboarding needs to be priority one. Marcus, can you own the redesign and have a prototype ready by the 15th?' },
  { speaker: 'Marcus Reid', color: 'oklch(0.78 0.16 85)', time: '0:42', text: 'Yes, I can do that. I\'ll loop in design tomorrow morning.' },
  { speaker: 'Priya Nair', color: 'oklch(0.65 0.18 170)', time: '0:49', text: 'On the backend side, we\'re seeing latency spikes during peak hours. I\'d recommend we prioritize the caching layer before the next launch.' },
  { speaker: 'Sarah Chen', color: 'oklch(0.65 0.22 265)', time: '1:03', text: 'Good catch. Let\'s make that a blocker. Priya, coordinate with DevOps and get that scoped by Wednesday.' },
];

const DEMO_ACTIONS = [
  { assignee: 'Marcus Reid', text: 'Redesign onboarding flow and deliver prototype', deadline: 'Jun 15', priority: 'high', done: false },
  { assignee: 'Priya Nair', text: 'Scope caching layer implementation with DevOps', deadline: 'Jun 12', priority: 'high', done: false },
  { assignee: 'Sarah Chen', text: 'Share final roadmap with stakeholders', deadline: 'Jun 10', priority: 'medium', done: true },
];

function DemoSection() {
  const [activeDemo, setActiveDemo] = useState<'transcript' | 'actions'>('transcript');
  const [playingLine, setPlayingLine] = useState<number | null>(null);

  const handlePlayLine = (idx: number) => {
    setPlayingLine(idx);
    setTimeout(() => setPlayingLine(null), 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="mb-20"
    >
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 border border-primary/15 text-primary text-[11px] font-semibold tracking-wide mb-3">
          <CircleDot className="h-3 w-3" />
          LIVE DEMO PREVIEW
        </span>
        <h2 className="font-display text-2xl font-bold mb-2">See it in action</h2>
        <p className="text-sm text-muted-foreground">A real output from a 1-minute sample meeting</p>
      </div>

      {/* Demo card */}
      <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden shadow-lg">
        {/* Mock header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-card/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
              <FileAudio className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Q3 Planning Session</p>
              <p className="text-[11px] text-muted-foreground">1:12 · 3 speakers · 2 action items</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary ring-1 ring-primary/15">
            Ready
          </span>
        </div>

        {/* Mock waveform */}
        <div className="px-5 py-4 border-b border-border/30 bg-secondary/10">
          <div className="flex items-center gap-3">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0">
              <Play className="h-3.5 w-3.5 ml-0.5" />
            </button>
            <div className="flex-1 flex items-end gap-[2px] h-8">
              {Array.from({ length: 80 }, (_, i) => {
                const height = 20 + Math.sin(i * 0.4) * 10 + Math.sin(i * 1.1) * 8 + Math.random() * 6;
                const progress = i / 80;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 rounded-full transition-colors",
                      progress < 0.35 ? "bg-primary/80" : "bg-primary/20"
                    )}
                    style={{ height: `${Math.max(3, height)}px` }}
                  />
                );
              })}
            </div>
            <span className="text-xs font-mono text-muted-foreground tabular-nums shrink-0">0:25 / 1:12</span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-2 border-b border-border/30 bg-card/40">
          {[
            { id: 'transcript' as const, label: 'Transcript' },
            { id: 'actions' as const, label: 'Action Items' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDemo(tab.id)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                activeDemo === tab.id
                  ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Demo content */}
        <div className="p-5 min-h-[260px]">
          {activeDemo === 'transcript' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {DEMO_TRANSCRIPT.map((line, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  className={cn(
                    "group flex gap-3 rounded-xl p-3 transition-all duration-200 cursor-pointer",
                    playingLine === idx ? "bg-primary/8 ring-1 ring-primary/20" : "hover:bg-secondary/40"
                  )}
                  onClick={() => handlePlayLine(idx)}
                >
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <span className="text-[10px] font-mono text-muted-foreground/60 tabular-nums">{line.time}</span>
                    {playingLine === idx ? (
                      <div className="flex gap-[2px] items-end h-4">
                        {[0,1,2].map(i => (
                          <motion.div
                            key={i}
                            className="w-[3px] rounded-full bg-primary"
                            animate={{ height: ['4px', '12px', '4px'] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    ) : (
                      <Mic2 className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[11px] font-bold mr-2"
                      style={{ color: line.color }}
                    >
                      {line.speaker}
                    </span>
                    <p className="text-sm text-foreground/90 leading-relaxed mt-0.5">{line.text}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeDemo === 'actions' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <p className="text-xs text-muted-foreground mb-4">AI-extracted from the conversation — with assignees, deadlines, and priorities.</p>
              {DEMO_ACTIONS.map((action, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.09 }}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border transition-all duration-200",
                    action.done
                      ? "border-border/30 bg-secondary/20 opacity-60"
                      : "border-border/50 bg-card/50 hover:border-primary/20 hover:bg-primary/3"
                  )}
                >
                  <CheckCircle2 className={cn(
                    "h-4 w-4 mt-0.5 shrink-0",
                    action.done ? "text-primary" : "text-muted-foreground/30"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", action.done && "line-through text-muted-foreground")}>
                      {action.text}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[11px] text-muted-foreground font-medium">{action.assignee}</span>
                      <span className="text-[11px] text-muted-foreground/60">Due {action.deadline}</span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                        action.priority === 'high' ? "bg-red-500/10 text-red-400 ring-1 ring-red-500/20" :
                        action.priority === 'medium' ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20" :
                        "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                      )}>
                        {action.priority}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              <div className="mt-4 p-3 rounded-xl bg-secondary/30 border border-border/30">
                <p className="text-[11px] text-muted-foreground text-center">
                  + Chapters, speaker breakdown, Q&amp;A, and Notion export available after processing
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const { meetings, removeMeeting } = useMeetingStore();
  const mounted = useMounted();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(id);
    setTimeout(() => {
      removeMeeting(id);
      setDeletingId(null);
    }, 200);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-64 bg-secondary rounded-lg mx-auto" />
            <div className="h-5 w-96 bg-secondary rounded mx-auto" />
            <div className="h-48 bg-secondary rounded-2xl mt-8" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/[0.04] blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-chart-3/[0.03] blur-[100px]" />
      </div>

      <Header />

      <main className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
        {/* Hero Section */}
        <div className="pt-16 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-8 tracking-wide"
            >
              <div className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </div>
              AI-POWERED MEETING INTELLIGENCE
            </motion.div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
              Turn meetings into
              <br />
              <span className="gradient-text">actionable insights</span>
            </h1>

            <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-4">
              Upload any recording or paste a YouTube link. Get AI transcription,
              speaker diarization, action items, and semantic Q&A.
            </p>

            {/* Stats row */}
            <div className="flex items-center justify-center gap-6 mt-8 mb-12">
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="text-center"
                >
                  <p className="text-sm font-semibold text-foreground">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Upload Zone */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-20"
          >
            <UploadZone />
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-20"
        >
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl font-bold mb-2">Everything you need</h2>
            <p className="text-sm text-muted-foreground">From raw audio to structured intelligence in one pipeline</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.07 }}
                className="group relative p-5 rounded-2xl border border-border/40 bg-card/40 hover:bg-card/70 backdrop-blur-sm transition-all duration-300 hover:border-border/60 hover:shadow-lg"
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br mb-4 transition-transform duration-300 group-hover:scale-105",
                  feature.gradient
                )}>
                  <feature.icon className={cn("h-5 w-5", feature.iconColor)} />
                </div>
                <h3 className="font-display text-sm font-bold mb-1.5">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Demo Section */}
        <DemoSection />

        {/* Recent Meetings */}
        {meetings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pb-20"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-xl font-bold">Recent Meetings</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{meetings.length} recording{meetings.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="space-y-2">
              {meetings.map((meeting, idx) => (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{
                    opacity: deletingId === meeting.id ? 0 : 1,
                    x: deletingId === meeting.id ? -30 : 0,
                    scale: deletingId === meeting.id ? 0.95 : 1,
                  }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Link
                    href={`/meeting/${meeting.id}`}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/30 hover:bg-card/60 backdrop-blur-sm transition-all duration-200 hover:border-border/60 hover:shadow-md"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 shrink-0 ring-1 ring-primary/10">
                      <FileAudio className="h-5 w-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{meeting.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {meeting.duration > 0 ? formatDuration(meeting.duration) : '—'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(meeting.fileSize)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(meeting.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[11px] px-2.5 py-1 rounded-full font-semibold tracking-wide",
                        meeting.status === 'completed' && "bg-primary/10 text-primary ring-1 ring-primary/20",
                        meeting.status === 'error' && "bg-destructive/10 text-destructive ring-1 ring-destructive/20",
                        ['uploading', 'transcribing', 'processing'].includes(meeting.status) && "bg-accent/10 text-accent ring-1 ring-accent/20",
                        meeting.status === 'uploaded' && "bg-secondary text-muted-foreground ring-1 ring-border/50"
                      )}>
                        {meeting.status === 'completed' ? 'Ready' : meeting.status}
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive/10"
                        onClick={(e) => handleDelete(meeting.id, e)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                      </Button>

                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state footer */}
        {meetings.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center pb-20"
          >
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground/60">
              <Sparkles className="h-3 w-3" />
              Powered by Groq · Whisper v3 + LLaMA 3.1 · Free forever
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
