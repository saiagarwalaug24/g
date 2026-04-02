import { NextRequest, NextResponse } from 'next/server';
import { getGroqFromRequest } from '@/lib/api-key';

export const maxDuration = 60;

interface RawSegment {
  id: string;
  text: string;
  start: number;
  end: number;
}

const SPEAKER_COLORS = [
  'oklch(0.65 0.22 265)',
  'oklch(0.78 0.16 85)',
  'oklch(0.65 0.18 170)',
  'oklch(0.60 0.20 330)',
  'oklch(0.70 0.15 30)',
  'oklch(0.60 0.20 140)',
  'oklch(0.65 0.18 290)',
  'oklch(0.70 0.14 200)',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { segments, fullText } = body as { segments: RawSegment[]; fullText: string };

    if (!segments || !fullText) {
      return NextResponse.json({ error: 'Missing segments or fullText' }, { status: 400 });
    }

    const groq = getGroqFromRequest(req);

    const systemPrompt = `You are an AI meeting analyst. Analyze the following meeting transcript and extract structured information.

For speaker diarization: Infer different speakers based on context, conversation flow, pronouns, topic changes, and speech patterns. Assign names like "Speaker 1", "Speaker 2" etc., or infer real names if mentioned in the conversation.

Return ONLY valid JSON, no markdown, no explanation, just the JSON object with this exact structure:
{
  "speakers": {
    "<segment_id>": "<speaker_name>"
  },
  "summary": "<2-3 sentence meeting summary>",
  "actionItems": [
    {
      "text": "<action item description>",
      "assignee": "<person responsible or 'Unassigned'>",
      "deadline": "<deadline if mentioned or null>",
      "priority": "high|medium|low"
    }
  ],
  "decisions": [
    {
      "text": "<decision made>",
      "madeBy": "<who made it or null>",
      "context": "<brief context>",
      "segmentId": "<closest segment_id>"
    }
  ],
  "keyQuestions": [
    {
      "question": "<question asked>",
      "askedBy": "<who asked or null>",
      "answered": true,
      "answer": "<answer if given or null>",
      "segmentId": "<closest segment_id>"
    }
  ],
  "chapters": [
    {
      "title": "<chapter title>",
      "summary": "<1-2 sentence chapter summary>",
      "keyPoints": ["<key point 1>", "<key point 2>"],
      "startSegmentId": "<first segment_id in this chapter>",
      "endSegmentId": "<last segment_id in this chapter>"
    }
  ]
}`;

    const segmentList = segments.map((s: RawSegment) => `[${s.id}] (${s.start.toFixed(1)}s-${s.end.toFixed(1)}s): ${s.text}`).join('\n');

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Meeting transcript:\n\n${segmentList}` },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const rawContent = completion.choices[0].message.content || '{}';
    // Strip markdown code fences if present
    const cleaned = rawContent.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
    const result = JSON.parse(cleaned);

    const speakerNames = [...new Set(Object.values(result.speakers || {}) as string[])];
    const speakerColorMap: Record<string, string> = {};
    speakerNames.forEach((name, i) => {
      speakerColorMap[name] = SPEAKER_COLORS[i % SPEAKER_COLORS.length];
    });

    const processedSegments = segments.map((seg: RawSegment) => {
      const speaker = (result.speakers || {})[seg.id] || 'Speaker 1';
      return {
        ...seg,
        speaker,
        speakerColor: speakerColorMap[speaker] || SPEAKER_COLORS[0],
      };
    });

    const segmentMap = new Map(segments.map((s: RawSegment) => [s.id, s]));

    const actionItems = (result.actionItems || []).map((item: Record<string, unknown>, idx: number) => ({
      id: `action-${idx}`,
      text: item.text,
      assignee: item.assignee || 'Unassigned',
      deadline: item.deadline || null,
      priority: item.priority || 'medium',
      completed: false,
    }));

    const decisions = (result.decisions || []).map((d: Record<string, unknown>, idx: number) => {
      const seg = segmentMap.get(d.segmentId as string);
      return {
        id: `decision-${idx}`,
        text: d.text,
        madeBy: d.madeBy || null,
        context: d.context || '',
        timestamp: seg ? (seg as RawSegment).start : 0,
      };
    });

    const keyQuestions = (result.keyQuestions || []).map((q: Record<string, unknown>, idx: number) => {
      const seg = segmentMap.get(q.segmentId as string);
      return {
        id: `question-${idx}`,
        question: q.question,
        askedBy: q.askedBy || null,
        answered: q.answered || false,
        answer: q.answer || null,
        timestamp: seg ? (seg as RawSegment).start : 0,
      };
    });

    const chapters = (result.chapters || []).map((ch: Record<string, unknown>, idx: number) => {
      const startSeg = segmentMap.get(ch.startSegmentId as string);
      const endSeg = segmentMap.get(ch.endSegmentId as string);
      return {
        id: `chapter-${idx}`,
        title: ch.title,
        summary: ch.summary,
        keyPoints: ch.keyPoints || [],
        start: startSeg ? (startSeg as RawSegment).start : 0,
        end: endSeg ? (endSeg as RawSegment).end : 0,
      };
    });

    return NextResponse.json({
      segments: processedSegments,
      summary: result.summary || '',
      actionItems,
      decisions,
      keyQuestions,
      chapters,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Processing failed';
    console.error('Process error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
