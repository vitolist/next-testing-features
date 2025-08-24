'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Volume2, Play, Download, Loader2, Mic } from 'lucide-react';

export default function HomePage() {
  const [text, setText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const generateSpeech = async () => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/text-to-speech', {
        method: 'POST',
        body: JSON.stringify({
          text,
          voice_id: '21m00Tcm4TlvDq8ikWAM', // default voice
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        console.error('Failed to generate speech');
        return;
      }

      const blob = await res.blob();
      setAudioUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Error generating speech:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = 'speech.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const playAudio = () => {
    const audio = document.querySelector('audio');
    if (audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play();
        setIsPlaying(true);
      }
    }
  };

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
              AI Voice Generator
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Transform your text into natural-sounding speech with ElevenLabs AI
          </p>
          <Badge variant="secondary" className="mt-2">
            <Mic className="w-3 h-3 mr-1" />
            Powered by ElevenLabs
          </Badge>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl text-gray-800 dark:text-gray-100">
              Create Your Voice
            </CardTitle>
            <CardDescription className="text-base">
              Enter your text below and generate high-quality speech in seconds
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Text Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Text
              </label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to convert to speech... Try something like 'Hello, welcome to the future of AI-powered voice generation!'"
                className="min-h-32 resize-none text-base leading-relaxed border-2 focus:border-purple-500 transition-colors"
                maxLength={2500}
              />
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Characters: {text.length}/2500</span>
                {text.length > 0 && (
                  <span className="text-green-600">Ready to generate</span>
                )}
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

            {/* Audio Player */}
            {audioUrl && (
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-green-800 dark:text-green-300">
                      Your Generated Speech
                    </h3>
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      Ready to play
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Custom Audio Controls */}
                    <div className="flex gap-3">
                      <Button
                        onClick={playAudio}
                        variant="outline"
                        size="sm"
                        className="border-green-300 hover:bg-green-50"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isPlaying ? 'Pause' : 'Play'}
                      </Button>
                      
                      <Button
                        onClick={downloadAudio}
                        variant="outline"
                        size="sm"
                        className="border-blue-300 hover:bg-blue-50"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    
                    {/* Native Audio Element (hidden but functional) */}
                    <audio
                      controls
                      src={audioUrl}
                      className="w-full"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            ⚡ Lightning Fast
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            🎭 Natural Voices
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            📱 Mobile Friendly
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            💾 Downloadable
          </Badge>
        </div>
      </div>
    </div>
  );
}