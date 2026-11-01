// Graph of slide 15 (Session 2, Part A). Every value shown in the video is
// computed here from the edge list: nothing is typed by hand.

export type Edge = [number, number];

export const NODES = [1, 2, 3, 4, 5, 6, 7];

export const EDGES: Edge[] = [
  [1, 2], [1, 3], [1, 4], [1, 5], [1, 6],
  [2, 3], [3, 4], [4, 5], [5, 6], [2, 6],
  [3, 7], [4, 7],
];

// Node coordinates read from the slide figure, scaled to the video frame.
const RAW: Record<number, [number, number]> = {
  1: [603, 259], 2: [585, 164], 3: [658, 236], 4: [631, 320],
  5: [537, 313], 6: [511, 217], 7: [718, 312],
};
const SCALE = 3.55;
export const POS: Record<number, {x: number; y: number}> = Object.fromEntries(
  Object.entries(RAW).map(([k, [x, y]]) => [
    Number(k),
    {x: 1075 + (x - 511) * SCALE, y: 225 + (y - 164) * SCALE},
  ]),
);

const linked = (a: number, b: number) =>
  EDGES.some(([u, v]) => (u === a && v === b) || (u === b && v === a));

export const neighbours = (i: number) => NODES.filter((n) => n !== i && linked(i, n));

export const pairsOf = (list: number[]): Edge[] => {
  const out: Edge[] = [];
  list.forEach((a, x) => list.slice(x + 1).forEach((b) => out.push([a, b])));
  return out;
};

export type Stat = {i: number; k: number; L: number; possible: number; C: number};

export const stat = (i: number): Stat => {
  const nb = neighbours(i);
  const pairs = pairsOf(nb);
  const L = pairs.filter(([a, b]) => linked(a, b)).length;
  return {i, k: nb.length, L, possible: pairs.length, C: pairs.length ? L / pairs.length : NaN};
};

export const STATS = NODES.map(stat);
export const MEAN_C = STATS.reduce((s, x) => s + x.C, 0) / STATS.length;

// Focus node of the walkthrough, as in the slide.
export const FOCUS = 1;
export const FOCUS_NB = neighbours(FOCUS);
export const FOCUS_PAIRS = pairsOf(FOCUS_NB);
export const FOCUS_REAL = FOCUS_PAIRS.filter(([a, b]) => linked(a, b));
export const FOCUS_STAT = stat(FOCUS);
