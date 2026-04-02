'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Download, Copy, FileText, FileJson, ExternalLink, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCopyToClipboard } from '@/hooks';
import { apiPost } from '@/lib/client-api';
import { formatTime } from '@/lib/format';
import type { Meeting } from '@/types';

interface ExportPanelProps {
  meeting: Meeting;
}

export function ExportPanel({ meeting }: ExportPanelProps) {
  const [copiedText, copyToClipboard] = useCopyToClipboard();
  const isCopied = copiedText !== null;
  const [notionKey, setNotionKey] = useState('');
  const [notionPageId, setNotionPageId] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);

  const generateMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# ${meeting.title}`);
    lines.push(`*Processed by EchoLens*\n`);

    if (meeting.summary) {
      lines.push(`## Summary`);
      lines.push(meeting.summary + '\n');
    }

    if (meeting.actionItems && meeting.actionItems.length > 0) {
      lines.push(`## Action Items`);
      meeting.actionItems.forEach(item => {
        const checkbox = item.completed ? '- [x]' : '- [ ]';
        let line = `${checkbox} ${item.text}`;
        if (item.assignee) line += ` (@${item.assignee})`;
        if (item.deadline) line += ` — due ${item.deadline}`;
        lines.push(line);
      });
      lines.push('');
    }

    if (meeting.decisions && meeting.decisions.length > 0) {
      lines.push(`## Decisions`);
      meeting.decisions.forEach(d => {
        lines.push(`- **${d.text}**${d.madeBy ? ` (by ${d.madeBy})` : ''}`);
      });
      lines.push('');
    }

    if (meeting.chapters && meeting.chapters.length > 0) {
      lines.push(`## Chapters`);
      meeting.chapters.forEach(ch => {
        lines.push(`### ${ch.title} (${formatTime(ch.start)})`);
        lines.push(ch.summary);
        if (ch.keyPoints.length > 0) {
          ch.keyPoints.forEach(p => lines.push(`- ${p}`));
        }
        lines.push('');
      });
    }

    if (meeting.transcript && meeting.transcript.length > 0) {
      lines.push(`## Transcript`);
      meeting.transcript.forEach(seg => {
        lines.push(`**${seg.speaker}** (${formatTime(seg.start)}): ${seg.text}`);
      });
    }

    return lines.join('\n');
  };

  const generateJSON = () => {
    return JSON.stringify({
      title: meeting.title,
      date: meeting.createdAt,
      duration: meeting.duration,
      summary: meeting.summary,
      actionItems: meeting.actionItems,
      decisions: meeting.decisions,
      keyQuestions: meeting.keyQuestions,
      chapters: meeting.chapters,
      transcript: meeting.transcript?.map(s => ({
        speaker: s.speaker,
        text: s.text,
        start: s.start,
        end: s.end,
      })),
    }, null, 2);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyActionItems = () => {
    if (!meeting.actionItems) return;
    const text = meeting.actionItems
      .map(item => `${item.completed ? '✅' : '⬜'} ${item.text}${item.assignee ? ` → ${item.assignee}` : ''}`)
      .join('\n');
    copyToClipboard(text);
  };

  const copyFullNotes = () => {
    copyToClipboard(generateMarkdown());
  };

  const handleNotionExport = async () => {
    if (!notionKey || !notionPageId) return;
    setIsExporting(true);
    setExportResult(null);

    try {
      const res = await apiPost('/api/export/notion', {
        notionKey,
        parentPageId: notionPageId,
        meeting: {
          title: meeting.title,
          summary: meeting.summary,
          actionItems: meeting.actionItems,
          decisions: meeting.decisions,
          chapters: meeting.chapters,
          transcript: meeting.transcript?.map(s => ({
            speaker: s.speaker,
            text: s.text,
            start: s.start,
          })),
        },
      });

      const data = await res.json();
      if (res.ok) {
        setExportResult('success');
      } else {
        setExportResult(data.error || 'Export failed');
      }
    } catch {
      setExportResult('Network error. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-380px)] min-h-[300px] overflow-y-auto space-y-6 pr-2 no-scrollbar">
      {/* Quick Export */}
      <div>
        <h3 className="font-display text-sm font-semibold mb-3">Quick Export</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="gap-2 h-auto py-3 flex-col items-start"
            onClick={() => downloadFile(generateMarkdown(), `${meeting.title}.md`, 'text/markdown')}
          >
            <FileText className="h-4 w-4 text-primary" />
            <div className="text-left">
              <p className="text-xs font-medium">Markdown</p>
              <p className="text-[10px] text-muted-foreground">Full notes as .md</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="gap-2 h-auto py-3 flex-col items-start"
            onClick={() => downloadFile(generateJSON(), `${meeting.title}.json`, 'application/json')}
          >
            <FileJson className="h-4 w-4 text-accent" />
            <div className="text-left">
              <p className="text-xs font-medium">JSON</p>
              <p className="text-[10px] text-muted-foreground">Structured data</p>
            </div>
          </Button>
        </div>
      </div>

      {/* Copy to Clipboard */}
      <div>
        <h3 className="font-display text-sm font-semibold mb-3">Copy to Clipboard</h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={copyActionItems}
            disabled={!meeting.actionItems?.length}
          >
            {isCopied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            Copy Action Items
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={copyFullNotes}
          >
            {isCopied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            Copy Full Notes
          </Button>
        </div>
      </div>

      {/* Notion Export */}
      <div>
        <h3 className="font-display text-sm font-semibold mb-3 flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          Notion Export
        </h3>
        <div className="space-y-2">
          <Input
            placeholder="Notion API Key (ntn_...)"
            value={notionKey}
            onChange={(e) => setNotionKey(e.target.value)}
            type="password"
            className="text-sm"
          />
          <Input
            placeholder="Parent Page ID"
            value={notionPageId}
            onChange={(e) => setNotionPageId(e.target.value)}
            className="text-sm"
          />
          <Button
            onClick={handleNotionExport}
            disabled={!notionKey || !notionPageId || isExporting}
            className="w-full gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export to Notion
          </Button>
          {exportResult && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-xs ${exportResult === 'success' ? 'text-primary' : 'text-destructive'}`}
            >
              {exportResult === 'success' ? 'Exported successfully to Notion!' : exportResult}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
