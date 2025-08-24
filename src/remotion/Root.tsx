// remotion/Root.tsx
import React from 'react';
import { Composition } from 'remotion';
import { ChatVideo } from './ChatVideo';
import { messages } from './sample-messages';
import { theme } from './theme';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ChatVideo"
      component={ChatVideo}
      durationInFrames={30 * 20} // 20s at 30fps
      fps={30}
      width={1080}
      height={1920} // vertical; set 1920x1080 for landscape
      defaultProps={{
        messages,
        theme,
        messageIntervalSec: 0.8, // new message every 0.8s
        padding: 28,
      }}
    />
  );
};
