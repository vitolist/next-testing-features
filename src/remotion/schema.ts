import { z } from 'zod';

export const Msg = z.object({
  id: z.string(),
  from: z.enum(['me', 'them']),
  text: z.string().min(1),
  avatar: z.string().url().optional(),
});

export const Theme = z.object({
  bg: z.string(),
  headerBg: z.string(),
  headerText: z.string(),
  myBubble: z.string(),
  myText: z.string(),
  theirBubble: z.string(),
  theirText: z.string(),
  radius: z.number().int().positive(),
  maxBubbleWidth: z.number().int().positive(),
});

export const RenderProps = z.object({
  messages: z.array(Msg).min(1),
  theme: Theme,
  messageIntervalSec: z.number().positive().default(0.8),
  padding: z.number().int().nonnegative().default(28),
});

export type RenderProps = z.infer<typeof RenderProps>;
