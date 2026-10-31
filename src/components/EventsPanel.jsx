import { useState } from 'react';
import { useI18n, formatShortDate } from '../i18n';
import { EVENT_KINDS, MAX_EVENTS } from '../utils/clients';

const emptyDraft = () => ({ date: '', time: '', kind: 'marriage', title: '' });

/**
 * The open client's life events: a list by date and a form to add one. `onSave(events)` stores
 * the new list; `onOpen(event)` shows the forecast for the event's date. Without a saved client
 * there is nowhere to keep events: `onSaveClient` asks to save one first.
 */
export function EventsPanel({ events, saved, signedIn, onSave, onOpen, onSaveClient }) {
  const { lang, t } = useI18n();
  const [draft, setDraft] = useState(emptyDraft);
  const [status, setStatus] = useState('idle'); // idle | saving | error
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  if (!saved) {
    return (
      <div className="space-y-3 py-4 text-center text-sm text-slate-600">
        <p>{t(signedIn ? 'lifeEvents.needClient' : 'lifeEvents.needAccount')}</p>
        {signedIn && (
          <button type="button" className="btn-secondary" onClick={onSaveClient}>
            {t('lifeEvents.saveClient')}
          </button>
        )}
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const store = async (next) => {
    setStatus('saving');
    try {
      await onSave(next);
      setStatus('idle');
      return true;
    } catch {
      setStatus('error');
      return false;
    }
  };
  const add = async (e) => {
    e.preventDefault();
    const event = { id: crypto.randomUUID(), date: draft.date, time: draft.time, kind: draft.kind, title: draft.title.trim().slice(0, 120) };
    if (await store([...events, event])) setDraft(emptyDraft());
  };

  return (
    <div className="space-y-5">
      <form onSubmit={add} className="grid grid-cols-2 gap-3 sm:grid-cols-[auto_auto_auto_1fr_auto] sm:items-end">
        <label className="field">
          <span>{t('lifeEvents.date')}</span>
          <input type="date" className="input" required value={draft.date} onChange={(e) => set({ date: e.target.value })} />
        </label>
        <label className="field">
          <span>{t('lifeEvents.time')}</span>
          <input type="time" className="input" value={draft.time} onChange={(e) => set({ time: e.target.value })} />
        </label>
        <label className="field">
          <span>{t('lifeEvents.kind')}</span>
          <select className="input" value={draft.kind} onChange={(e) => set({ kind: e.target.value })}>
            {EVENT_KINDS.map((k) => (
              <option key={k} value={k}>{t(`lifeEvents.kind.${k}`)}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('lifeEvents.title')}</span>
          <input className="input" maxLength={120} placeholder={t('lifeEvents.titlePlaceholder')} value={draft.title} onChange={(e) => set({ title: e.target.value })} />
        </label>
        <button type="submit" className="btn-primary col-span-2 sm:col-span-1" disabled={status === 'saving' || !draft.date || events.length >= MAX_EVENTS}>
          {t('lifeEvents.add')}
        </button>
      </form>
      {status === 'error' && <p className="text-sm text-red-600">{t('lifeEvents.error')}</p>}
      {events.length >= MAX_EVENTS && <p className="text-sm text-slate-500">{t('lifeEvents.full', { n: MAX_EVENTS })}</p>}

      {sorted.length === 0 ? (
        <p className="text-sm text-slate-500">{t('lifeEvents.empty')}</p>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {sorted.map((ev) => (
            <li key={ev.id} className="flex items-center gap-3 py-2">
              <button
                type="button"
                onClick={() => onOpen(ev)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1.5 py-1 text-left transition hover:bg-slate-50"
                title={t('lifeEvents.open')}
              >
                <span className="w-28 shrink-0 tabular-nums text-slate-500">
                  {formatShortDate(ev.date, lang)}
                  {ev.time && <span className="block text-[11px]">{ev.time}</span>}
                </span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{t(`lifeEvents.kind.${ev.kind}`)}</span>
                <span className="truncate">{ev.title}</span>
              </button>
              <button
                type="button"
                className="btn-ghost text-slate-400 hover:text-red-600"
                aria-label={t('lifeEvents.delete')}
                title={t('lifeEvents.delete')}
                disabled={status === 'saving'}
                onClick={() => store(events.filter((e) => e.id !== ev.id))}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
