import { NextRequest, NextResponse } from 'next/server';

interface MeetingData {
  title: string;
  summary?: string;
  actionItems?: Array<{
    text: string;
    assignee: string;
    deadline?: string;
    priority: string;
    completed: boolean;
  }>;
  decisions?: Array<{
    text: string;
    madeBy?: string;
  }>;
  chapters?: Array<{
    title: string;
    summary: string;
    keyPoints: string[];
  }>;
  transcript?: Array<{
    speaker: string;
    text: string;
    start: number;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { notionKey, parentPageId, meeting } = body as {
      notionKey: string;
      parentPageId: string;
      meeting: MeetingData;
    };

    if (!notionKey || !parentPageId || !meeting) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create page with Notion API
    const children: Record<string, unknown>[] = [];

    // Summary
    if (meeting.summary) {
      children.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Summary' } }],
        },
      });
      children.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: meeting.summary } }],
        },
      });
    }

    // Action Items as to-do blocks
    if (meeting.actionItems && meeting.actionItems.length > 0) {
      children.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Action Items' } }],
        },
      });

      meeting.actionItems.forEach((item) => {
        const text = `${item.text}${item.assignee ? ` → ${item.assignee}` : ''}${item.deadline ? ` (due: ${item.deadline})` : ''}`;
        children.push({
          object: 'block',
          type: 'to_do',
          to_do: {
            rich_text: [{ type: 'text', text: { content: text } }],
            checked: item.completed,
          },
        });
      });
    }

    // Decisions
    if (meeting.decisions && meeting.decisions.length > 0) {
      children.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Decisions' } }],
        },
      });

      meeting.decisions.forEach((d) => {
        children.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { type: 'text', text: { content: d.text }, annotations: { bold: true } },
              ...(d.madeBy ? [{ type: 'text', text: { content: ` (by ${d.madeBy})` } }] : []),
            ],
          },
        });
      });
    }

    // Chapters
    if (meeting.chapters && meeting.chapters.length > 0) {
      children.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Chapters' } }],
        },
      });

      meeting.chapters.forEach((ch) => {
        children.push({
          object: 'block',
          type: 'heading_3',
          heading_3: {
            rich_text: [{ type: 'text', text: { content: ch.title } }],
          },
        });
        children.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: ch.summary } }],
          },
        });
        ch.keyPoints.forEach((point) => {
          children.push({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: point } }],
            },
          });
        });
      });
    }

    // Notion API request
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { page_id: parentPageId },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: `📋 ${meeting.title} — Meeting Notes`,
                },
              },
            ],
          },
        },
        children: children.slice(0, 100), // Notion limit
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json(
        { error: err.message || 'Notion API error' },
        { status: response.status }
      );
    }

    const page = await response.json();
    return NextResponse.json({ success: true, pageId: page.id, url: page.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed';
    console.error('Notion export error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
