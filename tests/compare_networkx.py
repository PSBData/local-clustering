"""Checks assets/graph.js against NetworkX on generated graphs.

Run with:
    python3 tests/compare_networkx.py
"""
import json
import math
import subprocess
import textwrap
from pathlib import Path

import networkx as nx

ROOT = Path(__file__).resolve().parent.parent

SCRIPT = textwrap.dedent("""
    import * as G from './assets/graph.js';
    const out = [];
    for (let seed = 1; seed <= 40; seed++) {
      const graphs = {
        er: G.erdosRenyi(5 + seed % 30, 0.05 + (seed % 9) / 10, seed),
        ws: G.wattsStrogatz(6 + seed % 30, 2 + 2 * (seed % 4), (seed % 11) / 10, seed),
        ba: G.barabasiAlbert(5 + seed % 30, 1 + seed % 4, seed),
        sbm: G.communities(6 + seed % 30, 2 + seed % 3, 0.7, 0.03, seed),
      };
      for (const [name, g] of Object.entries(graphs)) {
        const s = G.summary(g);
        out.push({name, seed, nodes: g.nodes(), edges: g.edges(), density: s.density,
                  meanC: s.meanC, local: s.stats.map((x) => [x.i, x.k, x.L, x.C])});
      }
    }
    const c = G.courseExample().g;
    const s = G.summary(c);
    out.push({name: 'course', seed: 0, nodes: c.nodes(), edges: c.edges(), density: s.density,
              meanC: s.meanC, local: s.stats.map((x) => [x.i, x.k, x.L, x.C])});
    console.log(JSON.stringify(out));
""")

raw = subprocess.run(
    ["node", "--input-type=module", "-e", SCRIPT], capture_output=True, text=True, check=True, cwd=ROOT
).stdout
cases = json.loads(raw)

for case in cases:
    g = nx.Graph()
    g.add_nodes_from(case["nodes"])
    g.add_edges_from(case["edges"])
    expected = nx.clustering(g)
    for i, k, links, c in case["local"]:
        assert g.degree(i) == k, (case["name"], case["seed"], i)
        nb = list(g.neighbors(i))
        assert g.subgraph(nb).number_of_edges() == links, (case["name"], case["seed"], i)
        if k < 2:
            assert c is None and expected[i] == 0
        else:
            assert math.isclose(c, expected[i], abs_tol=1e-9), (case["name"], case["seed"], i)
    assert math.isclose(case["meanC"], nx.average_clustering(g), abs_tol=1e-9), (case["name"], case["seed"])
    assert math.isclose(case["density"], nx.density(g), abs_tol=1e-9), (case["name"], case["seed"])

print(f"{len(cases)} graphs match NetworkX")
