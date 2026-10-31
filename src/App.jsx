import { useState, useMemo, useEffect, useRef, useSyncExternalStore } from 'react';
import {
  ASPECTS,
  HOUSE_SYSTEMS,
  calculateNatal,
  calculateTransitPlanets,
  calculateProgressions,
  calculateReturn,
  calculateDirections,
  lunationPhase,
  DIRECTION_ARCS,
  RETURNS,
  toUtcDate,
  offsetForZone,
  formatOffset,
  momentAt,
  shiftMoment,
  pad,
  EXTRA_OBJECTS,
  extrasReady,
} from './utils/ephemeris';
import { findAspects, ORB_PRESET_KEYS } from './utils/aspects';
import { calculateBalance } from './utils/balance';
import { findAspectPatterns, findTransitPatterns } from './utils/aspectPatterns';
import { loadSettings, saveSettings, loadSession, saveSession, normalizeSettings } from './utils/settings';
import * as api from './utils/api';
import { ChartWheel } from './components/ChartWheel';
import { PlanetTable } from './components/PlanetTable';
import { AspectTable } from './components/AspectTable';
import { BalancePanel } from './components/BalancePanel';
import { PatternsPanel, TransitEvents } from './components/PatternsPanel';
import { BirthModal } from './components/BirthForm';
import { TransitBar } from './components/TransitBar';
import { DynamicsPanel } from './components/DynamicsPanel';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { AccountMenu } from './components/AccountMenu';
import { MobileMenu } from './components/MobileMenu';
import { ClientsModal } from './components/ClientsModal';
import { AboutModal } from './components/AboutModal';
import { APP_NAME } from './appInfo';
import { Tabs } from './components/Tabs';
import { detectCurrentPlace, placeFields, withoutPlace, withoutClient } from './utils/location';
import { I18nContext, LANGUAGES, loadLanguage, saveLanguage, translate, placeName } from './i18n';


/** Current local date/time and the browser's UTC offset. */
function nowLocal() {
  const d = new Date();
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    utcOffset: -d.getTimezoneOffset() / 60,
    live: true,
  };
}

const DEFAULT_TIME_ZONE = 'Europe/Kyiv';

function defaultBirth() {
  const { date, time } = nowLocal();
  return {
    date,
    time,
    utcOffset: offsetForZone(DEFAULT_TIME_ZONE, date, time),
    timeZone: DEFAULT_TIME_ZONE,
    // The default city is shown by translation key; cities found by search keep their own name.
    place: 'Київ, Україна',
    placeKey: 'kyiv',
    latitude: 50.4501,
    longitude: 30.5234,
  };
}

// Data entered before a reload (kept for 30 minutes after the last change).
const savedSession = loadSession();
// Sessions saved before the default city got a translation key.
if (savedSession?.birth?.place === 'Київ, Україна' && !('placeKey' in savedSession.birth)) {
  savedSession.birth.placeKey = 'kyiv';
}

// With nothing saved, the chart starts at the user's current location (Kyiv until it resolves
// or if permission is denied). Started once at load, so StrictMode doesn't ask twice.
const currentPlace = savedSession ? null : detectCurrentPlace(loadLanguage());

/** 2026-10-13 → "13 октября 2026 г." / "13 жовтня 2026 р." / "October 13, 2026". */
const formatDate = (iso, lang) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(y, m - 1, d));
};

function Legend({ aspectColors, t }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-[11px] text-slate-500">
      {ASPECTS.map((a) => (
        <span key={a.id} className="flex items-center gap-1.5">
          <span className="inline-block h-px w-5" style={{ backgroundColor: aspectColors[a.id], height: 1.5 }} />
          <span className="astro">{a.glyph}</span> {t(`aspect.${a.id}`)}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-5 border-t-[1.5px] border-dashed border-slate-400" />
        {t('legend.separating')}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-[3px] w-5 rounded bg-slate-500" />
        {t('legend.exact')}
      </span>
    </div>
  );
}

// Two wheels side by side need a wide screen; phones and tablets keep one wheel.
const WIDE = '(min-width: 1024px)';
const subscribeWide = (onChange) => {
  const query = window.matchMedia(WIDE);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};
const isWide = () => window.matchMedia(WIDE).matches;

/** Points of a forecast method for `date`: transits at `place`, progressions and directions from the birth chart. */
function forecastPoints(method, natal, date, place, settings, extras) {
  if (method === 'progressions') return calculateProgressions(natal, date, settings.houseSystem, extras, settings.nodeType);
  if (method === 'directions') return calculateDirections(natal, date, settings.directions);
  return calculateTransitPlanets(date, natal.houses, place, settings.houseSystem, extras, settings.nodeType);
}

/** Forecast aspects with the separating ones past `separatingOrb` hidden or dimmed. */
function withSeparating(aspects, { separating, separatingOrb }) {
  return aspects.flatMap((a) => {
    const past = !a.applying && a.orb > separatingOrb;
    if (past && separating === 'hide') return [];
    return [past && separating === 'dim' ? { ...a, faded: true } : a];
  });
}

/** What to highlight for a hovered planet, aspect or house of one wheel; null for anything else. */
function pointFocus(hover, aspects, planets) {
  if (hover?.type === 'planet') {
    return {
      planets: new Set([hover.key]),
      aspects: new Set(aspects.filter((a) => a.a.key === hover.key || a.b.key === hover.key).map((a) => a.id)),
    };
  }
  if (hover?.type === 'aspect') {
    const aspect = aspects.find((a) => a.id === hover.id);
    return aspect ? { planets: new Set([aspect.a.key, aspect.b.key]), aspects: new Set([aspect.id]) } : null;
  }
  if (hover?.type === 'house') {
    return {
      house: hover.index,
      planets: new Set(planets.filter((p) => p.house === hover.index + 1).map((p) => p.key)),
      aspects: new Set(),
    };
  }
  return null;
}

// Natal chart alone, or with the ring of a forecast method; labels are `mode.<id>`.
const MODES = ['natal', 'transit', 'progressions', 'directions', 'solar', 'lunar'];

function IconButton({ onClick, children, label }) {
  return (
    <button type="button" onClick={onClick} className="btn-secondary flex items-center gap-2" aria-label={label}>
      {children}
    </button>
  );
}

export default function App() {
  const [birth, setBirth] = useState(() => savedSession?.birth ?? defaultBirth());
  const [mode, setMode] = useState(() => savedSession?.mode ?? 'natal');
  // Second wheel beside the main one on wide screens: 'none', 'solar' or 'lunar'.
  const [second, setSecond] = useState(() => savedSession?.second ?? 'none');
  const [secondHover, setSecondHover] = useState(null);
  // Which chart the aspects table lists when there are two: 'main' or 'second'.
  const [aspectTarget, setAspectTarget] = useState('main');
  // A transit moment that was "now" (never moved by hand) is "now" again after a reload.
  const [transitMoment, setTransitMoment] = useState(() => {
    const saved = savedSession?.transitMoment;
    if (!saved) return nowLocal();
    return saved.live ? momentAt(saved, Date.now()) : saved;
  });
  const [settings, setSettings] = useState(loadSettings);
  const [hover, setHover] = useState(null);
  const [tab, setTab] = useState('dynamics');
  const [dynamics, setDynamics] = useState({ step: 1, unit: 'day' });
  const [birthOpen, setBirthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lang, setLang] = useState(loadLanguage);
  // Accounts: available only when the site runs with the Worker API (config is null otherwise).
  const [authConfig, setAuthConfig] = useState(null);
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  // Id of the user whose account settings have been loaded: only then are changes saved back,
  // so local values never overwrite the account's before it has been read.
  const [syncedUserId, setSyncedUserId] = useState(null);
  const syncReady = Boolean(user) && syncedUserId === user.id;
  // Saved clients (name + birth data) of the signed-in user, newest first; null while signed out.
  const [clientsOf, setClientsOf] = useState({ userId: null, list: [] });
  const clients = user && clientsOf.userId === user.id ? clientsOf.list : null;
  // Asteroids and Selena need data files that load after the first render.
  const [extrasLoaded, setExtrasLoaded] = useState(false);
  const t = (key, vars) => translate(lang, key, vars);
  const i18n = useMemo(() => ({ lang, setLang }), [lang]);

  useEffect(() => saveSettings(settings), [settings]);

  useEffect(() => {
    api.getConfig().then((config) => {
      setAuthConfig(config);
      if (config) api.getSession().then(setUser);
    });
  }, []);

  // On sign-in: take the account's settings and language, or store the current ones in a new
  // account. Afterwards every change is saved to the account (debounced).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api
      .loadSettings()
      .then((data) => {
        if (cancelled) return;
        if (data?.settings) setSettings(normalizeSettings(data.settings));
        if (data?.lang && LANGUAGES.some((l) => l.id === data.lang)) setLang(data.lang);
        setSyncedUserId(user.id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api
      .listCharts()
      .then((list) => !cancelled && setClientsOf({ userId: user.id, list }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  const setClients = (update) => setClientsOf((c) => ({ ...c, list: update(c.list) }));

  /** Saves `b` as a client (updates it when it has a clientId); resolves to `b` with its clientId. */
  const saveClient = async (b) => {
    const { clientId, name } = b;
    const data = withoutClient(b);
    if (clientId) {
      const { updatedAt } = await api.updateChart(clientId, name, { birth: data });
      const saved = { id: clientId, name, data: { birth: data }, updatedAt };
      setClients((list) => [saved, ...list.filter((c) => c.id !== clientId)]);
      return b;
    }
    const chart = await api.createChart(name, { birth: data });
    setClients((list) => [chart, ...list]);
    return { ...b, clientId: chart.id };
  };

  const syncTimer = useRef(null);
  useEffect(() => {
    if (!user || !syncReady) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => api.saveSettings({ settings, lang }).catch(() => {}), 800);
    return () => clearTimeout(syncTimer.current);
  }, [user, syncReady, settings, lang]);

  const changeMode = (id) => {
    setMode(id);
    setHover(null);
  };

  const signOut = async () => {
    await api.signOut().catch(() => {});
    setUser(null);
  };
  const deleteAccount = async () => {
    if (!window.confirm(t('account.deleteConfirm'))) return;
    try {
      await api.deleteAccount();
      setUser(null);
    } catch {
      window.alert(t('auth.error.generic'));
    }
  };
  useEffect(() => {
    extrasReady.then(setExtrasLoaded);
  }, []);
  useEffect(() => {
    let cancelled = false;
    currentPlace
      ?.then((found) => {
        if (cancelled) return;
        // Keep anything the user entered while the location was being detected.
        setBirth((b) =>
          b.placeKey === 'kyiv'
            ? { ...b, ...found, placeKey: null, utcOffset: offsetForZone(found.timeZone, b.date, b.time) }
            : b
        );
        // Transits without their own place start where the user is.
        setTransitMoment((m) => (m.latitude == null ? momentAt({ ...m, ...found, placeKey: null }, Date.now()) : m));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    saveLanguage(lang);
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => saveSession({ birth, mode, second, transitMoment }), [birth, mode, second, transitMoment]);

  // Transits use their own place once one is chosen. Until then they follow the birth place:
  // the stored instant is shown on the birth place's clock, and edits never store that place,
  // so changing the birth city later moves the transit place along with it.
  const hasTransitPlace = transitMoment.latitude != null;
  const transit = useMemo(() => {
    if (hasTransitPlace) return transitMoment;
    const merged = { ...transitMoment, ...placeFields(birth) };
    const ms = toUtcDate(transitMoment.date, transitMoment.time, transitMoment.utcOffset).getTime();
    return Number.isNaN(ms) ? merged : momentAt(merged, ms);
  }, [hasTransitPlace, transitMoment, birth]);
  const updateTransit = (m, live = false) => setTransitMoment({ ...(hasTransitPlace ? m : withoutPlace(m)), live });
  const transitNow = () => updateTransit(momentAt(transit, Date.now()), true);
  const stepTransit = (count) => updateTransit(shiftMoment(transit, count * dynamics.step, dynamics.unit));
  // Natal dynamics move the birth moment itself; nothing is saved until the birth form is submitted.
  const stepBirth = (count) => setBirth((b) => shiftMoment(b, count * dynamics.step, dynamics.unit));
  // "Now" replaces the open client with the chart of the current moment at the transit place
  // (the birth place unless transits have their own); the saved client itself stays as it is.
  const natalNow = () => setBirth(momentAt({ ...placeFields(transit), utcOffset: transit.utcOffset }, Date.now()));

  const { visible, weights, colors } = settings;

  // Additional objects switched on in the settings, as a stable string for memo dependencies.
  const extrasKey = EXTRA_OBJECTS.filter((o) => visible[o.id]).map((o) => o.id).join();
  const extras = useMemo(() => new Set(extrasKey ? extrasKey.split(',') : []), [extrasKey]);

  const chartData = useMemo(
    () =>
      calculateNatal(
        { date: toUtcDate(birth.date, birth.time, birth.utcOffset), latitude: birth.latitude, longitude: birth.longitude },
        settings.houseSystem,
        extras,
        settings.nodeType
      ),
    // extrasLoaded: recalculate once the data files arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [birth, settings.houseSystem, extras, settings.nodeType, extrasLoaded]
  );

  const { latitude: transitLat, longitude: transitLon } = transit;
  // Forecast methods draw an outer ring for the moment in the transit bar: transits at the
  // transit place, progressions and directions from the birth chart.
  const forecast = mode in ORB_PRESET_KEYS ? mode : null;
  // Solar and lunar returns replace the chart: the last return before the moment in the bar, at its place.
  const returnKind = RETURNS[mode] ? mode : null;
  const returnChart = useMemo(() => {
    if (!returnKind || !transitMoment.date) return null;
    const date = toUtcDate(transitMoment.date, transitMoment.time, transitMoment.utcOffset);
    if (Number.isNaN(date.getTime())) return null;
    const place = { latitude: transitLat, longitude: transitLon };
    return calculateReturn(chartData, returnKind, date, place, settings.houseSystem, extras, settings.nodeType);
  }, [returnKind, transitMoment, transitLat, transitLon, chartData, settings.houseSystem, extras, settings.nodeType]);
  // The return moment on the clock of its place.
  const returnMoment = returnChart && momentAt({ ...placeFields(transit), utcOffset: transit.utcOffset }, returnChart.date.getTime());
  // The chart in the middle of the wheel and in the tables: the birth chart or the return.
  const mainChart = returnChart ?? chartData;
  const returnAspectSettings = useMemo(() => ({ ...settings.aspects, ...settings.returnOrbPreset }), [settings.aspects, settings.returnOrbPreset]);
  const mainAspectSettings = returnKind ? returnAspectSettings : settings.aspects;

  const natalPlanets = useMemo(() => mainChart.planets.filter((p) => visible[p.id]), [mainChart, visible]);
  const natalAngles = useMemo(() => mainChart.angles.filter((p) => visible[p.id]), [mainChart, visible]);
  const natalPoints = useMemo(() => [...natalPlanets, ...natalAngles], [natalPlanets, natalAngles]);
  const natalAspects = useMemo(() => findAspects(natalPoints, mainAspectSettings), [natalPoints, mainAspectSettings]);

  const transitPlanets = useMemo(() => {
    if (!forecast || !transitMoment.date) return null;
    const date = toUtcDate(transitMoment.date, transitMoment.time, transitMoment.utcOffset);
    if (Number.isNaN(date.getTime())) return null;
    const place = { latitude: transitLat, longitude: transitLon };
    return forecastPoints(forecast, chartData, date, place, settings, extras).filter((p) => visible[p.id]);
  }, [forecast, transitMoment, transitLat, transitLon, chartData, visible, settings, extras]);

  // Each forecast method has its own orb table and formula; the rest of the aspect settings is shared.
  const orbPreset = settings[ORB_PRESET_KEYS[forecast] ?? ORB_PRESET_KEYS.transit];
  const transitAspectSettings = useMemo(() => ({ ...settings.aspects, ...orbPreset }), [settings.aspects, orbPreset]);
  const transitAspects = useMemo(
    () => (transitPlanets ? withSeparating(findAspects(transitPlanets, transitAspectSettings, natalPoints), transitAspectSettings) : null),
    [transitPlanets, transitAspectSettings, natalPoints]
  );

  const isBiWheel = Boolean(transitPlanets);
  const visibleAspects = transitAspects ?? natalAspects;
  // Progressed lunation: where the progressed Moon stands in its cycle with the progressed Sun.
  const progressedSun = forecast === 'progressions' && transitPlanets.find((p) => p.id === 'sun');
  const progressedMoon = forecast === 'progressions' && transitPlanets.find((p) => p.id === 'moon');
  const lunation = progressedSun && progressedMoon ? lunationPhase(progressedSun, progressedMoon) : null;

  // The second wheel shows any other mode for the same moment: the birth chart, a forecast ring
  // around it, or a solar or lunar return with its own houses (at the transit place).
  const wide = useSyncExternalStore(subscribeWide, isWide);
  const secondMode = wide && second !== mode && MODES.includes(second) ? second : null;
  const birthPlanets = useMemo(() => chartData.planets.filter((p) => visible[p.id]), [chartData, visible]);
  const birthAngles = useMemo(() => chartData.angles.filter((p) => visible[p.id]), [chartData, visible]);
  const birthPoints = useMemo(() => [...birthPlanets, ...birthAngles], [birthPlanets, birthAngles]);
  const secondView = useMemo(() => {
    if (!secondMode || !transitMoment.date) return null;
    const date = toUtcDate(transitMoment.date, transitMoment.time, transitMoment.utcOffset);
    if (Number.isNaN(date.getTime())) return null;
    const place = { latitude: transitLat, longitude: transitLon };
    if (RETURNS[secondMode]) {
      const chart = calculateReturn(chartData, secondMode, date, place, settings.houseSystem, extras, settings.nodeType, secondMode);
      const planets = chart.planets.filter((p) => visible[p.id]);
      const angles = chart.angles.filter((p) => visible[p.id]);
      const points = [...planets, ...angles];
      const moment = momentAt({ ...placeFields(transit), utcOffset: transit.utcOffset }, chart.date.getTime());
      return { chart, planets, angles, ring: null, points, aspects: findAspects(points, returnAspectSettings), moment, isReturn: true };
    }
    const base = { chart: chartData, planets: birthPlanets, angles: birthAngles };
    if (secondMode === 'natal') return { ...base, ring: null, points: birthPoints, aspects: findAspects(birthPoints, settings.aspects), moment: birth };
    const ring = forecastPoints(secondMode, chartData, date, place, settings, extras).filter((p) => visible[p.id]);
    const preset = { ...settings.aspects, ...settings[ORB_PRESET_KEYS[secondMode]] };
    return { ...base, ring, points: ring, aspects: withSeparating(findAspects(ring, preset, birthPoints), preset), moment: transit };
  }, [secondMode, transitMoment, transitLat, transitLon, transit, chartData, birth, settings, extras, visible, birthPlanets, birthAngles, birthPoints, returnAspectSettings]);
  // The aspects table can list the second chart instead: the main forecast to a return, or the second chart's own aspects.
  const secondTableAspects = useMemo(() => {
    if (!secondView) return null;
    if (secondView.isReturn && transitPlanets) {
      return withSeparating(findAspects(transitPlanets, transitAspectSettings, secondView.points), transitAspectSettings);
    }
    return secondView.aspects;
  }, [secondView, transitPlanets, transitAspectSettings]);
  const showSecondAspects = Boolean(secondTableAspects) && aspectTarget === 'second';
  const tableAspects = showSecondAspects ? secondTableAspects : visibleAspects;
  const tableTwoRings = showSecondAspects ? Boolean(secondView.ring || (secondView.isReturn && transitPlanets)) : isBiWheel;
  const secondFocus = useMemo(() => pointFocus(secondHover, secondView?.aspects ?? [], secondView?.planets ?? []), [secondHover, secondView]);

  const balance = useMemo(() => calculateBalance(mainChart, weights), [mainChart, weights]);
  // Natal figures in the natal chart; under transits, the figures transits complete with natal planets.
  const transitPatternSettings = settings.transitPatterns;
  const { patterns, patternAspects } = useMemo(() => {
    if (!transitPlanets) return { patterns: findAspectPatterns(natalPlanets, natalAspects), patternAspects: natalAspects };
    if (!transitPatternSettings.enabled) return { patterns: [], patternAspects: [] };
    const found = findTransitPatterns(natalPlanets, natalAspects, transitPlanets, transitAspectSettings, transitPatternSettings.orb);
    return { patterns: found.patterns, patternAspects: found.aspects };
  }, [natalPlanets, natalAspects, transitPlanets, transitAspectSettings, transitPatternSettings]);

  // What to highlight on the wheel and in the tables for the current hover target.
  const focus = useMemo(() => {
    if (!hover) return null;
    if (hover.type === 'pattern') {
      const pattern = patterns[hover.index];
      if (!pattern) return null;
      const members = new Set(pattern.members.map((m) => m.key));
      return {
        planets: members,
        aspects: new Set(patternAspects.filter((a) => members.has(a.a.key) && members.has(a.b.key)).map((a) => a.id)),
      };
    }
    // Aspects hovered in the table may belong to the second chart.
    return pointFocus(hover, secondTableAspects ? [...visibleAspects, ...secondTableAspects] : visibleAspects, natalPlanets);
  }, [hover, visibleAspects, secondTableAspects, natalPlanets, patternAspects, patterns]);

  // Dynamics comes first; the natal chart also has the element balance, transits show only Dynamics.
  const dynamicsTab = { id: 'dynamics', label: t('tab.dynamics') };
  const firstTabs = forecast ? [dynamicsTab] : [dynamicsTab, { id: 'balance', label: t('tab.balance') }];
  const activeTab = tab === 'balance' && forecast ? 'dynamics' : tab;
  // Transits draw only transit-to-natal aspects, so a hovered figure adds its missing lines
  // (natal pairs, transit-to-transit pairs) to the wheel.
  // With "contours" on, every transit figure stays drawn, not only the hovered one.
  const wheelAspects = useMemo(() => {
    if (!isBiWheel) return visibleAspects;
    let extra = [];
    if (transitPatternSettings.contours) {
      extra = patternAspects.filter((a) =>
        patterns.some((p) => p.members.some((m) => m.key === a.a.key) && p.members.some((m) => m.key === a.b.key))
      );
    } else if (hover?.type === 'pattern' && focus) {
      extra = patternAspects.filter((a) => focus.aspects.has(a.id));
    }
    const drawn = new Set(visibleAspects.map((a) => a.id));
    return [...visibleAspects, ...extra.filter((a) => !drawn.has(a.id))];
  }, [isBiWheel, hover, focus, visibleAspects, patternAspects, patterns, transitPatternSettings.contours]);

  const tabs = [
    ...firstTabs,
    { id: 'planets', label: t('tab.planets') },
    { id: 'aspects', label: t('tab.aspects'), badge: visibleAspects.length },
    { id: 'patterns', label: t('tab.patterns'), badge: patterns.length },
  ];
  const houseSystem = HOUSE_SYSTEMS.find((h) => h.id === settings.houseSystem);

  // The date (and place) of the forecast or return; with two wheels it goes under the main wheel
  // so both wheels start at the same height.
  const forecastBar = (forecast || returnKind) && (
    <TransitBar method={mode} moment={transit} onChange={updateTransit} onPlaceChange={setTransitMoment} onNow={transitNow}>
      {mode === 'directions' && (
        <>
          <label className="field">
            <span>{t('directions.arc')}</span>
            <select
              className="input-sm"
              value={settings.directions.arc}
              onChange={(e) => setSettings((s) => ({ ...s, directions: { ...s.directions, arc: e.target.value } }))}
            >
              {Object.keys(DIRECTION_ARCS).map((id) => (
                <option key={id} value={id}>{t(`directions.arc.${id}`)}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t('directions.direction')}</span>
            <select
              className="input-sm"
              value={settings.directions.converse ? 'converse' : 'direct'}
              onChange={(e) => setSettings((s) => ({ ...s, directions: { ...s.directions, converse: e.target.value === 'converse' } }))}
            >
              <option value="direct">{t('directions.direct')}</option>
              <option value="converse">{t('directions.converse')}</option>
            </select>
          </label>
        </>
      )}
    </TransitBar>
  );

  return (
    <I18nContext.Provider value={i18n}>
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <header className="relative z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <MobileMenu
                modes={MODES}
                mode={mode}
                onModeChange={changeMode}
                user={user}
                accountsEnabled={Boolean(authConfig)}
                onData={() => setBirthOpen(true)}
                onCharts={() => setChartsOpen(true)}
                onSettings={() => setSettingsOpen(true)}
                onAbout={() => setAboutOpen(true)}
                onSignIn={() => setAuthOpen(true)}
                onSignOut={signOut}
                onDelete={deleteAccount}
              />
            </div>
            <div>
              <h1 className="flex items-center gap-2 font-display text-3xl font-semibold leading-none tracking-tight">
                <img src="/favicon.svg" alt="" className="h-8 w-8" />
                {APP_NAME}
              </h1>
              <p className="mt-1 flex flex-wrap gap-x-2 text-xs tracking-wide text-slate-500">
                <span>{t('app.subtitle')}</span>
                {/* On phones About and Privacy live in the slide-out menu. */}
                <span aria-hidden className="hidden lg:inline">·</span>
                <button type="button" className="hidden underline lg:inline decoration-slate-300 underline-offset-2 hover:text-slate-900" onClick={() => setAboutOpen(true)}>
                  {t('app.about')}
                </button>
                <span aria-hidden className="hidden lg:inline">·</span>
                <a href={`/privacy?lang=${lang}`} target="_blank" rel="noreferrer" className="hidden underline lg:inline decoration-slate-300 underline-offset-2 hover:text-slate-900">
                  {t('auth.privacy')}
                </a>
              </p>
            </div>
          </div>
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-sm">
              {MODES.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => changeMode(id)}
                  className={`rounded-md px-3 py-1.5 transition ${mode === id ? 'bg-white font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {t(`mode.${id}`)}
                </button>
              ))}
            </div>
            <IconButton onClick={() => setBirthOpen(true)} label={t('birth.title')}>
              <span aria-hidden>✎</span> {t('header.data')}
            </IconButton>
            {user && (
              <IconButton onClick={() => setChartsOpen(true)} label={t('clients.button')}>
                <span aria-hidden>☰</span> {t('clients.button')}
              </IconButton>
            )}
            <IconButton onClick={() => setSettingsOpen(true)} label={t('header.settings')}>
              <span aria-hidden>⚙</span> {t('header.settings')}
            </IconButton>
            <select className="input-sm" value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t('app.language')}>
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
            {authConfig && (
              <AccountMenu
                user={user}
                onSignIn={() => setAuthOpen(true)}
                onCharts={() => setChartsOpen(true)}
                onSignOut={signOut}
                onDelete={deleteAccount}
              />
            )}
          </div>
        </div>
      </header>

      {/* With a second wheel both wheels share the top row and the tabs take the full width below. */}
      <main
        className={`mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 ${
          secondView ? 'lg:grid-cols-2' : 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]'
        }`}
      >
        {/* Wheel Chart Component */}
        <section className={`card flex flex-col gap-4 p-4 sm:p-6 ${secondView ? 'lg:self-start' : 'lg:sticky lg:top-6 lg:self-start'}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
            <button type="button" onClick={() => setBirthOpen(true)} className="text-left">
              <div className="font-display text-xl font-semibold">{birth.name || placeName(birth, t)}</div>
              <div className="text-xs tabular-nums text-slate-500">
                {birth.name && `${placeName(birth, t)} · `}
                {formatDate(birth.date, lang)} · {birth.time} · {formatOffset(birth.utcOffset)}
              </div>
            </button>
            <div className="flex items-center gap-3">
              {wide && (
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  {t('second.label')}
                  <select className="input-sm" value={secondMode ?? 'none'} onChange={(e) => setSecond(e.target.value)}>
                    <option value="none">{t('second.none')}</option>
                    {MODES.filter((id) => id !== mode).map((id) => (
                      <option key={id} value={id}>{t(`mode.${id}`)}</option>
                    ))}
                  </select>
                </label>
              )}
              <div className="text-[11px] uppercase tracking-wider text-slate-400">{houseSystem && t(`houseSystem.${houseSystem.key}`)}</div>
            </div>
          </div>
          {returnMoment && (
            <div className="-mt-2 px-1">
              <div className="font-display text-lg font-semibold">{t(`mode.${returnKind}`)}</div>
              <div className="text-xs tabular-nums text-slate-500">
                {placeName(transit, t)} · {formatDate(returnMoment.date, lang)} · {returnMoment.time} · {formatOffset(returnMoment.utcOffset)}
              </div>
            </div>
          )}

          {!secondView && forecastBar}

          <ChartWheel
            chartData={mainChart}
            planets={natalPlanets}
            angles={natalAngles}
            transitPlanets={transitPlanets}
            aspects={wheelAspects}
            elementColors={colors.elements}
            aspectColors={colors.aspects}
            hover={hover}
            focus={focus}
            onHover={setHover}
            highContrast={settings.highContrast}
          />
          {secondView && forecastBar}
          <Legend aspectColors={colors.aspects} t={t} />
          {isBiWheel && <TransitEvents patterns={patterns} aspects={patternAspects} hover={hover} onHover={setHover} />}
        </section>

        {secondView && (
          <section className="card flex flex-col gap-4 p-4 sm:p-6 lg:self-start">
            <div className="px-1">
              <div className="font-display text-xl font-semibold">{t(`mode.${secondMode}`)}</div>
              <div className="text-xs tabular-nums text-slate-500">
                {placeName(secondView.moment, t)} · {formatDate(secondView.moment.date, lang)} · {secondView.moment.time} ·{' '}
                {formatOffset(secondView.moment.utcOffset)}
              </div>
            </div>
            <ChartWheel
              chartData={secondView.chart}
              planets={secondView.planets}
              angles={secondView.angles}
              transitPlanets={secondView.ring}
              aspects={secondView.aspects}
              elementColors={colors.elements}
              aspectColors={colors.aspects}
              hover={secondHover}
              focus={secondFocus}
              onHover={setSecondHover}
              highContrast={settings.highContrast}
            />
            {/* The second chart's date bar sits under its wheel like the main one, so both wheels start
                at the same height; both bars set the same moment. */}
            {secondMode !== 'natal' && (
              <TransitBar method={secondMode} moment={transit} onChange={updateTransit} onPlaceChange={setTransitMoment} onNow={transitNow} />
            )}
          </section>
        )}

        {/* Balance, planets, aspects and patterns as tabs */}
        <section className={`card self-start p-4 sm:p-6 ${secondView ? 'lg:col-span-2' : ''}`}>
          <Tabs tabs={tabs} active={activeTab} onChange={setTab} className="-mt-2 mb-5" />
          {activeTab === 'balance' && <BalancePanel balance={balance} elementColors={colors.elements} />}
          {activeTab === 'dynamics' && (
            <DynamicsPanel
              natal={!isBiWheel}
              moment={mode === 'natal' ? birth : transit}
              dynamics={dynamics}
              onDynamicsChange={setDynamics}
              onStep={mode === 'natal' ? stepBirth : stepTransit}
              onNow={mode === 'natal' ? natalNow : transitNow}
              aspects={visibleAspects}
              aspectColors={colors.aspects}
              lunation={lunation}
            />
          )}
          {activeTab === 'planets' && (
            <PlanetTable points={natalPoints} secondPoints={secondView?.points} transitPlanets={transitPlanets} focus={focus} onHover={setHover} />
          )}
          {activeTab === 'aspects' && (
            <>
              {secondTableAspects && (
                <div className="mb-4 flex items-center gap-3 text-sm">
                  <span className="text-slate-500">{t('second.aspectsOf')}</span>
                  <div className="flex rounded-lg bg-slate-100 p-1">
                    {['main', 'second'].map((id) => (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={aspectTarget === id}
                        onClick={() => setAspectTarget(id)}
                        className={`rounded-md px-3 py-1 transition ${aspectTarget === id ? 'bg-white font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        {t(`mode.${id === 'main' ? mode : secondMode}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <AspectTable
                aspects={tableAspects}
                aspectColors={colors.aspects}
                isBiWheel={tableTwoRings}
                focus={focus}
                onHover={setHover}
              />
            </>
          )}
          {activeTab === 'patterns' && (
            <PatternsPanel
              patterns={patterns}
              hover={hover}
              onHover={setHover}
              transitSettings={isBiWheel ? transitPatternSettings : null}
              onTransitSettingsChange={(transitPatterns) => setSettings((s) => ({ ...s, transitPatterns }))}
            />
          )}
        </section>
      </main>

      <BirthModal
        open={birthOpen}
        onClose={() => setBirthOpen(false)}
        birth={birth}
        onSubmit={setBirth}
        clients={clients}
        onSaveClient={saveClient}
      />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} onChange={setSettings} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} google={Boolean(authConfig?.google)} turnstile={authConfig?.turnstile ?? null} onSignedIn={setUser} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} user={user} turnstile={authConfig?.turnstile ?? null} />
      <ClientsModal
        open={chartsOpen}
        onClose={() => setChartsOpen(false)}
        birth={birth}
        clients={clients}
        onSave={saveClient}
        onDeleted={(id) => {
          setClients((list) => list.filter((c) => c.id !== id));
          // The chart on screen stays, it just is no longer a saved client.
          setBirth((current) => (current.clientId === id ? withoutClient(current) : current));
        }}
        onOpen={setBirth}
      />
    </div>
    </I18nContext.Provider>
  );
}
