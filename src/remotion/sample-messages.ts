// remotion/sample-messages.ts
export type Msg = {
  id: string;
  from: 'me' | 'them';
  text: string;
  avatar?: string; // optional for 'them'
};

export const messages: Msg[] = [
  { id: '1', from: 'them', text: 'Hey! Ready for the demo?' },
  { id: '2', from: 'me',   text: 'Yep, just finishing the chat mockup.' },
  { id: '3', from: 'them', text: 'Nice. Can you export it as MP4?' },
  { id: '4', from: 'me',   text: 'Absolutely—rendered with Remotion ✨' },
];
