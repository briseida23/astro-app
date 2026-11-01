import { useMemo, useState } from 'react';
import { ANGLES, CONTACT_METHODS, EXTRA_OBJECTS, PLANETS, aspectTimeline, momentAt, toUtcDate } from '../utils/ephemeris';
import { allowedOrb } from '../utils/aspects';
import { useI18n, formatShortDate } from '../i18n';
import { Glyph } from './Glyph';
import { Hint } from './Hint';

const SPANS = [3, 6, 12, 24];
// Transiting planets that can be shown; the Moon would add a bar every few days to every point.
const TRANSIT_PLANETS = PLANETS.slice(0, 10).filter((p) => p.id !== 'moon');
// Slow planets only at first: the fast ones make dozens of short bars a year.
const DEFAULT_TRANSITS = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
// "All methods" lists the slowest first: directions, then progressions, then transits.
const ALL_ORDER = ['directions', 'progressions', 'transit'];
const BY_ID = Object.fromEntries([...PLANETS, ...ANGLES, ...EXTRA_OBJECTS].map((p) => [p.id, p]));

/** [start, end] of `months` months from the date `date` (YYYY-MM-DD) at UTC offset `offset`. */
function periodOf(date, months, offset) {
  const start = toUtcDate(date, '00:00', offset);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + months);
  return [start, end];
}

const methodsOf = (method) => (method === 'all' ? ALL_ORDER : [method]);

/**
 * Aspect calendar: bars from entering to leaving the orb, with the exact moments marked, for the
 * forecast aspects to the natal chart over a period. Orbs and the points that take part come from
 * `presets` (aspect settings per method). `onOpen(method, ms)` opens that method at a moment.
 */
export function AspectTimeline({ natal, points, moment, extras, presets, options, defaultMethod, aspectColors, onOpen }) {
  const { lang, t } = useI18n();
  const [method, setMethod] = useState(defaultMethod ?? 'all');
  const [from, setFrom] = useState(moment.date);
  const [span, setSpan] = useState(12);
  const [transits, setTransits] = useState(DEFAULT_TRANSITS);
  const methods = methodsOf(method);

  const [start, end] = periodOf(from, span, moment.utcOffset);

  const rows = useMemo(() => {
    const [start, end] = periodOf(from, span, moment.utcOffset);
    if (Number.isNaN(start.getTime())) return [];
    // Progressed and directed: every point the method's settings let take part.
    const all = [...PLANETS, ...ANGLES, ...EXTRA_OBJECTS.filter((o) => extras.has(o.id))].map((p) => p.id);
    return methodsOf(method).flatMap((m) => {
      const movers = m === 'transit' ? transits : all;
      return aspectTimeline(natal, m, movers, points, start, end, (a, b, aspect) => allowedOrb(a, b, aspect, presets[m]), options);
    });
  }, [natal, points, extras, presets, options, method, transits, from, span, moment.utcOffset]);

  const total = end - start;
  const pos = (date) => Math.min(100, Math.max(0, ((date - start) / total) * 100));
  const day = (date) => formatShortDate(momentAt(moment, date.getTime()).date, lang);
  const months = [];
  for (let i = 0; i < span; i++) {
    const m = new Date(start);
    m.setUTCMonth(m.getUTCMonth() + i);
    months.push(m);
  }
  const now = toUtcDate(moment.date, moment.time, moment.utcOffset);
  const showNow = now >= start && now <= end;
  const toggle = (id) => setTransits((list) => (list.includes(id) ? list.filter((p) => p !== id) : [...list, id]));
  const transitChips = [...TRANSIT_PLANETS, ...(extras.has('chiron') ? [BY_ID.chiron] : [])];

  const describe = (r, w) => {
    const name = `${t(`wheel.${r.method}Prefix`)}${t(`object.${r.mover}`)} ${t(`aspect.${r.aspect.id}`).toLowerCase()} ${t('wheel.natalPrefix')}${t(`object.${r.target.id}`)}`;
    const exact = w.exacts.length ? w.exacts.map(day).join(', ') : t('window.noExact');
    const enter = w.startClipped ? t('timeline.before', { date: day(w.start) }) : day(w.start);
    const leave = w.endClipped ? t('timeline.after', { date: day(w.end) }) : day(w.end);
    return `${name}\n${t('window.full', { enter, exact, exit: leave })}`;
  };

  return (
    <section className="space-y-4">
      <h3 className="font-display text-xl font-semibold">{t('timeline.title')}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="field col-span-2 sm:col-span-1">
          <span>{t('search.method')}</span>
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="all">{t('timeline.allMethods')}</option>
            {CONTACT_METHODS.map((m) => (
              <option key={m} value={m}>{t(`mode.${m}`)}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('search.from')}</span>
          <input type="date" className="input" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} />
        </label>
        <label className="field">
          <span>{t('search.span')}</span>
          <select className="input" value={span} onChange={(e) => setSpan(Number(e.target.value))}>
            {SPANS.map((s) => (
              <option key={s} value={s}>{s < 12 ? t('dynamics.preset.month', { n: s }) : t('dynamics.preset.year', { n: s / 12 })}</option>
            ))}
          </select>
        </label>
      </div>
      {methods.includes('transit') && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs text-slate-500">{t('timeline.transits')}</span>
          {transitChips.map((p) => {
            const on = transits.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                title={t(`object.${p.id}`)}
                onClick={() => toggle(p.id)}
                className={`astro flex h-8 w-8 items-center justify-center rounded-lg border text-base transition ${
                  on ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                }`}
              >
                {p.glyph}
              </button>
            );
          })}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">{t('timeline.empty')}</p>
      ) : (
        <div className="-mx-1 overflow-x-auto">
          <div className="min-w-[640px] px-1 text-sm">
            {/* Month scale */}
            <div className="flex border-b border-slate-200 pb-1 text-[10px] uppercase tracking-wider text-slate-400">
              <div className="w-44 shrink-0" />
              <div className="relative h-4 flex-1">
                {months.map((m, i) => (
                  <span key={i} className="absolute" style={{ left: `${pos(m)}%` }}>
                    {span > 12 && i % 2 ? '' : new Intl.DateTimeFormat(lang, { month: 'short', timeZone: 'UTC' }).format(m)}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              {/* Month lines and the chart's date, drawn once behind all the rows. */}
              <div aria-hidden className="pointer-events-none absolute inset-y-0 left-44 right-0">
                {months.slice(1).map((mo, i) => (
                  <span key={i} className="absolute inset-y-0 w-px bg-slate-100" style={{ left: `${pos(mo)}%` }} />
                ))}
                {showNow && <span className="absolute inset-y-0 w-px bg-amber-500" style={{ left: `${pos(now)}%` }} />}
              </div>
              {methods.map((m) => {
                const own = rows.filter((r) => r.method === m);
                if (own.length === 0) return null;
                return (
                  <div key={m}>
                    {methods.length > 1 && (
                      <div className="mt-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">{t(`mode.${m}`)}</div>
                    )}
                    {own.map((r) => (
                      <div key={`${r.mover}|${r.target.key}|${r.aspect.id}`} className="flex items-center border-b border-slate-50 py-0.5">
                        <div className="flex w-44 shrink-0 items-center">
                          {/* "дир. ♃ ⚹ нат. MC": which chart each side belongs to, as practitioners write it. */}
                          <span className="w-8 text-[10px] text-slate-400">{t(`timeline.short.${m}`)}</span>
                          <Hint label={`${t(`wheel.${m}Prefix`)}${t(`object.${r.mover}`)}`}>
                            <Glyph of={{ ...BY_ID[r.mover], ring: m }} className="inline-block w-6 text-center" symbolClass="astro text-base" />
                          </Hint>
                          <Hint label={t(`aspect.${r.aspect.id}`)}>
                            <span className="astro w-6 text-center text-base" style={{ color: r.aspect.id === 'opposition' ? undefined : aspectColors[r.aspect.id] }}>
                              {r.aspect.glyph}
                            </span>
                          </Hint>
                          <span className="ml-1 text-[10px] text-slate-400">{t('timeline.short.natal')}</span>
                          <Hint label={`${t('wheel.natalPrefix')}${t(`object.${r.target.id}`)}`}>
                            <Glyph of={r.target} className="inline-block w-6 text-center" symbolClass="astro text-base" />
                          </Hint>
                        </div>
                        <div className="relative h-6 flex-1">
                          {r.windows.map((w) => {
                            const color = r.aspect.id === 'opposition' ? '#0F172A' : aspectColors[r.aspect.id];
                            return (
                              <button
                                key={w.start.getTime()}
                                type="button"
                                title={describe(r, w)}
                                onClick={() => onOpen(m, (w.exacts[0] ?? w.start).getTime())}
                                className={`absolute top-1.5 h-3 min-w-[3px] ${w.startClipped ? '' : 'rounded-l-full'} ${w.endClipped ? '' : 'rounded-r-full'} transition hover:brightness-90`}
                                style={{ left: `${pos(w.start)}%`, width: `${pos(w.end) - pos(w.start)}%`, backgroundColor: `color-mix(in srgb, ${color} 25%, transparent)` }}
                              >
                                {w.exacts.map((e) => (
                                  <span
                                    key={e.getTime()}
                                    className="absolute -top-1 h-5 w-[3px] -translate-x-1/2 rounded-full"
                                    style={{ left: `${((e - w.start) / (w.end - w.start)) * 100}%`, backgroundColor: color }}
                                  />
                                ))}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">{t('timeline.legend')}</p>
          </div>
        </div>
      )}
    </section>
  );
}
