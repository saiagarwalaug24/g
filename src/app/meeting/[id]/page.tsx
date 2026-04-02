'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, ListChecks, BookOpen, MessageSquareText, Download,
  ArrowLeft, Play, AlertCircle, Sparkles, Clock, Users, Hash
} from 'lucide-react';
import { Header } from '@/components/header';
import { WaveformPlayer } from '@/components/waveform-player';
import { TranscriptViewer } from '@/components/transcript-viewer';
import { ActionItemsPanel } from '@/components/action-items';
import { ChapterBreakdown } from '@/components/chapter-breakdown';
import { QAChat } from '@/components/qa-chat';
import { ExportPanel } from '@/components/export-panel';
import { ProcessingOverlay } from '@/components/processing-overlay';
import { Button } from '@/components/ui/button';
import { useMeetingStore } from '@/lib/store';
import { useMounted } from '@/hooks';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/format';
import { apiPost, apiPostForm } from '@/lib/client-api';
import type { ProcessingProgress } from '@/types';
import Link from 'next/link';

const TABS = [
  { id: 'transcript', label: 'Transcript', icon: FileText, shortLabel: 'Transcript' },
  { id: 'actions', label: 'Actions & Decisions', icon: ListChecks, shortLabel: 'Actions' },
  { id: 'chapters', label: 'Chapters', icon: BookOpen, shortLabel: 'Chapters' },
  { id: 'qa', label: 'Ask AI', icon: MessageSquareText, shortLabel: 'Ask AI' },
  { id: 'export', label: 'Export', icon: Download, shortLabel: 'Export' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;
  const { getMeeting, updateMeeting } = useMeetingStore();
  const mounted = useMounted();

  const [activeTab, setActiveTab] = useState<TabId>('transcript');
  const [processing, setProcessing] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const meeting = mounted ? getMeeting(meetingId) : undefined;

  const processRecording = useCallback(async () => {
    if (!meeting || meeting.status === 'completed' || meeting.status === 'transcribing' || meeting.status === 'processing') return;

    setError(null);

    try {
      setProcessing({ stage: 'transcribing', progress: 10, message: 'Transcribing audio with Whisper AI...' });
      updateMeeting(meetingId, { status: 'transcribing' });

      const audioResponse = await fetch(meeting.fileUrl);
      const audioBlob = await audioResponse.blob();
      const formData = new FormData();
      formData.append('audio', audioBlob, meeting.fileName);

      setProcessing({ stage: 'transcribing', progress: 30, message: 'Sending audio to Whisper API...' });

      const transcribeRes = await apiPostForm('/api/transcribe', formData);
      if (!transcribeRes.ok) {
        const err = await transcribeRes.json();
        throw new Error(err.error || 'Transcription failed');
      }

      const transcribeData = await transcribeRes.json();
      setProcessing({ stage: 'diarizing', progress: 50, message: 'Identifying speakers and extracting insights...' });
      updateMeeting(meetingId, { status: 'processing' });

      const processRes = await apiPost('/api/process', {
        segments: transcribeData.segments,
        fullText: transcribeData.text,
      });

      if (!processRes.ok) {
        const err = await processRes.json();
        throw new Error(err.error || 'Processing failed');
      }

      const processData = await processRes.json();
      setProcessing({ stage: 'extracting', progress: 75, message: 'Organizing action items and chapters...' });
      setProcessing({ stage: 'embedding', progress: 90, message: 'Building search index...' });

      updateMeeting(meetingId, {
        status: 'completed',
        transcript: processData.segments,
        summary: processData.summary,
        actionItems: processData.actionItems,
        decisions: processData.decisions,
        keyQuestions: processData.keyQuestions,
        chapters: processData.chapters,
        duration: transcribeData.duration || meeting.duration,
      });

      setProcessing({ stage: 'complete', progress: 100, message: 'All done!' });
      setTimeout(() => setProcessing(null), 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Processing failed';
      setError(message);
      setProcessing(null);
      updateMeeting(meetingId, { status: 'error' });
    }
  }, [meeting, meetingId, updateMeeting]);

  const handleToggleActionComplete = (actionId: string) => {
    if (!meeting?.actionItems) return;
    const updated = meeting.actionItems.map(item =>
      item.id === actionId ? { ...item, completed: !item.completed } : item
    );
    updateMeeting(meetingId, { actionItems: updated });
  };

  const handleTimestampClick = (time: number) => {
    const w = window as unknown as Record<string, unknown>;
    const seekFn = w.__echolens_seek as ((t: number) => void) | undefined;
    const playFn = w.__echolens_play as (() => void) | undefined;
    seekFn?.(time);
    playFn?.();
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="animate-pulse space-y-5">
            <div className="h-6 w-40 bg-secondary rounded-lg" />
            <div className="h-28 bg-secondary rounded-2xl" />
            <div className="h-[500px] bg-secondary rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[65vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50 mb-4">
              <AlertCircle className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold mb-2">Meeting not found</h2>
            <p className="text-sm text-muted-foreground mb-6">This meeting may have been deleted or the link is invalid.</p>
            <Button asChild className="gap-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const speakerCount = meeting.transcript
    ? new Set(meeting.transcript.map(s => s.speaker)).size
    : 0;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] rounded-full bg-accent/[0.03] blur-[100px]" />
      </div>

      <Header />

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-6">
        {/* Top bar: Back + Title + Stats */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-secondary/60 mt-0.5 shrink-0"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl sm:text-2xl font-bold truncate leading-tight">
                {meeting.title}
              </h1>
              {meeting.summary && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {meeting.summary}
                </p>
              )}

              {/* Stats pills */}
              {meeting.status === 'completed' && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {meeting.duration > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full">
                      <Clock className="h-3 w-3" />
                      {formatDuration(meeting.duration)}
                    </span>
                  )}
                  {speakerCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full">
                      <Users className="h-3 w-3" />
                      {speakerCount} speaker{speakerCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {meeting.transcript && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full">
                      <Hash className="h-3 w-3" />
                      {meeting.transcript.length} segments
                    </span>
                  )}
                  {meeting.actionItems && meeting.actionItems.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full ring-1 ring-primary/15">
                      <ListChecks className="h-3 w-3" />
                      {meeting.actionItems.length} actions
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Processing Overlay */}
        {processing && processing.stage !== 'complete' && (
          <ProcessingOverlay progress={processing} />
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-5 rounded-2xl border border-destructive/20 bg-destructive/5 backdrop-blur-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 shrink-0">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-destructive">Processing Error</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{error}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Make sure your Groq API key is configured in{' '}
                  <Link href="/settings" className="text-primary hover:underline font-medium">Settings</Link>.
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                className="gap-2 bg-primary hover:bg-primary/90"
                onClick={() => { setError(null); processRecording(); }}
              >
                <Play className="h-3 w-3" />
                Retry Processing
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/settings">Configure Key</Link>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        {!processing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Waveform Player */}
            <div className="mb-6">
              <WaveformPlayer audioUrl={meeting.fileUrl} />
            </div>

            {/* Process Button */}
            {meeting.status === 'uploaded' && !error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-8 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-accent/5 text-center backdrop-blur-sm"
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15 mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-base font-bold mb-1">Ready to process</h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
                  Transcribe, identify speakers, extract action items, generate chapters, and build a searchable index.
                </p>
                <Button
                  onClick={processRecording}
                  className="gap-2 h-11 px-6 bg-primary hover:bg-primary/90 font-medium shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                >
                  <Sparkles className="h-4 w-4" />
                  Process with AI
                </Button>
              </motion.div>
            )}

            {/* Tabs + Content */}
            {(meeting.status === 'completed' || (meeting.transcript && meeting.transcript.length > 0)) && (
              <>
                {/* Tab bar */}
                <div className="mb-5">
                  <div className="flex gap-1 p-1 rounded-xl bg-secondary/40 backdrop-blur-sm overflow-x-auto no-scrollbar">
                    {TABS.map((tab) => {
                      const isActive = activeTab === tab.id;
                      const count = tab.id === 'actions' ? meeting.actionItems?.length :
                                    tab.id === 'chapters' ? meeting.chapters?.length : undefined;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="meeting-tab"
                              className="absolute inset-0 bg-card rounded-lg shadow-sm ring-1 ring-border/40"
                              transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                            />
                          )}
                          <span className="relative z-10 flex items-center gap-2">
                            <tab.icon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.shortLabel}</span>
                            {count !== undefined && count > 0 && (
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                                isActive
                                  ? "bg-primary/10 text-primary"
                                  : "bg-secondary text-muted-foreground"
                              )}>
                                {count}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tab Content with animation */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm p-5"
                  >
                    {activeTab === 'transcript' && (
                      <TranscriptViewer segments={meeting.transcript || []} />
                    )}
                    {activeTab === 'actions' && (
                      <ActionItemsPanel
                        actionItems={meeting.actionItems || []}
                        decisions={meeting.decisions || []}
                        keyQuestions={meeting.keyQuestions || []}
                        onToggleComplete={handleToggleActionComplete}
                        onTimestampClick={handleTimestampClick}
                      />
                    )}
                    {activeTab === 'chapters' && (
                      <ChapterBreakdown chapters={meeting.chapters || []} />
                    )}
                    {activeTab === 'qa' && (
                      <QAChat meetingId={meetingId} transcript={meeting.transcript || []} />
                    )}
                    {activeTab === 'export' && (
                      <ExportPanel meeting={meeting} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
