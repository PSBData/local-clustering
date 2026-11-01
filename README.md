# Local Clustering Explorer

Interactive companion to the Social Network Analysis course (MSc Data Management, Paris School of Business). It teaches the local clustering coefficient, in English and French.

**Live site:** https://psbdata.github.io/local-clustering/

## What it does

* Generates networks: course example (slide 15), Erdős Rényi, Watts Strogatz, Barabási Albert, communities, star, clique. Random models take a seed, so a graph can be reproduced.
* Walks through the calculation for any node: neighbours, possible links, each pair checked one by one, ratio, reading.
* Lets students edit the graph and watch C change at once.
* Tests students on a random node, with the table and the chart hidden.
* Shows all nodes in a table and in the (k, C) plane, with the average lines used in class.

## Repository

* `index.html` and `assets/`: the static site, with no build step. Served by GitHub Pages from the root of `main`.
* `assets/graph.js`: graph logic and generators, free of any DOM code.
* `tests/compare_networkx.py`: checks `graph.js` against NetworkX. Run `python3 tests/compare_networkx.py` from the root.
* `video/`: Remotion source of the explainer, rendered in English and French.

## Run locally

```bash
python3 -m http.server 8000
```

## Render the video

```bash
cd video
npm install
npm run render:en
npm run render:fr
```

The QR code at the end of the video points to the live site. The address is set in `video/src/i18n.ts` and `video/public/qr.svg`.

## Conventions

`C_i = 2L_i / k_i(k_i - 1)`. When `k_i < 2` the value is undefined, as in the course. NetworkX returns 0 for those nodes, and the mean clustering shown on the site follows `nx.average_clustering`. The site then also shows the mean over defined nodes.

## Third party

* [KaTeX](https://katex.org) (MIT), bundled in `assets/katex/`.
* Montserrat and Lato fonts (SIL Open Font License).
* [Remotion](https://www.remotion.dev) for the video source. Check its license terms before reusing the video code in an organisation.
