import { NextRequest, NextResponse } from 'next/server';
import { getGroqFromRequest } from '@/lib/api-key';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const groq = getGroqFromRequest(req);

    // Groq supports whisper-large-v3 and whisper-large-v3-turbo for free
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    const rawSegments = (transcription as unknown as { segments?: Array<{ text?: string; start: number; end: number }> }).segments || [];
    const segments = rawSegments.map((seg, idx) => ({
      id: `seg-${idx}`,
      text: (seg.text || '').trim(),
      start: seg.start,
      end: seg.end,
    }));

    return NextResponse.json({
      text: transcription.text,
      segments,
      language: (transcription as unknown as { language?: string }).language || 'en',
      duration: segments.length > 0 ? segments[segments.length - 1].end : 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Transcription failed';
    console.error('Transcription error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
