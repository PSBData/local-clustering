import React from 'react';
import {EDGES, FOCUS, FOCUS_NB, FOCUS_PAIRS, FOCUS_REAL, NODES, POS, STATS, Edge} from './graph';
import {Lang, num} from './i18n';
import {C, GlowDefs, NodeDot, TITLE_FONT, bump, ramp} from './kit';
import {T} from './timeline';

const same = (a: Edge, b: Edge) => (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);
const isSpoke = (e: Edge) => e.includes(FOCUS);
const isReal = (e: Edge) => FOCUS_REAL.some((r) => same(r, e));

const Line: React.FC<{
  e: Edge;
  stroke: string;
  width: number;
  opacity: number;
  dash?: string;
  glow?: boolean;
}> = ({e, stroke, width, opacity, dash, glow}) => {
  const a = POS[e[0]];
  const b = POS[e[1]];
  if (opacity <= 0.001) return null;
  return (
    <g opacity={opacity}>
      {glow ? (
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={width + 4} filter="url(#glowLine)" />
      ) : null}
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={stroke}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dash}
      />
    </g>
  );
};

// Where the C label sits around a node, outward from the centre of the graph.
const labelPos = (i: number) => {
  const cx = NODES.reduce((s, n) => s + POS[n].x, 0) / NODES.length;
  const cy = NODES.reduce((s, n) => s + POS[n].y, 0) / NODES.length;
  const p = POS[i];
  if (i === FOCUS) return {x: p.x + 8, y: p.y + 84};
  const d = Math.hypot(p.x - cx, p.y - cy) || 1;
  // stays inside the safe area on the right of the frame
  const x = Math.min(p.x + ((p.x - cx) / d) * 98, 1824);
  const y = x === 1824 ? p.y + 82 : p.y + ((p.y - cy) / d) * 80;
  // and clear of the table on the left
  if (x < 1040) return {x: p.x, y: p.y - 82};
  return {x, y};
};

export const MainGraph: React.FC<{t: number; lang: Lang}> = ({t, lang}) => {
  // Global visibility of the graph over the video.
  const shown = Math.min(
    Math.max(
      Math.min(ramp(t, T.q[0], T.q[0] + 1), 1 - ramp(t, T.ext[0] - 0.8, T.ext[0])),
      Math.min(ramp(t, T.all[0], T.all[0] + 1), 1 - ramp(t, T.end[0] - 0.8, T.end[0])),
    ),
    1,
  );
  if (shown <= 0.001) return null;

  const allScene = t >= T.ext[1] - 0.5;
  const focusIn = ramp(t, T.q[0] + 2.4, T.q[0] + 3); // node 1 turns magenta
  const setAside = allScene ? 0 : ramp(t, T.s2[0] + 0.3, T.s2[0] + 1.4) * (1 - ramp(t, T.s3[0] + 7.4, T.s3[0] + 8.2));
  const stepPair = (n: number) => T.s2[0] + 2 + n * 0.72; // dashed pairs, one by one
  const stepReal = (n: number) => T.s3[0] + 1 + n * 1.15; // existing links, one by one
  const stepTri = (n: number) => T.s3[0] + 7.8 + n * 0.5; // triangles, one by one
  const stepNb = (n: number) => T.s1[0] + 1.2 + n * 0.95; // neighbours, one by one

  const nbIndex = (i: number) => FOCUS_NB.indexOf(i);

  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: shown}}>
      <GlowDefs />

      {/* Triangles closed with the focus node */}
      {!allScene &&
        FOCUS_REAL.map(([a, b], n) => {
          const o = ramp(t, stepTri(n), stepTri(n) + 0.5);
          const pts = [POS[FOCUS], POS[a], POS[b]].map((p) => `${p.x},${p.y}`).join(' ');
          return <polygon key={`${a}${b}`} points={pts} fill={C.yellow} opacity={o * 0.1} />;
        })}

      {/* Links of the graph */}
      {EDGES.map((e) => {
        const key = e.join('-');
        if (allScene) {
          const real = isReal(e);
          return <Line key={key} e={e} stroke={C.line} width={real ? 5 : 4} opacity={0.9} />;
        }
        const spoke = isSpoke(e);
        const base = ramp(t, T.q[0] + 0.6, T.q[0] + 2);
        if (spoke) {
          const n = nbIndex(e[0] === FOCUS ? e[1] : e[0]);
          const lit = ramp(t, stepNb(n), stepNb(n) + 0.4);
          const opacity = base * (1 - setAside * 0.86);
          return (
            <React.Fragment key={key}>
              <Line e={e} stroke={C.line} width={4} opacity={opacity * (1 - lit)} />
              <Line e={e} stroke={C.cyan} width={6} opacity={opacity * lit} glow={setAside < 0.5} />
            </React.Fragment>
          );
        }
        if (isReal(e)) {
          const n = FOCUS_REAL.findIndex((r) => same(r, e));
          const lit = ramp(t, stepReal(n), stepReal(n) + 0.4);
          return (
            <React.Fragment key={key}>
              <Line e={e} stroke={C.line} width={4} opacity={base * (1 - setAside * 0.72) * (1 - lit)} />
              <Line e={e} stroke={C.yellow} width={9} opacity={lit} glow />
            </React.Fragment>
          );
        }
        // links towards node 7, outside the neighbourhood
        return <Line key={key} e={e} stroke={C.line} width={4} opacity={base * (1 - setAside * 0.72)} />;
      })}

      {/* Candidate pairs between the neighbours */}
      {!allScene &&
        FOCUS_PAIRS.map((e, n) => {
          const on = ramp(t, stepPair(n), stepPair(n) + 0.35);
          const real = isReal(e);
          // existing pairs turn solid; the others stay as faint ghosts
          const ghost = real ? 1 - ramp(t, T.s3[0] + 1, T.s3[0] + 2) : 1 - 0.62 * ramp(t, T.s3[0] + 5.8, T.s3[0] + 6.8);
          return (
            <Line key={e.join('-')} e={e} stroke={C.violet} width={4} opacity={on * ghost * 0.95} dash="10 13" />
          );
        })}

      {/* Nodes */}
      {NODES.map((i) => {
        const p = POS[i];
        const isFocus = i === FOCUS;
        const n = nbIndex(i);
        const appear = ramp(t, T.q[0] + 0.2 + i * 0.1, T.q[0] + 0.8 + i * 0.1);
        if (allScene) {
          return <NodeDot key={i} x={p.x} y={p.y} label={i} tone="cyan" />;
        }
        if (isFocus) {
          const pulse = bump(t, T.q[0] + 2.4, 0.8) + bump(t, T.s3[0] + 7.5, 0.7);
          return (
            <React.Fragment key={i}>
              <NodeDot x={p.x} y={p.y} label={i} tone="slate" opacity={appear * (1 - focusIn)} />
              <NodeDot
                x={p.x}
                y={p.y}
                label={i}
                tone="magenta"
                opacity={focusIn * (1 - setAside * 0.74)}
                scale={1 + pulse * 0.22}
              />
            </React.Fragment>
          );
        }
        if (n >= 0) {
          const lit = ramp(t, stepNb(n), stepNb(n) + 0.35);
          return (
            <React.Fragment key={i}>
              <NodeDot x={p.x} y={p.y} label={i} tone="slate" opacity={appear * (1 - lit)} />
              <NodeDot
                x={p.x}
                y={p.y}
                label={i}
                tone="cyan"
                opacity={lit}
                scale={1 + bump(t, stepNb(n), 0.55) * 0.26}
              />
            </React.Fragment>
          );
        }
        return (
          <NodeDot
            key={i}
            x={p.x}
            y={p.y}
            label={i}
            tone="slate"
            opacity={appear * (1 - setAside * 0.6)}
          />
        );
      })}

      {/* C value next to each node, final scene */}
      {allScene &&
        STATS.map((s, n) => {
          const at = T.all[0] + 1.2 + n * 0.75;
          const o = ramp(t, at, at + 0.4);
          const p = labelPos(s.i);
          const hl = (s.i === 1 || s.i === 7) && t > T.all[0] + 9;
          return (
            <g key={s.i} opacity={o} transform={`translate(${p.x} ${p.y})`}>
              <rect
                x={-58}
                y={-26}
                width={116}
                height={52}
                rx={12}
                fill={C.bg}
                stroke={hl ? C.yellow : C.line}
                strokeWidth={hl ? 4 : 2}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily={TITLE_FONT}
                fontWeight={700}
                fontSize={28}
                fill={hl ? C.yellow : C.text}
              >
                {num(lang, s.C, 3)}
              </text>
            </g>
          );
        })}
    </svg>
  );
};
