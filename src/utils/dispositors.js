import { normalize } from './ephemeris';

// Modern rulers of the signs, Aries to Pisces: Scorpio — Pluto, Aquarius — Uranus, Pisces — Neptune.
export const MODERN_RULERS = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'pluto', 'jupiter', 'saturn', 'uranus', 'neptune'];

// The ten planets of the chains: no angles, nodes, Lilith or asteroids.
export const CHAIN_PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

const rulerOf = (longitude) => MODERN_RULERS[Math.floor(normalize(longitude) / 30)];

/**
 * Splits a graph where every node has exactly one outgoing edge into chains. Each chain ends in
 * a center — a cycle: one node pointing at itself, two in mutual reception, or a ring of 3+.
 * `next` maps a node to the node its arrow points at.
 * Returns [{ center: [ids in arrow order], type, members: [ids], sources: Map(id → [ids pointing at it]) }],
 * the largest chains first; `sources` leaves out the arrows inside the center.
 */
function findChains(nodes, next) {
  const centerOf = new Map(); // node → the center (array) its arrows end in
  for (const start of nodes) {
    const path = [];
    let node = start;
    while (!centerOf.has(node) && !path.includes(node)) {
      path.push(node);
      node = next.get(node);
    }
    let center = centerOf.get(node);
    if (!center) {
      // The walk closed on itself: the cycle starts at the first repeat. Begin it at the earliest node.
      const cycle = path.slice(path.indexOf(node));
      const first = Math.min(...cycle.map((n) => nodes.indexOf(n)));
      const at = cycle.indexOf(nodes[first]);
      center = [...cycle.slice(at), ...cycle.slice(0, at)];
    }
    for (const n of path) centerOf.set(n, center);
  }

  const chains = [];
  for (const node of nodes) {
    const center = centerOf.get(node);
    let chain = chains.find((c) => c.center === center);
    if (!chain) {
      chain = {
        center,
        type: center.length === 1 ? 'single' : center.length === 2 ? 'mutual' : 'cycle',
        members: [],
        sources: new Map(),
      };
      chains.push(chain);
    }
    chain.members.push(node);
    if (center.includes(node)) continue;
    const to = next.get(node);
    chain.sources.set(to, [...(chain.sources.get(to) ?? []), node]);
  }
  return chains.sort((a, b) => b.members.length - a.members.length);
}

/** Planetary chain: each planet points at the ruler of its sign. Needs no birth time. */
export function planetaryChains(planets) {
  const byId = new Map(planets.map((p) => [p.id, p]));
  const nodes = CHAIN_PLANETS.filter((id) => byId.has(id));
  const next = new Map(nodes.map((id) => [id, rulerOf(byId.get(id).longitude)]));
  return findChains(nodes, next);
}

/**
 * House chain: each house points at the house its cusp ruler stands in. Needs the birth time.
 * `rulers` maps a house (1–12) to the ruling planet, for the labels.
 */
export function houseChains(planets, cusps) {
  const houseOfPlanet = new Map(planets.map((p) => [p.id, p.house]));
  const nodes = cusps.map((_, i) => i + 1);
  const rulers = new Map(nodes.map((h) => [h, rulerOf(cusps[h - 1])]));
  const next = new Map(nodes.map((h) => [h, houseOfPlanet.get(rulers.get(h))]));
  return { chains: findChains(nodes, next), rulers };
}

export function calculateDispositors(chartData) {
  const planets = chartData.planets.filter((p) => CHAIN_PLANETS.includes(p.id));
  return {
    planetary: planetaryChains(planets),
    houses: chartData.houses?.length === 12 ? houseChains(planets, chartData.houses) : null,
  };
}
