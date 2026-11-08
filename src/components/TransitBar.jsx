import { useState } from 'react';
import { Modal } from './Modal';
import { CitySearch, OffsetSelect } from './BirthForm';
import { offsetForZone, toUtcDate, momentAt, formatOffset, STEP_PRESETS } from '../utils/ephemeris';
import { detectCurrentPlace, placeFromSearch, withoutPlace } from '../utils/location';
import { useI18n, placeName, formatShortDate } from '../i18n';

/**
 * A button's hint above it, shown at once on hover and on keyboard focus (a native title waits
 * about a second).
 */
function Tip({ label, align = 'center', children }) {
  // The outermost buttons of a bar anchor their hint to the outer side, so it stays on a phone's screen.
  const place = { left: 'left-0', right: 'right-0', center: 'left-1/2 -translate-x-1/2' }[align];
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-30 mb-1.5 hidden whitespace-nowrap ${place} rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-lg group-hover/tip:block group-focus-within/tip:block`}
      >
        {label}
      </span>
    </span>
  );
}

/** Picks the transit place; `onSelect(null)` means "follow the birth place". */
function TransitPlaceModal({ open, onClose, onSelect }) {
  const { lang, t } = useI18n();
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const choose = (place) => {
    onSelect(place);
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={t('transit.placeTitle')} width="max-w-lg">
      <div className="space-y-4">
        <CitySearch onSelect={(r) => choose(placeFromSearch(r))} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => choose(null)}>
            {t('transit.placeBirth')}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={status === 'loading'}
            onClick={async () => {
              setStatus('loading');
              try {
                const found = await detectCurrentPlace(lang);
                setStatus('idle');
                choose({ ...found, placeKey: null });
              } catch {
                setStatus('error');
              }
            }}
          >
            {status === 'loading' ? '…' : t('transit.placeCurrent')}
          </button>
        </div>
        {status === 'error' && <p className="text-xs text-red-600">{t('transit.placeCurrentError')}</p>}
      </div>
    </Modal>
  );
}

/**
 * ‹ [return date] › for solar and lunar returns: `dates` are the returns around the one shown
 * (`current` is its index); picking one or stepping calls `onPick` with that return's date.
 * Dates are read on the clock of `moment`'s place, as in the chart's title.
 */
export function ReturnPicker({ kind, dates, current, moment, onPick }) {
  const { lang, t } = useI18n();
  const label = (d) => formatShortDate(momentAt(moment, d.getTime()).date, lang);
  return (
    <div className="mb-0.5 flex gap-1">
      <Tip label={t(`returns.prev.${kind}`)}>
        <button
          type="button"
          className="input-sm px-3 hover:border-slate-300"
          onClick={() => onPick(dates[current - 1])}
          aria-label={t(`returns.prev.${kind}`)}
        >
          ‹
        </button>
      </Tip>
      <select className="input-sm" aria-label={t(`mode.${kind}`)} value={current} onChange={(e) => onPick(dates[Number(e.target.value)])}>
        {dates.map((d, i) => (
          <option key={d.getTime()} value={i}>
            {label(d)}
          </option>
        ))}
      </select>
      <Tip label={t(`returns.next.${kind}`)}>
        <button
          type="button"
          className="input-sm px-3 hover:border-slate-300"
          onClick={() => onPick(dates[current + 1])}
          aria-label={t(`returns.next.${kind}`)}
        >
          ›
        </button>
      </Tip>
    </div>
  );
}

/**
 * Date, time, zone and place of the forecast moment. `onChange` gets date/time/zone edits,
 * `onPlaceChange` a moment with a newly chosen place. Progressions and directions come from the
 * birth chart, so they have no place; returns use it as the return place. `children` are the
 * method's own controls.
 */
export function TransitBar({ method = 'transit', moment, onChange, onPlaceChange, onNow, children }) {
  const { t } = useI18n();
  const [placeOpen, setPlaceOpen] = useState(false);
  // Changing the date or time re-derives the offset from the place's time zone (DST included).
  const set = (patch) => {
    const next = { ...moment, ...patch };
    if (next.timeZone && !('utcOffset' in patch) && next.date) {
      next.utcOffset = offsetForZone(next.timeZone, next.date, next.time);
    }
    onChange(next);
  };
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
      <label className="field">
        <span>{t(`${method}.date`)}</span>
        <input type="date" className="input-sm" value={moment.date} onChange={(e) => set({ date: e.target.value })} />
      </label>
      <label className="field">
        <span>{t('field.time')}</span>
        <input type="time" className="input-sm" value={moment.time} onChange={(e) => set({ time: e.target.value })} />
      </label>
      <label className="field">
        <span>{t('transit.zone')}</span>
        <OffsetSelect className="input-sm" value={moment.utcOffset} onChange={(utcOffset) => set({ utcOffset })} />
      </label>
      {method !== 'progressions' && method !== 'directions' && (
        <div className="field min-w-0">
          <span>{t('transit.place')}</span>
          <button
            type="button"
            className="input-sm max-w-[14rem] truncate text-left hover:border-slate-300"
            onClick={() => setPlaceOpen(true)}
            title={t('transit.placeTitle')}
          >
            <span aria-hidden>⌖</span> {placeName(moment, t)}
          </button>
        </div>
      )}
      {children}
      <button type="button" className="btn-ghost mb-1" onClick={onNow}>
        {t('transit.now')}
      </button>
      <TransitPlaceModal
        open={placeOpen}
        onClose={() => setPlaceOpen(false)}
        // Same instant, shown on the new place's clock: the planets stay put, the angles move.
        onSelect={(place) =>
          onPlaceChange(
            place
              ? momentAt({ ...moment, ...place }, toUtcDate(moment.date, moment.time, moment.utcOffset).getTime())
              : withoutPlace(moment)
          )
        }
      />
    </div>
  );
}

/**
 * The bar over a forecast wheel: steps back and forward by the chosen interval (« ‹ [1 day] › »)
 * and "Now". `children` replace the steps where a chart moves its own way (‹ return ›).
 */
export function StepBar({ dynamics, onDynamicsChange, onStep, onNow, children }) {
  const { t } = useI18n();
  const { step, unit } = dynamics;
  const amount = (count) => t(`dynamics.preset.${unit}`, { n: Math.abs(count) * step });
  const known = STEP_PRESETS.some((p) => p.step === step && p.unit === unit);
  const options = known ? STEP_PRESETS : [...STEP_PRESETS, { step, unit }];
  const arrow = (count, sign) => {
    const label = t(count < 0 ? 'dynamics.back' : 'dynamics.forward', { amount: amount(count) });
    return (
      <Tip label={label} align={count === -10 ? 'left' : count === 10 ? 'right' : 'center'}>
        <button type="button" className="input-sm min-w-9 px-2.5 hover:border-slate-300" onClick={() => onStep(count)} aria-label={label}>
          {sign}
        </button>
      </Tip>
    );
  };
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2">
      {children || (
        <>
          {arrow(-10, '«')}
          {arrow(-1, '‹')}
          <select
            className="input-sm"
            aria-label={t('dynamics.step')}
            value={`${step}|${unit}`}
            onChange={(e) => {
              const [s, u] = e.target.value.split('|');
              onDynamicsChange({ step: Number(s), unit: u });
            }}
          >
            {options.map((p) => (
              <option key={`${p.step}|${p.unit}`} value={`${p.step}|${p.unit}`}>
                {t(`dynamics.preset.${p.unit}`, { n: p.step })}
              </option>
            ))}
          </select>
          {arrow(1, '›')}
          {arrow(10, '»')}
        </>
      )}
      {onNow && (
        <button type="button" className="btn-ghost" onClick={onNow}>
          {t('transit.now')}
        </button>
      )}
    </div>
  );
}

/**
 * A line under the chart's title with the forecast's date, time, zone and place; a click opens
 * them for editing in a window. `children` are the method's own settings (the arc of directions…).
 */
export function MomentButton({ method = 'transit', moment, onChange, onPlaceChange, onNow, children }) {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const withPlace = method !== 'progressions' && method !== 'directions';
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-slate-100 px-2.5 py-1 text-left text-xs tabular-nums text-slate-700 transition hover:bg-slate-200"
        title={t('moment.edit')}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
        <span className="truncate">
          {t(`${method}.date`)}: {formatShortDate(moment.date, lang)}, {moment.time} · {formatOffset(moment.utcOffset)}
          {withPlace && ` · ${placeName(moment, t)}`}
        </span>
        <span aria-hidden className="text-slate-400">✎</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('moment.title')} width="max-w-xl">
        <TransitBar method={method} moment={moment} onChange={onChange} onPlaceChange={onPlaceChange} onNow={onNow}>
          {children}
        </TransitBar>
      </Modal>
    </>
  );
}
