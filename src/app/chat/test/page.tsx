"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Send, MoreVertical, Phone, Video, ArrowLeft, Play, Pause, RotateCcw, Download, Plus, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Participant {
  name: string;
  personality: string;
}

interface Message {
  sender: string;
  content: string;
}

interface DisplayMessage extends Message {
  timestamp: string;
}

interface ChatData {
  theme: string;
  participants: {
    participant1: Participant;
    participant2: Participant;
  };
  total_messages?: number;
  generated_at?: string;
  messages: Message[];
}

type ChatTheme = 'whatsapp' | 'instagram' | 'ios' | 'messenger' | 'snapchat' | 'viber';

interface ThemeStyles {
  bg: string;
  header: string;
  myBubble: string;
  theirBubble: string;
  pattern?: string;
}

interface QueueItem {
  id: string;
  theme: ChatTheme;
  speed: number;
  status: 'pending' | 'recording' | 'completed' | 'failed';
  progress: number;
  fileName: string;
}

// Mock ElementToVideoRecorder component
const ElementToVideoRecorder: React.FC<{
  targetRef: React.RefObject<HTMLDivElement>;
  fps: number;
  durationMs: number;
  onRecordingStart?: () => void;
  onRecordingComplete?: (blob: Blob) => void;
  onRecordingError?: (error: Error) => void;
  autoStart?: boolean;
  queueItemId?: string;
}> = ({ targetRef, fps, durationMs, onRecordingStart, onRecordingComplete, onRecordingError, autoStart = false, queueItemId }) => {
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    if (!targetRef.current) return;

    setIsRecording(true);
    onRecordingStart?.();

    try {
      // Mock recording process - simulate video data
      await new Promise(resolve => setTimeout(resolve, durationMs + 1000));

      // Create mock video blob with proper size (simulate real video data)
      const mockVideoData = new ArrayBuffer(1024 * 1024); // 1MB mock data
      const mockBlob = new Blob([mockVideoData], { type: 'video/mp4' });
      onRecordingComplete?.(mockBlob);
    } catch (error) {
      onRecordingError?.(error as Error);
    } finally {
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (autoStart && queueItemId) {
      startRecording();
    }
  }, [autoStart, queueItemId]);

  return (
    <Card className="w-80">
      <div className="p-4 border rounded-lg bg-slate-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Video Recorder</span>
          <Badge variant={isRecording ? "destructive" : "secondary"}>
            {isRecording ? "Recording..." : "Ready"}
          </Badge>
        </div>
        <div className="text-xs text-slate-600 mb-2">
          FPS: {fps} | Duration: {durationMs / 1000}s
        </div>
        {queueItemId && (
          <div className="text-xs text-blue-600 mb-2">
            Recording: {queueItemId}
          </div>
        )}
        {!autoStart && (
          <Button
            onClick={startRecording}
            disabled={isRecording}
            className="w-full mt-2"
            size="sm"
          >
            {isRecording ? "Recording..." : "Start Recording"}
          </Button>
        )}
      </div>
    </Card>
  );
};

const ChatMockup: React.FC = () => {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingSender, setTypingSender] = useState<string>('');
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [chatTheme, setChatTheme] = useState<ChatTheme>('whatsapp');
  const [speed, setSpeed] = useState<number[]>([2000]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Queue system states
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);
  const [currentlyRecording, setCurrentlyRecording] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(12000);
  const [videoFps, setVideoFps] = useState<number>(30);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Start/stop animation
  const toggleAnimation = (): void => {
    if (isPlaying) {
      setIsPlaying(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else {
      setIsPlaying(true);
      if (chatData && currentIndex < chatData.messages.length) {
        animateNextMessage();
      }
    }
  };

  // Reset animation
  const resetAnimation = (): void => {
    setMessages([]);
    setCurrentIndex(0);
    setIsTyping(false);
    setTypingSender('');
    setIsPlaying(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Load JSON data using fetch
  useEffect(() => {
    const loadChatData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const response = await fetch('/sample.json');
        if (!response.ok) {
          throw new Error('Failed to fetch sample.json');
        }
        const data: ChatData = await response.json();
        setChatData(data);
      } catch (error) {
        console.error('Error loading chat data:', error);
        // Fallback sample data if file doesn't exist
        const fallbackData: ChatData = {
          theme: "Sample chat conversation",
          participants: {
            participant1: { name: "ME", personality: "User" },
            participant2: { name: "YOU", personality: "Friend" }
          },
          messages: [
            { sender: "Liam", content: "Hey! How's it going?" },
            { sender: "Zoe", content: "Not bad, just busy with work" },
            { sender: "Liam", content: "Same here, want to grab coffee later?" },
            { sender: "Zoe", content: "Sure! What time works for you?" },
            { sender: "Liam", content: "How about 3 PM at our usual spot?" },
            { sender: "Zoe", content: "Perfect! See you there 😊" }
          ]
        };
        setChatData(fallbackData);
      } finally {
        setIsLoading(false);
      }
    };
    loadChatData();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Queue management functions
  const addToQueue = (theme: ChatTheme, speed: number) => {
    const newItem: QueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      theme,
      speed,
      status: 'pending',
      progress: 0,
      fileName: `chat-${theme}-${Date.now()}.mp4`
    };
    setQueue(prev => [...prev, newItem]);
  };

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const addAllThemes = () => {
    const themes: ChatTheme[] = ['whatsapp', 'instagram', 'ios', 'messenger', 'snapchat', 'viber'];
    themes.forEach(theme => {
      addToQueue(theme, speed[0]);
    });
  };

  const clearQueue = () => {
    setQueue([]);
  };

  // Process queue
  // Queue management with video storage
  const [completedVideos, setCompletedVideos] = useState<Map<string, Blob>>(new Map());

  const processQueue = async () => {
    if (isProcessingQueue || queue.length === 0) return;

    setIsProcessingQueue(true);

    for (const item of queue) {
      if (item.status !== 'pending') continue;

      // Update status to recording
      setQueue(prev => prev.map(q =>
        q.id === item.id ? { ...q, status: 'recording' as const, progress: 0 } : q
      ));

      setCurrentlyRecording(item.id);

      try {
        // Reset animation for this theme
        await resetAnimationForTheme(item.theme, item.speed);

        // Wait for recording to complete
        await new Promise<void>((resolve, reject) => {
          let recordingCompleted = false;

          const handleRecordingComplete = (blob: Blob) => {
            if (!recordingCompleted) {
              recordingCompleted = true;
              // Store the actual video blob
              setCompletedVideos(prev => new Map(prev.set(item.id, blob)));

              // Mark as completed
              setQueue(prev => prev.map(q =>
                q.id === item.id ? { ...q, status: 'completed' as const, progress: 100 } : q
              ));
              resolve();
            }
          };

          // Simulate progress updates
          const progressInterval = setInterval(() => {
            setQueue(prev => prev.map(q => {
              if (q.id === item.id && q.status === 'recording') {
                const newProgress = Math.min(q.progress + 10, 90);
                return { ...q, progress: newProgress };
              }
              return q;
            }));
          }, videoDuration / 10);

          // Setup recording completion handler
          const recordingTimeout = setTimeout(() => {
            clearInterval(progressInterval);
            if (!recordingCompleted) {
              // Create mock video data for demo
              const mockVideoData = new ArrayBuffer(1024 * 1024); // 1MB
              const mockBlob = new Blob([mockVideoData], { type: 'video/mp4' });
              handleRecordingComplete(mockBlob);
            }
          }, videoDuration + 2000);
        });

      } catch (error) {
        // Mark as failed
        setQueue(prev => prev.map(q =>
          q.id === item.id ? { ...q, status: 'failed' as const } : q
        ));
      }
    }

    setCurrentlyRecording(null);
    setIsProcessingQueue(false);
  };

  const resetAnimationForTheme = async (theme: ChatTheme, animationSpeed: number) => {
    // Reset states
    setMessages([]);
    setCurrentIndex(0);
    setIsTyping(false);
    setTypingSender('');
    setIsPlaying(false);
    setChatTheme(theme);
    setSpeed([animationSpeed]);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Small delay to ensure state updates
    await new Promise(resolve => setTimeout(resolve, 100));

    // Start animation
    setIsPlaying(true);
  };

  const downloadVideo = (item: QueueItem) => {
    const videoBlob = completedVideos.get(item.id);
    if (!videoBlob) {
      console.error('Video blob not found for item:', item.id);
      return;
    }

    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllCompleted = () => {
    const completedItems = queue.filter(item => item.status === 'completed');
    completedItems.forEach(item => {
      setTimeout(() => downloadVideo(item), 100); // Small delay between downloads
    });
  };

  // Animation logic (from original code)
  const getFirstSender = (): string => {
    return chatData?.messages[0]?.sender || '';
  };

  const animateNextMessage = (): void => {
    if (!chatData?.messages || currentIndex >= chatData.messages.length) {
      setIsPlaying(false);
      return;
    }

    const currentMessage = chatData.messages[currentIndex];
    console.log(`Animating message ${currentIndex + 1}:`, currentMessage);
    const firstSender = getFirstSender();
    const isMe = currentMessage.sender === firstSender;
    const displaySender = isMe ? "ME" : "YOU";

    // Show typing indicator on correct side
    setIsTyping(true);
    setTypingSender(displaySender);

    timeoutRef.current = setTimeout(() => {
      // Add message
      const newMessage: DisplayMessage = {
        ...currentMessage,
        sender: displaySender,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
      setTypingSender('');

      // Move to next message
      setCurrentIndex(prev => prev + 1);

      // Continue to next message after a brief pause
      timeoutRef.current = setTimeout(() => {
        // Just let the useEffect handle the next message
      }, 500);
    }, speed[0]);
  };

  // Trigger animation when currentIndex changes or play state changes
  useEffect(() => {
    if (isPlaying && chatData && currentIndex < chatData.messages.length) {
      animateNextMessage();
    } else if (isPlaying && chatData && currentIndex >= chatData.messages.length) {
      // Animation complete
      setIsPlaying(false);
    }
  }, [currentIndex]);
  // }, [currentIndex, isPlaying, chatData, speed]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getThemeStyles = (): ThemeStyles => {
    switch (chatTheme) {
      case 'whatsapp':
        return {
          bg: 'bg-emerald-50 bg-opacity-50',
          header: 'bg-emerald-600 text-white',
          myBubble: 'bg-emerald-500 text-white',
          theirBubble: 'bg-white text-slate-800 border border-slate-200',
        };
      case 'instagram':
        return {
          bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
          header: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
          myBubble: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
          theirBubble: 'bg-white text-slate-800 border border-slate-200',
        };
      case 'ios':
        return {
          bg: 'bg-slate-100',
          header: 'bg-slate-200 text-slate-800 border-b border-slate-300',
          myBubble: 'bg-blue-500 text-white',
          theirBubble: 'bg-slate-300 text-slate-800',
        };
      case 'messenger':
        return {
          bg: 'bg-blue-50',
          header: 'bg-blue-600 text-white',
          myBubble: 'bg-blue-600 text-white',
          theirBubble: 'bg-slate-200 text-slate-800',
        };
      case 'snapchat':
        return {
          bg: 'bg-white',
          header: 'bg-yellow-300 text-black',
          myBubble: 'rounded-none text-black border-l-blue-500 border-l-6',
          theirBubble: 'rounded-none text-slate-800 border-slate-200 border-l-red-500 border-l-6',
        };
      case 'viber':
        return {
          bg: 'bg-purple-50',
          header: 'bg-purple-700 text-white',
          myBubble: 'bg-purple-600 text-white',
          theirBubble: 'bg-white text-slate-800 border border-slate-200',
        };
      default:
        return {
          bg: 'bg-slate-50',
          header: 'bg-blue-600 text-white',
          myBubble: 'bg-blue-500 text-white',
          theirBubble: 'bg-white text-slate-800 border border-slate-200',
        };
    }
  };

  const theme = getThemeStyles();

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (!chatData) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-slate-600">Failed to load chat data</p>
          </div>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: QueueItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'recording':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex lg:flex-row flex-col gap-6 p-4 max-w-7xl mx-auto">

      {/* Controls Sidebar */}
      <div className="space-y-4">
        <Card className="w-80">
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Animation Controls</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Theme</label>
              <Select value={chatTheme} onValueChange={(value: ChatTheme) => setChatTheme(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="ios">iOS Messages</SelectItem>
                  <SelectItem value="messenger">Messenger</SelectItem>
                  <SelectItem value="snapchat">Snapchat</SelectItem>
                  <SelectItem value="viber">Viber</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Speed: {speed[0] / 1000}s
              </label>
              <Slider
                value={speed}
                onValueChange={setSpeed}
                max={5000}
                min={500}
                step={500}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={toggleAnimation}
                variant={isPlaying ? "secondary" : "default"}
                className="w-full"
                disabled={currentIndex >= (chatData?.messages.length || 0) && !isPlaying}
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? 'Pause' : 'Start'}
              </Button>
              <Button
                onClick={() => {
                  resetAnimation();
                }}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* Video Queue Controls */}
        <Card className="w-80">
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Video Queue</h3>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Duration (ms)</label>
                <Input
                  type="number"
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(Number(e.target.value))}
                  min={5000}
                  max={30000}
                  step={1000}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">FPS</label>
                <Input
                  type="number"
                  value={videoFps}
                  onChange={(e) => setVideoFps(Number(e.target.value))}
                  min={15}
                  max={60}
                  step={15}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => addToQueue(chatTheme, speed[0])}
                size="sm"
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Current
              </Button>
              <Button
                onClick={addAllThemes}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                Add All Themes
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={processQueue}
                disabled={isProcessingQueue || queue.length === 0}
                className="flex-1"
                variant="default"
              >
                {isProcessingQueue ? "Processing..." : "Start Queue"}
              </Button>
              <Button
                onClick={clearQueue}
                variant="destructive"
                size="sm"
                disabled={isProcessingQueue}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {queue.map((item, index) => (
                <div key={item.id} className="p-3 border rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="text-sm font-medium capitalize">{item.theme}</span>
                    </div>
                    <div className="flex gap-1">
                      {item.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadVideo(item)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromQueue(item.id)}
                        disabled={item.status === 'recording'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600">
                    Speed: {item.speed / 1000}s
                  </div>
                  {item.status === 'recording' && (
                    <div className="mt-2">
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{item.progress}%</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {queue.filter(item => item.status === 'completed').length > 0 && (
              <Button
                onClick={downloadAllCompleted}
                className="w-full"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All Completed ({queue.filter(item => item.status === 'completed').length})
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Chat Interface */}
      <Card ref={chatRef} className="overflow-hidden" style={{ width: '360px', height: '640px' }}>
        <div className={`${theme.bg} h-full relative flex flex-col`}>
          {/* Header */}
          <div className={`${theme.header} px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0`}>
            <div className="flex items-center space-x-3">
              <ArrowLeft className="w-5 h-5" />
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-sm font-medium">
                {chatData.participants.participant2?.name?.[0] || 'Y'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{chatData.participants.participant2?.name || 'YOU'}</div>
                <div className="text-xs opacity-75 h-4">
                  {isTyping && typingSender === 'YOU' ? 'typing...' : ''}
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <Phone className="w-5 h-5" />
              <Video className="w-5 h-5" />
              <MoreVertical className="w-5 h-5" />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === 'ME' ? (chatTheme === 'snapchat' ? 'justify-start' : 'justify-end') : 'justify-start'}`}
              >
                <div className={`max-w-[80%] px-3 py-2 ${chatTheme === "snapchat" ? "" : "rounded-lg shadow-sm"} ${message.sender === 'ME' ? theme.myBubble : theme.theirBubble
                  } ${chatTheme === 'ios' ? 'rounded-2xl' : ''}`}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words font-semibold">
                    {message.content}
                  </div>
                  <div className={`text-xs mt-1 ${message.sender === 'ME'
                    ? (chatTheme === 'snapchat' ? 'text-slate-500' : 'text-white text-opacity-75')
                    : 'text-slate-500'
                    }`}>
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className={`flex ${typingSender === 'ME' ? (chatTheme === 'snapchat' ? 'justify-start' : 'justify-end') : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-lg shadow-sm ${typingSender === 'ME' ? theme.myBubble : theme.theirBubble
                  } ${chatTheme === 'ios' ? 'rounded-2xl' : ''}`}>
                  <div className="flex space-x-1">
                    <div className={`w-2 h-2 rounded-full animate-bounce ${typingSender === 'ME' ? (chatTheme === "snapchat" ? 'bg-slate-400' : 'bg-white bg-opacity-75') : 'bg-slate-400'
                      }`}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${typingSender === 'ME' ? (chatTheme === "snapchat" ? 'bg-slate-400' : 'bg-white bg-opacity-75') : 'bg-slate-400'
                      }`} style={{ animationDelay: '0.1s' }}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${typingSender === 'ME' ? (chatTheme === "snapchat" ? 'bg-slate-400' : 'bg-white bg-opacity-75') : 'bg-slate-400'
                      }`} style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </Card>

      {/* Video Recorder */}
      <ElementToVideoRecorder
        targetRef={chatRef}
        fps={videoFps}
        durationMs={videoDuration}
        autoStart={currentlyRecording !== null}
        queueItemId={currentlyRecording || undefined}
        onRecordingStart={() => console.log('Recording started')}
        onRecordingComplete={(blob) => {
          console.log('Recording completed', blob);
          // Store completed video
          if (currentlyRecording) {
            setCompletedVideos(prev => new Map(prev.set(currentlyRecording, blob)));
          }
        }}
        onRecordingError={(error) => {
          console.error('Recording error', error);
        }}
      />
    </div>
  );
};

export default ChatMockup;