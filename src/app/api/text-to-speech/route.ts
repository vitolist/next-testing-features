// app/api/text-to-speech/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const { text, voice_id } = await req.json();

    // Request raw audio
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
      {
        text,
        model_id: 'eleven_monolingual_v1',
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        responseType: 'arraybuffer', // get raw bytes
      }
    );

    // response.data is already a Buffer/ArrayBuffer
    const audioBuffer = Buffer.from(response.data);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json({ error: 'Error generating TTS' }, { status: 500 });
  }
}
