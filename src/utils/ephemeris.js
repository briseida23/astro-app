import { SwissEphemeris, Planet, LunarPoint, Asteroid, FictitiousPlanet, HouseSystem } from '@swisseph/browser';

// The WASM module must be initialised before any calculation. Top-level await keeps
// the calculate* functions synchronous for callers.
const swe = new SwissEphemeris();
await swe.init();

/**
 * Data files for the additional objects, served from public/ephe: seas_18.se1 holds the main
 * asteroids (1800–2399), seorbel.txt the orbital elements of Selena, Proserpina and others.
 * Loaded in the background; resolves to false if they could not be fetched.
 */
export const extrasReady = swe
  .loadEphemerisFiles(
    ['seas_18.se1', 'seorbel.txt'].map((name) => ({ name, url: `${import.meta.env.BASE_URL}ephe/${name}` }))
  )
  .then(() => true)
  .catch(() => false);

// U+FE0E forces text (not emoji) presentation of the zodiac symbols.
const T = '︎';

export const SIGNS = [
  { id: 'aries', name: 'Aries', glyph: `♈${T}`, element: 'fire', modality: 'cardinal' },
  { id: 'taurus', name: 'Taurus', glyph: `♉${T}`, element: 'earth', modality: 'fixed' },
  { id: 'gemini', name: 'Gemini', glyph: `♊${T}`, element: 'air', modality: 'mutable' },
  { id: 'cancer', name: 'Cancer', glyph: `♋${T}`, element: 'water', modality: 'cardinal' },
  { id: 'leo', name: 'Leo', glyph: `♌${T}`, element: 'fire', modality: 'fixed' },
  { id: 'virgo', name: 'Virgo', glyph: `♍${T}`, element: 'earth', modality: 'mutable' },
  { id: 'libra', name: 'Libra', glyph: `♎${T}`, element: 'air', modality: 'cardinal' },
  { id: 'scorpio', name: 'Scorpio', glyph: `♏${T}`, element: 'water', modality: 'fixed' },
  { id: 'sagittarius', name: 'Sagittarius', glyph: `♐${T}`, element: 'fire', modality: 'mutable' },
  { id: 'capricorn', name: 'Capricorn', glyph: `♑${T}`, element: 'earth', modality: 'cardinal' },
  { id: 'aquarius', name: 'Aquarius', glyph: `♒${T}`, element: 'air', modality: 'fixed' },
  { id: 'pisces', name: 'Pisces', glyph: `♓${T}`, element: 'water', modality: 'mutable' },
];

export const PLANETS = [
  { id: 'sun', body: Planet.Sun, glyph: '☉' },
  { id: 'moon', body: Planet.Moon, glyph: '☽' },
  { id: 'mercury', body: Planet.Mercury, glyph: '☿' },
  { id: 'venus', body: Planet.Venus, glyph: '♀' },
  { id: 'mars', body: Planet.Mars, glyph: '♂' },
  { id: 'jupiter', body: Planet.Jupiter, glyph: '♃' },
  { id: 'saturn', body: Planet.Saturn, glyph: '♄' },
  { id: 'uranus', body: Planet.Uranus, glyph: '♅' },
  { id: 'neptune', body: Planet.Neptune, glyph: '♆' },
  { id: 'pluto', body: Planet.Pluto, glyph: '♇' },
  { id: 'node', body: LunarPoint.TrueNode, glyph: '☊' },
  // Always exactly opposite the North Node: the nodal axis is read as a whole.
  { id: 'southNode', body: LunarPoint.TrueNode, glyph: '☋', opposite: true },
  { id: 'lilith', body: LunarPoint.MeanApogee, glyph: '⚸' },
];

// textGlyph: the glyph is a text label, drawn smaller and in the regular font.
export const ANGLES = [
  { id: 'ascendant', glyph: 'ASC', textGlyph: true },
  { id: 'mc', glyph: 'MC', textGlyph: true },
];

/**
 * Asteroids and fictitious points that can be added in the settings. Groups: asteroid,
 * lunar (Moon-related points), uranian (Hamburg school), hypothetical.
 */
export const EXTRA_OBJECTS = [
  { id: 'chiron', body: Asteroid.Chiron, glyph: '⚷', group: 'asteroid' },
  { id: 'pholus', body: Asteroid.Pholus, glyph: 'Pho', textGlyph: true, group: 'asteroid' },
  { id: 'ceres', body: Asteroid.Ceres, glyph: '⚳', group: 'asteroid' },
  { id: 'pallas', body: Asteroid.Pallas, glyph: '⚴', group: 'asteroid' },
  { id: 'juno', body: Asteroid.Juno, glyph: '⚵', group: 'asteroid' },
  { id: 'vesta', body: Asteroid.Vesta, glyph: '⚶', group: 'asteroid' },
  // Drawn as Lilith's glyph made hollow: white crescent over a cross, dark outline (see SelenaShape).
  { id: 'selena', body: FictitiousPlanet.WhiteMoon, glyph: '☾', group: 'lunar', hollow: true, ink: '#111827' },
  { id: 'trueLilith', body: LunarPoint.OsculatingApogee, glyph: 'Lt', textGlyph: true, group: 'lunar' },
  { id: 'priapus', body: LunarPoint.InterpolatedPerigee, glyph: 'Pri', textGlyph: true, group: 'lunar' },
  { id: 'waldemath', body: FictitiousPlanet.Waldemath, glyph: 'Wal', textGlyph: true, group: 'lunar' },
  { id: 'cupido', body: FictitiousPlanet.Cupido, glyph: 'Cup', textGlyph: true, group: 'uranian' },
  { id: 'hades', body: FictitiousPlanet.Hades, glyph: 'Had', textGlyph: true, group: 'uranian' },
  { id: 'zeus', body: FictitiousPlanet.Zeus, glyph: 'Zeu', textGlyph: true, group: 'uranian' },
  { id: 'kronos', body: FictitiousPlanet.Kronos, glyph: 'Kro', textGlyph: true, group: 'uranian' },
  { id: 'apollon', body: FictitiousPlanet.Apollon, glyph: 'Apo', textGlyph: true, group: 'uranian' },
  { id: 'admetos', body: FictitiousPlanet.Admetos, glyph: 'Adm', textGlyph: true, group: 'uranian' },
  { id: 'vulkanus', body: FictitiousPlanet.Vulkanus, glyph: 'Vlk', textGlyph: true, group: 'uranian' },
  { id: 'poseidon', body: FictitiousPlanet.Poseidon, glyph: 'Pos', textGlyph: true, group: 'uranian' },
  { id: 'transpluto', body: FictitiousPlanet.Isis, glyph: 'TrP', textGlyph: true, group: 'hypothetical' },
  { id: 'vulcan', body: FictitiousPlanet.Vulcan, glyph: 'Vul', textGlyph: true, group: 'hypothetical' },
  { id: 'proserpina', body: FictitiousPlanet.Proserpina, glyph: 'Prs', textGlyph: true, group: 'hypothetical' },
];

export const EXTRA_GROUPS = ['asteroid', 'lunar', 'uranian', 'hypothetical'];

// Shown without the user having to add them.
export const DEFAULT_EXTRAS = new Set(['chiron', 'selena']);

/** All chart objects in display order (luminaries, ASC, personal, social, MC, outer, points). */
export const OBJECTS = [
  ...PLANETS.slice(0, 2),
  ANGLES[0],
  ...PLANETS.slice(2, 7),
  ANGLES[1],
  ...PLANETS.slice(7),
];

/** Core objects followed by every additional one; keys of the visibility and orb settings. */
export const ALL_OBJECTS = [...OBJECTS, ...EXTRA_OBJECTS];

export const ASPECTS = [
  { id: 'conjunction', angle: 0, glyph: '☌' },
  { id: 'sextile', angle: 60, glyph: '⚹' },
  { id: 'square', angle: 90, glyph: '□' },
  { id: 'trine', angle: 120, glyph: '△' },
  { id: 'opposition', angle: 180, glyph: '☍' },
];

export const HOUSE_SYSTEMS = [
  { id: HouseSystem.Placidus, key: 'placidus' },
  { id: HouseSystem.Koch, key: 'koch' },
  { id: HouseSystem.Regiomontanus, key: 'regiomontanus' },
  { id: HouseSystem.Campanus, key: 'campanus' },
  { id: HouseSystem.Porphyrius, key: 'porphyrius' },
  { id: HouseSystem.Equal, key: 'equal' },
  { id: HouseSystem.WholeSign, key: 'wholeSign' },
];

export const normalize = (deg) => ((deg % 360) + 360) % 360;

export const pad = (n) => String(n).padStart(2, '0');

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export function formatDegree(longitude) {
  const inSign = normalize(longitude) % 30;
  const deg = Math.floor(inSign);
  const min = Math.floor((inSign - deg) * 60);
  return `${deg}°${String(min).padStart(2, '0')}′`;
}

export function formatOrb(orb) {
  const deg = Math.floor(orb);
  const min = Math.round((orb - deg) * 60);
  return min === 60 ? `${deg + 1}°00′` : `${deg}°${String(min).padStart(2, '0')}′`;
}

/** Local wall-clock date/time + UTC offset in hours → UTC Date. */
export function toUtcDate(date, time, utcOffset) {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = (time || '12:00').split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - utcOffset * 3600000);
}

/** UTC offset (hours) of an IANA time zone at the UTC instant `ms`. */
function zoneOffsetAt(timeZone, ms) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(new Date(ms));
  const match = parts.find((p) => p.type === 'timeZoneName')?.value.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;
  return (match[1] === '-' ? -1 : 1) * (Number(match[2]) + Number(match[3]) / 60);
}

/** UTC offset (hours) of an IANA time zone at the given local date/time, DST included. */
export function offsetForZone(timeZone, date, time) {
  // The wall-clock time read as UTC is off by the offset itself, which matters within a few
  // hours of a DST change: guess, then look again at the instant that guess implies.
  const wall = new Date(`${date}T${time || '12:00'}:00Z`).getTime();
  if (Number.isNaN(wall)) return 0;
  const guess = zoneOffsetAt(timeZone, wall);
  const offset = zoneOffsetAt(timeZone, wall - guess * 3600000);
  return offset === guess ? offset : zoneOffsetAt(timeZone, wall - offset * 3600000);
}

export function formatOffset(offset) {
  const sign = offset < 0 ? '−' : '+';
  const abs = Math.abs(offset);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}

function houseOf(longitude, cusps) {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    if (normalize(longitude - start) < normalize(end - start)) return i + 1;
  }
  return 1;
}

const NODE_IDS = new Set(['node', 'southNode']);

function makePoint(ring, def, longitude, speed, house) {
  const lon = normalize(longitude);
  const signIndex = Math.floor(lon / 30);
  const sign = SIGNS[signIndex];
  return {
    key: `${ring}:${def.id}`,
    ring,
    id: def.id,
    glyph: def.glyph,
    textGlyph: Boolean(def.textGlyph),
    hollow: Boolean(def.hollow),
    ink: def.ink ?? null,
    longitude: lon,
    speed,
    // The nodes move backwards almost all the time, so their "R" carries no information.
    retrograde: speed < 0 && !NODE_IDS.has(def.id),
    signIndex,
    sign,
    element: sign.element,
    modality: sign.modality,
    degree: formatDegree(lon),
    house,
  };
}

/** Lunar node calculations offered in the settings: the mean node (default) or the true (osculating) one. */
export const NODE_TYPES = ['mean', 'true'];
/** Lilith calculations: the mean apogee (default) or the true (osculating) one. */
export const LILITH_TYPES = ['mean', 'true'];
/** Which node and Lilith to calculate: { nodeType, lilithType }. */
export const POINT_TYPES = { nodeType: 'mean', lilithType: 'mean' };

/** The body to calculate for `p` under `types`: the chosen node and Lilith, else its own. */
function bodyOf(p, types) {
  if (NODE_IDS.has(p.id)) return types.nodeType === 'true' ? LunarPoint.TrueNode : LunarPoint.MeanNode;
  if (p.id === 'lilith') return types.lilithType === 'true' ? LunarPoint.OsculatingApogee : LunarPoint.MeanApogee;
  return p.body;
}

/**
 * Planets plus the additional objects whose ids are in `extras`. An additional object that
 * cannot be calculated (data file missing, date outside its range) is left out.
 */
function calculatePlanets(jd, ring, cusps, extras, pointTypes) {
  const defs = [...PLANETS, ...EXTRA_OBJECTS.filter((o) => extras.has(o.id))];
  return defs.flatMap((p) => {
    try {
      const pos = swe.calculatePosition(jd, bodyOf(p, pointTypes));
      const lon = normalize(pos.longitude + (p.opposite ? 180 : 0));
      return [makePoint(ring, p, lon, pos.longitudeSpeed, houseOf(lon, cusps))];
    } catch {
      return [];
    }
  });
}

/**
 * Tropical, geocentric natal positions.
 * @param {{ date: Date, latitude: number, longitude: number }} birthData
 * @param {string} houseSystem one of HOUSE_SYSTEMS ids
 */
export function calculateNatal(birthData, houseSystem = HouseSystem.Placidus, extras = new Set(), pointTypes = POINT_TYPES, ring = 'natal') {
  const { date, latitude, longitude } = birthData;
  const jd = swe.dateToJulianDay(date);
  const houseData = swe.calculateHouses(jd, latitude, longitude, houseSystem);
  const houses = houseData.cusps.slice(1, 13);
  // Angles are treated as fixed points (speed 0) for applying/separating. Their house is
  // looked up: with Equal or Whole Sign houses the MC need not be in the 10th.
  const angles = [
    makePoint(ring, ANGLES[0], houseData.ascendant, 0, houseOf(normalize(houseData.ascendant), houses)),
    makePoint(ring, ANGLES[1], houseData.mc, 0, houseOf(normalize(houseData.mc), houses)),
  ];
  return {
    date,
    latitude,
    longitude,
    planets: calculatePlanets(jd, ring, houses, extras, pointTypes),
    angles,
    houses,
    ascendant: angles[0].longitude,
    mc: angles[1].longitude,
    armc: houseData.armc,
  };
}

// Angles sweep the whole zodiac once a sidereal day; enough for applying/separating.
const ANGLE_SPEED = 360.9856;

/**
 * Transit positions for `date`, placed in the natal houses. With a location the transit
 * ASC and MC for that place are added after the planets.
 * @param {{ latitude: number, longitude: number } | null} place
 */
export function calculateTransitPlanets(date, natalHouses, place = null, houseSystem = HouseSystem.Placidus, extras = new Set(), pointTypes = POINT_TYPES) {
  const jd = swe.dateToJulianDay(date);
  const planets = calculatePlanets(jd, 'transit', natalHouses, extras, pointTypes);
  if (!place) return planets;
  const houseData = swe.calculateHouses(jd, place.latitude, place.longitude, houseSystem);
  return [
    ...planets,
    makePoint('transit', ANGLES[0], houseData.ascendant, ANGLE_SPEED, houseOf(normalize(houseData.ascendant), natalHouses)),
    makePoint('transit', ANGLES[1], houseData.mc, ANGLE_SPEED, houseOf(normalize(houseData.mc), natalHouses)),
  ];
}

const TROPICAL_YEAR = 365.242199;
const DEG = Math.PI / 180;

/** Signed difference a − b folded into −180…180. */
const signedDiff = (a, b) => ((((a - b) % 360) + 540) % 360) - 180;

/** Right ascension of an ecliptic longitude (latitude 0) for obliquity `eps`, degrees. */
const rightAscension = (lon, eps) => normalize(Math.atan2(Math.sin(lon * DEG) * Math.cos(eps * DEG), Math.cos(lon * DEG)) / DEG);

/**
 * Secondary progressions (a day after birth for each year of life) for `date`, placed in the
 * natal houses. Progressed MC = natal MC + solar arc in longitude; the progressed ASC is the
 * ASC of that MC at the birth place (houses cast for the matching sidereal time).
 * @param {ReturnType<typeof calculateNatal>} natal
 */
export function calculateProgressions(natal, date, houseSystem = HouseSystem.Placidus, extras = new Set(), pointTypes = POINT_TYPES) {
  const birthJd = swe.dateToJulianDay(natal.date);
  const jd = birthJd + (swe.dateToJulianDay(date) - birthJd) / TROPICAL_YEAR;
  const planets = calculatePlanets(jd, 'progressions', natal.houses, extras, pointTypes);
  const { ascendant, mc, speed } = progressedAngles(natal, birthJd, jd, houseSystem);
  return [
    ...planets,
    makePoint('progressions', ANGLES[0], ascendant, speed, houseOf(ascendant, natal.houses)),
    makePoint('progressions', ANGLES[1], mc, speed, houseOf(mc, natal.houses)),
  ];
}

/** Progressed ASC and MC for the progressed Julian day `jd`, and their speed (the progressed Sun's, about 1° a year). */
function progressedAngles(natal, birthJd, jd, houseSystem) {
  const sun = swe.calculatePosition(jd, Planet.Sun);
  const arc = signedDiff(sun.longitude, swe.calculatePosition(birthJd, Planet.Sun).longitude);
  // Mean obliquity of the ecliptic at birth; enough for turning the MC into sidereal time.
  const eps = 23.439291 - 0.0130042 * ((birthJd - 2451545) / 36525);
  const mc = normalize(natal.mc + arc);
  const armcShift = signedDiff(rightAscension(mc, eps), rightAscension(natal.mc, eps));
  const houseData = swe.calculateHouses(birthJd + armcShift / ANGLE_SPEED, natal.latitude, natal.longitude, houseSystem);
  return { ascendant: normalize(houseData.ascendant), mc, speed: sun.longitudeSpeed };
}

/** The real date whose secondary progression is the progressed Julian day `progJd`. */
const progressedToDate = (natal, birthJd, progJd) => new Date(natal.date.getTime() + (progJd - birthJd) * TROPICAL_YEAR * 86400000);

/** Next sign and next natal house the forward-moving `lon` enters: [{ kind, to, delta }] with delta in degrees. */
function nextBoundaries(lon, cusps, backwards = false) {
  const ahead = (target) => (backwards ? normalize(lon - target) : normalize(target - lon)) || 360;
  const sign = backwards ? Math.floor(lon / 30) : (Math.floor(lon / 30) + 1) % 12;
  const signEdge = sign * 30;
  // Moving backwards a point leaves its sign through the sign's start and enters the one before.
  const signTo = backwards ? (sign + 11) % 12 : sign;
  const house = houseOf(lon, cusps);
  const houseEdge = backwards ? cusps[house - 1] : cusps[house % 12];
  const houseTo = backwards ? ((house + 10) % 12) + 1 : (house % 12) + 1;
  return [
    { kind: 'sign', to: SIGNS[signTo], delta: ahead(signEdge) },
    { kind: 'house', to: houseTo, delta: ahead(houseEdge) },
  ];
}

/**
 * When the progressed Moon (`moon`, a progressed point for `date`) next enters a sign and a natal
 * house: [{ point, kind: 'sign' | 'house', to, date }], earliest first.
 */
export function progressedMoonIngresses(natal, date, moon) {
  const birthJd = swe.dateToJulianDay(natal.date);
  const progJd = birthJd + (swe.dateToJulianDay(date) - birthJd) / TROPICAL_YEAR;
  return nextBoundaries(moon.longitude, natal.houses)
    .map(({ kind, to, delta }) => {
      // Newton on the progressed day: the Moon always moves forward.
      const target = normalize(moon.longitude + delta);
      let jd = progJd + delta / RETURNS.lunar.speed;
      for (let i = 0; i < 12; i++) {
        const pos = swe.calculatePosition(jd, Planet.Moon);
        const step = signedDiff(pos.longitude, target) / pos.longitudeSpeed;
        jd -= step;
        if (Math.abs(step) < 1e-7) break;
      }
      return { point: moon, kind, to, date: progressedToDate(natal, birthJd, jd) };
    })
    .sort((a, b) => a.date - b.date);
}

/**
 * Coming ingresses of directed points (`points`, directions for `date`) into the next sign and
 * natal house, within `years`: [{ point, kind, to, date }], earliest first. Converse directions
 * move backwards.
 */
export function directionIngresses(natal, date, { arc: arcType, converse }, points, years = 10) {
  const birthJd = swe.dateToJulianDay(natal.date);
  const ageNow = (swe.dateToJulianDay(date) - birthJd) / TROPICAL_YEAR;
  const perYear = DIRECTION_ARCS[arcType];
  const sunNatal = swe.calculatePosition(birthJd, Planet.Sun).longitude;
  const arcAt = (age) => (perYear === null ? signedDiff(swe.calculatePosition(birthJd + age, Planet.Sun).longitude, sunNatal) : age * perYear);
  // Age at which the arc reaches `arc`: direct for 1°/Naibod, Newton on the progressed Sun for the solar arc.
  const ageFor = (arc) => {
    if (perYear !== null) return arc / perYear;
    let age = arc / RETURNS.solar.speed;
    for (let i = 0; i < 12; i++) {
      const step = (arcAt(age) - arc) / swe.calculatePosition(birthJd + age, Planet.Sun).longitudeSpeed;
      age -= step;
      if (Math.abs(step) < 1e-7) break;
    }
    return age;
  };
  const arcNow = arcAt(ageNow);
  return points
    .flatMap((point) =>
      nextBoundaries(point.longitude, natal.houses, converse).map(({ kind, to, delta }) => {
        const age = ageFor(arcNow + delta);
        return { point, kind, to, age, date: progressedToDate(natal, birthJd, birthJd + age) };
      })
    )
    .filter((i) => i.age - ageNow <= years)
    .sort((a, b) => a.date - b.date);
}

// The eight phases of the Sun–Moon cycle, 45° each, from the New Moon on.
export const LUNATION_PHASES = ['new', 'crescent', 'firstQuarter', 'gibbous', 'full', 'disseminating', 'lastQuarter', 'balsamic'];

/** Lunation phase of a Moon–Sun pair: { phase, angle } with the Moon's elongation from the Sun, 0…360°. */
export function lunationPhase(sun, moon) {
  const angle = normalize(moon.longitude - sun.longitude);
  return { phase: LUNATION_PHASES[Math.floor(angle / 45)], angle };
}

// Directions: the arc added to every natal point, in degrees per year of life (null: solar arc).
export const DIRECTION_ARCS = { symbolic: 1, naibod: 0.985647, solar: null };

/**
 * Directions for `date`: every natal point moved by the same arc and placed in the natal houses.
 * The arc is 1° a year (symbolic), Naibod's mean solar motion, or the solar arc (progressed minus
 * natal Sun); converse directions subtract it.
 * @param {ReturnType<typeof calculateNatal>} natal
 * @param {{ arc: keyof DIRECTION_ARCS, converse: boolean }} options
 */
export function calculateDirections(natal, date, { arc: arcType, converse }) {
  const birthJd = swe.dateToJulianDay(natal.date);
  const arc = directionArc(birthJd, (swe.dateToJulianDay(date) - birthJd) / TROPICAL_YEAR, arcType);
  const sign = converse ? -1 : 1;
  // About 1° a year either way: enough for applying/separating.
  const speed = sign / TROPICAL_YEAR;
  return [...natal.planets, ...natal.angles].map((p) => {
    const lon = normalize(p.longitude + sign * arc);
    // Converse points all move backwards: an "R" on each would say nothing.
    return { ...makePoint('directions', p, lon, speed, houseOf(lon, natal.houses)), retrograde: false };
  });
}

/** The direction arc after `years` of life: 1°/Naibod a year, or the solar arc (progressed minus natal Sun). */
function directionArc(birthJd, years, arcType) {
  const perYear = DIRECTION_ARCS[arcType];
  if (perYear !== null) return years * perYear;
  return signedDiff(swe.calculatePosition(birthJd + years, Planet.Sun).longitude, swe.calculatePosition(birthJd, Planet.Sun).longitude);
}

// Methods whose points can be searched for exact contacts with the natal chart.
export const CONTACT_METHODS = ['transit', 'progressions', 'directions'];

/**
 * The longitude of object `id` moved by `method`, as a function of the Julian day; null if it
 * cannot be calculated (an angle in transits, an object missing from the natal chart).
 */
function moverLongitude(natal, method, id, { houseSystem, pointTypes, directions }) {
  const birthJd = swe.dateToJulianDay(natal.date);
  const def = [...PLANETS, ...EXTRA_OBJECTS].find((p) => p.id === id);
  const bodyLon = (jd) => normalize(swe.calculatePosition(jd, bodyOf(def, pointTypes)).longitude + (def.opposite ? 180 : 0));
  const progJd = (jd) => birthJd + (jd - birthJd) / TROPICAL_YEAR;
  if (method === 'transit') return def ? bodyLon : null;
  if (method === 'progressions') {
    if (def) return (jd) => bodyLon(progJd(jd));
    return (jd) => progressedAngles(natal, birthJd, progJd(jd), houseSystem)[id];
  }
  const natalPoint = [...natal.planets, ...natal.angles].find((p) => p.id === id);
  if (!natalPoint) return null;
  const sign = directions.converse ? -1 : 1;
  return (jd) => normalize(natalPoint.longitude + sign * directionArc(birthJd, (jd - birthJd) / TROPICAL_YEAR, directions.arc));
}

// Days between samples when looking for contacts: short enough that no contact slips between two.
function sampleStep(method, id) {
  if (method === 'directions') return 30;
  if (method === 'progressions') return id === 'moon' ? 5 : 30;
  if (id === 'moon') return 0.25;
  return ['sun', 'mercury', 'venus', 'mars'].includes(id) ? 1 : 2;
}

/**
 * Moments between `from` and `to` (Dates) when object `mover`, moved by `method`, makes one of
 * `aspects` exactly to one of `targets` ({ key, longitude }; a target with `cusp` set, a house number, is
 * that natal cusp and takes only the conjunction: the ingress into that house). Sampled, then refined by
 * bisection to a minute: [{ date, target, aspect, house, retrograde }], earliest first; `house` is
 * the house entered at a cusp, which is the one before it when the mover goes backwards.
 * @param {{ houseSystem, pointTypes, directions: { arc, converse } }} options
 */
export function findContacts(natal, method, mover, targets, aspects, from, to, options) {
  const lonAt = moverLongitude(natal, method, mover, options);
  if (!lonAt) return [];
  const fromJd = swe.dateToJulianDay(from);
  const toJd = swe.dateToJulianDay(to);
  const step = sampleStep(method, mover);
  const jds = [];
  for (let jd = fromJd; jd < toJd; jd += step) jds.push(jd);
  jds.push(toJd);
  const lons = jds.map(lonAt);
  const toDate = (jd) => new Date(from.getTime() + (jd - fromJd) * 86400000);
  const hits = [];
  for (const target of targets) {
    for (const aspect of target.cusp ? aspects.filter((a) => a.angle === 0) : aspects) {
      // Both sides of the target, once for the conjunction and the opposition.
      const goals = aspect.angle % 180 === 0 ? [target.longitude + aspect.angle] : [target.longitude + aspect.angle, target.longitude - aspect.angle];
      for (const goal of goals) {
        let prev = signedDiff(lons[0], goal);
        for (let i = 1; i < jds.length; i++) {
          const cur = signedDiff(lons[i], goal);
          // A change of sign near the goal, not the jump on the opposite side.
          if ((prev < 0) !== (cur < 0) && Math.abs(prev - cur) < 90) {
            let a = jds[i - 1];
            let b = jds[i];
            let fa = prev;
            while (b - a > 1 / 1440) {
              const m = (a + b) / 2;
              const fm = signedDiff(lonAt(m), goal);
              if ((fm < 0) === (fa < 0)) {
                a = m;
                fa = fm;
              } else b = m;
            }
            // Crossing a cusp backwards enters the house before it.
            const house = target.cusp && (prev > 0 ? ((target.cusp + 10) % 12) + 1 : target.cusp);
            hits.push({ date: toDate((a + b) / 2), target, aspect, house, retrograde: prev > 0 });
          }
          prev = cur;
        }
      }
    }
  }
  return hits.sort((x, y) => x.date - y.date);
}

// Fastest daily motion of each transiting object (°/day), so that sampling at half an orb's crossing time misses nothing.
const MAX_SPEED = { moon: 15.5, mercury: 2.3, venus: 1.3, sun: 1.02, mars: 0.8, jupiter: 0.25, saturn: 0.14, uranus: 0.07, neptune: 0.04, pluto: 0.04, node: 0.07, southNode: 0.07, lilith: 0.12, chiron: 0.15, trueLilith: 7 };

/** Fastest motion of `id` moved by `method`, in degrees per real day. */
function maxSpeed(method, id, pointTypes) {
  // Directions and progressed angles move by the solar arc, at most ~1.02° a year.
  if (method === 'directions' || ANGLES.some((a) => a.id === id)) return 1.1 / TROPICAL_YEAR;
  const speed = id === 'lilith' && pointTypes.lilithType === 'true' ? MAX_SPEED.trueLilith : MAX_SPEED[id] ?? 1;
  return method === 'progressions' ? speed / TROPICAL_YEAR : speed;
}

// How far around the moment to look for the edges of an orb, in days.
const WINDOW_HORIZON = { transit: 3 * 365, progressions: 40 * 365, directions: 40 * 365 };

/** Root of `fn` between a and b (fa = fn(a), opposite signs at the ends), to a minute. */
function bisect(a, b, fa, fn) {
  while (Math.abs(b - a) > 1 / 1440) {
    const m = (a + b) / 2;
    const fm = fn(m);
    if ((fm < 0) === (fa < 0)) {
      a = m;
      fa = fm;
    } else b = m;
  }
  return (a + b) / 2;
}

/**
 * The orb window around `at` of forecast aspects to fixed points. Each item is { mover, target,
 * angle, orb }: object `mover` moved by `method`, the target's longitude, the aspect angle and the
 * allowed orb. Returns per item { enter, exact, lastExact, exit } (Dates; null when beyond the
 * horizon), or null if the mover cannot be calculated. `exact` is the next exact moment inside
 * the window, `lastExact` the latest before `at`.
 */
export function orbWindows(natal, method, items, at, options) {
  const atJd = swe.dateToJulianDay(at);
  const toDate = (jd) => (jd === null ? null : new Date(at.getTime() + (jd - atJd) * 86400000));
  const tracks = new Map();
  return items.map(({ mover, target, angle, orb }) => {
    if (!tracks.has(mover)) tracks.set(mover, moverLongitude(natal, method, mover, options));
    const lonAt = tracks.get(mover);
    if (!lonAt) return null;
    const lon0 = lonAt(atJd);
    // The side of the target the mover is on now.
    const goals = angle % 180 === 0 ? [target + angle] : [target + angle, target - angle];
    const goal = goals.reduce((best, g) => (Math.abs(signedDiff(lon0, g)) < Math.abs(signedDiff(lon0, best)) ? g : best));
    const f = (jd) => signedDiff(lonAt(jd), goal);
    const outside = (jd) => Math.abs(f(jd)) - orb;
    const step = Math.max(orb, 0.05) / (2 * maxSpeed(method, mover, options.pointTypes));
    // Walk away from the moment until the orb is left, noting the first exact contact on the way.
    const scan = (dir) => {
      let jd0 = atJd;
      let f0 = f(atJd);
      let exact = null;
      for (let t = step; t <= WINDOW_HORIZON[method]; t += step) {
        const jd1 = atJd + dir * t;
        const f1 = f(jd1);
        if (exact === null && (f0 < 0) !== (f1 < 0) && Math.abs(f0 - f1) < 90) exact = bisect(jd0, jd1, f0, f);
        if (Math.abs(f1) > orb) return { edge: bisect(jd0, jd1, Math.abs(f0) - orb, outside), exact };
        jd0 = jd1;
        f0 = f1;
      }
      return { edge: null, exact };
    };
    const ahead = scan(1);
    const behind = scan(-1);
    return { enter: toDate(behind.edge), exact: toDate(ahead.exact), lastExact: toDate(behind.exact), exit: toDate(ahead.edge) };
  });
}

/**
 * Rectification by events (Erika Royals' method): each kind of event has a weight and its
 * significators, the natal houses (cusps) and points it is read by. ASC and MC stand for their
 * axes: an aspect to the ASC is one to the DSC as well, to the MC one to the IC.
 */
export const RECT_EVENTS = {
  marriage: { weight: 10, houses: [7], points: ['venus', 'jupiter', 'ascendant'] },
  divorce: { weight: 8, houses: [7], points: ['uranus', 'saturn', 'ascendant'] },
  child: { weight: 9, houses: [5], points: ['moon', 'venus', 'mc'] },
  move: { weight: 8, houses: [4, 9], points: ['uranus', 'jupiter', 'mc', 'ascendant'] },
  career: { weight: 8, houses: [10], points: ['mc', 'saturn', 'sun'] },
  health: { weight: 7, houses: [1, 6, 8], points: ['mars', 'pluto', 'ascendant'] },
  accident: { weight: 7, houses: [1, 8], points: ['mars', 'uranus', 'pluto', 'ascendant'] },
  loss: { weight: 7, houses: [8, 12], points: ['saturn', 'pluto', 'moon'] },
  education: { weight: 6, houses: [3, 9], points: ['jupiter', 'mercury', 'mc'] },
  other: { weight: 5, houses: [], points: ['ascendant', 'mc'] },
};
const RECT_PLANETS = PLANETS.slice(0, 10);
// Slow transits to the angles: an optional check, counted at half weight.
const RECT_TRANSITS = PLANETS.slice(6, 10);
const RECT_TRANSIT_FACTOR = 0.5;
const ANGLE_IDS = new Set(['ascendant', 'mc']);

/** Share of an event's weight a contact earns by its orb: 15′ full, 30′ 70%, 1° 30%, wider nothing. */
const tier = (orb) => (orb <= 0.25 ? 1 : orb <= 0.5 ? 0.7 : orb <= 1 ? 0.3 : 0);

/** Best rectification candidates first: highest score, then the closest contacts. */
export const byRectScore = (a, b) => b.score - a.score || a.orbs - b.orbs;

/** Major aspects of each mover ({ id, longitude }) to each target within 1°: [{ mover, target, aspect, orb, share }]. */
function rectContacts(movers, targets, keep = () => true) {
  const found = [];
  for (const m of movers) {
    for (const f of targets) {
      if (m.id === f.id || !keep(m, f)) continue;
      const sep = Math.abs(signedDiff(m.longitude, f.longitude));
      for (const aspect of ASPECTS) {
        const orb = Math.abs(sep - aspect.angle);
        if (orb <= 1) found.push({ mover: m.id, target: f.id, aspect: aspect.id, orb, share: tier(orb) });
      }
    }
  }
  return found;
}

// Only contacts that move with the birth time tell times apart: those of an angle, a cusp or the Moon.
const timeBound = (m, f) => [m, f].some((p) => ANGLE_IDS.has(p.id) || p.cusp || p.id === 'moon');

/**
 * Scores every birth time from `from` to `to` (Dates) `stepSeconds` apart at the place `birth`
 * ({ latitude, longitude }) against `events` ([{ date: Date, kind }]): at each event's date the
 * natal points are directed by `arc` (symbolic 1° a year by default), and directed angles and
 * planets that meet the event's natal significators, or directed significators that meet the natal
 * ASC or MC, earn the event's weight by orb; with `transits`, slow planets on the angles count too.
 * Each event earns at most its weight, by its best contact. Returns [{ date, score, orbs, percent,
 * matches: [{ event, method, mover, target, aspect, orb, points }] }] in time order: `orbs` sums each
 * event's closest orb (1° when none), `percent` is the score against the sum of the events' weights.
 */
export function rectify(birth, from, to, stepSeconds, events, { houseSystem, arc = 'symbolic', transits = false }) {
  const fromJd = swe.dateToJulianDay(from);
  const steps = Math.floor((to.getTime() - from.getTime()) / (stepSeconds * 1000));
  const eventJds = events.map((e) => swe.dateToJulianDay(e.date));
  const configs = events.map((e) => RECT_EVENTS[e.kind] ?? RECT_EVENTS.other);
  const maxScore = configs.reduce((sum, c) => sum + c.weight, 0) || 1;
  // The slow planets at each event's moment do not depend on the birth time.
  const transitPoints = transits ? eventJds.map((jd) => RECT_TRANSITS.map((p) => ({ id: p.id, longitude: swe.calculatePosition(jd, p.body).longitude }))) : null;
  const results = [];
  for (let i = 0; i <= steps; i++) {
    const jd = fromJd + (i * stepSeconds) / 86400;
    const houses = swe.calculateHouses(jd, birth.latitude, birth.longitude, houseSystem);
    const angles = [
      { id: 'ascendant', longitude: houses.ascendant },
      { id: 'mc', longitude: houses.mc },
    ];
    const planets = RECT_PLANETS.map((p) => ({ id: p.id, longitude: swe.calculatePosition(jd, p.body).longitude }));
    const natal = [...planets, ...angles];
    const matches = [];
    events.forEach((event, e) => {
      const config = configs[e];
      const significators = [
        ...natal.filter((p) => config.points.includes(p.id)),
        ...config.houses.map((n) => ({ id: `cusp${n}`, cusp: n, longitude: houses.cusps[n] })),
      ];
      const shift = directionArc(jd, (eventJds[e] - jd) / TROPICAL_YEAR, arc);
      const directed = natal.map((p) => ({ id: p.id, longitude: p.longitude + shift }));
      const add = (method, factor) => (c) => matches.push({ event: e, method, ...c, points: c.share * config.weight * factor });
      // Directed angles and planets to the event's natal significators…
      rectContacts(directed, significators, timeBound).forEach(add('directions', 1));
      // …and the event's directed significators to the natal angles not among them (those were counted above).
      const otherAngles = angles.filter((p) => !config.points.includes(p.id));
      rectContacts(directed.filter((p) => config.points.includes(p.id) && !ANGLE_IDS.has(p.id)), otherAngles).forEach(add('directions', 1));
      if (transitPoints) rectContacts(transitPoints[e], angles).forEach(add('transit', RECT_TRANSIT_FACTOR));
    });
    // An event earns at most its weight, by its closest contact; the sum of those orbs breaks ties
    // between times that explain the events equally well.
    let score = 0;
    let orbs = 0;
    events.forEach((_, e) => {
      const own = matches.filter((m) => m.event === e);
      if (own.length === 0) {
        orbs += 1;
        return;
      }
      score += Math.max(...own.map((m) => m.points));
      orbs += Math.min(...own.map((m) => m.orb));
    });
    results.push({ date: new Date(from.getTime() + i * stepSeconds * 1000), score, orbs, percent: (score / maxScore) * 100, matches });
  }
  return results;
}

// Return methods: the body whose return to its natal longitude starts the chart, and its mean speed (°/day).
export const RETURNS = {
  solar: { body: Planet.Sun, speed: 0.98561 },
  lunar: { body: Planet.Moon, speed: 13.17640 },
};

/**
 * The moment of the last solar or lunar return at or before `date`: the body back at its natal
 * longitude, refined by Newton's method.
 * @param {ReturnType<typeof calculateNatal>} natal
 * @param {'solar' | 'lunar'} kind
 */
export function findReturn(natal, kind, date) {
  const { body, speed } = RETURNS[kind];
  const natalLon = swe.calculatePosition(swe.dateToJulianDay(natal.date), body).longitude;
  const targetJd = swe.dateToJulianDay(date);
  const solve = (guess) => {
    let jd = guess;
    for (let i = 0; i < 12; i++) {
      const pos = swe.calculatePosition(jd, body);
      const step = signedDiff(pos.longitude, natalLon) / pos.longitudeSpeed;
      jd -= step;
      if (Math.abs(step) < 1e-7) break;
    }
    return jd;
  };
  // How far the body has gone since its last return, at its mean speed.
  let jd = solve(targetJd - normalize(swe.calculatePosition(targetJd, body).longitude - natalLon) / speed);
  if (jd > targetJd) jd = solve(jd - 360 / speed);
  return new Date(date.getTime() + (jd - targetJd) * 86400000);
}

/**
 * Return moments around `shown` (a return moment): `count` before it, it, and `count` after,
 * oldest first. A minute before a return the last one is the previous; half a cycle past the
 * next, the next.
 */
export function returnsAround(natal, kind, shown, count) {
  const periodMs = (360 / RETURNS[kind].speed) * 86400000;
  const list = [shown];
  for (let i = 0; i < count; i++) list.unshift(findReturn(natal, kind, new Date(list[0].getTime() - 60000)));
  for (let i = 0; i < count; i++) list.push(findReturn(natal, kind, new Date(list[list.length - 1].getTime() + 1.5 * periodMs)));
  return list;
}

/**
 * The chart of the last solar or lunar return at or before `date`, cast at `place`;
 * `ring` names its points ("natal" when it stands in for the birth chart).
 */
export function calculateReturn(natal, kind, date, place, houseSystem = HouseSystem.Placidus, extras = new Set(), pointTypes = POINT_TYPES, ring = 'natal') {
  const returnDate = findReturn(natal, kind, date);
  return calculateNatal({ date: returnDate, latitude: place.latitude, longitude: place.longitude }, houseSystem, extras, pointTypes, ring);
}

/** Wall-clock { date, time } in `timeZone` at the UTC instant `ms`. */
function wallClock(ms, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(ms))
      .map((p) => [p.type, p.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

/** A UTC Date read as wall clock (getUTC*) → { date, time }. */
const fromWall = (d) => ({
  date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
  time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
});

/** The moment `ms` (UTC) as local date/time of `moment`'s zone (its time zone if known, else its fixed offset). */
export function momentAt(moment, ms) {
  if (moment.timeZone) {
    const wall = wallClock(ms, moment.timeZone);
    return { ...moment, ...wall, utcOffset: offsetForZone(moment.timeZone, wall.date, wall.time) };
  }
  return { ...moment, ...fromWall(new Date(ms + moment.utcOffset * 3600000)) };
}

export const STEP_UNITS = ['minute', 'hour', 'day', 'week', 'month', 'year'];

/**
 * `moment` ({ date, time, utcOffset, timeZone? }) moved by `amount` units. Minutes and hours
 * move the instant; days and longer keep the wall-clock time (as calendars do across DST).
 */
export function shiftMoment(moment, amount, unit) {
  if (unit === 'minute' || unit === 'hour') {
    const ms = toUtcDate(moment.date, moment.time, moment.utcOffset).getTime() + amount * (unit === 'minute' ? 60000 : 3600000);
    return momentAt(moment, ms);
  }
  const [y, m, d] = moment.date.split('-').map(Number);
  const [hh, mm] = (moment.time || '12:00').split(':').map(Number);
  let year = y;
  let month = m - 1;
  let day = d;
  if (unit === 'day') day += amount;
  if (unit === 'week') day += amount * 7;
  if (unit === 'month') month += amount;
  if (unit === 'year') year += amount;
  if (unit === 'month' || unit === 'year') {
    // 31 January + 1 month → 28/29 February, not early March.
    day = Math.min(day, new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
  }
  const wall = fromWall(new Date(Date.UTC(year, month, day, hh, mm)));
  return {
    ...moment,
    ...wall,
    utcOffset: moment.timeZone ? offsetForZone(moment.timeZone, wall.date, wall.time) : moment.utcOffset,
  };
}
