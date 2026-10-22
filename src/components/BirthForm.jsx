import { useState } from 'react';
import { Modal } from './Modal';
import { offsetForZone, formatOffset } from '../utils/ephemeris';
import { useI18n, placeName } from '../i18n';

const OFFSETS = [
  ...Array.from({ length: 53 }, (_, i) => -12 + i * 0.5),
  5.75, 8.75, 12.75, 13.75,
].sort((a, b) => a - b);

export function OffsetSelect({ value, onChange, id, className = "input" }) {
  return (
    <select id={id} className={className} value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {OFFSETS.map((o) => (
        <option key={o} value={o}>
          {formatOffset(o)}
        </option>
      ))}
    </select>
  );
}

async function geocode(query, lang) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=${lang}&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.results ?? [];
}

export function CitySearch({ onSelect }) {
  const { lang, t } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | empty | error

  const search = async () => {
    if (!query.trim()) return;
    setStatus('loading');
    try {
      const found = await geocode(query.trim(), lang);
      setResults(found);
      setStatus(found.length ? 'idle' : 'empty');
    } catch {
      setResults([]);
      setStatus('error');
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder={t('city.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              search();
            }
          }}
        />
        <button type="button" className="btn-secondary" onClick={search} disabled={status === 'loading'}>
          {status === 'loading' ? '…' : t('city.search')}
        </button>
      </div>
      {status === 'empty' && <p className="mt-1 text-xs text-slate-500">{t('city.empty')}</p>}
      {status === 'error' && <p className="mt-1 text-xs text-red-600">{t('city.error')}</p>}
      {results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                onClick={() => {
                  onSelect(r);
                  setResults([]);
                  setQuery(r.name);
                }}
              >
                {r.name}
                <span className="text-slate-500">
                  {[r.admin1, r.country].filter(Boolean).length ? `, ${[r.admin1, r.country].filter(Boolean).join(', ')}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function BirthModal({ open, onClose, birth, onSubmit }) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t('birth.title')} width="max-w-lg">
      {/* Remount on open so the draft starts from the applied data. */}
      {open && (
        <BirthForm
          birth={birth}
          onSubmit={(b) => {
            onSubmit(b);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

function BirthForm({ birth, onSubmit }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(birth);
  // Re-derive the UTC offset from the city's time zone whenever the date, time or city
  // changes, so historical DST rules for that date are applied.
  const set = (patch) =>
    setDraft((d) => {
      const next = { ...d, ...patch };
      if (next.timeZone && !('utcOffset' in patch) && next.date) {
        next.utcOffset = offsetForZone(next.timeZone, next.date, next.time);
      }
      return next;
    });

  const valid = draft.date && draft.time && draft.place;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(draft);
      }}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="field">
          <span>{t('field.date')}</span>
          <input type="date" className="input" value={draft.date} onChange={(e) => set({ date: e.target.value })} required />
        </label>
        <label className="field">
          <span>{t('field.time')}</span>
          <input type="time" className="input" value={draft.time} onChange={(e) => set({ time: e.target.value })} required />
        </label>
        <label className="field col-span-2 sm:col-span-1">
          <span>{t('field.timezone')}</span>
          <OffsetSelect value={draft.utcOffset} onChange={(utcOffset) => set({ utcOffset })} />
        </label>
      </div>

      <div className="field">
        <span>{t('field.place')}</span>
        <CitySearch
          onSelect={(r) =>
            set({
              place: [r.name, r.country].filter(Boolean).join(', '),
              latitude: r.latitude,
              longitude: r.longitude,
              timeZone: r.timezone,
              placeKey: null,
            })
          }
        />
        {draft.place && (
          <span className="normal-case tracking-normal text-slate-500">
            {placeName(draft, t)}
            {draft.timeZone && ` · ${draft.timeZone}`}
          </span>
        )}
      </div>

      <button type="submit" className="btn-primary w-full" disabled={!valid}>
        {t('birth.submit')}
      </button>
    </form>
  );
}
