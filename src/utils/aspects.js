import { ASPECTS, ALL_OBJECTS, normalize } from './ephemeris';

// The ten real planets; only they form aspect figures.
export const PLANET_IDS = new Set([
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
]);

// Planets and Chiron always take part in aspects; the other groups are switched on per chart.
const CORE_IDS = new Set([...PLANET_IDS, 'chiron']);
const ANGLE_IDS = new Set(['ascendant', 'mc']);
const NODE_IDS = new Set(['node', 'southNode', 'lilith']);

/** Whether point `p` may form aspects under `include` ({ angles, nodes, extras, moon? }). */
function takesPart(p, include) {
  // The forecast Moon is optional: the transiting one (~13°/day) sets the mood of the day, not events.
  if (p.ring !== 'natal' && p.id === 'moon') return include.moon !== false;
  if (CORE_IDS.has(p.id)) return true;
  if (ANGLE_IDS.has(p.id)) return include.angles;
  if (NODE_IDS.has(p.id)) return include.nodes;
  return include.extras;
}

/** Angles, nodes, Lilith, Chiron and additional objects: their orb caps the orb of any pair. */
const isPoint = (p) => !PLANET_IDS.has(p.id);

// Natal base orb per object (degrees), applied to every major aspect by default:
// luminaries 8°, personal planets 6°, social 5°, higher 4°, angles 4°,
// nodes, Lilith and Chiron 2°.
const BASE_ORBS = {
  sun: 8,
  moon: 8,
  ascendant: 4,
  mercury: 6,
  venus: 6,
  mars: 6,
  jupiter: 5,
  saturn: 5,
  mc: 4,
  uranus: 4,
  neptune: 4,
  pluto: 4,
  node: 2,
  southNode: 2,
  lilith: 2,
  chiron: 2,
};

// Additional objects without their own entry above.
const EXTRA_ORB = 2;

// Transits: a fixed 1° for every transit-to-natal pair, 1.5° for the
// transiting luminaries. Only near-exact contacts coincide with events.
const TRANSIT_ORBS = { sun: 1.5, moon: 1.5 };
const TRANSIT_OTHER_ORB = 1;

/** Orb table: object id → aspect id → orb in degrees. */
export const DEFAULT_ORB_TABLE = Object.fromEntries(
  ALL_OBJECTS.map((o) => [o.id, Object.fromEntries(ASPECTS.map((a) => [a.id, BASE_ORBS[o.id] ?? EXTRA_ORB]))])
);

export const DEFAULT_TRANSIT_ORB_TABLE = Object.fromEntries(
  ALL_OBJECTS.map((o) => [o.id, Object.fromEntries(ASPECTS.map((a) => [a.id, TRANSIT_ORBS[o.id] ?? TRANSIT_OTHER_ORB]))])
);

// combine(orb of the first object, orb of the second); under transits the first is the transit.
export const ORB_METHODS = [
  { id: 'average', combine: (a, b) => (a + b) / 2 },
  { id: 'max', combine: Math.max },
  { id: 'min', combine: Math.min },
  { id: 'transit', combine: (a) => a, transitOnly: true },
];

export const DEFAULT_ASPECT_SETTINGS = {
  method: 'average',
  exactPercent: 30,
  // Natal: aspects to the angles count (they shape the personality), nodes and Lilith with narrow orbs.
  include: { angles: true, nodes: true, extras: false },
  enabled: Object.fromEntries(ASPECTS.map((a) => [a.id, true])),
  orbs: DEFAULT_ORB_TABLE,
};

/**
 * Orbs for transit-to-natal aspects; aspect types, exactness and "planets only" are shared.
 * Separating aspects past `separatingOrb` have already peaked: `separating` shows, dims or hides them.
 */
export const DEFAULT_TRANSIT_ORB_SETTINGS = {
  method: 'transit',
  orbs: DEFAULT_TRANSIT_ORB_TABLE,
  // Transits: planets and Chiron only. Angles need a rectified birth time; nodes, Lilith
  // and the transiting Moon add background noise.
  include: { angles: false, nodes: false, extras: false, moon: false },
  separating: 'hide',
  separatingOrb: 0.5,
};

/**
 * Secondary progressions: 1° for every point, the progressed Moon (~1° a month) and angles
 * included; only applying and exact contacts count.
 */
export const DEFAULT_PROGRESSION_ORB_SETTINGS = {
  method: 'transit',
  orbs: Object.fromEntries(ALL_OBJECTS.map((o) => [o.id, Object.fromEntries(ASPECTS.map((a) => [a.id, 1]))])),
  include: { angles: true, nodes: false, extras: false, moon: true },
  separating: 'hide',
  separatingOrb: 0.2,
};

// Solar and lunar returns: aspects inside the return chart, narrower than natal ones.
const RETURN_ORBS = { sun: 4, moon: 4 };
const RETURN_POINT_ORB = 1.5;
const RETURN_PLANET_ORB = 3;

/** Orbs of aspects inside a solar or lunar return chart: luminaries 4°, planets and angles 3°, points 1.5°. */
export const DEFAULT_RETURN_ORB_SETTINGS = {
  method: 'average',
  orbs: Object.fromEntries(
    ALL_OBJECTS.map((o) => {
      const orb = RETURN_ORBS[o.id] ?? (PLANET_IDS.has(o.id) || ANGLE_IDS.has(o.id) ? RETURN_PLANET_ORB : RETURN_POINT_ORB);
      return [o.id, Object.fromEntries(ASPECTS.map((a) => [a.id, orb]))];
    })
  ),
  include: { angles: true, nodes: true, extras: false },
};

/** Directions: 1° for every point (major aspects only, as the aspect list holds). */
export const DEFAULT_DIRECTION_ORB_SETTINGS = {
  method: 'transit',
  orbs: Object.fromEntries(ALL_OBJECTS.map((o) => [o.id, Object.fromEntries(ASPECTS.map((a) => [a.id, 1]))])),
  include: { angles: true, nodes: false, extras: false, moon: true },
  separating: 'show',
  separatingOrb: 0.2,
};

/** Forecast method → settings key of its orb preset. */
export const ORB_PRESET_KEYS = { transit: 'transitOrbPreset', progressions: 'progressionOrbPreset', directions: 'directionOrbPreset' };

export const SEPARATING_MODES = ['show', 'dim', 'hide'];

function separation(l1, l2) {
  const d = normalize(l1 - l2);
  return d > 180 ? 360 - d : d;
}

const DT = 1 / 24; // one hour, in days

function aspectBetween(a, b, settings) {
  if (settings.include && !(takesPart(a, settings.include) && takesPart(b, settings.include))) return null;
  // ASC and MC always stand in the same relation to each other: not an aspect.
  if (ANGLE_IDS.has(a.id) && ANGLE_IDS.has(b.id)) return null;
  const combine = (ORB_METHODS.find((m) => m.id === settings.method) ?? ORB_METHODS[0]).combine;
  const sep = separation(a.longitude, b.longitude);
  for (const aspect of ASPECTS) {
    if (!settings.enabled[aspect.id]) continue;
    const orbA = settings.orbs[a.id]?.[aspect.id] ?? 0;
    const orbB = settings.orbs[b.id]?.[aspect.id] ?? 0;
    // A point's narrow orb is a hard limit: averaging Lilith's 2° with the Sun's 8° must not
    // give 5°, nor MC's 4° with Venus' 6° give 5°.
    const caps = [a, b].filter(isPoint).map((p) => (p === a ? orbA : orbB));
    const allowed = Math.min(combine(orbA, orbB), ...caps);
    const orb = Math.abs(sep - aspect.angle);
    if (orb > allowed) continue;
    // Applying if the orb shrinks as both bodies move on at their current speeds.
    const later = Math.abs(separation(a.longitude + a.speed * DT, b.longitude + b.speed * DT) - aspect.angle);
    return {
      id: `${a.key}|${b.key}`,
      type: aspect.id,
      glyph: aspect.glyph,
      angle: aspect.angle,
      a,
      b,
      orb,
      allowed,
      exact: orb <= (allowed * settings.exactPercent) / 100,
      applying: later < orb,
    };
  }
  return null;
}

/**
 * Aspects among `points`, or between `points` and `others` when given
 * (others are treated as fixed, e.g. natal points under transits).
 */
export function findAspects(points, settings, others = null) {
  const aspects = [];
  if (others) {
    const fixed = others.map((p) => ({ ...p, speed: 0 }));
    for (const a of points) {
      for (const b of fixed) {
        const aspect = aspectBetween(a, b, settings);
        if (aspect) aspects.push(aspect);
      }
    }
    return aspects;
  }
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      // The North and South Node are one axis, always exactly opposite: not an aspect.
      if (points[i].id === 'node' && points[j].id === 'southNode') continue;
      const aspect = aspectBetween(points[i], points[j], settings);
      if (aspect) aspects.push(aspect);
    }
  }
  return aspects;
}
