export interface Meeting {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  duration: number;
  status: 'uploading' | 'uploaded' | 'transcribing' | 'processing' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
  summary?: string;
  transcript?: TranscriptSegment[];
  actionItems?: ActionItem[];
  decisions?: Decision[];
  keyQuestions?: KeyQuestion[];
  chapters?: Chapter[];
  embeddings?: EmbeddingChunk[];
}

export interface TranscriptSegment {
  id: string;
  speaker: string;
  speakerColor: string;
  text: string;
  start: number;
  end: number;
  words?: TranscriptWord[];
}

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

export interface ActionItem {
  id: string;
  text: string;
  assignee: string;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export interface Decision {
  id: string;
  text: string;
  madeBy?: string;
  context: string;
  timestamp: number;
}

export interface KeyQuestion {
  id: string;
  question: string;
  askedBy?: string;
  answered: boolean;
  answer?: string;
  timestamp: number;
}

export interface Chapter {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  start: number;
  end: number;
}

export interface EmbeddingChunk {
  id: string;
  text: string;
  start: number;
  end: number;
  embedding: number[];
}

export interface QAMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: string;
}

export interface Citation {
  text: string;
  start: number;
  end: number;
  speaker: string;
}

export interface ProcessingProgress {
  stage: 'uploading' | 'transcribing' | 'diarizing' | 'extracting' | 'embedding' | 'complete';
  progress: number;
  message: string;
}

export type SpeakerColorMap = Record<string, string>;

export const SPEAKER_COLORS = [
  'oklch(0.65 0.22 265)',  // indigo
  'oklch(0.78 0.16 85)',   // amber
  'oklch(0.65 0.18 170)',  // teal
  'oklch(0.60 0.20 330)',  // pink
  'oklch(0.70 0.15 30)',   // orange
  'oklch(0.60 0.20 140)',  // green
  'oklch(0.65 0.18 290)',  // purple
  'oklch(0.70 0.14 200)',  // cyan
];

export const ACCEPTED_FILE_TYPES = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-wav': ['.wav'],
  'audio/webm': ['.webm'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'audio/mp4': ['.m4a'],
  'audio/x-m4a': ['.m4a'],
};

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
