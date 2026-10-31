import { useMemo, useState } from 'react';
import { ASPECTS, CONTACT_METHODS, PLANETS, ANGLES, EXTRA_OBJECTS, ROMAN, findContacts, momentAt, toUtcDate } from '../utils/ephemeris';
import { useI18n } from '../i18n';
import { Glyph } from './Glyph';
import { Hint } from './Hint';

// Search periods in months.
const SPANS = [1, 3, 6, 12, 24, 60, 120, 240];
// The transit Moon touches every point twice a month or more: longer lists would be unreadable.
const MOON_SPAN_MAX = 12;
// No more rows than this are listed.
const LIMIT = 300;

/**
 * Finds the moments when a transiting, progressed or directed object makes an exact aspect to a
 * natal point or enters a natal house. `onPick(method, ms)` opens the chart for a found moment.
 */
export function SearchPanel({ natal, points, moment, extras, options, defaultMethod, aspectColors, onPick }) {
  const { lang, t } = useI18n();
  const [method, setMethod] = useState(defaultMethod ?? 'transit');
  const [mover, setMover] = useState('saturn');
  const [aspect, setAspect] = useState('all');
  const [target, setTarget] = useState('all');
  const [from, setFrom] = useState(moment.date);
  const [span, setSpan] = useState(12);

  // Transits move planets only; progressions and directions move the angles too.
  const movers = useMemo(
    () => [
      ...PLANETS,
      ...EXTRA_OBJECTS.filter((o) => extras.has(o.id)),
      ...(method === 'transit' ? [] : ANGLES),
    ],
    [method, extras]
  );
  const moverId = movers.some((m) => m.id === mover) ? mover : 'sun';
  const moverDef = movers.find((m) => m.id === moverId);
  const moonTransit = method === 'transit' && moverId === 'moon';
  const months = moonTransit ? Math.min(span, MOON_SPAN_MAX) : span;

  const result = useMemo(() => {
    const start = toUtcDate(from, '00:00', moment.utcOffset);
    if (Number.isNaN(start.getTime())) return null;
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + months);
    const cusps = natal.houses.map((longitude, i) => ({ key: `cusp:${i + 1}`, longitude, cusp: i + 1 }));
    let targets = points;
    if (target === 'houses') targets = cusps;
    else if (target.startsWith('cusp:')) targets = cusps.filter((c) => c.key === target);
    else if (target !== 'all') targets = points.filter((p) => p.key === target);
    const aspects = aspect === 'all' ? ASPECTS : ASPECTS.filter((a) => a.id === aspect);
    const hits = findContacts(natal, method, moverId, targets, aspects, start, end, options);
    return { hits: hits.slice(0, LIMIT), more: hits.length > LIMIT };
  }, [natal, points, method, moverId, aspect, target, from, months, moment.utcOffset, options]);

  // Progressed and directed contacts are slow: a day is as precise as they get.
  const precise = method === 'transit';
  const formatHit = (date) => {
    const local = momentAt(moment, date.getTime());
    const [y, m, d] = local.date.split('-').map(Number);
    const day = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(y, m - 1, d));
    return precise ? `${day}, ${local.time}` : day;
  };
  const moverPoint = { ...moverDef, ring: method };
  // The nodes are almost always retrograde and converse directions always move back.
  const showRetro = method === 'transit' && moverId !== 'node' && moverId !== 'southNode';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="field">
          <span>{t('search.method')}</span>
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            {CONTACT_METHODS.map((m) => (
              <option key={m} value={m}>{t(`mode.${m}`)}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('search.mover')}</span>
          <select className="input" value={moverId} onChange={(e) => setMover(e.target.value)}>
            {movers.map((m) => (
              <option key={m.id} value={m.id}>{t(`object.${m.id}`)}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('search.aspect')}</span>
          <select className="input" value={aspect} onChange={(e) => setAspect(e.target.value)}>
            <option value="all">{t('search.allAspects')}</option>
            {ASPECTS.map((a) => (
              <option key={a.id} value={a.id}>{t(`aspect.${a.id}`)}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('search.target')}</span>
          <select className="input" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="all">{t('search.allPoints')}</option>
            <option value="houses">{t('search.allHouses')}</option>
            <optgroup label={t('search.points')}>
              {points.map((p) => (
                <option key={p.key} value={p.key}>{t(`object.${p.id}`)}</option>
              ))}
            </optgroup>
            <optgroup label={t('search.houses')}>
              {ROMAN.map((r, i) => (
                <option key={r} value={`cusp:${i + 1}`}>{t('ingress.house', { n: r })}</option>
              ))}
            </optgroup>
          </select>
        </label>
        <label className="field">
          <span>{t('search.from')}</span>
          <input type="date" className="input" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} />
        </label>
        <label className="field">
          <span>{t('search.span')}</span>
          <select className="input" value={months} onChange={(e) => setSpan(Number(e.target.value))}>
            {SPANS.filter((s) => !moonTransit || s <= MOON_SPAN_MAX).map((s) => (
              <option key={s} value={s}>{s < 12 ? t('dynamics.preset.month', { n: s }) : t('dynamics.preset.year', { n: s / 12 })}</option>
            ))}
          </select>
        </label>
      </div>

      {result && (
        <div>
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {t('search.found', { n: result.hits.length })}
          </h3>
          {result.hits.length === 0 ? (
            <p className="text-sm text-slate-500">{t('search.empty')}</p>
          ) : (
            <ul className="space-y-0.5 text-sm">
              {result.hits.map((h) => (
                <li key={`${h.date.getTime()}:${h.target.key}:${h.aspect.id}`}>
                  <button
                    type="button"
                    onClick={() => onPick(method, h.date.getTime())}
                    className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition hover:bg-slate-50"
                    title={t('search.open')}
                  >
                    <Hint label={`${t(`wheel.${method}Prefix`)}${t(`object.${moverId}`)}`}>
                      <Glyph of={moverPoint} className="inline-block w-6 text-center" symbolClass="astro text-base" />
                    </Hint>
                    <span className="inline-block w-3 text-[10px] font-semibold text-red-600">{showRetro && h.retrograde ? 'R' : ''}</span>
                    {h.target.cusp ? (
                      <>
                        <span className="text-slate-400">→</span>
                        <span className="font-display text-base">{t('ingress.house', { n: ROMAN[h.target.cusp - 1] })}</span>
                      </>
                    ) : (
                      <>
                        <Hint label={t(`aspect.${h.aspect.id}`)}>
                          <span className="astro w-6 text-center text-base" style={{ color: h.aspect.id === 'opposition' ? undefined : aspectColors[h.aspect.id] }}>
                            {h.aspect.glyph}
                          </span>
                        </Hint>
                        <Hint label={`${t('wheel.natalPrefix')}${t(`object.${h.target.id}`)}`}>
                          <Glyph of={h.target} className="inline-block w-6 text-center" symbolClass="astro text-base" />
                        </Hint>
                      </>
                    )}
                    <span className="ml-auto tabular-nums text-slate-500">{formatHit(h.date)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {result.more && <p className="mt-2 text-xs text-slate-500">{t('search.more', { n: LIMIT })}</p>}
        </div>
      )}
    </div>
  );
}
