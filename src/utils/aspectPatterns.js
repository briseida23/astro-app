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

  // Member sets of the larger figures: smaller figures made of their planets are not listed again.
  const groupOf = (members) => new Set(members.map((m) => m.key));
  const inside = (groups, members) => groups.some((g) => members.every((m) => g.has(m.key)));
  const crosses = [];
  const wholes = []; // Mystic Rectangles, Kites and Cradles: each holds two or four half-wagons

  for (const quad of combinations(points, 4)) {
    // Try each way of splitting the four planets into two opposing pairs.
    for (const [p, q, r, s] of [
      [quad[0], quad[1], quad[2], quad[3]],
      [quad[0], quad[2], quad[1], quad[3]],
      [quad[0], quad[3], quad[1], quad[2]],
    ]) {
      if (!(is(p, q, 'opposition') && is(r, s, 'opposition'))) continue;
      if (is(p, r, 'square') && is(p, s, 'square') && is(q, r, 'square') && is(q, s, 'square')) {
        add('grandCross', quad);
        crosses.push(groupOf(quad));
      }
      // Mystic Rectangle: two oppositions whose ends are joined by two sextiles and two trines.
      if (
        (is(p, r, 'sextile') && is(q, s, 'sextile') && is(p, s, 'trine') && is(q, r, 'trine')) ||
        (is(p, s, 'sextile') && is(q, r, 'sextile') && is(p, r, 'trine') && is(q, s, 'trine'))
      ) {
        add('mysticRectangle', quad);
        wholes.push(groupOf(quad));
      }
    }
  }

  // One pass over the oppositions: a T-square's apex is square to both ends; a half-wagon's
  // (slanted sail's) apex is trine to one end and sextile to the other. Half-wagons are kept
  // until the larger figures are known.
  const halfWagons = [];
  for (const [p, q] of combinations(points, 2)) {
    if (!is(p, q, 'opposition')) continue;
    for (const apex of points) {
      if (apex === p || apex === q) continue;
      if (is(apex, p, 'square') && is(apex, q, 'square')) {
        if (!inside(crosses, [p, q, apex])) add('tSquare', [p, q, apex], apex);
      } else if (
        (is(apex, p, 'trine') && is(apex, q, 'sextile')) ||
        (is(apex, p, 'sextile') && is(apex, q, 'trine'))
      ) {
        halfWagons.push([p, q, apex]);
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
          wholes.push(groupOf([...trio, d]));
        }
      }
    }
  }

  // Cradle (trapezoid): an opposition spanned by a chain of three sextiles p–r–s–q,
  // so r and s are also trine to the far ends of the opposition.
  for (const [p, q] of combinations(points, 2)) {
    if (!is(p, q, 'opposition')) continue;
    const others = points.filter((x) => x !== p && x !== q);
    for (const [a, b] of combinations(others, 2)) {
      for (const [r, s] of [[a, b], [b, a]]) {
        if (
          is(p, r, 'sextile') && is(r, s, 'sextile') && is(s, q, 'sextile') &&
          is(p, s, 'trine') && is(r, q, 'trine')
        ) {
          add('cradle', [p, r, s, q]);
          wholes.push(groupOf([p, q, r, s]));
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

  // The weakest figure goes last; inside a Mystic Rectangle, Kite or Cradle only the whole is shown.
  for (const members of halfWagons) {
    if (!inside(wholes, members)) add('halfWagon', members, members[2]);
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
  // A half-wagon is too weak to count as a transit event: it stays a natal figure only.
  const patterns = findAspectPatterns([...natalPlanets, ...transits], aspects).filter(
    (p) =>
      p.type !== 'halfWagon' &&
      p.members.some((m) => m.ring === 'natal') && p.members.some((m) => m.ring !== 'natal')
  );
  return { patterns, aspects };
}
