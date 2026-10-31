import { findAspects, PLANET_IDS } from './aspects';

// Only real planets form figures: no angles, nodes, Lilith, asteroids or fictitious points.

function combinations(items, k, start = 0, acc = [], out = []) {
  if (acc.length === k) {
    out.push(acc);
    return out;
  }
  for (let i = start; i < items.length; i++) combinations(items, k, i + 1, [...acc, items[i]], out);
  return out;
}

export function findAspectPatterns(planets, aspects) {
  const points = planets.filter((p) => PLANET_IDS.has(p.id));
  const typeOf = new Map();
  for (const a of aspects) {
    typeOf.set(`${a.a.key}|${a.b.key}`, a.type);
    typeOf.set(`${a.b.key}|${a.a.key}`, a.type);
  }
  const is = (p, q, type) => typeOf.get(`${p.key}|${q.key}`) === type;

  const patterns = [];
  const add = (type, members, apex) => patterns.push({ type, members, apex });

  const crossMembers = new Set();
  for (const quad of combinations(points, 4)) {
    // Try each way of splitting the four planets into two opposing pairs.
    for (const [p, q, r, s] of [
      [quad[0], quad[1], quad[2], quad[3]],
      [quad[0], quad[2], quad[1], quad[3]],
      [quad[0], quad[3], quad[1], quad[2]],
    ]) {
      if (
        is(p, q, 'opposition') && is(r, s, 'opposition') &&
        is(p, r, 'square') && is(p, s, 'square') && is(q, r, 'square') && is(q, s, 'square')
      ) {
        add('grandCross', quad);
        crossMembers.add(quad.map((x) => x.key).sort().join());
      }
    }
  }
  const insideCross = (members) =>
    [...crossMembers].some((c) => members.every((m) => c.split(',').includes(m.key)));

  for (const [p, q] of combinations(points, 2)) {
    if (!is(p, q, 'opposition')) continue;
    for (const apex of points) {
      if (apex === p || apex === q) continue;
      if (is(apex, p, 'square') && is(apex, q, 'square') && !insideCross([p, q, apex])) {
        add('tSquare', [p, q, apex], apex);
      }
    }
  }

  for (const trio of combinations(points, 3)) {
    const [p, q, r] = trio;
    if (!(is(p, q, 'trine') && is(q, r, 'trine') && is(p, r, 'trine'))) continue;
    add('grandTrine', trio);
    for (const d of points) {
      if (trio.includes(d)) continue;
      for (const [opp, s1, s2] of [[p, q, r], [q, p, r], [r, p, q]]) {
        if (is(d, opp, 'opposition') && is(d, s1, 'sextile') && is(d, s2, 'sextile')) {
          add('kite', [...trio, d], opp);
        }
      }
    }
  }

  for (const [p, q] of combinations(points, 2)) {
    if (!is(p, q, 'trine')) continue;
    for (const apex of points) {
      if (apex === p || apex === q) continue;
      if (is(apex, p, 'sextile') && is(apex, q, 'sextile')) add('bisextile', [p, q, apex], apex);
    }
  }

  return patterns;
}

/**
 * Figures that one transit planet completes with natal ones. Natal pairs keep their natal
 * aspects; the transit's aspects must be within `orb` degrees, so moving transits do not
 * produce loose "phantom" figures. Transit-to-transit aspects are left out: they are the same
 * sky for everyone, so a figure may hold only one transit planet.
 * Returns the figures and every aspect they can be drawn from.
 */
export function findTransitPatterns(natalPlanets, natalAspects, transitPlanets, aspectSettings, orb) {
  // The transiting Moon joins only when it is switched on for transit aspects.
  const transits = transitPlanets.filter((p) => PLANET_IDS.has(p.id) && (p.id !== 'moon' || aspectSettings.include?.moon));
  const narrow = {
    ...aspectSettings,
    orbs: Object.fromEntries([...PLANET_IDS].map((id) => [id, Object.fromEntries(Object.keys(aspectSettings.enabled).map((a) => [a, orb]))])),
  };
  const aspects = [
    ...natalAspects,
    ...findAspects(transits, narrow, natalPlanets.filter((p) => PLANET_IDS.has(p.id))),
  ];
  const patterns = findAspectPatterns([...natalPlanets, ...transits], aspects).filter(
    (p) => p.members.some((m) => m.ring === 'natal') && p.members.some((m) => m.ring !== 'natal')
  );
  return { patterns, aspects };
}
