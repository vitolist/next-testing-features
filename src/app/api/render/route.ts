export const runtime = 'nodejs'; // needed for fs/child_process
export const maxDuration = 60;   // Next.js limit guard
export const dynamic = 'force-dynamic'; // avoid caching

import { NextRequest } from 'next/server';
import { bundle } from '@remotion/bundler';
import { renderMedia } from '@remotion/renderer';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { RenderProps } from '@/remotion/schema';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        // Validate input (throws on invalid)
        const props = RenderProps.parse(body) as RenderProps;

        // Bundle your Remotion project (do this per request for simplicity).
        // For higher throughput, pre-bundle at boot and cache `serveUrl`.
        const entry = path.resolve(process.cwd(), 'remotion', 'index.ts');
        const serveUrl = await bundle(entry);

        const output = path.join(os.tmpdir(), `chat-${Date.now()}.mp4`);

        await renderMedia({
            serveUrl,
            composition: 'ChatVideo', // from Root.tsx
            codec: 'h264',
            inputProps: props,
            outputLocation: output,
            // “Mobile-like” rendering tends to be happier with more memory + WebGL disabled:
            chromiumOptions: { disableWebSecurity: true },
            envVariables: {}, // if you need any
        });

        const file = await fs.readFile(output);
        // Clean up temp file (optional)
        fs.unlink(output).catch(() => { });
        return new Response(file, {
            headers: {
                'Content-Type': 'video/mp4',
                'Content-Disposition': 'attachment; filename="chat.mp4"',
                'Cache-Control': 'no-store',
            },
        });
    } catch (err: any) {
        const msg = err?.message || 'Render failed';
        return new Response(JSON.stringify({ error: msg }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
