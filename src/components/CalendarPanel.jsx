import { useMemo, useState } from 'react';
import { PLANETS, ROMAN, SIGNS, eclipsesAround, formatDegree, formatOrb, momentAt, toUtcDate, transitIngresses } from '../utils/ephemeris';
import { useI18n, formatShortDate } from '../i18n';
import { Glyph } from './Glyph';
import { Hint } from './Hint';

// Planets whose ingresses can be listed; the Moon changes sign every two and a half days.
const INGRESS_PLANETS = PLANETS.slice(0, 10).filter((p) => p.id !== 'moon');
// Mercury and the Sun are off at first: their ingresses come every few weeks.
const DEFAULT_PLANETS = ['venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
// Periods in months.
const SPANS = [1, 3, 6, 12, 24, 60];
const KINDS = ['all', 'sign', 'house'];
// Eclipses this many years either side of the date.
const ECLIPSE_YEARS = 2;

/**
 * Transit ingresses into signs and natal houses for a period, and the eclipses around the date with
 * their natal house and contacts. `onOpen(ms)` opens transits at a moment; hovering an eclipse
 * calls `onEclipseHover` so the wheel can mark its degree.
 */
export function CalendarPanel({ natal, points, moment, options, aspectColors, onOpen, onEclipseHover }) {
  const { lang, t } = useI18n();
  const [from, setFrom] = useState(moment.date);
  const [span, setSpan] = useState(12);
  const [planets, setPlanets] = useState(DEFAULT_PLANETS);
  const [kind, setKind] = useState('all');

  const ingresses = useMemo(() => {
    const start = toUtcDate(from, '00:00', moment.utcOffset);
    if (Number.isNaN(start.getTime())) return [];
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + span);
    return transitIngresses(natal, planets, start, end, options);
  }, [natal, planets, from, span, moment.utcOffset, options]);
  const shown = kind === 'all' ? ingresses : ingresses.filter((i) => i.kind === kind);

  // Two years either side do not depend on the hour: stepping the time leaves the list alone.
  const eclipses = useMemo(() => {
    const date = toUtcDate(moment.date, '12:00', moment.utcOffset);
    return Number.isNaN(date.getTime()) ? [] : eclipsesAround(natal, date, ECLIPSE_YEARS, points);
  }, [natal, points, moment.date, moment.utcOffset]);
  const now = toUtcDate(moment.date, moment.time, moment.utcOffset).getTime();

  const day = (date) => formatShortDate(momentAt(moment, date.getTime()).date, lang);
  const toggle = (id) => setPlanets((list) => (list.includes(id) ? list.filter((p) => p !== id) : [...list, id]));
  const heading = 'mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400';

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="font-display text-xl font-semibold">{t('calendar.ingresses')}</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
          <label className="field col-span-2 sm:col-span-1">
            <span>{t('calendar.kind')}</span>
            <select className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>{t(`calendar.kind.${k}`)}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-1">
          {INGRESS_PLANETS.map((p) => {
            const on = planets.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                title={t(`object.${p.id}`)}
                onClick={() => toggle(p.id)}
                className={`astro flex h-9 w-9 items-center justify-center rounded-lg border text-base transition ${
                  on ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                }`}
              >
                {p.glyph}
              </button>
            );
          })}
        </div>
        {shown.length === 0 ? (
          <p className="text-sm text-slate-500">{t('calendar.noIngresses')}</p>
        ) : (
          <ul className="space-y-0.5 text-sm">
            {shown.map((i) => (
              <li key={`${i.date.getTime()}:${i.mover}:${i.kind}`}>
                <button
                  type="button"
                  onClick={() => onOpen(i.date.getTime())}
                  title={t('search.open')}
                  className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition hover:bg-slate-50"
                >
                  <Hint label={`${t('wheel.transitPrefix')}${t(`object.${i.mover}`)}`}>
                    <Glyph of={{ ...PLANETS.find((p) => p.id === i.mover), ring: 'transit' }} className="inline-block w-6 text-center" symbolClass="astro text-base" />
                  </Hint>
                  <span className="inline-block w-3 text-[10px] font-semibold text-red-600">{i.retrograde ? 'R' : ''}</span>
                  <span className="text-slate-400">→</span>
                  {i.kind === 'sign' ? (
                    <Hint label={t(`sign.${i.sign.id}`)}>
                      <span className="astro w-6 text-center text-base">{i.sign.glyph}</span>
                    </Hint>
                  ) : (
                    <span className="font-display text-base">{t('ingress.house', { n: ROMAN[i.house - 1] })}</span>
                  )}
                  <span className="ml-auto tabular-nums text-slate-500">{day(i.date)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-xl font-semibold">{t('calendar.eclipses')}</h3>
        <p className="text-sm text-slate-600">{t('calendar.eclipsesLead', { n: ECLIPSE_YEARS })}</p>
        <ul className="space-y-1 text-sm" onMouseLeave={() => onEclipseHover(null)}>
          {eclipses.map((e) => {
            const past = e.date.getTime() < now;
            return (
              <li key={e.date.getTime()}>
                <button
                  type="button"
                  onClick={() => onOpen(e.date.getTime())}
                  onMouseEnter={() => onEclipseHover(e)}
                  onFocus={() => onEclipseHover(e)}
                  title={t('search.open')}
                  className={`flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-1.5 py-1.5 text-left transition hover:bg-slate-50 ${past ? 'text-slate-400' : ''}`}
                >
                  <span className="shrink-0 tabular-nums sm:w-28">{day(e.date)}</span>
                  <span className="shrink-0 sm:w-40">
                    <span aria-hidden className="mr-1">{e.kind === 'solar' ? '●' : '◐'}</span>
                    {t(`eclipse.${e.kind}.${e.type}`)}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 tabular-nums sm:w-24">
                    {formatDegree(e.longitude)}
                    <span className="astro text-base">{SIGNS[Math.floor(e.longitude / 30)].glyph}</span>
                  </span>
                  <span className="shrink-0 font-display text-base sm:w-16">{t('ingress.house', { n: ROMAN[e.house - 1] })}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    {e.contacts.map((c) => (
                      <Hint key={`${c.point.key}:${c.aspect.id}`} label={`${t(`aspect.${c.aspect.id}`)} ${t('wheel.natalPrefix')}${t(`object.${c.point.id}`)} · ${formatOrb(c.orb)}`}>
                        <span className="inline-flex items-center">
                          <span className="astro text-base" style={{ color: c.aspect.id === 'opposition' ? undefined : aspectColors[c.aspect.id] }}>
                            {c.aspect.glyph}
                          </span>
                          <Glyph of={c.point} className="inline-block w-6 text-center" symbolClass="astro text-base" />
                        </span>
                      </Hint>
                    ))}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className={heading}>{t('calendar.eclipseOrbs')}</p>
      </section>
    </div>
  );
}
