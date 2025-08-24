// app/api/text-to-speech/route.ts
import { NextResponse } from 'next/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export const runtime = 'nodejs';

const eleven = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

type CharAlign = { char: string; start: number; end: number }; // seconds

function charsToWordTimestamps(chars: CharAlign[]) {
  const words: { text: string; start: number; end: number }[] = [];
  let current = '';
  let start = 0;
  let active = false;

  const push = () => {
    if (!current.trim()) return;
    words.push({ text: current, start, end: lastEnd });
  };

  let lastEnd = 0;
  for (const c of chars) {
    // skip newlines; keep spaces to detect word break
    const ch = c.char;
    if (!active && /\S/.test(ch)) {
      start = c.start;
      active = true;
    }
    current += ch;
    lastEnd = c.end;

    // word boundary on whitespace or common punctuation
    if (active && /[\s.,?!;:]/.test(ch)) {
      push();
      current = '';
      active = false;
    }
  }
  // tail
  if (active || current.trim()) {
    push();
  }
  return words;
}

export async function POST(req: Request) {
  try {
    const { text, voice_id, model_id = 'eleven_multilingual_v2', output_format = 'mp3_44100_128' } =
      await req.json();

    if (!text || !voice_id) {
      return NextResponse.json({ error: 'Missing text or voice_id' }, { status: 400 });
    }

    // SDK: convertWithTimestamps(voiceId, body)
    const res: any = await eleven.textToSpeech.convertWithTimestamps(voice_id, {
      text,
      modelId: model_id,
      outputFormat: output_format,
    });

    const audioBase64 = res.audioBase64 ?? res.audio_base64;
    const alignment = res.alignment as { characters: Array<{ char: string; start: number; end: number }> } | undefined;

    if (!audioBase64) {
      return NextResponse.json({ error: 'No audio returned from TTS' }, { status: 502 });
    }

    const timestamps =
      alignment?.characters?.length ? charsToWordTimestamps(alignment.characters as CharAlign[]) : [];

    return NextResponse.json({
      audioBase64,
      timestamps, // [{ text, start, end }]
    });
  } catch (err) {
    console.error('TTS Error:', err);
    return NextResponse.json({ error: 'Failed to generate TTS' }, { status: 500 });
  }
}
