import { HouseSystem } from '@swisseph/browser';
import { OBJECTS, EXTRA_OBJECTS, DEFAULT_EXTRAS } from './ephemeris';
import { DEFAULT_ASPECT_SETTINGS, DEFAULT_TRANSIT_ORB_SETTINGS, DEFAULT_PROGRESSION_ORB_SETTINGS, DEFAULT_RETURN_ORB_SETTINGS } from './aspects';
import { DEFAULT_WEIGHTS, PREVIOUS_DEFAULT_WEIGHTS } from './balance';

export const DEFAULT_ELEMENT_COLORS = {
  fire: '#EF4444',
  earth: '#22C55E',
  air: '#EAB308',
  water: '#3B82F6',
};

export const DEFAULT_ASPECT_COLORS = {
  conjunction: '#A855F7',
  sextile: '#22C55E',
  square: '#EF4444',
  trine: '#22C55E',
  opposition: '#000000',
};

export const DEFAULT_SETTINGS = {
  houseSystem: HouseSystem.Placidus,
  // Lunar node: 'mean' (classical default) or 'true' (osculating).
  nodeType: 'mean',
  // Darker, thicker, larger chart for low vision.
  highContrast: false,
  visible: Object.fromEntries([
    ...OBJECTS.map((o) => [o.id, true]),
    ...EXTRA_OBJECTS.map((o) => [o.id, DEFAULT_EXTRAS.has(o.id)]),
  ]),
  weights: DEFAULT_WEIGHTS,
  aspects: DEFAULT_ASPECT_SETTINGS,
  transitOrbPreset: DEFAULT_TRANSIT_ORB_SETTINGS,
  progressionOrbPreset: DEFAULT_PROGRESSION_ORB_SETTINGS,
  returnOrbPreset: DEFAULT_RETURN_ORB_SETTINGS,
  colors: { elements: DEFAULT_ELEMENT_COLORS, aspects: DEFAULT_ASPECT_COLORS },
  // Figures that transits complete with natal planets; transit aspects use the narrow orb.
  transitPatterns: { enabled: true, orb: 1, contours: false },
};

const STORAGE_KEY = 'astro-app:settings:v1';

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

// Deep-merge saved values onto the defaults so new settings keys always have a value.
function merge(defaults, saved) {
  if (!isObject(defaults) || !isObject(saved)) return saved ?? defaults;
  return Object.fromEntries(
    Object.keys(defaults).map((k) => [k, k in saved ? merge(defaults[k], saved[k]) : defaults[k]])
  );
}

/** Saved settings (from this browser or the account) completed with defaults for new keys. */
export function normalizeSettings(saved) {
  if (!isObject(saved)) return DEFAULT_SETTINGS;
  const copy = { ...saved };
  // Weights never edited by the user follow the new defaults; edited ones are kept.
  const w = copy.weights;
  if (isObject(w) && Object.entries(PREVIOUS_DEFAULT_WEIGHTS).every(([id, v]) => w[id] === v)) {
    delete copy.weights;
  }
  return merge(DEFAULT_SETTINGS, copy);
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeSettings(JSON.parse(raw)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const SESSION_KEY = 'astro-app:session:v1';
const SESSION_TTL = 30 * 60 * 1000; // entered data is kept for 30 minutes after the last change

/** Birth data, mode and transit moment saved by saveSession, or null if missing or expired. */
export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { savedAt, data } = JSON.parse(raw);
    if (!data || Date.now() - savedAt > SESSION_TTL) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function saveSession(data) {
  try {
    // Re-saving unchanged data (e.g. right after a reload) must not extend the 30 minutes.
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
    if (saved && JSON.stringify(saved.data) === JSON.stringify(data)) return;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Storage unavailable — data just won't survive a reload.
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable (private mode etc.) — settings just won't persist.
  }
}
