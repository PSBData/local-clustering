// Graph logic: no DOM here, so that the same code runs in the browser and in the
// test suite (tests/compare_networkx.py checks it against NetworkX).

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Graph {
  constructor(n = 0) {
    this.adj = new Map();
    for (let i = 1; i <= n; i++) this.addNode(i);
  }

  addNode(id) {
    if (!this.adj.has(id)) this.adj.set(id, new Set());
    return id;
  }

  nextId() {
    return this.nodes().reduce((m, x) => Math.max(m, x), 0) + 1;
  }

  removeNode(id) {
    for (const n of this.adj.get(id) ?? []) this.adj.get(n).delete(id);
    this.adj.delete(id);
  }

  addEdge(a, b) {
    if (a === b) return;
    this.addNode(a);
    this.addNode(b);
    this.adj.get(a).add(b);
    this.adj.get(b).add(a);
  }

  removeEdge(a, b) {
    this.adj.get(a)?.delete(b);
    this.adj.get(b)?.delete(a);
  }

  hasEdge(a, b) {
    return this.adj.get(a)?.has(b) ?? false;
  }

  toggleEdge(a, b) {
    if (this.hasEdge(a, b)) this.removeEdge(a, b);
    else this.addEdge(a, b);
  }

  nodes() {
    return [...this.adj.keys()];
  }

  edges() {
    const out = [];
    for (const [a, set] of this.adj) for (const b of set) if (a < b) out.push([a, b]);
    return out;
  }

  neighbours(i) {
    return [...(this.adj.get(i) ?? [])].sort((x, y) => x - y);
  }

  degree(i) {
    return this.adj.get(i)?.size ?? 0;
  }
}

// Every unordered pair of a list.
export function pairs(list) {
  const out = [];
  for (let a = 0; a < list.length; a++) {
    for (let b = a + 1; b < list.length; b++) out.push([list[a], list[b]]);
  }
  return out;
}

// Local clustering of node i. C is null when k < 2: the ratio is 0/0.
export function localClustering(g, i) {
  const nb = g.neighbours(i);
  const all = pairs(nb);
  const existing = all.filter(([a, b]) => g.hasEdge(a, b));
  const k = nb.length;
  const L = existing.length;
  const possible = all.length;
  return {i, k, L, possible, neighbours: nb, pairs: all, existing, C: possible > 0 ? L / possible : null};
}

export function summary(g) {
  const ids = g.nodes();
  const stats = ids.map((i) => localClustering(g, i));
  const N = ids.length;
  const links = g.edges().length;
  const defined = stats.filter((s) => s.C !== null);
  const sum = defined.reduce((acc, s) => acc + s.C, 0);
  return {
    N,
    links,
    density: N > 1 ? (2 * links) / (N * (N - 1)) : 0,
    meanDegree: N > 0 ? (2 * links) / N : 0,
    stats,
    undefinedCount: N - defined.length,
    // same convention as nx.average_clustering: undefined values count as 0
    meanC: N > 0 ? sum / N : 0,
    // mean over the nodes where C is defined
    meanDefined: defined.length ? sum / defined.length : null,
  };
}

// ---- Generators. All of them take a seed, so that a graph can be reproduced.

export function erdosRenyi(n, p, seed) {
  const rand = mulberry32(seed);
  const g = new Graph(n);
  for (let a = 1; a <= n; a++) {
    for (let b = a + 1; b <= n; b++) if (rand() < p) g.addEdge(a, b);
  }
  return g;
}

export function wattsStrogatz(n, k, beta, seed) {
  const rand = mulberry32(seed);
  const g = new Graph(n);
  const half = Math.max(1, Math.floor(k / 2));
  for (let a = 1; a <= n; a++) {
    for (let s = 1; s <= half; s++) g.addEdge(a, ((a - 1 + s) % n) + 1);
  }
  for (let a = 1; a <= n; a++) {
    for (let s = 1; s <= half; s++) {
      const b = ((a - 1 + s) % n) + 1;
      if (rand() < beta && g.hasEdge(a, b)) {
        const free = g.nodes().filter((x) => x !== a && !g.hasEdge(a, x));
        if (free.length) {
          g.removeEdge(a, b);
          g.addEdge(a, free[Math.floor(rand() * free.length)]);
        }
      }
    }
  }
  return g;
}

export function barabasiAlbert(n, m, seed) {
  const rand = mulberry32(seed);
  const g = new Graph(m + 1);
  const urn = [];
  for (const [a, b] of pairs(g.nodes())) {
    g.addEdge(a, b);
    urn.push(a, b);
  }
  for (let v = m + 2; v <= n; v++) {
    const chosen = new Set();
    while (chosen.size < m) chosen.add(urn[Math.floor(rand() * urn.length)]);
    for (const t of chosen) {
      g.addEdge(v, t);
      urn.push(v, t);
    }
  }
  return g;
}

// Planted communities: dense inside the groups, sparse between them.
export function communities(n, groups, pIn, pOut, seed) {
  const rand = mulberry32(seed);
  const g = new Graph(n);
  const group = (x) => (x - 1) % groups;
  for (let a = 1; a <= n; a++) {
    for (let b = a + 1; b <= n; b++) {
      if (rand() < (group(a) === group(b) ? pIn : pOut)) g.addEdge(a, b);
    }
  }
  return g;
}

export function star(n) {
  const g = new Graph(n);
  for (let v = 2; v <= n; v++) g.addEdge(1, v);
  return g;
}

export function clique(n) {
  const g = new Graph(n);
  for (const [a, b] of pairs(g.nodes())) g.addEdge(a, b);
  return g;
}

// Graph of slide 15, with the coordinates of the figure.
export function courseExample() {
  const g = new Graph(7);
  [[1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [2, 3], [3, 4], [4, 5], [5, 6], [2, 6], [3, 7], [4, 7]].forEach(
    ([a, b]) => g.addEdge(a, b),
  );
  const raw = {1: [603, 259], 2: [585, 164], 3: [658, 236], 4: [631, 320], 5: [537, 313], 6: [511, 217], 7: [718, 312]};
  const pos = new Map();
  for (const [id, [x, y]] of Object.entries(raw)) {
    pos.set(Number(id), {x: 0.08 + ((x - 511) / 207) * 0.84, y: 0.1 + ((y - 164) / 156) * 0.76});
  }
  return {g, pos};
}

// ---- Layout: Fruchterman Reingold, seeded, in a unit square.

export function forceLayout(g, seed, iterations = 320) {
  const rand = mulberry32(seed ^ 0x9e3779b9);
  const ids = g.nodes();
  const n = ids.length;
  const pos = new Map();
  ids.forEach((id, idx) => {
    const a = (idx / Math.max(1, n)) * 2 * Math.PI;
    pos.set(id, {x: 0.5 + 0.35 * Math.cos(a) + (rand() - 0.5) * 0.1, y: 0.5 + 0.35 * Math.sin(a) + (rand() - 0.5) * 0.1});
  });
  if (n < 2) return pos;
  const area = 1;
  const k = 0.82 * Math.sqrt(area / n);
  const edges = g.edges();
  let temp = 0.12;
  const cool = temp / (iterations + 1);
  for (let it = 0; it < iterations; it++) {
    const disp = new Map(ids.map((id) => [id, {x: 0, y: 0}]));
    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) {
        const pa = pos.get(ids[a]);
        const pb = pos.get(ids[b]);
        let dx = pa.x - pb.x;
        let dy = pa.y - pb.y;
        const d = Math.max(Math.hypot(dx, dy), 1e-3);
        const f = (k * k) / d;
        dx = (dx / d) * f;
        dy = (dy / d) * f;
        disp.get(ids[a]).x += dx;
        disp.get(ids[a]).y += dy;
        disp.get(ids[b]).x -= dx;
        disp.get(ids[b]).y -= dy;
      }
    }
    for (const [a, b] of edges) {
      const pa = pos.get(a);
      const pb = pos.get(b);
      const dx = pa.x - pb.x;
      const dy = pa.y - pb.y;
      const d = Math.max(Math.hypot(dx, dy), 1e-3);
      const f = (d * d) / k;
      disp.get(a).x -= (dx / d) * f;
      disp.get(a).y -= (dy / d) * f;
      disp.get(b).x += (dx / d) * f;
      disp.get(b).y += (dy / d) * f;
    }
    for (const id of ids) {
      const p = pos.get(id);
      const v = disp.get(id);
      // light pull towards the centre keeps isolated nodes in the frame
      v.x += (0.5 - p.x) * 0.9 * k;
      v.y += (0.5 - p.y) * 0.9 * k;
      const d = Math.max(Math.hypot(v.x, v.y), 1e-6);
      p.x += (v.x / d) * Math.min(d, temp);
      p.y += (v.y / d) * Math.min(d, temp);
    }
    temp -= cool;
  }
  // Fit into the frame, keeping the proportions of the drawing area.
  const xs = ids.map((id) => pos.get(id).x);
  const ys = ids.map((id) => pos.get(id).y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(...xs) - minX || 1;
  const spanY = Math.max(...ys) - minY || 1;
  for (const id of ids) {
    const p = pos.get(id);
    p.x = 0.08 + ((p.x - minX) / spanX) * 0.84;
    p.y = 0.08 + ((p.y - minY) / spanY) * 0.84;
  }
  return pos;
}

// Steps of the walkthrough for one node. The player only reads this list, so
// that what is drawn and what is said can never disagree with the calculation.
export function buildSteps(s) {
  const steps = [{kind: 'pick'}, {kind: 'neighbours'}];
  if (s.k < 2) {
    steps.push({kind: 'undefined'});
    return steps;
  }
  steps.push({kind: 'possible'});
  let running = 0;
  s.pairs.forEach(([a, b], n) => {
    const exists = s.existing.some(([x, y]) => x === a && y === b);
    if (exists) running += 1;
    steps.push({kind: 'check', a, b, exists, index: n, running});
  });
  steps.push({kind: 'ratio'}, {kind: 'read'});
  return steps;
}

// Accepts 0.5, 0,5 or 1/2.
export function parseAnswer(text) {
  const t = String(text).trim().replace(',', '.');
  if (!t) return null;
  const m = t.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (m) return Number(m[2]) === 0 ? null : Number(m[1]) / Number(m[2]);
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
}
