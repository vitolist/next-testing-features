'use client';

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

type Props = {
  /** The element you want to record (e.g., your chat container). */
  targetRef: React.RefObject<HTMLElement>;
  /** Frames per second to render; 24–30 is a good balance. */
  fps?: number;
  /** Recording duration in ms; if omitted, you’ll stop manually. */
  durationMs?: number;
  /** Scale multiplier for sharpness (defaults to devicePixelRatio). */
  scale?: number;
};

export default function ElementToVideoRecorder({
  targetRef,
  fps = 30,
  durationMs,
  scale,
}: Props) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    try {
      setError(null);
      const target = targetRef.current;
      if (!target) {
        throw new Error('Target element not found.');
      }

      // Measure target & create a recording canvas
      const rect = target.getBoundingClientRect();
      const dpr = scale ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));

      const recCanvas = document.createElement('canvas');
      recCanvas.width = width;
      recCanvas.height = height;
      canvasRef.current = recCanvas;
      const ctx = recCanvas.getContext('2d');
      if (!ctx) throw new Error('2D context not available.');

      // Start capturing the canvas stream
      const stream = (recCanvas as HTMLCanvasElement).captureStream(fps);
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data?.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mime });

        // Try File System Access API; fallback to link download
        try {
          // @ts-ignore
          const handle = await window.showSaveFilePicker({
            suggestedName: `chat-mockup-${Date.now()}.webm`,
            types: [{ description: 'WebM Video', accept: { 'video/webm': ['.webm'] } }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `chat-mockup-${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }

        setIsRecording(false);
      };

      // Render loop: rasterize the target and draw onto the recording canvas
      const frameInterval = 1000 / fps;
      let lastTime = 0;
      let elapsed = 0;

      const renderFrame = async (now: number) => {
        rafRef.current = requestAnimationFrame(renderFrame);

        if (now - lastTime < frameInterval) return;
        lastTime = now;

        // Snapshot the DOM node to a canvas (expensive; keep fps modest)
        const snap = await html2canvas(target, {
          backgroundColor: null,
          scale: dpr,
          useCORS: true, // helpful for same-origin images
        });

        // Draw snapshot onto recording canvas
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(snap, 0, 0, width, height);

        if (durationMs) {
          elapsed += frameInterval;
          if (elapsed >= durationMs) stop();
        }
      };

      recorder.start(200); // collect chunks every 200ms
      setIsRecording(true);
      rafRef.current = requestAnimationFrame(renderFrame);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start recording.');
      setIsRecording(false);
    }
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    recorderRef.current?.stop();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={start}
        disabled={isRecording}
        className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        Start (element → video)
      </button>
      <button
        onClick={stop}
        disabled={!isRecording}
        className="px-3 py-2 rounded bg-slate-200"
      >
        Stop & Save
      </button>
      {error && <span className="text-red-600 text-sm">{error}</span>}
    </div>
  );
}
