import { useState } from 'react';
import { Modal } from './Modal';
import { deleteChart } from '../utils/api';
import { clientMatches } from '../utils/clients';
import { withoutClient } from '../utils/location';
import { useI18n, placeName, formatShortDate } from '../i18n';

// Sort keys of the table columns → value to compare.
const SORT_VALUE = {
  name: (c) => c.name.toLowerCase(),
  birth: (c) => `${c.data.birth.date} ${c.data.birth.time}`,
  place: (c, t) => placeName(c.data.birth, t).toLowerCase(),
  updated: (c) => c.updatedAt ?? 0,
};

/** Table of the signed-in user's saved clients: search, sort, open, delete, save the current chart. */
function ClientsTable({ birth, clients, onSave, onDeleted, onOpen }) {
  const { lang, t } = useI18n();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: 'updated', desc: true });
  const [name, setName] = useState(birth.clientId ? '' : (birth.name ?? ''));
  const [error, setError] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setError(false);
    try {
      // Always a new client, even when the chart on screen was opened from another one.
      await onSave({ ...withoutClient(birth), name: name.trim() || `${placeName(birth, t)}, ${formatShortDate(birth.date, lang)}` });
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

  const rows = (clients ?? []).filter((c) => clientMatches(c, query, lang, t));
  const value = SORT_VALUE[sort.key];
  rows.sort((a, b) => {
    const va = value(a, t);
    const vb = value(b, t);
    const order = typeof va === 'string' ? va.localeCompare(vb, lang) : va - vb;
    return sort.desc ? -order : order;
  });

  const header = (key, label, className = '') => (
    <th className={`px-3 py-2 font-medium ${className}`}>
      <button
        type="button"
        className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-slate-900"
        onClick={() => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key === 'updated' }))}
      >
        {label}
        <span aria-hidden className={sort.key === key ? '' : 'invisible'}>{sort.desc ? '↓' : '↑'}</span>
      </button>
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          className="input md:flex-1"
          type="search"
          placeholder={t('clients.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <form className="flex gap-2 md:flex-1" onSubmit={save}>
          <input
            className="input min-w-0 flex-1"
            placeholder={t('charts.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
          />
          <button type="submit" className="btn-primary whitespace-nowrap">{t('charts.saveCurrent')}</button>
        </form>
      </div>
      {error && <p className="text-sm text-red-600">{t('auth.error.generic')}</p>}

      {clients === null && !error && <p className="text-sm text-slate-500">…</p>}
      {clients?.length === 0 && <p className="text-sm text-slate-500">{t('charts.empty')}</p>}
      {clients?.length > 0 && rows.length === 0 && <p className="text-sm text-slate-500">{t('client.nothing')}</p>}
      {rows.length > 0 && (
        // Scrolls on its own, with the column headers kept in view.
        <div className="max-h-[55vh] overflow-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] text-slate-500 shadow-[0_1px_0_#e2e8f0]">
              <tr>
                {header('name', t('clients.col.name'))}
                {header('birth', t('clients.col.birth'))}
                <th className="px-3 py-2 font-medium uppercase tracking-wider">{t('clients.col.time')}</th>
                {header('place', t('clients.col.place'))}
                {header('updated', t('clients.col.updated'))}
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((client) => {
                const b = client.data.birth;
                const open = () => onOpen({ ...b, clientId: client.id, name: client.name });
                const current = birth.clientId === client.id;
                return (
                  <tr key={client.id} className={`cursor-pointer hover:bg-slate-50 ${current ? 'bg-slate-50' : ''}`} onClick={open}>
                    <td className="px-3 py-2.5 font-medium">{client.name}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{formatShortDate(b.date, lang)}</td>
                    <td className="px-3 py-2.5 tabular-nums">{b.time}</td>
                    <td className="px-3 py-2.5 text-slate-600">{placeName(b, t)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-slate-500">
                      {client.updatedAt ? new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric' }).format(client.updatedAt) : ''}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-right">
                      <button
                        type="button"
                        className="btn-ghost text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(client);
                        }}
                        aria-label={t('charts.delete')}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {clients?.length > 0 && <p className="text-xs text-slate-500">{t('clients.count', { n: clients.length })}</p>}
    </div>
  );
}

export function ClientsModal({ open, onClose, birth, clients, onSave, onDeleted, onOpen }) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t('charts.title')} width="max-w-4xl">
      {open && (
        <ClientsTable
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
