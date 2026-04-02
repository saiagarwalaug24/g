'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Key, Save, Check, AlertCircle, ExternalLink, Shield,
  Sparkles, Eye, EyeOff, Database, Plug, Zap
} from 'lucide-react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMounted, useLocalStorage } from '@/hooks';
import { useMeetingStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const SETUP_STEPS = [
  {
    number: 1,
    title: 'Get a FREE Groq API Key',
    description: 'Sign up at Groq Console — no credit card required. Groq gives you free access to Whisper transcription and LLaMA 3.1 for AI processing.',
    link: 'https://console.groq.com',
    linkLabel: 'Open Groq Console (free)',
  },
  {
    number: 2,
    title: 'Paste your key below',
    description: "Your key starts with 'gsk_' and stays in your browser's local storage. For production, set it as a GROQ_API_KEY environment variable.",
  },
  {
    number: 3,
    title: 'Upload a meeting recording',
    description: 'Go to the dashboard and upload an audio/video file or paste a YouTube URL. EchoLens handles the rest — all powered by free Groq APIs.',
  },
];

export default function SettingsPage() {
  const mounted = useMounted();
  const [apiKey, setApiKey] = useLocalStorage('echolens-groq-key', '');
  const [notionKey, setNotionKey] = useLocalStorage('echolens-notion-key', '');
  const [saved, setSaved] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);
  const [notionKeyVisible, setNotionKeyVisible] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const { meetings } = useMeetingStore();

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const testApiKey = async () => {
    if (!apiKey.trim()) return;
    setTestingKey(true);
    setKeyStatus('idle');

    try {
      const res = await fetch('/api/hello', {
        method: 'GET',
        headers: { 'x-groq-key': apiKey },
      });
      // Just check the key works via our own /api/hello endpoint
      // or test directly against Groq models list
      const groqRes = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      setKeyStatus(groqRes.ok ? 'valid' : 'invalid');
    } catch {
      setKeyStatus('invalid');
    } finally {
      setTestingKey(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-40 bg-secondary rounded-lg" />
            <div className="h-4 w-72 bg-secondary rounded" />
            <div className="h-56 bg-secondary rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[100px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-accent/[0.04] blur-[100px]" />
      </div>

      <Header />

      <main className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold mb-3">
              <Zap className="h-3 w-3" />
              100% FREE — No credit card required
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Configure your free Groq API key to power EchoLens. Groq provides Whisper transcription and LLaMA 3.1 at no cost.
            </p>
          </div>

          {/* Quick Setup Guide */}
          <div className="mb-10">
            <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Quick Setup Guide
            </h2>
            <div className="space-y-3">
              {SETUP_STEPS.map((step, idx) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.08 }}
                  className={cn(
                    "flex gap-4 p-4 rounded-xl border transition-all duration-200",
                    step.number === 1 && apiKey ? "border-primary/20 bg-primary/5" :
                    step.number === 2 && apiKey ? "border-primary/20 bg-primary/5" :
                    step.number === 3 && meetings.length > 0 ? "border-primary/20 bg-primary/5" :
                    "border-border/40 bg-card/30"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 text-xs font-bold font-mono",
                    (step.number <= 2 && apiKey) || (step.number === 3 && meetings.length > 0)
                      ? "bg-primary/15 text-primary"
                      : "bg-secondary text-muted-foreground"
                  )}>
                    {(step.number <= 2 && apiKey) || (step.number === 3 && meetings.length > 0)
                      ? <Check className="h-4 w-4" />
                      : step.number
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
                    {step.link && (
                      <a
                        href={step.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline mt-2 font-medium"
                      >
                        {step.linkLabel}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            {/* Groq Key */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden"
            >
              <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 ring-1 ring-emerald-500/15">
                    <Zap className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold">Groq API Key</h2>
                    <p className="text-xs text-muted-foreground">
                      Free — powers Whisper transcription + LLaMA 3.1 AI processing
                    </p>
                  </div>
                  {keyStatus === 'valid' && (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full ring-1 ring-emerald-500/20">
                      <Check className="h-3 w-3" />
                      Connected
                    </span>
                  )}
                  {keyStatus === 'invalid' && (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2.5 py-1 rounded-full ring-1 ring-destructive/20">
                      <AlertCircle className="h-3 w-3" />
                      Invalid
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      type={keyVisible ? 'text' : 'password'}
                      placeholder="gsk_..."
                      value={apiKey}
                      onChange={(e) => { setApiKey(e.target.value); setKeyStatus('idle'); }}
                      className="pl-10 pr-24 h-12 font-mono text-sm bg-secondary/30 border-border/50 focus-visible:ring-emerald-500/30"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        onClick={() => setKeyVisible(!keyVisible)}
                        className="p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-secondary/60 transition-colors"
                      >
                        {keyVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs font-medium"
                        onClick={testApiKey}
                        disabled={!apiKey.trim() || testingKey}
                      >
                        {testingKey ? 'Testing...' : 'Test'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-muted-foreground/70 p-3 rounded-lg bg-secondary/20">
                    <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <div>
                      <p>Keys are stored locally in your browser. For production, set <code className="font-mono text-[11px] bg-secondary/60 px-1 py-0.5 rounded">GROQ_API_KEY</code> as an environment variable.</p>
                    </div>
                  </div>

                  <a
                    href="https://console.groq.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline font-medium"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Get your free Groq API key at console.groq.com
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Notion Key */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden"
            >
              <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 ring-1 ring-accent/15">
                    <Plug className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold">Notion Integration</h2>
                    <p className="text-xs text-muted-foreground">
                      Optional — Export meeting notes directly to Notion
                    </p>
                  </div>
                  <span className="ml-auto text-[10px] font-medium text-muted-foreground/50 bg-secondary/40 px-2 py-1 rounded-full">
                    Optional
                  </span>
                </div>

                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    type={notionKeyVisible ? 'text' : 'password'}
                    placeholder="ntn_..."
                    value={notionKey}
                    onChange={(e) => setNotionKey(e.target.value)}
                    className="pl-10 pr-12 h-12 font-mono text-sm bg-secondary/30 border-border/50 focus-visible:ring-accent/30"
                  />
                  <button
                    onClick={() => setNotionKeyVisible(!notionKeyVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-secondary/60 transition-colors"
                  >
                    {notionKeyVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <a
                  href="https://www.notion.so/my-integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-3 font-medium"
                >
                  Create a Notion integration
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={handleSave}
                className={cn(
                  "w-full h-12 gap-2 font-medium text-sm rounded-xl transition-all duration-300",
                  saved
                    ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20 hover:bg-emerald-500/20"
                    : "bg-primary hover:bg-primary/90"
                )}
              >
                {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? 'Settings Saved' : 'Save Settings'}
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm p-6 mt-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-display text-sm font-semibold">Storage & Stats</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl bg-secondary/30">
                  <p className="text-lg font-bold font-mono text-foreground">{meetings.length}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Meetings</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary/30">
                  <p className="text-lg font-bold font-mono text-foreground">
                    {meetings.filter(m => m.status === 'completed').length}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Processed</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary/30">
                  <p className="text-sm font-bold text-foreground">Browser</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Storage</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground/60 mt-4">
                Data persists in localStorage. Powered by Groq — 100% free, no usage limits for personal use.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
