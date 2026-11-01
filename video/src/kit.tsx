import katex from 'katex';
import 'katex/dist/katex.min.css';
import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

// Palette of the neon deck (theme colours of the pptx).
export const C = {
  bg: '#0B0B14',
  card: '#161828',
  cardDeep: '#12131F',
  line: '#46548C',
  slate: '#2E3352',
  text: '#F2F3FA',
  muted: '#9AA3C7',
  faint: '#6B73A0',
  magenta: '#FF3DB8',
  cyan: '#3DF2FF',
  yellow: '#FFE14D',
  violet: '#B388FF',
  magentaDeep: '#3A1230',
  cyanDeep: '#0E3338',
  yellowDeep: '#3A3110',
};

export const TITLE_FONT = 'Montserrat, sans-serif';
export const BODY_FONT = 'Lato, sans-serif';

const soft = Easing.bezier(0.16, 1, 0.3, 1);

export const useSeconds = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return frame / fps;
};

export const ramp = (t: number, from: number, to: number) =>
  interpolate(t, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: soft,
  });

// 0 then 1 then 0: used for the pop of a node when it lights up.
export const bump = (t: number, at: number, length = 0.6) =>
  interpolate(t, [at, at + length / 2, at + length], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

// Fades in at `from`, fades out at `to`.
export const window01 = (t: number, from: number, to: number, fade = 0.5) =>
  Math.min(ramp(t, from, from + fade), 1 - ramp(t, to - fade, to));

export const Math_: React.FC<{tex: string; display?: boolean; style?: React.CSSProperties}> = ({
  tex,
  display,
  style,
}) => (
  <span
    style={style}
    dangerouslySetInnerHTML={{__html: katex.renderToString(tex, {displayMode: !!display, output: 'html'})}}
  />
);

// Inline **bold** and $math$ markup used by the strings.
export const Rich: React.FC<{text: string}> = ({text}) => (
  <>
    {text.split(/(\*\*[^*]+\*\*|\$[^$]+\$)/g).map((part, n) => {
      if (part.startsWith('**')) {
        return (
          <strong key={n} style={{fontWeight: 700}}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('$')) {
        return <Math_ key={n} tex={part.slice(1, -1)} />;
      }
      return <span key={n}>{part}</span>;
    })}
  </>
);

// Line that fades and rises in from `at`.
export const Reveal: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  at,
  children,
  style,
}) => {
  const t = useSeconds();
  return (
    <div
      style={{
        opacity: ramp(t, at, at + 0.6),
        translate: `0px ${(1 - ramp(t, at, at + 0.6)) * 22}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Kicker: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{fontFamily: BODY_FONT, fontWeight: 700, fontSize: 26, letterSpacing: '0.22em', color: C.magenta}}>
    {children}
  </div>
);

export const Headline: React.FC<{children: React.ReactNode; size?: number}> = ({children, size = 60}) => (
  <div style={{fontFamily: TITLE_FONT, fontWeight: 700, fontSize: size, lineHeight: 1.14, color: C.text}}>
    {children}
  </div>
);

export const Body: React.FC<{children: React.ReactNode; color?: string; size?: number}> = ({
  children,
  color = C.text,
  size = 40,
}) => (
  <div style={{fontFamily: BODY_FONT, fontSize: size, lineHeight: 1.36, color}}>{children}</div>
);

export const Card: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{background: C.card, borderRadius: 18, padding: '30px 38px', ...style}}>{children}</div>
);

// Formula box of the deck: deep card with a magenta border.
export const FormulaBox: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div
    style={{
      background: C.cardDeep,
      border: `3px solid ${C.magenta}`,
      borderRadius: 18,
      padding: '22px 34px',
      boxShadow: `0 0 34px ${C.magenta}33`,
      color: C.text,
      ...style,
    }}
  >
    {children}
  </div>
);

type Tone = 'slate' | 'cyan' | 'magenta' | 'yellow';

const TONES: Record<Tone, {fill: string; stroke: string; text: string}> = {
  slate: {fill: '#1C1E36', stroke: C.line, text: C.muted},
  cyan: {fill: C.cyanDeep, stroke: C.cyan, text: C.cyan},
  magenta: {fill: C.magentaDeep, stroke: C.magenta, text: '#FFB3E3'},
  yellow: {fill: C.yellowDeep, stroke: C.yellow, text: C.yellow},
};

export const NodeDot: React.FC<{
  x: number;
  y: number;
  r?: number;
  label?: string | number;
  tone: Tone;
  opacity?: number;
  scale?: number;
}> = ({x, y, r = 44, label, tone, opacity = 1, scale = 1}) => {
  const c = TONES[tone];
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${scale})`}>
      {tone !== 'slate' ? <circle r={r} fill="none" stroke={c.stroke} strokeWidth={6} filter="url(#glow)" /> : null}
      <circle r={r} fill={c.fill} stroke={c.stroke} strokeWidth={5} />
      {label !== undefined ? (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily={TITLE_FONT}
          fontWeight={700}
          fontSize={r * 0.78}
          fill={c.text}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
};

export const GlowDefs: React.FC = () => (
  <defs>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="9" />
    </filter>
    <filter id="glowLine" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" />
    </filter>
  </defs>
);
