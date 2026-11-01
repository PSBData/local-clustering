import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {LocalClustering} from './LocalClustering';
import {DURATION, FPS} from './timeline';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="LocalClustering-EN"
      component={LocalClustering}
      durationInFrames={DURATION * FPS}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{lang: 'en' as const}}
    />
    <Composition
      id="LocalClustering-FR"
      component={LocalClustering}
      durationInFrames={DURATION * FPS}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{lang: 'fr' as const}}
    />
  </>
);
