import { useState } from 'react';
import { Modal } from './Modal';
import { deleteChart } from '../utils/api';
import { useI18n, placeName, formatShortDate } from '../i18n';
import { withoutClient } from '../utils/location';

/** Saved clients of the signed-in user: save the current birth data, open or delete saved ones. */
function ClientsList({ birth, clients, onSave, onDeleted, onOpen }) {
  const { lang, t } = useI18n();
  const [name, setName] = useState(birth.clientId ? '' : (birth.name ?? ''));
  const [error, setError] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setError(false);
    try {
      // A new client from the chart on screen, even if it was opened from another client.
      onOpen(await onSave({ ...withoutClient(birth), name: name.trim() || `${placeName(birth, t)}, ${formatShortDate(birth.date, lang)}` }));
      setName('');
    } catch {
      setError(true);
    }
  };

  const remove = async (client) => {
    if (!window.confirm(t('charts.deleteConfirm', { name: client.name }))) return;
    try {
      await deleteChart(client.id);
      onDeleted(client.id);
    } catch {
      setError(true);
    }
  };

  return (
    <div className="space-y-5">
      <form className="flex gap-2" onSubmit={save}>
        <input
          className="input flex-1"
          placeholder={t('charts.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />
        <button type="submit" className="btn-primary whitespace-nowrap">{t('charts.saveCurrent')}</button>
      </form>
      {error && <p className="text-sm text-red-600">{t('auth.error.generic')}</p>}

      {clients === null && !error && <p className="text-sm text-slate-500">…</p>}
      {clients?.length === 0 && <p className="text-sm text-slate-500">{t('charts.empty')}</p>}
      {clients?.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {clients.map((client) => {
            const b = client.data.birth;
            return (
              <li key={client.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{client.name}</div>
                  <div className="truncate text-xs tabular-nums text-slate-500">
                    {formatShortDate(b.date, lang)} · {b.time} · {placeName(b, t)}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-secondary px-3 py-1"
                  onClick={() => onOpen({ ...b, clientId: client.id, name: client.name })}
                >
                  {t('charts.open')}
                </button>
                <button type="button" className="btn-ghost text-red-600" onClick={() => remove(client)} aria-label={t('charts.delete')}>
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function ChartsModal({ open, onClose, birth, clients, onSave, onDeleted, onOpen }) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t('charts.title')} width="max-w-xl">
      {open && (
        <ClientsList
          birth={birth}
          clients={clients}
          onSave={onSave}
          onDeleted={onDeleted}
          onOpen={(b) => {
            onOpen(b);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}
