// remotion/ChatVideo.tsx
import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import type { Msg } from '@/remotion/sample-messages'; // Adjust import path as needed

type Props = {
  messages: Msg[];
  theme: {
    bg: string;
    headerBg: string;
    headerText: string;
    myBubble: string;
    myText: string;
    theirBubble: string;
    theirText: string;
    radius: number;
    maxBubbleWidth: number;
  };
  messageIntervalSec?: number;
  padding?: number;
};

const Bubble: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  textColor: string;
  text: string;
  r: number;
  appearFrame: number;
}> = ({ x, y, w, h, color, textColor, text, r, appearFrame }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [appearFrame, appearFrame + 10], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [appearFrame, appearFrame + 10], [20, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + translateY,
        width: w,
        minHeight: h,
        background: color,
        color: textColor,
        borderRadius: r,
        padding: 16,
        opacity,
        boxSizing: 'border-box',
        lineHeight: 1.35,
        fontSize: 36,
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
      }}
    >
      {text}
    </div>
  );
};

export const ChatVideo: React.FC<Props> = ({
  messages,
  theme,
  messageIntervalSec = 0.8,
  padding = 28,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Simple text measurer using canvas for wrapping width
  const measure = useMemo(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.font = '36px system-ui';
    return (text: string, maxWidth: number) => {
      // naive: estimate height by splitting on words
      const words = text.split(' ');
      const lines: string[] = [];
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        const metrics = ctx.measureText(test);
        if (metrics.width > maxWidth) {
          lines.push(line || w);
          line = w;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      const lineHeight = 48; // px
      const height = Math.max(lineHeight + 12, lines.length * lineHeight + 12);
      const width = Math.min(
        Math.max(...lines.map((l) => ctx.measureText(l).width)) + 8,
        maxWidth
      );
      return { width: Math.ceil(width), height: Math.ceil(height) };
    };
  }, []);

  // Layout bubbles vertically
  const laidOut = useMemo(() => {
    const maxW = Math.min(theme.maxBubbleWidth, width - padding * 2 - 120);
    let y = 120; // below header
    const items = messages.map((m, idx) => {
      const isMe = m.from === 'me';
      const { width: bw, height: bh } = measure(m.text, maxW);
      const bubbleWidth = bw + 32;    // padding inside bubble
      const bubbleHeight = Math.max(56, bh + 20);
      const x = isMe
        ? width - padding - bubbleWidth
        : padding + 80; // leave room for avatar area if needed

      const appearAt = Math.floor(idx * messageIntervalSec * fps);

      const node = (
        <Bubble
          key={m.id}
          x={x}
          y={y}
          w={bubbleWidth}
          h={bubbleHeight}
          color={isMe ? theme.myBubble : theme.theirBubble}
          textColor={isMe ? theme.myText : theme.theirText}
          text={m.text}
          r={theme.radius}
          appearFrame={appearAt}
        />
      );

      const out = { node, yTop: y, yBottom: y + bubbleHeight + 16, appearAt };
      y = out.yBottom;
      return out;
    });

    return { items, totalHeight: y + padding };
  }, [messages, measure, theme, width, padding, fps, messageIntervalSec]);

  // Background + header
  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width,
          height: 96,
          background: theme.headerBg,
          color: theme.headerText,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          boxSizing: 'border-box',
          fontSize: 40,
          fontWeight: 600,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
        }}
      >
        Chat
      </div>

      {/* Messages layer */}
      {laidOut.items.map(({ node }) => node)}
    </AbsoluteFill>
  );
};
