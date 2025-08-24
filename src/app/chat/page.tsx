"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Send, MoreVertical, Phone, Video, ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import ElementToVideoRecorder from './TabRecorder';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const chatRef = useRef<HTMLDivElement>(null);

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
            { sender: "Zoe", content: "Sure! What time works for you?" }
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

  // Get the first sender from messages to determine who is "ME"
  const getFirstSender = (): string => {
    return chatData?.messages[0]?.sender || '';
  };

  // Animate next message
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
        // Don't set isPlaying to false here unless we're really done
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

  // Cleanup timeouts on unmount
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
          pattern: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23065f46' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
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
          // myBubble: 'bg-yellow-300 text-black',
          // theirBubble: 'bg-white text-slate-800 border border-slate-200',
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
            <p className="text-sm text-slate-500 mt-2">Make sure sample.json exists in your public folder</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex md:flex-row flex-col gap-6 p-4 max-w-6xl mx-auto">

      {/* Controls Sidebar */}
      <Card className="w-80 h-fit">
        <div className="p-4 space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Controls</h3>

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
              disabled={currentIndex >= chatData.messages.length && !isPlaying}
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Start'}
            </Button>
            <Button
              onClick={resetAnimation}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>

          </div>

          <div className="text-sm text-slate-600 text-center">
            Progress: {currentIndex} / {chatData.messages.length}
          </div>
        </div>
      </Card>
      
      <ElementToVideoRecorder targetRef={chatRef} fps={30} durationMs={12000} />
      {/* Chat Interface - 9:16 aspect ratio */}
      <Card ref={chatRef} className="overflow-hidden py-0" style={{ width: '360px', height: '640px' }}>
        <div className={`${theme.bg} h-full relative flex flex-col`} style={{ backgroundImage: theme.pattern }}>
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
          <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-hide">
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

    </div>
  );
};

export default ChatMockup;