import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ASPECTS, DIRECTION_ARCS, ROMAN, formatOrb, momentAtOffset, shiftMoment, toUtcDate } from '../utils/ephemeris';
import { useI18n, formatShortDate } from '../i18n';

const STEPS = [60, 120, 300];
const TOP = 5;
// Candidates closer than this (minutes) belong to the same peak of the histogram.
const PEAK_GAP = 6;
const ASPECT_GLYPH = Object.fromEntries(ASPECTS.map((a) => [a.id, a.glyph]));
// "Both arcs": the symbolic directions and the solar arc, a time strong in both being the
// better answer; any single arc can be chosen too.
const ARC_CHOICES = { both: ['symbolic', 'solar'], ...Object.fromEntries(Object.keys(DIRECTION_ARCS).map((a) => [a, [a]])) };
const FULL = 99.9;

/**
 * Every time in the window with its runs for each arc: `percent` is their mean, `orbs` the sum of
 * their closest orbs, `confirmed` true when each arc explains every event in full.
 */
function combine(byArc, arcs) {
  return byArc[arcs[0]].map((first, i) => {
    const parts = arcs.map((a) => byArc[a][i]);
    return {
      date: first.date,
      parts,
      percent: parts.reduce((s, p) => s + p.percent, 0) / parts.length,
      orbs: parts.reduce((s, p) => s + p.orbs, 0),
      confirmed: parts.every((p) => p.percent >= FULL),
    };
  });
}

const byCombined = (a, b) => b.percent - a.percent || b.confirmed - a.confirmed || a.orbs - b.orbs;

/** The best times from different peaks: a neighbour of a better time one step away is the same answer. */
function peaks(results, count) {
  const picked = [];
  for (const r of [...results].sort(byCombined)) {
    if (r.percent === 0 || picked.length === count) break;
    if (picked.every((p) => Math.abs(p.date - r.date) >= PEAK_GAP * 60000)) picked.push(r);
  }
  return picked;
}

/** An event's contacts in one run, best first. */
const contactsOf = (run, event) => run.matches.filter((m) => m.event === event).sort((a, b) => b.points - a.points || a.orb - b.orb);

/**
 * Rectification of the birth time by the client's events: the window and step to try, the
 * direction arc (or both the symbolic and the solar arc, to compare) and an optional transit
 * check; runs in a worker. Shows the score of every time as a histogram per arc, the best times
 * from different peaks, every contact that explains each event, and the candidates side by side.
 * `onShow({ ms, arc, event, contact })` shows a contact on the wheel: that birth time, that arc, at
 * the event's date.
 */
export function RectificationPanel({ birth, events, houseSystem, onShow }) {
  const { lang, t } = useI18n();
  // An hour either side of the recorded time, on the offset it was entered with.
  const start = shiftMoment({ ...birth, timeZone: null }, -60, 'minute');
  const end = shiftMoment({ ...birth, timeZone: null }, 60, 'minute');
  const [from, setFrom] = useState(start.time);
  const [to, setTo] = useState(end.time);
  const [step, setStep] = useState(60);
  const [arcChoice, setArcChoice] = useState('both');
  const [transits, setTransits] = useState(false);
  // Off at first: with event dates known only roughly, the extra significators add chance matches.
  const [personal, setPersonal] = useState(false);
  const [state, setState] = useState({ status: 'idle', byArc: null, arcs: null });
  const [chosen, setChosen] = useState(0);
  // Events whose every contact is shown, as `${event}:${arc}`.
  const [open, setOpen] = useState(() => new Set());
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
    const arcs = ARC_CHOICES[arcChoice];
    worker.current.onmessage = ({ data }) => {
      if (data.id !== runId.current) return;
      setChosen(0);
      setOpen(new Set());
      setState({ status: 'done', byArc: data.byArc, arcs });
    };
    worker.current.onerror = () => setState({ status: 'error', byArc: null, arcs: null });
    setState((s) => ({ ...s, status: 'running' }));
    worker.current.postMessage({
      id,
      birth: { latitude: birth.latitude, longitude: birth.longitude },
      from: fromDate,
      to: toDate,
      stepSeconds: step,
      events: events.map((e) => ({ kind: e.kind, date: toUtcDate(e.date, e.time || '12:00', birth.utcOffset) })),
      options: { houseSystem, transits, personal },
      arcs,
    });
  };

  const { byArc, arcs } = state;
  const results = useMemo(() => (byArc ? combine(byArc, arcs) : null), [byArc, arcs]);
  const best = useMemo(() => (results ? peaks(results, TOP) : []), [results]);
  const recorded = toUtcDate(birth.date, birth.time, birth.utcOffset).getTime();
  // On the birth's own offset, the one the window was entered in.
  const clock = (date) => momentAtOffset(birth, date.getTime()).time;
  const offsetLabel = (date) => {
    const min = Math.round((date - recorded) / 60000);
    return min === 0 ? t('rect.asRecorded') : t('rect.offset', { n: `${min > 0 ? '+' : '−'}${Math.abs(min)}` });
  };
  const pointName = (id, prefix) => (id.startsWith('cusp') ? t('rect.cusp', { n: ROMAN[Number(id.slice(4)) - 1] }) : `${prefix}${t(`object.${id}`)}`);
  const contactText = (m) => (
    <>
      {pointName(m.mover, t(`wheel.${m.method}Prefix`))} <span className="astro">{ASPECT_GLYPH[m.aspect]}</span> {pointName(m.target, t('wheel.natalPrefix'))}{' '}
      <span className="tabular-nums text-slate-500">{formatOrb(m.orb)}</span>
    </>
  );
  // "on the wheel": the contact of candidate `c` under `arc` for event number `index`.
  const showButton = (c, arc, index, m) => (
    <button
      type="button"
      title={t('rect.showHint')}
      onClick={() => onShow({ ms: c.date.getTime(), arc, event: events[index], contact: { method: m.method, mover: m.mover, target: m.target } })}
      className="ml-1.5 rounded-md border border-slate-200 px-1.5 py-px text-[11px] font-normal text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
    >
      ◎ {t('rect.show')}
    </button>
  );
  const scores = (r) => r.parts.map((p) => `${Math.round(p.percent)}%`).join(' / ');
  const toggle = (key) =>
    setOpen((set) => {
      const next = new Set(set);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  const candidate = best[chosen];
  const several = arcs && arcs.length > 1;
  const recordedAt = results && (recorded - results[0].date) / (step * 1000) + 0.5;

  return (
    <section className="space-y-4 border-t border-slate-100 pt-5">
      <div>
        <h3 className="font-display text-xl font-semibold">{t('rect.title')}</h3>
        <p className="mt-1 text-sm text-slate-600">{t('rect.lead')}</p>
        <p className="mt-1 text-xs text-slate-500">{t('rect.hardNote')}</p>
        {events.length < 3 && <p className="mt-1 text-sm text-amber-700">{t('rect.fewEvents')}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-5 @2xl:items-end">
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
          <select className="input" value={arcChoice} onChange={(e) => setArcChoice(e.target.value)}>
            <option value="both">{t('rect.arcBoth')}</option>
            {Object.keys(DIRECTION_ARCS).map((a) => (
              <option key={a} value={a}>{t(`directions.arc.${a}`)}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-primary col-span-2 @2xl:col-span-1" onClick={run} disabled={state.status === 'running' || events.length === 0}>
          {state.status === 'running' ? t('rect.running') : t('rect.run')}
        </button>
      </div>
      <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-600">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-slate-900" checked={personal} onChange={(e) => setPersonal(e.target.checked)} />
        <span>
          {t('rect.personal')}
          <span className="block text-xs text-slate-500">{t('rect.personalHint')}</span>
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" className="h-4 w-4 accent-slate-900" checked={transits} onChange={(e) => setTransits(e.target.checked)} />
        {t('rect.transits')}
      </label>
      {state.status === 'error' && <p className="text-sm text-red-600">{t('rect.error')}</p>}

      {results && (
        <>
          {/* One strip per arc; a time full in every arc is green, the chosen one dark. */}
          <figure className="space-y-1">
            {arcs.map((arc) => (
              <div key={arc} className="flex items-center gap-2">
                {several && <span className="w-20 shrink-0 text-right text-[11px] text-slate-500">{t(`rect.arcShort.${arc}`)}</span>}
                <svg viewBox={`0 0 ${results.length} 100`} preserveAspectRatio="none" className={`${several ? 'h-16' : 'h-24'} w-full rounded-lg bg-slate-50`} role="img" aria-label={`${t('rect.chart')} · ${t(`rect.arcShort.${arc}`)}`}>
                  {byArc[arc].map((r, i) => (
                    <rect
                      key={i}
                      x={i + 0.1}
                      width={0.8}
                      y={100 - r.percent}
                      height={r.percent}
                      className={candidate && r.date.getTime() === candidate.date.getTime() ? 'fill-slate-900' : several && results[i].confirmed ? 'fill-emerald-500' : 'fill-slate-300'}
                    />
                  ))}
                  {recordedAt >= 0 && recordedAt <= results.length && (
                    <line x1={recordedAt} x2={recordedAt} y1={0} y2={100} className="stroke-amber-500" strokeWidth={1.5} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
                  )}
                </svg>
              </div>
            ))}
            <figcaption className={`flex justify-between text-[11px] tabular-nums text-slate-500 ${several ? 'pl-22' : ''}`}>
              <span>{clock(results[0].date)}</span>
              <span className="text-amber-600">┆ {t('rect.recorded')} {birth.time}</span>
              <span>{clock(results[results.length - 1].date)}</span>
            </figcaption>
            {several && <p className="text-xs text-slate-500">{t('rect.confirmedLegend')}</p>}
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
                    onClick={() => {
                      setChosen(i);
                      setOpen(new Set());
                    }}
                    className={`rounded-xl border px-3 py-2 text-left transition ${chosen === i ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-display text-lg font-semibold tabular-nums">{clock(c.date)}</span>
                      {several && c.confirmed && (
                        <span title={t('rect.confirmed')} className={`rounded-full px-1.5 text-[10px] font-semibold ${chosen === i ? 'bg-emerald-400 text-slate-900' : 'bg-emerald-100 text-emerald-800'}`}>
                          ✓ {t('rect.confirmed')}
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] tabular-nums ${chosen === i ? 'text-slate-300' : 'text-slate-500'}`}>
                      {scores(c)} · {offsetLabel(c.date)}
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
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold tabular-nums">
                      {t('rect.accuracyAll', { n: scores(candidate) })}
                    </span>
                  </div>
                  <div className={`grid gap-x-6 gap-y-3 text-sm ${several ? '@2xl:grid-cols-[minmax(0,12rem)_1fr_1fr]' : '@2xl:grid-cols-[minmax(0,12rem)_1fr]'}`}>
                    {several && (
                      <>
                        <span className="hidden @2xl:block" />
                        {arcs.map((arc) => (
                          <span key={arc} className="hidden text-[11px] font-medium uppercase tracking-wider text-slate-400 @2xl:block">
                            {t(`directions.arc.${arc}`)}
                          </span>
                        ))}
                      </>
                    )}
                    {events.map((e, index) => (
                      <Fragment key={e.id}>
                        <span className="font-medium">
                          {t(`lifeEvents.kind.${e.kind}`)} <span className="font-normal text-slate-500">({formatShortDate(e.date, lang)})</span>
                        </span>
                        {arcs.map((arc, a) => {
                          const own = contactsOf(candidate.parts[a], index);
                          const key = `${index}:${arc}`;
                          const shown = open.has(key) ? own : own.slice(0, 1);
                          return (
                            <div key={arc} className="text-slate-700">
                              {several && <span className="text-[11px] text-slate-400 @2xl:hidden">{t(`rect.arcShort.${arc}`)}: </span>}
                              {own.length === 0 ? (
                                <span className="text-slate-400">{t('rect.noContact')}</span>
                              ) : (
                                <ul className="space-y-0.5">
                                  {shown.map((m, i) => (
                                    <li key={i} className={i ? 'text-slate-500' : ''}>
                                      {contactText(m)}
                                      {showButton(candidate, arc, index, m)}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {own.length > 1 && (
                                <button type="button" className="text-xs text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-900" onClick={() => toggle(key)}>
                                  {open.has(key) ? t('rect.less') : t('rect.more', { n: own.length - 1 })}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">{t('rect.showNote')}</p>
                </div>
              )}

              {/* The candidates side by side: which time explains each event, and how closely. */}
              {best.length > 1 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{t('rect.compare')}</h4>
                  <div className="-mx-1 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left">
                          <th className="px-2 py-1.5" />
                          {best.map((c, i) => (
                            <th key={c.date.getTime()} className="px-2 py-1.5 align-bottom">
                              <button type="button" onClick={() => setChosen(i)} className={`text-left ${chosen === i ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>
                                <span className="font-display text-base font-semibold tabular-nums">{clock(c.date)}</span>
                                {several && c.confirmed && <span className="ml-1 text-emerald-600">✓</span>}
                                <span className="block text-[11px] font-normal tabular-nums">{scores(c)}</span>
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {events.map((e, index) => (
                          <tr key={e.id} className="border-t border-slate-100 align-top">
                            <td className="whitespace-nowrap px-2 py-1.5 font-medium">{t(`lifeEvents.kind.${e.kind}`)}</td>
                            {best.map((c, i) => (
                              <td key={c.date.getTime()} className={`px-2 py-1.5 ${chosen === i ? 'bg-slate-50' : ''}`}>
                                {arcs.map((arc, a) => {
                                  const top = contactsOf(c.parts[a], index)[0];
                                  return (
                                    <div key={arc} className={`whitespace-nowrap text-xs ${top && top.orb <= 0.25 ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                                      {several && <span className="font-normal text-slate-400">{t(`rect.arcTag.${arc}`)} </span>}
                                      {top ? (
                                        <>
                                          {contactText(top)}
                                          {showButton(c, arc, index, top)}
                                        </>
                                      ) : (
                                        <span className="text-slate-400">—</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-500">{t('rect.compareHint')}</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
