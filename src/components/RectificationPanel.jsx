import { useEffect, useMemo, useRef, useState } from 'react';
import { ASPECTS, DIRECTION_ARCS, ROMAN, byRectScore, formatOrb, momentAt, shiftMoment, toUtcDate } from '../utils/ephemeris';
import { useI18n, formatShortDate } from '../i18n';

const STEPS = [60, 120, 300];
const TOP = 5;
// Candidates closer than this (minutes) belong to the same peak of the histogram.
const PEAK_GAP = 6;
const ASPECT_GLYPH = Object.fromEntries(ASPECTS.map((a) => [a.id, a.glyph]));

/** The best times from different peaks: a neighbour of a better time one step away is the same answer. */
function peaks(results, count) {
  const picked = [];
  for (const r of [...results].sort(byRectScore)) {
    if (r.score === 0 || picked.length === count) break;
    if (picked.every((p) => Math.abs(p.date - r.date) >= PEAK_GAP * 60000)) picked.push(r);
  }
  return picked;
}

/**
 * Rectification of the birth time by the client's events: the window and step to try, the
 * direction arc and an optional transit check; runs in a worker. Shows the score of every time as
 * a histogram, the best times from different peaks and what explains each event; `onApply(ms)`
 * sets the birth time.
 */
export function RectificationPanel({ birth, events, houseSystem, onApply }) {
  const { lang, t } = useI18n();
  const start = shiftMoment(birth, -60, 'minute');
  const end = shiftMoment(birth, 60, 'minute');
  const [from, setFrom] = useState(start.time);
  const [to, setTo] = useState(end.time);
  const [step, setStep] = useState(60);
  const [arc, setArc] = useState('symbolic');
  const [transits, setTransits] = useState(false);
  const [state, setState] = useState({ status: 'idle', results: null });
  const [chosen, setChosen] = useState(0);
  const worker = useRef(null);
  const runId = useRef(0);

  useEffect(() => () => worker.current?.terminate(), []);

  const run = () => {
    const fromDate = toUtcDate(birth.date, from, birth.utcOffset);
    let toDate = toUtcDate(birth.date, to, birth.utcOffset);
    // A window across midnight ends on the next day.
    if (toDate <= fromDate) toDate = new Date(toDate.getTime() + 86400000);
    worker.current ??= new Worker(new URL('../workers/rectify.worker.js', import.meta.url), { type: 'module' });
    const id = ++runId.current;
    worker.current.onmessage = ({ data }) => {
      if (data.id !== runId.current) return;
      setChosen(0);
      setState({ status: 'done', results: data.results });
    };
    worker.current.onerror = () => setState({ status: 'error', results: null });
    setState((s) => ({ ...s, status: 'running' }));
    worker.current.postMessage({
      id,
      birth: { latitude: birth.latitude, longitude: birth.longitude },
      from: fromDate,
      to: toDate,
      stepSeconds: step,
      events: events.map((e) => ({ kind: e.kind, date: toUtcDate(e.date, e.time || '12:00', birth.utcOffset) })),
      options: { houseSystem, arc, transits },
    });
  };

  const results = state.results;
  const best = useMemo(() => (results ? peaks(results, TOP) : []), [results]);
  const recorded = toUtcDate(birth.date, birth.time, birth.utcOffset).getTime();
  const clock = (date) => momentAt(birth, date.getTime()).time;
  const offsetLabel = (date) => {
    const min = Math.round((date - recorded) / 60000);
    return min === 0 ? t('rect.asRecorded') : t('rect.offset', { n: `${min > 0 ? '+' : '−'}${Math.abs(min)}` });
  };
  const pointName = (id, prefix) => (id.startsWith('cusp') ? t('rect.cusp', { n: ROMAN[Number(id.slice(4)) - 1] }) : `${prefix}${t(`object.${id}`)}`);
  const candidate = best[chosen];

  return (
    <section className="space-y-4 border-t border-slate-100 pt-5">
      <div>
        <h3 className="font-display text-xl font-semibold">{t('rect.title')}</h3>
        <p className="mt-1 text-sm text-slate-600">{t('rect.lead')}</p>
        {events.length < 3 && <p className="mt-1 text-sm text-amber-700">{t('rect.fewEvents')}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:items-end">
        <label className="field">
          <span>{t('rect.from')}</span>
          <input type="time" className="input" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} />
        </label>
        <label className="field">
          <span>{t('rect.to')}</span>
          <input type="time" className="input" value={to} onChange={(e) => e.target.value && setTo(e.target.value)} />
        </label>
        <label className="field">
          <span>{t('rect.step')}</span>
          <select className="input" value={step} onChange={(e) => setStep(Number(e.target.value))}>
            {STEPS.map((s) => (
              <option key={s} value={s}>{t('dynamics.preset.minute', { n: s / 60 })}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('rect.arc')}</span>
          <select className="input" value={arc} onChange={(e) => setArc(e.target.value)}>
            {Object.keys(DIRECTION_ARCS).map((a) => (
              <option key={a} value={a}>{t(`directions.arc.${a}`)}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-primary col-span-2 sm:col-span-1" onClick={run} disabled={state.status === 'running' || events.length === 0}>
          {state.status === 'running' ? t('rect.running') : t('rect.run')}
        </button>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" className="h-4 w-4 accent-slate-900" checked={transits} onChange={(e) => setTransits(e.target.checked)} />
        {t('rect.transits')}
      </label>
      {state.status === 'error' && <p className="text-sm text-red-600">{t('rect.error')}</p>}

      {results && (
        <>
          <figure>
            <svg viewBox={`0 0 ${results.length} 100`} preserveAspectRatio="none" className="h-24 w-full rounded-lg bg-slate-50" role="img" aria-label={t('rect.chart')}>
              {results.map((r, i) => (
                <rect
                  key={i}
                  x={i + 0.1}
                  width={0.8}
                  y={100 - r.percent}
                  height={r.percent}
                  className={candidate && r.date.getTime() === candidate.date.getTime() ? 'fill-slate-900' : 'fill-slate-300'}
                />
              ))}
              {recorded >= results[0].date && recorded <= results[results.length - 1].date && (
                <line
                  x1={(recorded - results[0].date) / (step * 1000) + 0.5}
                  x2={(recorded - results[0].date) / (step * 1000) + 0.5}
                  y1={0}
                  y2={100}
                  className="stroke-amber-500"
                  strokeWidth={Math.max(0.3, results.length / 300)}
                  strokeDasharray="4 3"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>
            <figcaption className="mt-1 flex justify-between text-[11px] tabular-nums text-slate-500">
              <span>{clock(results[0].date)}</span>
              <span className="text-amber-600">┆ {t('rect.recorded')} {birth.time}</span>
              <span>{clock(results[results.length - 1].date)}</span>
            </figcaption>
          </figure>

          {best.length === 0 ? (
            <p className="text-sm text-slate-500">{t('rect.nothing')}</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {best.map((c, i) => (
                  <button
                    key={c.date.getTime()}
                    type="button"
                    aria-pressed={chosen === i}
                    onClick={() => setChosen(i)}
                    className={`rounded-xl border px-3 py-2 text-left transition ${chosen === i ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="font-display text-lg font-semibold tabular-nums">{clock(c.date)}</div>
                    <div className={`text-[11px] ${chosen === i ? 'text-slate-300' : 'text-slate-500'}`}>
                      {Math.round(c.percent)}% · {offsetLabel(c.date)}
                    </div>
                  </button>
                ))}
              </div>

              {candidate && (
                <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-display text-xl font-semibold tabular-nums">{clock(candidate.date)}</span>
                      <span className="ml-2 text-sm text-slate-500">{offsetLabel(candidate.date)}</span>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{t('rect.accuracy', { n: Math.round(candidate.percent) })}</span>
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {events.map((e, index) => {
                      const own = candidate.matches.filter((m) => m.event === index).sort((a, b) => b.points - a.points || a.orb - b.orb);
                      const top = own[0];
                      return (
                        <li key={e.id} className="flex flex-wrap gap-x-2">
                          <span className="font-medium">
                            {t(`lifeEvents.kind.${e.kind}`)} ({formatShortDate(e.date, lang)}):
                          </span>
                          {top ? (
                            <span className="text-slate-700">
                              {pointName(top.mover, t(`wheel.${top.method}Prefix`))} <span className="astro">{ASPECT_GLYPH[top.aspect]}</span>{' '}
                              {pointName(top.target, t('wheel.natalPrefix'))}{' '}
                              <span className="tabular-nums text-slate-500">{formatOrb(top.orb)}</span>
                              {own.length > 1 && <span className="text-slate-400"> {t('rect.more', { n: own.length - 1 })}</span>}
                            </span>
                          ) : (
                            <span className="text-slate-400">{t('rect.noContact')}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className="btn-primary" onClick={() => onApply(candidate.date.getTime())}>
                      {t('rect.apply', { time: clock(candidate.date) })}
                    </button>
                    <span className="text-xs text-slate-500">{t('rect.applyHint')}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
