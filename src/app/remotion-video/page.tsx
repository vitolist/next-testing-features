'use client';

import { useState } from 'react';
import type { RenderProps } from '@/remotion/schema';

const defaultJson: RenderProps = {
  messages: [
    { id: '1', from: 'them', text: 'Hey! Ready for the demo?' },
    { id: '2', from: 'me',   text: 'Yep, exporting to MP4 now.' },
    { id: '3', from: 'them', text: 'Sweet!' }
  ],
  theme: {
    bg: '#f1f5f9',
    headerBg: '#2563eb',
    headerText: '#ffffff',
    myBubble: '#3b82f6',
    myText: '#ffffff',
    theirBubble: '#e5e7eb',
    theirText: '#111827',
    radius: 18,
    maxBubbleWidth: 820
  },
  messageIntervalSec: 0.8,
  padding: 28
};

export default function Home() {
  const [text, setText] = useState(JSON.stringify(defaultJson, null, 2));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function render() {
    try {
      setErr(null);
      setLoading(true);
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `chat-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to render');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Chat → MP4</h1>
      <p className="text-sm text-slate-600">
        Paste JSON matching the schema (messages, theme, timings), then click Render.
      </p>
      <textarea
        className="w-full h-96 border rounded p-3 font-mono text-sm"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={render}
        disabled={loading}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {loading ? 'Rendering…' : 'Render MP4'}
      </button>
      {err && <div className="text-red-600 text-sm">{err}</div>}
    </main>
  );
}
