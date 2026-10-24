import { useState } from 'react';
import { Modal } from './Modal';
import { offsetForZone, formatOffset } from '../utils/ephemeris';
import { placeFromSearch, withoutClient } from '../utils/location';
import { useI18n, placeName, formatShortDate } from '../i18n';

const OFFSETS = [
  ...Array.from({ length: 53 }, (_, i) => -12 + i * 0.5),
  5.75, 8.75, 12.75, 13.75,
].sort((a, b) => a - b);

export function OffsetSelect({ value, onChange, id, className = "input" }) {
  // Historical local mean time (e.g. Kyiv +2:02 before 1924) matches no standard offset:
  // list it too, so the select shows it instead of falling back to the first option.
  const options = OFFSETS.includes(value) ? OFFSETS : [...OFFSETS, value].sort((a, b) => a - b);
  return (
    <select id={id} className={className} value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {options.map((o) => (
        <option key={o} value={o}>
          {formatOffset(o)}
        </option>
      ))}
    </select>
  );
}

async function geocodeIn(query, lang) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=${lang}&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.results ?? [];
}

/**
 * Language(s) of a city query, judged by its letters: Open-Meteo matches names only in the
 * requested language ("Горішні Плавні" is found with language=uk, not ru or en).
 * Cyrillic without Ukrainian- or Russian-only letters ("Полтава") could be either.
 */
function queryLanguages(query) {
  if (/[іїєґ]/i.test(query)) return ['uk'];
  if (/[ыэъё]/i.test(query)) return ['ru'];
  if (/[а-я]/i.test(query)) return ['uk', 'ru'];
  return ['en'];
}

/** Places matching the query in the language(s) it is typed in; the most populous first. */
async function geocode(query) {
  const settled = await Promise.allSettled(queryLanguages(query).map((l) => geocodeIn(query, l)));
  if (settled.every((r) => r.status === 'rejected')) throw settled[0].reason;
  const byId = new Map();
  for (const r of settled) {
    if (r.status !== 'fulfilled') continue;
    for (const place of r.value) if (!byId.has(place.id)) byId.set(place.id, place);
  }
  return [...byId.values()].sort((a, b) => (b.population ?? 0) - (a.population ?? 0)).slice(0, 8);
}

export function CitySearch({ onSelect }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | empty | error

  const search = async () => {
    if (!query.trim()) return;
    setStatus('loading');
    try {
      const found = await geocode(query.trim());
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

/** Search box over the signed-in user's saved clients; picking one fills the form. */
function ClientPicker({ clients, onPick }) {
  const { lang, t } = useI18n();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const q = query.trim().toLowerCase();
  const found = clients.filter((c) => !q || c.name.toLowerCase().includes(q)).slice(0, 8);

  return (
    <div className="relative">
      <input
        className="input w-full"
        placeholder={t('client.search')}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
      />
      {open && (
        // preventDefault on mousedown keeps the input focused, so the click lands on the item.
        <ul
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          {found.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">{t(clients.length ? 'client.nothing' : 'charts.empty')}</li>}
          {found.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                onClick={() => {
                  onPick(c);
                  setQuery('');
                  setOpen(false);
                }}
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-slate-500">
                  {' · '}
                  {formatShortDate(c.data.birth.date, lang)} · {c.data.birth.time} · {placeName(c.data.birth, t)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Birth data form. With an account (`clients` not null) it can load a saved client and save
 * the entered data as a client (`onSaveClient` resolves to the birth data with its clientId).
 */
export function BirthModal({ open, onClose, birth, onSubmit, clients, onSaveClient }) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t('birth.title')} width="max-w-lg">
      {/* Remount on open so the draft starts from the applied data. */}
      {open && (
        <BirthForm
          birth={birth}
          clients={clients}
          onSaveClient={onSaveClient}
          onSubmit={(b) => {
            onSubmit(b);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

function BirthForm({ birth, clients, onSaveClient, onSubmit }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(birth);
  // Saving is opt-in: the name field and the save button show only when asked for
  // (or when a saved client is open, so it can be updated).
  const [saveOpen, setSaveOpen] = useState(Boolean(birth.clientId));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
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

  const saveAndSubmit = async () => {
    if (!draft.name?.trim()) {
      setSaveError('client.nameRequired');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      onSubmit(await onSaveClient({ ...draft, name: draft.name.trim() }));
    } catch {
      setSaveError('auth.error.generic');
      setSaving(false);
    }
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(draft);
      }}
    >
      {clients?.length > 0 && (
        <ClientPicker
          clients={clients}
          onPick={(c) => {
            setDraft({ ...c.data.birth, clientId: c.id, name: c.name });
            setSaveOpen(true);
          }}
        />
      )}

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
        <CitySearch onSelect={(r) => set(placeFromSearch(r))} />
        {draft.place && (
          <span className="normal-case tracking-normal text-slate-500">
            {placeName(draft, t)}
            {draft.timeZone && ` · ${draft.timeZone}`}
          </span>
        )}
        {draft.place && !draft.timeZone && (
          <span className="normal-case tracking-normal text-amber-700">{t('city.noZone')}</span>
        )}
      </div>

      <button type="submit" className="btn-primary w-full" disabled={!valid || saving}>
        {t('birth.submit')}
      </button>

      {clients && !saveOpen && (
        <button type="button" className="w-full text-sm text-slate-600 underline hover:text-slate-900" onClick={() => setSaveOpen(true)}>
          {t('client.saveOpen')}
        </button>
      )}
      {clients && saveOpen && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="field">
            <span className="flex items-center justify-between">
              {t('client.name')}
              {draft.clientId && (
                <button
                  type="button"
                  className="normal-case tracking-normal text-slate-500 underline hover:text-slate-800"
                  onClick={() => setDraft(withoutClient)}
                >
                  {t('client.new')}
                </button>
              )}
            </span>
            <input
              className="input"
              placeholder={t('client.namePlaceholder')}
              value={draft.name ?? ''}
              onChange={(e) => {
                setDraft((d) => ({ ...d, name: e.target.value }));
                setSaveError(null);
              }}
              maxLength={120}
            />
          </label>
          {saveError && <p className="text-sm text-red-600">{t(saveError)}</p>}
          <button type="button" className="btn-secondary w-full" disabled={!valid || saving} onClick={saveAndSubmit}>
            {saving ? '…' : t(draft.clientId ? 'client.update' : 'client.save')}
          </button>
        </div>
      )}
    </form>
  );
}
