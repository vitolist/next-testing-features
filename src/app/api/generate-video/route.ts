// app/api/generate-video/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

type WordTS = { text: string; start: number; end: number };

function toSrtTime(sec: number) {
  // 00:00:00,000
  const ms = Math.round(sec * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  const ms3 = String(ms % 1000).padStart(3, '0');
  return `${h}:${m}:${s},${ms3}`;
}

function wordsToSrt(words: WordTS[]) {
  // group words into short lines (~7–10 words per line)
  const lines: { start: number; end: number; text: string }[] = [];
  if (!words.length) return '';
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, Math.min(i + 8, words.length)); // 8 words per cue
    const start = chunk[0].start;
    const end = chunk[chunk.length - 1].end;
    const text = chunk.map((w) => w.text).join('');
    lines.push({ start, end, text: text.trim() });
    i += 8;
  }

  return lines
    .map((l, idx) => `${idx + 1}\n${toSrtTime(l.start)} --> ${toSrtTime(l.end)}\n${l.text}\n`)
    .join('\n');
}

export async function POST(req: Request) {
  try {
    const { audioBase64, timestamps } = (await req.json()) as {
      audioBase64: string;
      timestamps: WordTS[];
    };

    if (!audioBase64) {
      return NextResponse.json({ error: 'Missing audioBase64' }, { status: 400 });
    }

    const id = randomUUID();
    const pubDir = path.join(process.cwd(), 'public');
    const audioPath = path.join(pubDir, `tts_${id}.mp3`);
    const srtPath = path.join(pubDir, `subs_${id}.srt`);
    const inputVideo = path.join(pubDir, 'sample.mp4');
    const outputVideo = path.join(pubDir, `final_${id}.mp4`);

    // write audio
    const buf = Buffer.from(audioBase64, 'base64');
    await fs.writeFile(audioPath, buf);

    // write SRT
    const srtContent = wordsToSrt(timestamps || []);
    await fs.writeFile(srtPath, srtContent);

    // FFmpeg: burn subtitles, replace audio, keep shortest
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputVideo)
        .input(audioPath)
        .outputOptions([
          '-shortest',
          '-map 0:v:0',
          '-map 1:a:0',
          '-c:v libx264',
          '-c:a aac',
          '-b:a 192k',
        ])
        .videoFilters(
          // Use drawtext via subtitles for simplicity; escape path
          `subtitles='${srtPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:')}'`
        )
        .on('end', resolve)
        .on('error', reject)
        .save(outputVideo);
    });

    // optionally cleanup temp audio + srt (keep final video)
    await fs.unlink(audioPath).catch(() => {});
    await fs.unlink(srtPath).catch(() => {});

    return NextResponse.json({ url: `/final_${id}.mp4` });
  } catch (err) {
    console.error('Video Generation Error:', err);
    return NextResponse.json({ error: 'Failed to generate video' }, { status: 500 });
  }
}
