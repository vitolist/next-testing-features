'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Volume2, Play, Download, Loader2, Mic, Clapperboard } from 'lucide-react';


type WordTS = { text: string; start: number; end: number };

export default function HomePage() {
    const [text, setText] = useState('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [timestamps, setTimestamps] = useState<WordTS[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const [audioBase64, setAudioBase64] = useState<string | null>(null);
    const [finalUrl, setFinalUrl] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState(false);


    const audioRef = useRef<HTMLAudioElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const rafRef = useRef<number | null>(null);

    function base64ToBlobUrl(b64: string, mime = 'audio/mpeg') {
        const byteChars = atob(b64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        return URL.createObjectURL(blob);
    }


    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const generateSpeech = async () => {
        if (!text.trim()) return;

        setIsGenerating(true);
        setFinalUrl(null); // clear previous rendered video
        try {
            const res = await fetch('/api/tts-timestamps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    voice_id: '21m00Tcm4TlvDq8ikWAM',
                }),
            });

            if (!res.ok) {
                console.error('Failed to generate speech');
                return;
            }

            const { audioBase64: b64, timestamps: ts } = await res.json();
            if (!b64) return;

            setAudioBase64(b64);
            setTimestamps(ts || []);

            // make a playable URL for the audio player
            const url = base64ToBlobUrl(b64, 'audio/mpeg');
            setAudioUrl(url);
        } catch (error) {
            console.error('Error generating speech:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const renderVideo = async () => {
        if (!audioBase64) return;
        setIsRendering(true);
        try {
            const res = await fetch('/api/generate-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64, timestamps }),
            });

            if (!res.ok) {
                console.error('Failed to render video');
                return;
            }

            const { url } = await res.json();
            if (url) setFinalUrl(url);
        } catch (e) {
            console.error('Render error:', e);
        } finally {
            setIsRendering(false);
        }
    };

    const downloadAudio = () => {
        if (!audioUrl) return;
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = 'speech.mp3';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const tick = () => {
        const a = audioRef.current;
        if (!a || !timestamps.length) return;
        const t = a.currentTime;
        // find last word whose start <= t < end
        // simple linear scan is fine for ~thousands; binary search if huge
        let idx = timestamps.findIndex((w) => t >= w.start && t < w.end);
        if (idx === -1 && t >= (timestamps[timestamps.length - 1]?.end ?? 0)) {
            idx = timestamps.length - 1;
        }
        setActiveIndex(idx);
        rafRef.current = requestAnimationFrame(tick);
    };

    const playAudio = async () => {
        const a = audioRef.current;
        const v = videoRef.current;
        if (!a) return;

        if (isPlaying) {
            a.pause();
            v?.pause();
            setIsPlaying(false);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            return;
        }

        try {
            // sync both to 0 when starting
            if (a.currentTime === 0) {
                if (v) v.currentTime = 0;
                setActiveIndex(-1);
            }
            await a.play();
            if (videoRef.current) {
                // play muted video in sync
                videoRef.current.muted = true;
                await videoRef.current.play();
            }
            setIsPlaying(true);
            rafRef.current = requestAnimationFrame(tick);
        } catch (e) {
            console.error('Play error', e);
        }
    };

    // Render text as word spans with highlight
    const renderedWords = useMemo(() => {
        if (!timestamps.length) return null;
        return (
            <div className="mt-3 text-lg leading-8">
                {timestamps.map((w, i) => (
                    <span
                        key={i}
                        className={
                            'transition-colors duration-100 ' +
                            (i === activeIndex ? 'bg-yellow-300 dark:bg-yellow-600 text-black rounded px-1' : 'text-gray-800 dark:text-gray-100')
                        }
                    >
                        {w.text}
                    </span>
                ))}
            </div>
        );
    }, [timestamps, activeIndex]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
                            <Volume2 className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            AI Voice & Video Generator
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        Convert your text to speech and watch it over a sample gameplay video.
                    </p>
                    <Badge variant="secondary" className="mt-2">
                        <Mic className="w-3 h-3 mr-1" />
                        Powered by ElevenLabs
                    </Badge>
                </div>

                {/* Main Card */}
                <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-2xl text-gray-800 dark:text-gray-100">Create Your Voice</CardTitle>
                        <CardDescription className="text-base">Enter your text and generate speech</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Text</label>
                            <Textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Enter text to convert to speech..."
                                className="min-h-32 resize-none text-base leading-relaxed border-2 focus:border-purple-500 transition-colors"
                                maxLength={2500}
                            />
                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>Characters: {text.length}/2500</span>
                                {text.length > 0 && <span className="text-green-600">Ready to generate</span>}
                            </div>
                        </div>

                        {/* Generate Button */}
                        <Button
                            onClick={generateSpeech}
                            disabled={!text.trim() || isGenerating}
                            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Generating Speech...
                                </>
                            ) : (
                                <>
                                    <Volume2 className="w-5 h-5 mr-2" />
                                    Generate Speech
                                </>
                            )}
                        </Button>

                        {/* Video + Captions */}
                        <video
                            ref={videoRef}
                            src="/sample.mp4"
                            className="w-full rounded-lg mt-4 shadow-lg"
                            controls
                            muted
                            loop={false}
                        />

                        {/* Live “karaoke” text */}
                        {renderedWords}

                        {/* Audio Player & Controls */}
                        {audioUrl && (
                            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800 mt-4">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-green-800 dark:text-green-300">Your Generated Speech</h3>
                                        <Badge variant="outline" className="text-green-600 border-green-300">Ready to play</Badge>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button onClick={playAudio} variant="outline" size="sm" className="border-green-300 hover:bg-green-50">
                                            <Play className="w-4 h-4 mr-2" />
                                            {isPlaying ? 'Pause' : 'Play'}
                                        </Button>

                                        <Button onClick={downloadAudio} variant="outline" size="sm" className="border-blue-300 hover:bg-blue-50">
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>

                                        <Button
                                            onClick={renderVideo}
                                            variant="outline"
                                            size="sm"
                                            disabled={!audioBase64 || isRendering}
                                            className="border-purple-300 hover:bg-purple-50"
                                        >
                                            {isRendering ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Rendering…
                                                </>
                                            ) : (
                                                <>
                                                    <Clapperboard className="w-4 h-4 mr-2" />
                                                    Render Final Video
                                                </>
                                            )}
                                        </Button>

                                    </div>

                                    <audio
                                        ref={audioRef}
                                        controls
                                        src={audioUrl}
                                        className="w-full mt-2"
                                        onPlay={() => {
                                            setIsPlaying(true);
                                            if (videoRef.current) {
                                                videoRef.current.currentTime = 0;
                                                videoRef.current.play().catch(() => { });
                                            }
                                            if (rafRef.current) cancelAnimationFrame(rafRef.current);
                                            rafRef.current = requestAnimationFrame(tick);
                                        }}
                                        onPause={() => {
                                            setIsPlaying(false);
                                            videoRef.current?.pause();
                                            if (rafRef.current) cancelAnimationFrame(rafRef.current);
                                        }}
                                        onEnded={() => {
                                            setIsPlaying(false);
                                            videoRef.current?.pause();
                                            setActiveIndex(timestamps.length - 1);
                                            if (rafRef.current) cancelAnimationFrame(rafRef.current);
                                        }}
                                    />

                                    {finalUrl && (
                                        <Card className="mt-6 border-purple-200 dark:border-purple-800">
                                            <CardContent className="pt-6">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="font-semibold">Final Video (burned subtitles)</h3>
                                                    <Badge variant="outline" className="border-purple-300 text-purple-700 dark:text-purple-300">
                                                        Ready
                                                    </Badge>
                                                </div>
                                                <video
                                                    src={finalUrl}
                                                    className="w-full rounded-lg shadow"
                                                    controls
                                                />
                                            </CardContent>
                                        </Card>
                                    )}

                                </CardContent>
                            </Card>
                        )}
                    </CardContent>
                </Card>

                {/* Feature Pills */}
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                    <Badge variant="secondary" className="px-4 py-2 text-sm">⚡ Lightning Fast</Badge>
                    <Badge variant="secondary" className="px-4 py-2 text-sm">🎭 Natural Voices</Badge>
                    <Badge variant="secondary" className="px-4 py-2 text-sm">📱 Mobile Friendly</Badge>
                    <Badge variant="secondary" className="px-4 py-2 text-sm">💾 Downloadable</Badge>
                </div>
            </div>
        </div>
    );
}
