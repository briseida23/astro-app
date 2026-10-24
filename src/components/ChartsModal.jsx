import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { listCharts, createChart, deleteChart } from '../utils/api';
import { useI18n, placeName } from '../i18n';

/** Saved charts of the signed-in user: save the current birth data, open or delete saved ones. */
function ChartsList({ birth, onOpen }) {
  const { lang, t } = useI18n();
  const [charts, setCharts] = useState(null); // null while loading
  const [name, setName] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listCharts()
      .then((list) => !cancelled && setCharts(list))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(y, m - 1, d));
  };

  const save = async (e) => {
    e.preventDefault();
    setError(false);
    try {
      const chart = await createChart(name.trim() || `${placeName(birth, t)}, ${formatDate(birth.date)}`, { birth });
      setCharts((list) => [chart, ...(list ?? [])]);
      setName('');
    } catch {
      setError(true);
    }
  };

  const remove = async (chart) => {
    if (!window.confirm(t('charts.deleteConfirm', { name: chart.name }))) return;
    try {
      await deleteChart(chart.id);
      setCharts((list) => list.filter((c) => c.id !== chart.id));
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

      {charts === null && !error && <p className="text-sm text-slate-500">…</p>}
      {charts?.length === 0 && <p className="text-sm text-slate-500">{t('charts.empty')}</p>}
      {charts?.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {charts.map((chart) => {
            const b = chart.data.birth;
            return (
              <li key={chart.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{chart.name}</div>
                  <div className="truncate text-xs tabular-nums text-slate-500">
                    {formatDate(b.date)} · {b.time} · {placeName(b, t)}
                  </div>
                </div>
                <button type="button" className="btn-secondary px-3 py-1" onClick={() => onOpen(b)}>
                  {t('charts.open')}
                </button>
                <button type="button" className="btn-ghost text-red-600" onClick={() => remove(chart)} aria-label={t('charts.delete')}>
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

export function ChartsModal({ open, onClose, birth, onOpen }) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t('charts.title')} width="max-w-xl">
      {open && (
        <ChartsList
          birth={birth}
          onOpen={(b) => {
            onOpen(b);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}
