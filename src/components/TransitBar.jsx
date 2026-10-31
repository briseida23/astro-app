import { useState } from 'react';
import { Modal } from './Modal';
import { CitySearch, OffsetSelect } from './BirthForm';
import { offsetForZone, toUtcDate, momentAt } from '../utils/ephemeris';
import { detectCurrentPlace, placeFromSearch, withoutPlace } from '../utils/location';
import { useI18n, placeName, formatShortDate } from '../i18n';

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

/** A ‹ › pair for the date bar: one step back or forward (a step, or the previous/next return). */
export function BarSteps({ prevLabel, nextLabel, onPrev, onNext }) {
  return (
    <div className="mb-0.5 flex gap-1">
      <button type="button" className="input-sm px-3 hover:border-slate-300" onClick={onPrev} aria-label={prevLabel} title={prevLabel}>
        ‹
      </button>
      <button type="button" className="input-sm px-3 hover:border-slate-300" onClick={onNext} aria-label={nextLabel} title={nextLabel}>
        ›
      </button>
    </div>
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
      <button
        type="button"
        className="input-sm px-3 hover:border-slate-300"
        onClick={() => onPick(dates[current - 1])}
        aria-label={t(`returns.prev.${kind}`)}
        title={t(`returns.prev.${kind}`)}
      >
        ‹
      </button>
      <select className="input-sm" aria-label={t(`mode.${kind}`)} value={current} onChange={(e) => onPick(dates[Number(e.target.value)])}>
        {dates.map((d, i) => (
          <option key={d.getTime()} value={i}>
            {label(d)}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="input-sm px-3 hover:border-slate-300"
        onClick={() => onPick(dates[current + 1])}
        aria-label={t(`returns.next.${kind}`)}
        title={t(`returns.next.${kind}`)}
      >
        ›
      </button>
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
