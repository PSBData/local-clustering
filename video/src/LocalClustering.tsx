import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile} from 'remotion';
import {FOCUS_PAIRS, FOCUS_REAL, FOCUS_STAT, MEAN_C, STATS} from './graph';
import {Lang, SITE_URL, STRINGS, Strings, num} from './i18n';
import {
  BODY_FONT,
  Body,
  C,
  Card,
  FormulaBox,
  GlowDefs,
  Headline,
  Kicker,
  Math_,
  NodeDot,
  Reveal,
  Rich,
  TITLE_FONT,
  ramp,
  useSeconds,
  window01,
} from './kit';
import {MainGraph} from './MainGraph';
import {DURATION, T} from './timeline';

type P = {s: Strings; lang: Lang};

const K = FOCUS_STAT.k;
const L = FOCUS_STAT.L;
const POSSIBLE = FOCUS_STAT.possible;
const VALUE = FOCUS_STAT.C;

const cK = (x: string | number) => `\\textcolor{${C.cyan}}{${x}}`;
const cL = (x: string | number) => `\\textcolor{${C.yellow}}{${x}}`;
const cP = (x: string | number) => `\\textcolor{${C.violet}}{${x}}`;
const cC = (x: string | number) => `\\textcolor{${C.magenta}}{${x}}`;

// Left column of a step.
const Panel: React.FC<{range: readonly [number, number]; children: React.ReactNode}> = ({range, children}) => {
  const t = useSeconds();
  const o = window01(t, range[0], range[1], 0.6);
  if (o <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 96,
        top: 92,
        width: 860,
        opacity: o,
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
      }}
    >
      {children}
    </div>
  );
};

const Title: React.FC<P> = ({s}) => {
  const t = useSeconds();
  const o = window01(t, T.title[0] - 1, T.title[1], 0.7);
  if (o <= 0.001) return null;
  const a = {x: 1490, y: 170};
  const b = {x: 1700, y: 300};
  const c = {x: 1420, y: 400};
  const closed = ramp(t, 3, 3.9);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <GlowDefs />
        <polygon
          points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`}
          fill={C.yellow}
          opacity={ramp(t, 3.7, 4.6) * 0.1}
        />
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.muted} strokeWidth={5} opacity={ramp(t, 0.9, 1.5)} />
        <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke={C.muted} strokeWidth={5} opacity={ramp(t, 1.2, 1.8)} />
        <line
          x1={b.x}
          y1={b.y}
          x2={b.x + (c.x - b.x) * closed}
          y2={b.y + (c.y - b.y) * closed}
          stroke={C.yellow}
          strokeWidth={8}
          strokeLinecap="round"
          opacity={closed > 0 ? 1 : 0}
        />
        <NodeDot x={a.x} y={a.y} r={44} tone="magenta" opacity={ramp(t, 0.5, 1.1)} />
        <NodeDot x={b.x} y={b.y} r={34} tone="cyan" opacity={ramp(t, 0.8, 1.4)} />
        <NodeDot x={c.x} y={c.y} r={34} tone="cyan" opacity={ramp(t, 1.1, 1.7)} />
      </svg>
      <div style={{position: 'absolute', left: 116, top: 400, width: 1500}}>
        <Reveal at={0.3}>
          <Kicker>{s.titleKicker}</Kicker>
        </Reveal>
        <Reveal at={0.6} style={{marginTop: 34}}>
          <Headline size={88}>{s.title}</Headline>
        </Reveal>
        <Reveal at={1.3} style={{marginTop: 28}}>
          <div style={{fontFamily: BODY_FONT, fontSize: 48, color: C.yellow}}>{s.subtitle}</div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

const Question: React.FC<P> = ({s}) => (
  <Panel range={T.q}>
    <Reveal at={T.q[0] + 0.3}>
      <Kicker>{s.qKicker}</Kicker>
    </Reveal>
    <Reveal at={T.q[0] + 0.5}>
      <Headline>{s.qTitle}</Headline>
    </Reveal>
    <Reveal at={T.q[0] + 2.2} style={{marginTop: 26}}>
      <Card>
        <Body>
          <Rich text={s.qBody} />
        </Body>
      </Card>
    </Reveal>
    <Reveal at={T.q[0] + 5.2}>
      <Body color={C.yellow}>{s.qBody2}</Body>
    </Reveal>
  </Panel>
);

const Step1: React.FC<P> = ({s}) => {
  const t = useSeconds();
  const count = Array.from({length: K}, (_, n) => t >= T.s1[0] + 1.2 + n * 0.95).filter(Boolean).length;
  return (
    <Panel range={T.s1}>
      <Kicker>
        {s.stepOf(1)} · {s.s1Name}
      </Kicker>
      <Headline>{s.s1Title}</Headline>
      <Card style={{marginTop: 18}}>
        <Body>
          <Rich text={s.s1Body} />
        </Body>
      </Card>
      <FormulaBox style={{alignSelf: 'flex-start', fontSize: 62}}>
        <Math_ tex={`${cK('k_1')} = ${cK(count)}`} />
      </FormulaBox>
      <Reveal at={T.s1[0] + 6.8}>
        <Body color={C.muted} size={36}>
          <Rich text={s.s1Note} />
        </Body>
      </Reveal>
    </Panel>
  );
};

const Step2: React.FC<P> = ({s}) => {
  const t = useSeconds();
  const count = FOCUS_PAIRS.filter((_, n) => t >= T.s2[0] + 2 + n * 0.72).length;
  return (
    <Panel range={T.s2}>
      <Kicker>
        {s.stepOf(2)} · {s.s2Name}
      </Kicker>
      <Headline>{s.s2Title}</Headline>
      <Card style={{marginTop: 18}}>
        <Body>
          <Rich text={s.s2Body} />
        </Body>
      </Card>
      <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
        <div style={{fontFamily: TITLE_FONT, fontWeight: 800, fontSize: 92, color: C.violet, minWidth: 130}}>
          {count}
        </div>
        <Body color={C.muted}>{s.s2Counter}</Body>
      </div>
      <Reveal at={T.s2[0] + 9.6}>
        <FormulaBox style={{fontSize: 46, textAlign: 'center'}}>
          <Math_ tex={`\\frac{${cK('k_1')}(${cK('k_1')}-1)}{2} = \\frac{${cK(K)}\\times ${K - 1}}{2} = ${cP(POSSIBLE)}`} />
        </FormulaBox>
      </Reveal>
      <Reveal at={T.s2[0] + 11.2}>
        <Body color={C.muted} size={34}>
          {s.s2Note}
        </Body>
      </Reveal>
    </Panel>
  );
};

const Step3: React.FC<P> = ({s}) => {
  const t = useSeconds();
  const count = FOCUS_REAL.filter((_, n) => t >= T.s3[0] + 1 + n * 1.15).length;
  return (
    <Panel range={T.s3}>
      <Kicker>
        {s.stepOf(3)} · {s.s3Name}
      </Kicker>
      <Headline>{s.s3Title}</Headline>
      <Card style={{marginTop: 18}}>
        <Body>
          <Rich text={s.s3Body} />
        </Body>
      </Card>
      <FormulaBox style={{alignSelf: 'flex-start', fontSize: 62}}>
        <Math_ tex={`${cL('L_1')} = ${cL(count)}`} />
      </FormulaBox>
      <Reveal at={T.s3[0] + 7.6}>
        <Body>
          <Rich text={s.s3Tri} />
        </Body>
      </Reveal>
      <Reveal at={T.s3[0] + 10.6}>
        <Body color={C.muted} size={34}>
          {s.s3Note}
        </Body>
      </Reveal>
    </Panel>
  );
};

const Gauge: React.FC<{value: number; at: number; lang: Lang}> = ({value, at, lang}) => {
  const t = useSeconds();
  const v = value * ramp(t, at, at + 1.4);
  return (
    <div style={{position: 'relative', height: 62}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 22, borderRadius: 11, background: C.slate}} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: 22,
          width: `${v * 100}%`,
          borderRadius: 11,
          background: `linear-gradient(90deg, ${C.cyan}, ${C.magenta})`,
          boxShadow: `0 0 18px ${C.magenta}66`,
        }}
      />
      {[0, 0.5, 1].map((x) => (
        <div
          key={x}
          style={{
            position: 'absolute',
            top: 30,
            left: `${x * 100}%`,
            translate: x === 0 ? '0' : x === 1 ? '-100%' : '-50%',
            fontFamily: BODY_FONT,
            fontSize: 28,
            color: C.muted,
          }}
        >
          {x === 0.5 ? num(lang, x, 1) : x}
        </div>
      ))}
    </div>
  );
};

const Step4: React.FC<P> = ({s, lang}) => (
  <Panel range={T.s4}>
    <Kicker>
      {s.stepOf(4)} · {s.s4Name}
    </Kicker>
    <Headline>{s.s4Title}</Headline>
    <Reveal at={T.s4[0] + 0.9} style={{fontSize: 46, marginTop: 14, color: C.text}}>
      <Math_ tex={`C_1 = \\frac{${cL(L)}}{${cP(POSSIBLE)}}`} display />
    </Reveal>
    <Reveal at={T.s4[0] + 4.5}>
      <FormulaBox style={{fontSize: 50, textAlign: 'center'}}>
        <Math_
          tex={`${cC('C_i')} = \\frac{${cL('L_i')}}{\\tfrac{${cK('k_i')}(${cK('k_i')}-1)}{2}} = \\frac{2${cL('L_i')}}{${cK('k_i')}(${cK('k_i')}-1)}`}
        />
      </FormulaBox>
    </Reveal>
    <Reveal at={T.s4[0] + 8.5} style={{fontSize: 44, textAlign: 'center', color: C.text}}>
      <Math_
        tex={`C_1 = \\frac{2\\times ${cL(L)}}{${cK(K)}\\times ${K - 1}} = \\frac{${2 * L}}{${K * (K - 1)}} = ${cC(num(lang, VALUE, 1, true))}`}
      />
    </Reveal>
    <Reveal at={T.s4[0] + 11.2}>
      <Gauge value={VALUE} at={T.s4[0] + 11.4} lang={lang} />
    </Reveal>
    <Reveal at={T.s4[0] + 13}>
      <Body size={38}>
        <Rich text={s.s4Read} />
      </Body>
    </Reveal>
  </Panel>
);

const MiniGraph: React.FC<{kind: 'star' | 'clique' | 'leaf'; at: number}> = ({kind, at}) => {
  const t = useSeconds();
  const cx = 230;
  const cy = 170;
  const R = 130;
  const ring = Array.from({length: 5}, (_, n) => {
    const a = -Math.PI / 2 + (n * 2 * Math.PI) / 5;
    return {x: cx + R * Math.cos(a), y: cy + R * Math.sin(a)};
  });
  const pts = kind === 'leaf' ? [{x: cx + 130, y: cy}] : ring;
  const c0 = kind === 'leaf' ? {x: cx - 110, y: cy} : {x: cx, y: cy};
  const between: [number, number][] = [];
  if (kind === 'clique') {
    for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) between.push([a, b]);
  }
  return (
    <svg width={460} height={340} style={{display: 'block', margin: '0 auto'}}>
      <GlowDefs />
      {pts.map((p, n) => (
        <line
          key={n}
          x1={c0.x}
          y1={c0.y}
          x2={p.x}
          y2={p.y}
          stroke={C.line}
          strokeWidth={4}
          opacity={ramp(t, at + 0.2, at + 0.7)}
        />
      ))}
      {between.map(([a, b], n) => {
        const on = ramp(t, at + 0.9 + n * 0.12, at + 1.2 + n * 0.12);
        return (
          <line
            key={n}
            x1={ring[a].x}
            y1={ring[a].y}
            x2={ring[a].x + (ring[b].x - ring[a].x) * on}
            y2={ring[a].y + (ring[b].y - ring[a].y) * on}
            stroke={C.yellow}
            strokeWidth={5}
            strokeLinecap="round"
            opacity={on > 0 ? 1 : 0}
          />
        );
      })}
      {pts.map((p, n) => (
        <NodeDot key={n} x={p.x} y={p.y} r={24} tone="cyan" opacity={ramp(t, at + 0.1, at + 0.6)} />
      ))}
      <NodeDot x={c0.x} y={c0.y} r={32} label="i" tone="magenta" opacity={ramp(t, at, at + 0.5)} />
    </svg>
  );
};

const Extreme: React.FC<{
  at: number;
  kind: 'star' | 'clique' | 'leaf';
  name: string;
  value: string;
  body: string;
}> = ({at, kind, name, value, body}) => (
  <Reveal at={at} style={{flex: 1}}>
    <Card style={{height: 742, padding: '26px 30px', display: 'flex', flexDirection: 'column', gap: 12}}>
      <div style={{fontFamily: TITLE_FONT, fontWeight: 700, fontSize: 32, color: C.muted, textAlign: 'center'}}>
        {name}
      </div>
      <MiniGraph kind={kind} at={at + 0.2} />
      <div style={{textAlign: 'center', fontSize: 46, color: C.text}}>
        <Math_ tex={value} />
      </div>
      <Body size={33}>
        <Rich text={body} />
      </Body>
    </Card>
  </Reveal>
);

const Extremes: React.FC<P> = ({s}) => {
  const t = useSeconds();
  const o = window01(t, T.ext[0] - 0.6, T.ext[1] - 0.3, 0.7);
  if (o <= 0.001) return null;
  const a = T.ext[0];
  return (
    <div style={{position: 'absolute', left: 96, right: 96, top: 78, opacity: o}}>
      <Kicker>{s.extKicker}</Kicker>
      <div style={{marginTop: 14}}>
        <Headline>{s.extTitle}</Headline>
      </div>
      <div style={{display: 'flex', gap: 34, marginTop: 30}}>
        <Extreme
          at={a + 1}
          kind="star"
          name={s.ext0Name}
          value={`${cL('L_i')} = 0 \\;\\Rightarrow\\; ${cC('C_i')} = 0`}
          body={s.ext0Body}
        />
        <Extreme
          at={a + 6}
          kind="clique"
          name={s.ext1Name}
          value={`${cL('L_i')} = 10 \\;\\Rightarrow\\; ${cC('C_i')} = 1`}
          body={s.ext1Body}
        />
        <Extreme
          at={a + 11.5}
          kind="leaf"
          name={s.extUName}
          value={`${cK('k_i')} \\leq 1 \\;\\Rightarrow\\; ${cC('C_i')}\\ ?`}
          body={s.extUBody}
        />
      </div>
    </div>
  );
};

const EveryNode: React.FC<P> = ({s, lang}) => {
  const t = useSeconds();
  const start = T.all[0];
  const cell: React.CSSProperties = {flex: 1, textAlign: 'center'};
  const sum = STATS.reduce((a, x) => a + x.C, 0);
  return (
    <Panel range={T.all}>
      <Kicker>{s.allKicker}</Kicker>
      <Headline size={54}>{s.allTitle}</Headline>
      <div style={{marginTop: 4}}>
        <div
          style={{
            display: 'flex',
            fontFamily: BODY_FONT,
            fontWeight: 700,
            fontSize: 30,
            color: C.muted,
            padding: '8px 22px',
          }}
        >
          <div style={cell}>{s.colNode}</div>
          <div style={cell}>
            <Math_ tex="k" />
          </div>
          <div style={cell}>
            <Math_ tex="L" />
          </div>
          <div style={cell}>
            <Math_ tex="C" />
          </div>
        </div>
        {STATS.map((x, n) => {
          const at = start + 1.2 + n * 0.75;
          const hl = (x.i === 1 || x.i === 7) && t > start + 9;
          return (
            <div
              key={x.i}
              style={{
                display: 'flex',
                fontFamily: BODY_FONT,
                fontSize: 33,
                padding: '6px 22px',
                color: hl ? C.yellow : C.text,
                fontWeight: hl ? 700 : 400,
                background: hl ? '#3A311066' : 'transparent',
                borderRadius: 10,
                opacity: ramp(t, at, at + 0.4),
              }}
            >
              <div style={cell}>{x.i}</div>
              <div style={cell}>{x.k}</div>
              <div style={cell}>{x.L}</div>
              <div style={cell}>{num(lang, x.C, 3)}</div>
            </div>
          );
        })}
      </div>
      <Reveal at={start + 8} style={{fontSize: 38, color: C.text}}>
        <Math_
          tex={`\\langle C\\rangle = \\frac{1}{N}\\sum_i C_i = \\frac{${num(lang, sum, 3, true)}}{${STATS.length}} = ${cC(num(lang, MEAN_C, 3, true))}`}
        />
      </Reveal>
      <Reveal at={start + 10.5}>
        <Body size={34}>
          <Rich text={s.allInsight} />
        </Body>
      </Reveal>
    </Panel>
  );
};

const End: React.FC<P> = ({s}) => {
  const t = useSeconds();
  const o = ramp(t, T.end[0], T.end[0] + 0.8);
  if (o <= 0.001) return null;
  const a = T.end[0];
  return (
    <div style={{position: 'absolute', left: 96, right: 96, top: 92, opacity: o}}>
      <Kicker>{s.endKicker}</Kicker>
      <div style={{marginTop: 16}}>
        <Headline>{s.endTitle}</Headline>
      </div>
      <div style={{display: 'flex', gap: 70, marginTop: 44, alignItems: 'flex-start'}}>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 30}}>
          {[s.end1, s.end2, s.end3].map((line, n) => (
            <Reveal key={n} at={a + 0.8 + n * 1.2}>
              <Body>
                <span style={{fontFamily: TITLE_FONT, fontWeight: 800, color: C.magenta, marginRight: 22}}>
                  {n + 1}
                </span>
                <Rich text={line} />
              </Body>
            </Reveal>
          ))}
          <Reveal at={a + 4.6}>
            <FormulaBox style={{fontSize: 66, textAlign: 'center', marginTop: 12}}>
              <Math_ tex={`${cC('C_i')} = \\frac{2${cL('L_i')}}{${cK('k_i')}(${cK('k_i')}-1)}`} />
            </FormulaBox>
          </Reveal>
        </div>
        <Reveal at={a + 6} style={{width: 500, textAlign: 'center'}}>
          <Img src={staticFile('qr.svg')} style={{width: 380, height: 380, borderRadius: 18, display: 'inline-block'}} />
          <div style={{fontFamily: BODY_FONT, fontSize: 38, color: C.yellow, marginTop: 24}}>{s.endCta}</div>
          <div style={{fontFamily: BODY_FONT, fontSize: 31, color: C.muted, marginTop: 10}}>{SITE_URL}</div>
        </Reveal>
      </div>
    </div>
  );
};

export const LocalClustering: React.FC<{lang: Lang}> = ({lang}) => {
  const s = STRINGS[lang];
  const t = useSeconds();
  // Dark cover for the opening, and at the end of the video.
  const dark = Math.max(1 - ramp(t, T.title[1] - 0.8, T.title[1] + 0.2), ramp(t, T.end[0] - 0.4, T.end[0] + 0.6));
  const progress = interpolate(t, [0, DURATION], [0, 100], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Img src={staticFile('bg_content.jpg')} style={{position: 'absolute', inset: 0, width: 1920, height: 1080}} />
      <Img
        src={staticFile('bg_dark.jpg')}
        style={{position: 'absolute', inset: 0, width: 1920, height: 1080, opacity: dark}}
      />
      <MainGraph t={t} lang={lang} />
      <Title s={s} lang={lang} />
      <Question s={s} lang={lang} />
      <Step1 s={s} lang={lang} />
      <Step2 s={s} lang={lang} />
      <Step3 s={s} lang={lang} />
      <Step4 s={s} lang={lang} />
      <Extremes s={s} lang={lang} />
      <EveryNode s={s} lang={lang} />
      <End s={s} lang={lang} />
      <div
        style={{
          position: 'absolute',
          left: 96,
          bottom: 30,
          fontFamily: BODY_FONT,
          fontSize: 20,
          color: C.faint,
          opacity: t > T.title[1] ? 1 : 0,
        }}
      >
        {s.footer}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          height: 5,
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${C.cyan}, ${C.magenta})`,
        }}
      />
    </AbsoluteFill>
  );
};
