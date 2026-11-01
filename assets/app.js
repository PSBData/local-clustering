import {
  barabasiAlbert, buildSteps, clique, communities, courseExample, erdosRenyi, forceLayout,
  localClustering, parseAnswer, star, summary, wattsStrogatz,
} from './graph.js';
import {STRINGS} from './i18n.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const W = 800;
const H = 600;
const $ = (id) => document.getElementById(id);

// Slider definitions per model: [key, label key, min, max, step, default].
const MODELS = {
  course: {params: []},
  er: {params: [['n', 'pN', 5, 40, 1, 12], ['p', 'pP', 0.02, 0.9, 0.01, 0.3]]},
  ws: {params: [['n', 'pN', 6, 40, 1, 16], ['k', 'pK', 2, 8, 2, 4], ['beta', 'pBeta', 0, 1, 0.01, 0.1]]},
  ba: {params: [['n', 'pN', 5, 40, 1, 18], ['m', 'pM', 1, 4, 1, 2]]},
  sbm: {params: [['n', 'pN', 6, 40, 1, 18], ['groups', 'pGroups', 2, 4, 1, 3], ['pIn', 'pIn', 0.2, 1, 0.01, 0.75], ['pOut', 'pOut', 0, 0.3, 0.01, 0.03]]},
  star: {params: [['n', 'pN', 3, 20, 1, 7]]},
  clique: {params: [['n', 'pN', 3, 12, 1, 6]]},
};

const SEEDED = new Set(['er', 'ws', 'ba', 'sbm']);

const state = {
  lang: 'en',
  model: 'course',
  params: {},
  seed: 42,
  g: null,
  pos: new Map(),
  sel: null,
  steps: [],
  step: 0,
  mode: 'walk',
  heat: false,
  armed: null,
  timer: null,
  sort: {key: 'i', dir: 1},
  quiz: {node: null, solved: false, tried: false, ok: 0, n: 0},
};

// Drawing elements kept between repaints, so that CSS transitions can run.
const els = {edges: new Map(), nodes: new Map(), layers: {}};

const t = () => STRINGS[state.lang];

function loadLang() {
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'en' || saved === 'fr') return saved;
  } catch { /* storage may be blocked */ }
  return (navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

function saveLang(lang) {
  try { localStorage.setItem('lang', lang); } catch { /* storage may be blocked */ }
}

// Numbers: 3 decimals, decimal comma in French.
const fmt = (x, d = 3) => {
  const s = x.toFixed(d);
  return state.lang === 'fr' ? s.replace('.', ',') : s;
};
const fmtTex = (x, d = 3) => {
  const s = x.toFixed(d);
  return state.lang === 'fr' ? s.replace('.', '{,}') : s;
};

function tex(el, src, display = false) {
  window.katex.render(src, el, {throwOnError: false, displayMode: display});
}

// Fills an element from a string with **bold** and $math$.
function rich(el, text) {
  el.textContent = '';
  for (const part of text.split(/(\*\*[^*]+\*\*|\$[^$]+\$)/g)) {
    if (!part) continue;
    if (part.startsWith('**')) {
      const b = document.createElement('strong');
      b.textContent = part.slice(2, -2);
      el.append(b);
    } else if (part.startsWith('$')) {
      const s = document.createElement('span');
      tex(s, part.slice(1, -1));
      el.append(s);
    } else {
      el.append(document.createTextNode(part));
    }
  }
}

// ---- Graph creation

function buildGraph() {
  const p = state.params;
  const s = state.seed;
  switch (state.model) {
    case 'er': return erdosRenyi(p.n, p.p, s);
    case 'ws': return wattsStrogatz(p.n, p.k, p.beta, s);
    case 'ba': return barabasiAlbert(p.n, p.m, s);
    case 'sbm': return communities(p.n, p.groups, p.pIn, p.pOut, s);
    case 'star': return star(p.n);
    case 'clique': return clique(p.n);
    default: return null;
  }
}

function regenerate() {
  stopPlay();
  if (state.model === 'course') {
    const {g, pos} = courseExample();
    state.g = g;
    state.pos = pos;
  } else {
    state.g = buildGraph();
    state.pos = forceLayout(state.g, state.seed);
  }
  state.armed = null;
  clearDrawing();
  chooseStartNode();
  if (state.mode === 'quiz') newQuiz();
  refresh();
}

// Start on the most informative node: highest degree, as on the slide.
function chooseStartNode() {
  const ids = state.g.nodes();
  if (!ids.length) { state.sel = null; state.steps = []; return; }
  const best = ids.reduce((a, b) => (state.g.degree(b) > state.g.degree(a) ? b : a), ids[0]);
  selectNode(best, false);
}

function selectNode(id, repaint = true) {
  stopPlay();
  state.sel = id;
  rebuildSteps(0);
  if (repaint) refresh();
}

function rebuildSteps(index) {
  if (state.sel === null) { state.steps = []; state.step = 0; return; }
  state.steps = buildSteps(localClustering(state.g, state.sel));
  state.step = Math.min(index, state.steps.length - 1);
}

// ---- Drawing

const px = (id) => {
  const p = state.pos.get(id);
  return {x: p.x * W, y: p.y * H};
};

const nodeRadius = () => {
  const n = state.g.nodes().length;
  const base = n <= 12 ? 23 : n <= 24 ? 18 : 14;
  // On a narrow screen the drawing shrinks: grow the nodes so they stay tappable.
  const width = $('graph').clientWidth || W;
  return base * Math.min(1.9, Math.max(1, 520 / width));
};

function setupDrawing() {
  const svg = $('graph');
  for (const name of ['tri', 'edges', 'pairs', 'nodes']) {
    const g = document.createElementNS(SVG_NS, 'g');
    svg.append(g);
    els.layers[name] = g;
  }
}

function clearDrawing() {
  for (const l of Object.values(els.layers)) l.textContent = '';
  els.edges.clear();
  els.nodes.clear();
}

function line(a, b, cls) {
  const l = document.createElementNS(SVG_NS, 'line');
  const p = px(a);
  const q = px(b);
  l.setAttribute('x1', p.x);
  l.setAttribute('y1', p.y);
  l.setAttribute('x2', q.x);
  l.setAttribute('y2', q.y);
  l.setAttribute('class', cls);
  return l;
}

const edgeKey = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`);

function heatColour(c) {
  // one hue, from dark teal to the course cyan
  const a = [0x12, 0x34, 0x3c];
  const b = [0x3d, 0xf2, 0xff];
  const m = a.map((v, n) => Math.round(v + (b[n] - v) * c));
  return `rgb(${m.join(' ')})`;
}

function paintGraph(sum) {
  const g = state.g;
  const r = nodeRadius();
  const s = state.sel !== null ? localClustering(g, state.sel) : null;
  const quiz = state.mode === 'quiz';
  const edit = state.mode === 'edit';
  const step = state.steps[state.step];
  const kind = edit ? 'ratio' : step?.kind;
  const nbSet = new Set(s?.neighbours ?? []);

  const lit = !quiz && kind !== 'pick' && s !== null;
  const asideKinds = new Set(['possible', 'check']);
  const aside = !edit && !quiz && asideKinds.has(kind);

  // Pairs already checked, and the one under the cursor.
  let upto = -1;
  let current = null;
  if (!quiz && s) {
    if (kind === 'check') { upto = step.index; current = s.pairs[step.index]; }
    if (kind === 'ratio' || kind === 'read') upto = s.pairs.length;
  }
  const yes = new Set();
  const no = new Set();
  if (s) {
    s.pairs.forEach(([a, b], n) => {
      if (n > upto) return;
      (g.hasEdge(a, b) ? yes : no).add(edgeKey(a, b));
    });
  }

  // Links
  const seen = new Set();
  for (const [a, b] of g.edges()) {
    const key = edgeKey(a, b);
    seen.add(key);
    let el = els.edges.get(key);
    if (!el) {
      el = line(a, b, 'edge');
      els.layers.edges.append(el);
      els.edges.set(key, el);
    }
    const spoke = s && (a === s.i || b === s.i);
    const cls = ['edge'];
    if (yes.has(key)) cls.push('yes');
    else if (spoke && lit) cls.push('spoke');
    if (aside && !yes.has(key)) cls.push('dim');
    el.setAttribute('class', cls.join(' '));
  }
  for (const [key, el] of els.edges) {
    if (!seen.has(key)) { el.remove(); els.edges.delete(key); }
  }

  // Candidate pairs, dashed. A pair that exists shows as its real link once checked.
  els.layers.pairs.textContent = '';
  if (s && !quiz && !edit && ['possible', 'check', 'ratio', 'read'].includes(kind)) {
    s.pairs.forEach(([a, b], n) => {
      const key = edgeKey(a, b);
      if (yes.has(key)) return;
      const cls = ['pair'];
      if (no.has(key)) cls.push('no');
      if (current && current[0] === a && current[1] === b) cls.push('current');
      els.layers.pairs.append(line(a, b, cls.join(' ')));
    });
  }

  // Triangles closed with the focus node
  els.layers.tri.textContent = '';
  if (s && !quiz) {
    for (const key of yes) {
      const [a, b] = key.split(':').map(Number);
      const poly = document.createElementNS(SVG_NS, 'polygon');
      poly.setAttribute('points', [s.i, a, b].map((id) => { const p = px(id); return `${p.x},${p.y}`; }).join(' '));
      poly.setAttribute('class', 'tri');
      els.layers.tri.append(poly);
    }
  }

  // Nodes
  const byId = new Map(sum.stats.map((x) => [x.i, x]));
  const live = new Set(g.nodes());
  for (const id of live) {
    let el = els.nodes.get(id);
    if (!el) {
      el = document.createElementNS(SVG_NS, 'g');
      el.setAttribute('tabindex', '0');
      el.dataset.id = id;
      el.append(document.createElementNS(SVG_NS, 'circle'), document.createElementNS(SVG_NS, 'text'));
      el.lastChild.textContent = id;
      els.layers.nodes.append(el);
      els.nodes.set(id, el);
    }
    const p = px(id);
    el.setAttribute('transform', `translate(${p.x} ${p.y})`);
    el.firstChild.setAttribute('r', r);
    el.lastChild.setAttribute('font-size', r * 0.82);

    const cls = ['node'];
    const isNb = lit && nbSet.has(id);
    if (s && id === s.i) cls.push('focus');
    else if (isNb) cls.push('nb');
    if (aside && !isNb) cls.push('faded');
    if (current && current.includes(id)) cls.push('current');
    if (state.armed === id) cls.push('armed');

    const circle = el.firstChild;
    const label = el.lastChild;
    circle.style.fill = '';
    label.style.fill = '';
    if (state.heat && !quiz) {
      const c = byId.get(id).C;
      if (c === null) {
        cls.push('undefined-heat');
      } else if (!(s && id === s.i)) {
        circle.style.fill = heatColour(c);
        label.style.fill = c > 0.55 ? '#0b0b14' : '#f2f3fa';
      }
    }
    el.setAttribute('class', cls.join(' '));
    el.setAttribute('aria-label', nodeSummary(byId.get(id), quiz));
  }
  for (const [id, el] of els.nodes) {
    if (!live.has(id)) { el.remove(); els.nodes.delete(id); }
  }

  $('graph').classList.toggle('adding', edit);
  $('legend').hidden = !state.heat || quiz;
}

function nodeSummary(x, hide) {
  const name = t().plotTip(String(x.i));
  if (hide) return name;
  const c = x.C === null ? t().legendUndef : fmt(x.C);
  return `${name}, k = ${x.k}, L = ${x.L}, C = ${c}`;
}

function moveNode(id) {
  const p = px(id);
  els.nodes.get(id)?.setAttribute('transform', `translate(${p.x} ${p.y})`);
  for (const [key, el] of els.edges) {
    const [a, b] = key.split(':').map(Number);
    if (a !== id && b !== id) continue;
    if (a === id) { el.setAttribute('x1', p.x); el.setAttribute('y1', p.y); }
    if (b === id) { el.setAttribute('x2', p.x); el.setAttribute('y2', p.y); }
  }
}

// ---- Step panel

function paintWalk(sum) {
  const T = t();
  const edit = state.mode === 'edit';
  const body = $('stepBody');
  const formula = $('formula');
  const chips = $('chips');
  const gauge = $('gauge');
  formula.textContent = '';
  chips.textContent = '';
  gauge.hidden = true;

  if (state.sel === null) {
    $('stepKicker').textContent = '';
    $('stepTitle').textContent = T.pickTitle;
    rich(body, T.noNodes);
    for (const id of ['prev', 'play', 'next', 'skip']) $(id).disabled = true;
    $('progressBar').style.width = '0';
    return;
  }

  const s = localClustering(state.g, state.sel);
  const i = s.i;
  const total = state.steps.length;
  const step = edit ? (s.k < 2 ? {kind: 'undefined'} : {kind: 'ratio'}) : state.steps[state.step];
  const list = s.neighbours.join(', ');

  $('stepKicker').textContent = edit ? t().plotTip(String(i)) : T.stepKicker(i, state.step + 1, total);
  for (const id of ['prev', 'play', 'next', 'skip']) {
    $(id).hidden = edit;
    $(id).disabled = false;
  }
  $('speed').parentElement.hidden = edit;
  $('prev').disabled = state.step === 0;
  $('next').disabled = state.step === total - 1;
  $('skip').disabled = state.step === total - 1;
  $('play').textContent = state.timer ? T.ctlPause : T.ctlPlay;
  $('progressBar').style.width = edit ? '100%' : `${((state.step + 1) / total) * 100}%`;

  const showChips = (upto, currentIndex) => {
    s.pairs.forEach(([a, b], n) => {
      const chip = document.createElement('span');
      const known = n <= upto;
      const has = state.g.hasEdge(a, b);
      chip.className = `chip${known ? (has ? ' yes' : ' no') : ''}${n === currentIndex ? ' current' : ''}`;
      chip.textContent = `(${a}, ${b})`;
      chips.append(chip);
    });
  };

  switch (step.kind) {
    case 'pick':
      $('stepTitle').textContent = T.pickTitle;
      rich(body, T.pickBody(i));
      break;
    case 'neighbours':
      $('stepTitle').textContent = T.nbTitle;
      rich(body, T.nbBody(i, s.k, list));
      break;
    case 'undefined':
      $('stepTitle').textContent = T.undefTitle;
      rich(body, T.undefBody(i, s.k));
      tex(formula, `C_{${i}} = \\frac{2\\times 0}{${s.k}\\times ${s.k - 1 === -1 ? '(-1)' : s.k - 1}} = \\frac{0}{0}`, true);
      break;
    case 'possible':
      $('stepTitle').textContent = T.possTitle;
      rich(body, T.possBody(i, s.k));
      tex(formula, `\\frac{k_{${i}}(k_{${i}}-1)}{2} = \\frac{${s.k}\\times ${s.k - 1}}{2} = ${s.possible}`, true);
      showChips(-1, -1);
      break;
    case 'check':
      $('stepTitle').textContent = T.checkTitle(step.index + 1, s.possible);
      rich(body, step.exists ? T.checkYes(step.a, step.b, step.running) : T.checkNo(step.a, step.b, step.running));
      showChips(step.index, step.index);
      break;
    case 'ratio': {
      $('stepTitle').textContent = T.ratioTitle;
      rich(body, T.ratioBody(i, s.L, s.possible));
      tex(
        formula,
        `C_{${i}} = \\frac{2L_{${i}}}{k_{${i}}(k_{${i}}-1)} = \\frac{2\\times ${s.L}}{${s.k}\\times ${s.k - 1}} = \\frac{${2 * s.L}}{${s.k * (s.k - 1)}} = ${fmtTex(s.C)}`,
        true,
      );
      gauge.hidden = false;
      gauge.querySelector('.fill').style.width = `${s.C * 100}%`;
      break;
    }
    case 'read': {
      $('stepTitle').textContent = T.readTitle;
      const pct = `${(s.C * 100).toFixed(1).replace('.', state.lang === 'fr' ? ',' : '.')}${state.lang === 'fr' ? ' ' : ''}%`;
      rich(body, `${T.readPct(i, s.L, s.possible, pct)} ${readingOf(s, sum)}`);
      tex(formula, `C_{${i}} = ${fmtTex(s.C)} \\qquad \\langle C\\rangle = ${fmtTex(sum.meanC)}`, true);
      gauge.hidden = false;
      gauge.querySelector('.fill').style.width = `${s.C * 100}%`;
      break;
    }
    default:
      break;
  }
}

// Section of the (k, C) plane, as in slide 21.
function readingOf(s, sum) {
  const T = t();
  if (s.k === sum.meanDegree || s.C === sum.meanC) return T.readEven;
  const highK = s.k > sum.meanDegree;
  const highC = s.C > sum.meanC;
  if (!highK && !highC) return T.readSection[1];
  if (!highK && highC) return T.readSection[2];
  if (highK && !highC) return T.readSection[3];
  return T.readSection[4];
}

function stopPlay() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
}

function togglePlay() {
  if (state.timer) {
    stopPlay();
  } else {
    if (state.step >= state.steps.length - 1) state.step = 0;
    state.timer = setInterval(() => {
      if (state.step >= state.steps.length - 1) stopPlay();
      else state.step += 1;
      refresh();
    }, Number($('speed').value));
  }
  refresh();
}

function goStep(delta) {
  stopPlay();
  state.step = Math.max(0, Math.min(state.steps.length - 1, state.step + delta));
  refresh();
}

// ---- Quiz

function candidates() {
  return state.g.nodes().filter((id) => state.g.degree(id) >= 2);
}

function newQuiz() {
  const list = candidates().filter((id) => id !== state.quiz.node);
  const pool = list.length ? list : candidates();
  state.quiz.node = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  state.quiz.solved = false;
  state.quiz.tried = false;
  state.sel = state.quiz.node;
  rebuildSteps(0);
  for (const id of ['ansK', 'ansL', 'ansC']) $(id).value = '';
  for (const id of ['markK', 'markL', 'markC']) { $(id).textContent = ''; $(id).className = ''; }
  $('quizFeedback').textContent = '';
}

function checkQuiz(ev) {
  ev.preventDefault();
  const T = t();
  const q = state.quiz;
  if (q.node === null) return;
  const s = localClustering(state.g, q.node);
  const k = parseAnswer($('ansK').value);
  const L = parseAnswer($('ansL').value);
  const C = parseAnswer($('ansC').value);
  if (k === null || L === null || C === null) {
    rich($('quizFeedback'), T.quizFormat);
    return;
  }
  const okK = k === s.k;
  const okL = L === s.L;
  const okC = Math.abs(C - s.C) < 0.006;
  [['markK', okK], ['markL', okL], ['markC', okC]].forEach(([id, ok]) => {
    $(id).textContent = ok ? '✓' : '✗';
    $(id).className = ok ? 'ok' : 'ko';
  });
  if (!q.tried && !q.solved) q.n += 1;
  q.tried = true;
  if (okK && okL && okC) {
    if (!q.solved) q.ok += 1;
    q.solved = true;
    rich($('quizFeedback'), T.quizAllOk(fmtTex(s.C)));
  } else {
    rich($('quizFeedback'), T.quizFix);
  }
  paintQuiz();
}

function paintQuiz() {
  const T = t();
  const q = state.quiz;
  if (q.node === null) {
    $('quizTitle').textContent = '';
    rich($('quizBody'), T.quizNone);
    $('quizForm').hidden = true;
  } else {
    $('quizTitle').textContent = T.quizTitle(q.node);
    rich($('quizBody'), T.quizBody);
    $('quizForm').hidden = false;
  }
  tex($('qk'), 'k');
  tex($('qL'), 'L');
  tex($('qC'), 'C');
  $('quizScore').textContent = q.n ? T.quizScore(q.ok, q.n) : '';
}

// ---- Tables and charts

function paintNetwork(sum) {
  const T = t();
  const tiles = $('tiles');
  tiles.textContent = '';
  const row = [
    [String(sum.N), T.tileN],
    [String(sum.links), T.tileL],
    [fmt(sum.density), T.tileD],
    [fmt(sum.meanDegree, 2), T.tileK],
    [fmt(sum.meanC), T.tileC],
  ];
  for (const [v, l] of row) {
    const d = document.createElement('div');
    d.className = 'tile';
    const a = document.createElement('div');
    a.className = 'v';
    a.textContent = v;
    const b = document.createElement('div');
    b.className = 'l';
    b.textContent = l;
    d.append(a, b);
    tiles.append(d);
  }
  let note = T.netNoteBase(fmtTex(sum.meanC), fmtTex(sum.density));
  if (sum.undefinedCount) note += T.netNoteUndef(sum.undefinedCount, sum.meanDefined === null ? '?' : fmt(sum.meanDefined));
  rich($('netNote'), note);
}

function paintTable(sum) {
  const T = t();
  const {key, dir} = state.sort;
  const rows = [...sum.stats].sort((a, b) => {
    const va = a[key] ?? -1;
    const vb = b[key] ?? -1;
    return (va - vb) * dir || a.i - b.i;
  });
  const table = $('table');
  table.textContent = '';
  const head = table.createTHead().insertRow();
  const cols = [['i', T.colNode], ['k', 'k'], ['L', 'L'], ['C', 'C']];
  for (const [k, label] of cols) {
    const th = document.createElement('th');
    th.scope = 'col';
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label + (key === k ? (dir > 0 ? ' ↑' : ' ↓') : '');
    b.addEventListener('click', () => {
      state.sort = {key: k, dir: key === k ? -dir : k === 'i' ? 1 : -1};
      refresh();
    });
    th.append(b);
    head.append(th);
  }
  head.append(document.createElement('th'));
  const body = table.createTBody();
  for (const x of rows) {
    const tr = body.insertRow();
    if (x.i === state.sel) tr.className = 'selected';
    tr.addEventListener('click', () => selectFromAnalysis(x.i));
    tr.insertCell().textContent = x.i;
    tr.insertCell().textContent = x.k;
    tr.insertCell().textContent = x.L;
    tr.insertCell().textContent = x.C === null ? T.legendUndef : fmt(x.C);
    const bar = tr.insertCell();
    bar.className = 'bar';
    const i = document.createElement('i');
    if (x.C === null) i.className = 'none';
    else i.style.width = `${x.C * 100}%`;
    bar.append(i);
  }
}

function selectFromAnalysis(id) {
  if (state.mode === 'quiz') return;
  selectNode(id);
}

function svgEl(name, attrs = {}, parent) {
  const el = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  parent?.append(el);
  return el;
}

function paintPlot(sum) {
  const T = t();
  const svg = $('plot');
  svg.textContent = '';
  const m = {l: 54, r: 18, t: 14, b: 48};
  const w = 560;
  const h = 400;
  const iw = w - m.l - m.r;
  const ih = h - m.t - m.b;
  const shown = sum.stats.filter((x) => x.C !== null);
  const maxK = Math.max(2, ...sum.stats.map((x) => x.k));
  const x = (v) => m.l + (v / (maxK + 0.5)) * iw;
  const y = (v) => m.t + (1 - v) * ih;

  const axis = svgEl('g', {class: 'axis'}, svg);
  for (const v of [0, 0.25, 0.5, 0.75, 1]) {
    svgEl('line', {x1: m.l, x2: w - m.r, y1: y(v), y2: y(v)}, axis);
    const l = svgEl('text', {x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end'}, axis);
    l.textContent = fmt(v, 2);
  }
  const every = Math.max(1, Math.ceil(maxK / 10));
  for (let v = 0; v <= maxK; v += every) {
    const l = svgEl('text', {x: x(v), y: h - m.b + 18, 'text-anchor': 'middle'}, axis);
    l.textContent = v;
  }
  const xl = svgEl('text', {x: m.l + iw / 2, y: h - 8, 'text-anchor': 'middle'}, axis);
  xl.textContent = T.plotX;
  const yl = svgEl('text', {transform: `translate(14 ${m.t + ih / 2}) rotate(-90)`, 'text-anchor': 'middle'}, axis);
  yl.textContent = T.plotY;

  svgEl('line', {class: 'mean-line', x1: x(sum.meanDegree), x2: x(sum.meanDegree), y1: m.t, y2: h - m.b}, svg);
  svgEl('line', {class: 'mean-line', x1: m.l, x2: w - m.r, y1: y(sum.meanC), y2: y(sum.meanC)}, svg);

  // Nodes sharing the same (k, C) are one dot, larger, listed in the tooltip.
  const groups = new Map();
  for (const s of shown) {
    const key = `${s.k}|${s.C.toFixed(6)}`;
    if (!groups.has(key)) groups.set(key, {k: s.k, C: s.C, ids: []});
    groups.get(key).ids.push(s.i);
  }
  for (const g of groups.values()) {
    const selected = g.ids.includes(state.sel) && state.mode !== 'quiz';
    const r = 6 + Math.min(7, g.ids.length - 1) * 1.1;
    svgEl('circle', {class: `dot${selected ? ' selected' : ''}`, cx: x(g.k), cy: y(g.C), r}, svg);
    const hit = svgEl('circle', {class: 'hit', cx: x(g.k), cy: y(g.C), r: Math.max(14, r + 6), tabindex: 0}, svg);
    hit.setAttribute('aria-label', `${T.plotTip(g.ids.join(', '))}, k = ${g.k}, C = ${fmt(g.C)}`);
    const show = (ev) => {
      const box = ev.target.getBoundingClientRect();
      tooltip(`C = ${fmt(g.C)}`, `k = ${g.k} · ${T.plotTip(g.ids.join(', '))}`, box.left + box.width / 2, box.top);
    };
    hit.addEventListener('pointerenter', show);
    hit.addEventListener('focus', show);
    hit.addEventListener('pointerleave', hideTooltip);
    hit.addEventListener('blur', hideTooltip);
    hit.addEventListener('click', () => selectFromAnalysis(g.ids[0]));
    hit.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') selectFromAnalysis(g.ids[0]);
    });
  }
  const n = sum.undefinedCount;
  $('plotUndef').textContent = n ? T.plotUndef(n) : '';
}

function tooltip(main, sub, x, y) {
  const el = $('tooltip');
  el.textContent = '';
  const a = document.createElement('strong');
  a.textContent = main;
  const b = document.createElement('span');
  b.textContent = sub;
  el.append(a, b);
  el.hidden = false;
  const r = el.getBoundingClientRect();
  el.style.left = `${Math.max(8, Math.min(window.innerWidth - r.width - 8, x - r.width / 2))}px`;
  el.style.top = `${Math.max(8, y - r.height - 10)}px`;
}

function hideTooltip() {
  $('tooltip').hidden = true;
}

// ---- Static text and controls

function paintStatic() {
  const T = t();
  document.documentElement.lang = state.lang;
  document.title = T.docTitle;
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = T[el.dataset.t];
  for (const b of document.querySelectorAll('[data-lang]')) {
    b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang));
  }
  for (const b of document.querySelectorAll('[data-mode]')) {
    b.setAttribute('aria-selected', String(b.dataset.mode === state.mode));
  }
  const model = $('model');
  const value = state.model;
  model.textContent = '';
  for (const key of Object.keys(MODELS)) {
    const o = document.createElement('option');
    o.value = key;
    o.textContent = T.models[key];
    model.append(o);
  }
  model.value = value;
  paintParams();

  tex($('sheetFormula'), 'C_i = \\frac{2L_i}{k_i(k_i-1)}', true);
  rich($('sheetDefBody'), T.sheetDefBody);
  const ul = $('sheetTraps');
  ul.textContent = '';
  for (const line_ of T.traps) {
    const li = document.createElement('li');
    rich(li, line_);
    ul.append(li);
  }
  $('sheetCodeNote').textContent = T.sheetCodeNote;

  const video = $('video');
  const src = `assets/video/local-clustering-${state.lang}.mp4`;
  if (video.getAttribute('src') !== src) video.setAttribute('src', src);
}

function paintParams() {
  const T = t();
  const box = $('params');
  box.textContent = '';
  for (const [key, label, min, max, step] of MODELS[state.model].params) {
    const wrap = document.createElement('label');
    wrap.className = 'slider';
    const row = document.createElement('span');
    row.className = 'row';
    const name = document.createElement('span');
    name.textContent = T[label];
    const out = document.createElement('output');
    out.textContent = state.params[key];
    row.append(name, out);
    const input = document.createElement('input');
    input.type = 'range';
    Object.assign(input, {min, max, step, value: state.params[key]});
    input.addEventListener('input', () => {
      state.params[key] = Number(input.value);
      out.textContent = input.value;
      regenerate();
    });
    wrap.append(row, input);
    box.append(wrap);
  }
  $('seed').disabled = !SEEDED.has(state.model);
  $('seed').value = state.seed;
}

function paintHint() {
  const T = t();
  const hint = $('stageHint');
  hint.textContent = '';
  if (state.mode === 'walk') hint.textContent = T.hintWalk;
  if (state.mode === 'quiz') hint.textContent = T.hintQuiz;
  if (state.mode === 'edit') {
    hint.textContent = state.armed === null ? T.hintEdit : T.hintEditArmed(state.armed);
    if (state.armed !== null) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = T.removeNode(state.armed);
      b.style.marginLeft = '10px';
      b.addEventListener('click', () => {
        const id = state.armed;
        state.g.removeNode(id);
        state.pos.delete(id);
        state.armed = null;
        if (state.sel === id) chooseStartNode();
        refresh();
      });
      hint.append(b);
    }
  }
}

// Repaints everything that depends on the graph, selection or step.
function refresh() {
  const sum = summary(state.g);
  const quiz = state.mode === 'quiz';
  $('walkPanel').hidden = quiz;
  $('quizPanel').hidden = !quiz;
  $('analysis').classList.toggle('locked', quiz);
  $('analysis').inert = quiz;
  document.querySelector('.stats').hidden = quiz;
  $('heat').disabled = quiz;
  paintGraph(sum);
  if (quiz) paintQuiz();
  else paintWalk(sum);
  paintHint();
  paintNetwork(sum);
  paintTable(sum);
  paintPlot(sum);
}

function setMode(mode) {
  if (state.mode === mode) return;
  stopPlay();
  state.mode = mode;
  state.armed = null;
  if (mode === 'quiz') newQuiz();
  else rebuildSteps(0);
  paintStatic();
  refresh();
}

function setModel(model) {
  state.model = model;
  state.params = Object.fromEntries(MODELS[model].params.map(([key, , , , , def]) => [key, def]));
  paintParams();
  regenerate();
}

// ---- Pointer: drag, select, edit

function svgPoint(ev) {
  const svg = $('graph');
  const m = svg.getScreenCTM().inverse();
  const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m);
  return {x: p.x, y: p.y};
}

function setupPointer() {
  const svg = $('graph');
  let drag = null;

  svg.addEventListener('pointerdown', (ev) => {
    const g = ev.target.closest('.node');
    if (g) {
      drag = {id: Number(g.dataset.id), moved: false, sx: ev.clientX, sy: ev.clientY};
      svg.setPointerCapture(ev.pointerId);
    } else {
      drag = {id: null};
    }
  });

  svg.addEventListener('pointermove', (ev) => {
    const g = ev.target.closest?.('.node');
    if (g && !drag && state.mode !== 'quiz') {
      const x = localClustering(state.g, Number(g.dataset.id));
      const box = g.getBoundingClientRect();
      tooltip(`C = ${x.C === null ? t().legendUndef : fmt(x.C)}`, `${t().plotTip(String(x.i))} · k = ${x.k} · L = ${x.L}`, box.left + box.width / 2, box.top);
    } else if (!drag) {
      hideTooltip();
    }
    if (!drag || drag.id === null) return;
    if (Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) > 4) drag.moved = true;
    if (!drag.moved) return;
    hideTooltip();
    const p = svgPoint(ev);
    state.pos.set(drag.id, {x: Math.min(0.97, Math.max(0.03, p.x / W)), y: Math.min(0.96, Math.max(0.04, p.y / H))});
    moveNode(drag.id);
    if (state.steps[state.step] && ['possible', 'check', 'ratio', 'read'].includes(state.steps[state.step].kind)) paintGraph(summary(state.g));
  });

  svg.addEventListener('pointerleave', () => { if (!drag) hideTooltip(); });

  svg.addEventListener('pointerup', (ev) => {
    const d = drag;
    drag = null;
    if (!d) return;
    if (d.id === null) {
      if (state.mode === 'edit' && state.armed === null) {
        const p = svgPoint(ev);
        const id = state.g.addNode(state.g.nextId());
        state.pos.set(id, {x: p.x / W, y: p.y / H});
        if (state.sel === null) state.sel = id;
        rebuildSteps(0);
        refresh();
      } else if (state.mode === 'edit') {
        state.armed = null;
        refresh();
      }
      return;
    }
    if (!d.moved) nodeClicked(d.id);
  });

  svg.addEventListener('keydown', (ev) => {
    const g = ev.target.closest?.('.node');
    if (g && (ev.key === 'Enter')) nodeClicked(Number(g.dataset.id));
  });
}

function nodeClicked(id) {
  if (state.mode === 'quiz') return;
  if (state.mode === 'edit') {
    if (state.armed === null) {
      state.armed = id;
      state.sel = id;
      rebuildSteps(0);
    } else if (state.armed === id) {
      state.armed = null;
    } else {
      state.g.toggleEdge(state.armed, id);
      state.sel = state.armed;
      rebuildSteps(0);
    }
    refresh();
    return;
  }
  selectNode(id);
}

function setupControls() {
  for (const b of document.querySelectorAll('[data-lang]')) {
    b.addEventListener('click', () => {
      state.lang = b.dataset.lang;
      saveLang(state.lang);
      paintStatic();
      refresh();
    });
  }
  for (const b of document.querySelectorAll('[data-mode]')) {
    b.addEventListener('click', () => setMode(b.dataset.mode));
  }
  $('model').addEventListener('change', (ev) => setModel(ev.target.value));
  $('seed').addEventListener('change', (ev) => {
    const v = Math.max(0, Math.floor(Number(ev.target.value)) || 0);
    state.seed = v;
    regenerate();
  });
  $('regen').addEventListener('click', () => {
    state.seed = Math.floor(Math.random() * 100000);
    $('seed').value = state.seed;
    // Fixed graphs have nothing to redraw: go to a random network instead.
    if (SEEDED.has(state.model)) regenerate();
    else {
      $('model').value = 'er';
      setModel('er');
    }
  });
  $('heat').addEventListener('change', (ev) => {
    state.heat = ev.target.checked;
    refresh();
  });
  $('prev').addEventListener('click', () => goStep(-1));
  $('next').addEventListener('click', () => goStep(1));
  $('skip').addEventListener('click', () => goStep(state.steps.length));
  $('play').addEventListener('click', togglePlay);
  $('speed').addEventListener('change', () => {
    if (state.timer) { stopPlay(); togglePlay(); }
  });
  $('quizForm').addEventListener('submit', checkQuiz);
  $('quizNew').addEventListener('click', () => { newQuiz(); refresh(); });
  $('quizShow').addEventListener('click', () => {
    const id = state.quiz.node;
    setMode('walk');
    if (id !== null) selectNode(id);
  });
  document.addEventListener('keydown', (ev) => {
    if (state.mode !== 'walk') return;
    if (ev.target.closest('input, select, textarea, video')) return;
    if (ev.key === 'ArrowRight') { ev.preventDefault(); goStep(1); }
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); goStep(-1); }
    // Space keeps its normal meaning on buttons and links.
    if (ev.key === ' ' && !ev.target.closest('button, a')) { ev.preventDefault(); togglePlay(); }
  });
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refresh, 150);
  });
}

function start() {
  state.lang = loadLang();
  setupDrawing();
  setupPointer();
  setupControls();
  state.params = {};
  paintStatic();
  regenerate();
}

start();
