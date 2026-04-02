# EchoLens — AI-Powered Meeting Intelligence & Action Extractor

Upload meeting recordings and get AI-powered transcription with speaker diarization, auto-generated action items, smart chapters, semantic Q&A, and one-click exports.

## Features

- **Drag & Drop Upload** — MP3, WAV, MP4, WebM, M4A up to 100MB
- **Waveform Visualization** — Interactive wavesurfer.js player synced with transcript
- **AI Transcription** — OpenAI Whisper with word-level timestamps
- **Speaker Diarization** — GPT-4 inferred speaker labels with color coding
- **Action Items** — Auto-extracted with assignee detection, deadlines, and priority
- **Decisions & Key Questions** — Structured extraction from conversation context
- **Smart Chapters** — AI-generated topic breakdown with clickable timestamps
- **Ask AI (Q&A)** — Chat with your transcript, get cited answers
- **Export** — Markdown, JSON, clipboard copy, Notion API integration
- **Dark/Light Theme** — Studio Monitor dark aesthetic with theme switching

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion
- **Audio**: wavesurfer.js for waveform visualization
- **State**: Zustand with localStorage persistence
- **AI**: OpenAI Whisper (transcription) + GPT-4o-mini (processing + Q&A)
- **UI**: Radix UI primitives, Lucide icons, shadcn/ui components

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

### Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for Whisper + GPT-4 |
| `NOTION_API_KEY` | No | Notion integration key for export |
| `NEXT_PUBLIC_APP_URL` | No | App URL (auto-detected on Vercel) |

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push this repo to GitHub
2. Import in Vercel
3. Add `OPENAI_API_KEY` to Environment Variables
4. Deploy

The app uses Next.js API routes — no separate backend needed.

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Dashboard — upload zone + meeting list
│   ├── meeting/[id]/page.tsx # Meeting view — waveform, transcript, AI panels
│   ├── settings/page.tsx     # API key configuration
│   └── api/
│       ├── transcribe/       # Whisper API transcription
│       ├── process/          # GPT-4 speaker diarization + extraction
│       ├── qa/               # Semantic Q&A over transcript
│       └── export/notion/    # Notion API page creation
├── components/
│   ├── waveform-player.tsx   # wavesurfer.js audio player
│   ├── transcript-viewer.tsx # Synced transcript with auto-scroll
│   ├── action-items.tsx      # Actions, decisions, questions panel
│   ├── chapter-breakdown.tsx # Clickable chapter navigation
│   ├── qa-chat.tsx           # Chat interface for transcript Q&A
│   ├── export-panel.tsx      # Markdown/JSON/Notion export
│   ├── upload-zone.tsx       # Drag-drop file upload
│   └── processing-overlay.tsx # Multi-stage processing UI
└── lib/
    ├── store.ts              # Zustand state management
    ├── format.ts             # Time/size formatting utilities
    └── openai.ts             # OpenAI client factory
```

## Processing Pipeline

1. **Upload** → File stored as browser blob URL (or Supabase Storage)
2. **Transcribe** → OpenAI Whisper API → segments with timestamps
3. **Process** → GPT-4o-mini structured output:
   - Speaker diarization (inferred from context)
   - Action items with assignees
   - Decisions and key questions
   - Chapter breakdown with summaries
4. **Q&A** → Full transcript context + GPT-4o-mini for cited answers

## License

MIT
