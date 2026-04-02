import { NextRequest, NextResponse } from 'next/server';
import { getGroqFromRequest } from '@/lib/api-key';

export const maxDuration = 30;

interface TranscriptEntry {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

interface HistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, transcript, history } = body as {
      question: string;
      transcript: TranscriptEntry[];
      history: HistoryEntry[];
    };

    if (!question || !transcript) {
      return NextResponse.json({ error: 'Missing question or transcript' }, { status: 400 });
    }

    const groq = getGroqFromRequest(req);

    const transcriptContext = transcript
      .map((s: TranscriptEntry) => `[${s.start.toFixed(1)}s-${s.end.toFixed(1)}s] ${s.speaker}: ${s.text}`)
      .join('\n');

    const systemPrompt = `You are an intelligent meeting assistant. Answer questions about the meeting transcript below.

IMPORTANT:
- Base your answers ONLY on the transcript content
- Include specific citations with timestamps and speaker names
- If the answer isn't in the transcript, say so clearly
- Be concise but thorough

Return ONLY valid JSON (no markdown fences), with this structure:
{
  "answer": "<your detailed answer>",
  "citations": [
    {
      "text": "<relevant quote from transcript>",
      "start": <timestamp in seconds as number>,
      "end": <timestamp in seconds as number>,
      "speaker": "<speaker name>"
    }
  ]
}

TRANSCRIPT:
${transcriptContext}`;

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    if (history && history.length > 0) {
      history.forEach((h: HistoryEntry) => {
        messages.push({ role: h.role, content: h.content });
      });
    }

    messages.push({ role: 'user', content: question });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages,
      temperature: 0.3,
      max_tokens: 2000,
    });

    const rawContent = completion.choices[0].message.content || '{}';
    const cleaned = rawContent.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
    const result = JSON.parse(cleaned);

    return NextResponse.json({
      answer: result.answer || 'I could not find an answer in the transcript.',
      citations: result.citations || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Q&A failed';
    console.error('QA error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
