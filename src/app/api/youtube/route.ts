import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export const maxDuration = 300;

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // Pre-flight: check yt-dlp is available
    try {
      await execAsync('yt-dlp --version', { timeout: 5000 });
    } catch {
      return NextResponse.json({
        error: 'YouTube import requires yt-dlp to be installed on the server. Install it with: brew install yt-dlp (macOS) or pip install yt-dlp (Linux/Windows). This feature works locally but is not available on serverless hosts like Vercel.',
      }, { status: 503 });
    }

    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL. Supported formats: youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/...' }, { status: 400 });
    }

    const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const tmpDir = '/tmp/echolens';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const outputPath = path.join(tmpDir, `${videoId}.mp3`);

    // Get video info first
    let title = 'YouTube Video';
    let duration = 0;
    try {
      const { stdout: infoJson } = await execAsync(
        `yt-dlp --dump-json --no-download "${fullUrl}" 2>/dev/null`,
        { timeout: 30000 }
      );
      const info = JSON.parse(infoJson);
      title = info.title || title;
      duration = info.duration || 0;
    } catch {
      // Continue without metadata
    }

    // Download audio as mp3
    await execAsync(
      `yt-dlp -x --audio-format mp3 --audio-quality 4 -o "${outputPath}" --no-playlist --max-filesize 100m "${fullUrl}" 2>&1`,
      { timeout: 180000 }
    );

    if (!fs.existsSync(outputPath)) {
      return NextResponse.json({ error: 'Failed to download audio. The video might be restricted or unavailable.' }, { status: 500 });
    }

    const fileBuffer = fs.readFileSync(outputPath);
    const fileSize = fileBuffer.length;

    // Clean up
    try { fs.unlinkSync(outputPath); } catch { /* ignore */ }

    // Return audio as base64 with metadata
    const base64Audio = fileBuffer.toString('base64');

    return NextResponse.json({
      title: title.replace(/[-_]/g, ' '),
      duration,
      fileSize,
      audioBase64: base64Audio,
      mimeType: 'audio/mpeg',
      videoId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'YouTube download failed';
    console.error('YouTube error:', message);

    if (message.includes('timeout')) {
      return NextResponse.json({ error: 'Download timed out. Try a shorter video.' }, { status: 408 });
    }

    return NextResponse.json({ error: 'Failed to extract audio from YouTube. The video might be private, age-restricted, or unavailable.' }, { status: 500 });
  }
}
