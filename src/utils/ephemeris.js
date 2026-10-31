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

/**
 * Planets plus the additional objects whose ids are in `extras`. An additional object that
 * cannot be calculated (data file missing, date outside its range) is left out.
 */
function calculatePlanets(jd, ring, cusps, extras, nodeType) {
  const defs = [...PLANETS, ...EXTRA_OBJECTS.filter((o) => extras.has(o.id))];
  return defs.flatMap((p) => {
    try {
      const body = NODE_IDS.has(p.id) && nodeType === 'mean' ? LunarPoint.MeanNode : p.body;
      const pos = swe.calculatePosition(jd, body);
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
export function calculateNatal(birthData, houseSystem = HouseSystem.Placidus, extras = new Set(), nodeType = 'mean') {
  const { date, latitude, longitude } = birthData;
  const jd = swe.dateToJulianDay(date);
  const houseData = swe.calculateHouses(jd, latitude, longitude, houseSystem);
  const houses = houseData.cusps.slice(1, 13);
  // Angles are treated as fixed points (speed 0) for applying/separating. Their house is
  // looked up: with Equal or Whole Sign houses the MC need not be in the 10th.
  const angles = [
    makePoint('natal', ANGLES[0], houseData.ascendant, 0, houseOf(normalize(houseData.ascendant), houses)),
    makePoint('natal', ANGLES[1], houseData.mc, 0, houseOf(normalize(houseData.mc), houses)),
  ];
  return {
    date,
    latitude,
    longitude,
    planets: calculatePlanets(jd, 'natal', houses, extras, nodeType),
    angles,
    houses,
    ascendant: angles[0].longitude,
    mc: angles[1].longitude,
  };
}

// Angles sweep the whole zodiac once a sidereal day; enough for applying/separating.
const ANGLE_SPEED = 360.9856;

/**
 * Transit positions for `date`, placed in the natal houses. With a location the transit
 * ASC and MC for that place are added after the planets.
 * @param {{ latitude: number, longitude: number } | null} place
 */
export function calculateTransitPlanets(date, natalHouses, place = null, houseSystem = HouseSystem.Placidus, extras = new Set(), nodeType = 'mean') {
  const jd = swe.dateToJulianDay(date);
  const planets = calculatePlanets(jd, 'transit', natalHouses, extras, nodeType);
  if (!place) return planets;
  const houseData = swe.calculateHouses(jd, place.latitude, place.longitude, houseSystem);
  return [
    ...planets,
    makePoint('transit', ANGLES[0], houseData.ascendant, ANGLE_SPEED, houseOf(normalize(houseData.ascendant), natalHouses)),
    makePoint('transit', ANGLES[1], houseData.mc, ANGLE_SPEED, houseOf(normalize(houseData.mc), natalHouses)),
  ];
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
