import { normalize } from './ephemeris';

// Modern rulers of the signs, Aries to Pisces: Scorpio — Pluto, Aquarius — Uranus, Pisces — Neptune.
export const MODERN_RULERS = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'pluto', 'jupiter', 'saturn', 'uranus', 'neptune'];

// The ten planets of the chains: no angles, nodes, Lilith or asteroids. All ten count, whether
// or not they are shown on the wheel: leaving one out would change where the arrows end.
export const CHAIN_PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

const rulerOf = (longitude) => MODERN_RULERS[Math.floor(normalize(longitude) / 30)];

/**
 * Splits a graph where every node has one outgoing edge into chains. Each chain ends in a center:
 * a cycle — one node pointing at itself ('single'), two in mutual reception ('mutual'), a ring of
 * 3+ ('cycle') — or a node whose ruler was not calculated ('missing', with `missing` its ruler).
 * `next` maps a node to the node its arrow points at; `missingRuler` maps the nodes whose target
 * is not among `nodes` to the planet that is missing.
 * Returns [{ center: [ids in arrow order], type, missing?, members: [ids], sources: Map(id → [ids pointing at it]) }],
 * the largest chains first; `sources` leaves out the arrows inside the center.
 */
function findChains(nodes, next, missingRuler) {
  const centerOf = new Map(); // node → its chain's center (the same array for the whole chain)
  for (const node of missingRuler.keys()) centerOf.set(node, [node]);
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
      const missing = missingRuler.get(center[0]);
      chain = {
        center,
        type: missingRuler.has(center[0]) ? 'missing' : center.length === 1 ? 'single' : center.length === 2 ? 'mutual' : 'cycle',
        ...(missing && { missing }),
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
  const missing = new Map(nodes.filter((id) => !byId.has(next.get(id))).map((id) => [id, next.get(id)]));
  return findChains(nodes, next, missing);
}

/**
 * House chain: each house (1–12) points at the house its cusp ruler stands in.
 * Returns { chains, rulers }, `rulers` mapping each house to the planet ruling its cusp, or null
 * when the cusps could not be calculated (e.g. Placidus at a polar latitude).
 */
export function houseChains(planets, cusps) {
  if (cusps?.length !== 12 || !cusps.every(Number.isFinite)) return null;
  const houseOfPlanet = new Map(planets.map((p) => [p.id, p.house]));
  const nodes = cusps.map((_, i) => i + 1);
  const rulers = new Map(nodes.map((h) => [h, rulerOf(cusps[h - 1])]));
  const next = new Map(nodes.map((h) => [h, houseOfPlanet.get(rulers.get(h))]));
  const missing = new Map(nodes.filter((h) => next.get(h) == null).map((h) => [h, rulers.get(h)]));
  return { chains: findChains(nodes, next, missing), rulers };
}

export function calculateDispositors(chartData) {
  const planets = chartData.planets.filter((p) => CHAIN_PLANETS.includes(p.id));
  return {
    planetary: planetaryChains(planets),
    houses: houseChains(planets, chartData.houses),
  };
}
