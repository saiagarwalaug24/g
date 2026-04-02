'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileAudio, X, Loader2, AlertCircle, Link2, Youtube, ArrowRight, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMeetingStore } from '@/lib/store';
import { formatFileSize, generateId } from '@/lib/format';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '@/types';
import type { Meeting } from '@/types';
import { cn } from '@/lib/utils';
import { apiPost } from '@/lib/client-api';

type InputMode = 'upload' | 'youtube';

export function UploadZone() {
  const router = useRouter();
  const { addMeeting } = useMeetingStore();
  const [mode, setMode] = useState<InputMode>('upload');
  const [uploadState, setUploadState] = useState<'idle' | 'selected' | 'uploading' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeLoading, setYoutubeLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > MAX_FILE_SIZE) {
        setErrorMsg(`File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`);
        setUploadState('error');
        return;
      }
      setSelectedFile(file);
      setUploadState('selected');
      setErrorMsg('');
    }
  }, []);

  const onDropRejected = useCallback(() => {
    setErrorMsg('Invalid file type. Please upload MP3, WAV, MP4, WebM, or M4A files.');
    setUploadState('error');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadState('uploading');
    setUploadProgress(0);

    const meetingId = generateId();
    const fileUrl = URL.createObjectURL(selectedFile);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval); return 90; }
        return prev + Math.random() * 15;
      });
    }, 200);

    const meeting: Meeting = {
      id: meetingId,
      title: selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      fileName: selectedFile.name,
      fileUrl,
      fileType: selectedFile.type,
      fileSize: selectedFile.size,
      duration: 0,
      status: 'uploaded',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const audio = new Audio(fileUrl);
      await new Promise<void>((resolve) => {
        audio.addEventListener('loadedmetadata', () => { meeting.duration = audio.duration; resolve(); });
        audio.addEventListener('error', () => resolve());
      });
    } catch { /* duration remains 0 */ }

    clearInterval(progressInterval);
    setUploadProgress(100);
    addMeeting(meeting);
    setTimeout(() => router.push(`/meeting/${meetingId}`), 300);
  };

  const handleYoutubeSubmit = async () => {
    if (!youtubeUrl.trim()) return;
    setYoutubeLoading(true);
    setErrorMsg('');

    try {
      const res = await apiPost('/api/youtube', { url: youtubeUrl.trim() });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to process YouTube URL');
      }

      const data = await res.json();

      // Convert base64 audio to blob
      const binaryStr = atob(data.audioBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: data.mimeType });
      const fileUrl = URL.createObjectURL(audioBlob);

      const meetingId = generateId();
      const meeting: Meeting = {
        id: meetingId,
        title: data.title || 'YouTube Recording',
        fileName: `${data.videoId}.mp3`,
        fileUrl,
        fileType: data.mimeType,
        fileSize: data.fileSize,
        duration: data.duration || 0,
        status: 'uploaded',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addMeeting(meeting);
      router.push(`/meeting/${meetingId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'YouTube processing failed';
      setErrorMsg(message);
    } finally {
      setYoutubeLoading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadState('idle');
    setErrorMsg('');
    setUploadProgress(0);
  };

  return (
    <div className="w-full">
      {/* Mode Tabs */}
      <div className="flex items-center gap-1 mb-4 p-1 rounded-xl bg-secondary/50 w-fit mx-auto">
        {[
          { id: 'upload' as InputMode, label: 'Upload File', icon: Upload },
          { id: 'youtube' as InputMode, label: 'YouTube URL', icon: Youtube },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setMode(tab.id); setErrorMsg(''); setUploadState('idle'); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              mode === tab.id
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* YouTube URL Mode */}
        {mode === 'youtube' && (
          <motion.div
            key="youtube"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="relative rounded-2xl border border-border/60 bg-card/50 p-8 glass">
              <div className="flex flex-col items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                  <Youtube className="h-7 w-7" />
                </div>
                <div className="text-center">
                  <p className="font-display text-base font-semibold">Paste a YouTube link</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    We&apos;ll extract the audio and process it with AI
                  </p>
                </div>
                <div className="w-full max-w-lg flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleYoutubeSubmit()}
                      placeholder="https://youtube.com/watch?v=..."
                      className="pl-10 h-12 text-sm bg-secondary/40 border-border/50 focus-visible:ring-primary/30"
                      disabled={youtubeLoading}
                    />
                  </div>
                  <Button
                    onClick={handleYoutubeSubmit}
                    disabled={!youtubeUrl.trim() || youtubeLoading}
                    className="h-12 px-6 gap-2 bg-primary hover:bg-primary/90 shrink-0"
                  >
                    {youtubeLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    {youtubeLoading ? 'Extracting...' : 'Process'}
                  </Button>
                </div>
                {youtubeLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <div className="flex gap-0.5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-primary/60 rounded-full"
                          animate={{ height: [8, 20, 8] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                    Downloading and extracting audio from YouTube...
                  </motion.div>
                )}
                {errorMsg && mode === 'youtube' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-destructive"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {errorMsg}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Upload Mode */}
        {mode === 'upload' && (uploadState === 'idle' || uploadState === 'error') && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div
              {...getRootProps()}
              className={cn(
                "relative group cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ease-out",
                isDragActive
                  ? "border-primary bg-primary/5 scale-[1.01] glow-primary"
                  : "border-border/50 hover:border-primary/40 hover:bg-card/50",
                uploadState === 'error' ? "border-destructive/50" : ""
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-5">
                <motion.div
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
                    isDragActive
                      ? "bg-primary/15 text-primary"
                      : "bg-secondary/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  )}
                  animate={isDragActive ? { scale: [1, 1.1, 1], rotate: [0, 3, -3, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {isDragActive ? <Mic className="h-7 w-7" /> : <Upload className="h-7 w-7" />}
                </motion.div>
                <div>
                  <p className="font-display text-lg font-semibold text-foreground">
                    {isDragActive ? 'Drop your recording here' : 'Upload a meeting recording'}
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Drag & drop or click to browse — MP3, WAV, MP4, WebM, M4A up to 100MB
                  </p>
                </div>
                {uploadState === 'error' && errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-destructive"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {errorMsg}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {mode === 'upload' && uploadState === 'selected' && selectedFile && (
          <motion.div
            key="selected"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-border/60 bg-card/80 p-6 glass"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <FileAudio className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile} className="shrink-0 hover:bg-destructive/10 hover:text-destructive">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-5 flex gap-3">
              <Button onClick={handleUpload} className="flex-1 h-11 gap-2 bg-primary hover:bg-primary/90 font-medium">
                <ArrowRight className="h-4 w-4" />
                Process Recording
              </Button>
              <Button variant="outline" onClick={clearFile} className="h-11">Cancel</Button>
            </div>
          </motion.div>
        )}

        {mode === 'upload' && uploadState === 'uploading' && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-border/60 bg-card/80 p-6 glass"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Preparing recording...</p>
                <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
              </div>
              <span className="text-sm font-mono text-primary tabular-nums">
                {Math.round(uploadProgress)}%
              </span>
            </div>
            <div className="mt-4 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
