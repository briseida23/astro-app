import { useState } from 'react';
import { Modal } from './Modal';
import { CitySearch, OffsetSelect } from './BirthForm';
import { offsetForZone, toUtcDate, momentAt } from '../utils/ephemeris';
import { detectCurrentPlace, placeFromSearch, withoutPlace } from '../utils/location';
import { useI18n, placeName } from '../i18n';

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
 * Date, time, zone and place of the forecast moment. `onChange` gets date/time/zone edits,
 * `onPlaceChange` a moment with a newly chosen place. Progressions are cast for the birth
 * place, so `method` "progressions" has no place; returns use it as the return place.
 */
export function TransitBar({ method = 'transit', moment, onChange, onPlaceChange, onNow }) {
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
      {method !== 'progressions' && (
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
