// On screen text. Markup: **bold**, $inline math$.

export type Lang = 'en' | 'fr';

// Decimal point in English, decimal comma in French. `tex` protects it for KaTeX.
export const num = (lang: Lang, x: number, digits: number, tex = false) => {
  const text = x.toFixed(digits);
  if (lang === 'en') return text;
  return text.replace('.', tex ? '{,}' : ',');
};
export const SITE_URL = 'psbdata.github.io/local-clustering';

const en = {
  footer: 'Social Network Analysis · MSc Data Management · PSB 2026/2027 · Charles Perez',
  titleKicker: 'SESSION 2 · PART A · CLUSTERING',
  title: 'Local clustering coefficient',
  subtitle: 'Are my friends friends with each other?',
  qKicker: 'THE QUESTION',
  qTitle: 'How tight is the circle around one node?',
  qBody: 'Take **node 1**. We look at its neighbours, and only at them.',
  qBody2: 'Four steps give the answer.',
  stepOf: (n: number) => `STEP ${n} / 4`,
  s1Name: 'NEIGHBOURS',
  s1Title: 'Find the neighbours',
  s1Body: 'Follow every link that leaves node 1. The number of neighbours is the **degree** $k_1$.',
  s1Note: '**Node 7** has no link to node 1, so it is not part of this calculation.',
  s2Name: 'POSSIBLE LINKS',
  s2Title: 'Count the possible links',
  s2Body: 'Set node 1 aside. If all neighbours knew each other, how many links would join them?',
  s2Counter: 'possible links',
  s2Note: 'Each of the 5 neighbours could reach 4 others. Divide by 2, because (2, 3) and (3, 2) are the same link.',
  s3Name: 'EXISTING LINKS',
  s3Title: 'Count the links that exist',
  s3Body: 'Among those pairs, keep the ones that are really connected. This is $L_1$.',
  s3Tri: 'Each existing link closes a **triangle** with node 1.',
  s3Note: '(3, 7) and (4, 7) do not count: node 7 is not a neighbour of node 1.',
  s4Name: 'THE RATIO',
  s4Title: 'Divide existing by possible',
  s4Read: '**Half** of the possible links between the neighbours of node 1 exist.',
  extKicker: 'READING THE VALUE',
  extTitle: 'Two extremes, and one trap',
  ext0Name: 'Star',
  ext0Body: 'No neighbour knows another. Node i is a **bridge**: structural holes (Burt).',
  ext1Name: 'Clique',
  ext1Body: 'Every neighbour knows every other. **Closure**: dense trust (Coleman).',
  extUName: 'One neighbour or none',
  extUBody: 'No pair to test, so the ratio is $\\tfrac{0}{0}$. $C_i$ is **undefined**, not zero.',
  allKicker: 'EVERY NODE HAS ITS OWN VALUE',
  allTitle: 'A high degree is not a high C',
  colNode: 'Node',
  allInsight: 'Node 7 has the lowest degree and the highest $C$. **Clustering measures closure, not popularity.**',
  endKicker: 'TO REMEMBER',
  endTitle: 'Local clustering in three moves',
  end1: 'Count the neighbours: $k_i$',
  end2: 'Count the links between them: $L_i$',
  end3: 'Compare with the $\\tfrac{k_i(k_i-1)}{2}$ possible links',
  endCta: 'Now try it on your own graphs',
};

type Strings = typeof en;

const fr: Strings = {
  footer: 'Social Network Analysis · MSc Data Management · PSB 2026/2027 · Charles Perez',
  titleKicker: 'SÉANCE 2 · PARTIE A · CLUSTERING',
  title: 'Coefficient de clustering local',
  subtitle: 'Mes amis sont-ils amis entre eux ?',
  qKicker: 'LA QUESTION',
  qTitle: 'Le cercle autour d’un nœud est-il soudé ?',
  qBody: 'Prenons le **nœud 1**. On regarde ses voisins, et seulement eux.',
  qBody2: 'Quatre étapes donnent la réponse.',
  stepOf: (n: number) => `ÉTAPE ${n} / 4`,
  s1Name: 'VOISINS',
  s1Title: 'Trouver les voisins',
  s1Body: 'Suivez chaque lien qui part du nœud 1. Le nombre de voisins est le **degré** $k_1$.',
  s1Note: 'Le **nœud 7** n’a pas de lien avec le nœud 1 : il n’entre pas dans ce calcul.',
  s2Name: 'LIENS POSSIBLES',
  s2Title: 'Compter les liens possibles',
  s2Body: 'Mettons le nœud 1 de côté. Si tous les voisins se connaissaient, combien de liens les relieraient ?',
  s2Counter: 'liens possibles',
  s2Note: 'Chacun des 5 voisins pourrait rejoindre 4 autres. On divise par 2, car (2, 3) et (3, 2) sont le même lien.',
  s3Name: 'LIENS EXISTANTS',
  s3Title: 'Compter les liens qui existent',
  s3Body: 'Parmi ces paires, on garde celles qui sont vraiment reliées. C’est $L_1$.',
  s3Tri: 'Chaque lien existant ferme un **triangle** avec le nœud 1.',
  s3Note: '(3, 7) et (4, 7) ne comptent pas : le nœud 7 n’est pas un voisin du nœud 1.',
  s4Name: 'LE RATIO',
  s4Title: 'Existant sur possible',
  s4Read: 'La **moitié** des liens possibles entre les voisins du nœud 1 existe.',
  extKicker: 'LIRE LA VALEUR',
  extTitle: 'Deux extrêmes et un piège',
  ext0Name: 'Étoile',
  ext0Body: 'Aucun voisin n’en connaît un autre. Le nœud i est un **pont** : trous structuraux (Burt).',
  ext1Name: 'Clique',
  ext1Body: 'Chaque voisin connaît tous les autres. **Fermeture** : confiance dense (Coleman).',
  extUName: 'Un voisin ou aucun',
  extUBody: 'Aucune paire à tester, le ratio vaut $\\tfrac{0}{0}$. $C_i$ est **indéfini**, pas nul.',
  allKicker: 'CHAQUE NŒUD A SA VALEUR',
  allTitle: 'Degré élevé ne veut pas dire C élevé',
  colNode: 'Nœud',
  allInsight: 'Le nœud 7 a le plus petit degré et le plus grand $C$. **Le clustering mesure la fermeture, pas la popularité.**',
  endKicker: 'À RETENIR',
  endTitle: 'Le clustering local en trois gestes',
  end1: 'Compter les voisins : $k_i$',
  end2: 'Compter les liens entre eux : $L_i$',
  end3: 'Comparer aux $\\tfrac{k_i(k_i-1)}{2}$ liens possibles',
  endCta: 'À vous sur vos propres graphes',
};

export const STRINGS: Record<Lang, Strings> = {en, fr};
export type {Strings};
