import { useEffect } from 'react';
import { useI18n } from '../i18n';

export function Modal({ open, onClose, title, children, footer, width = 'max-w-2xl' }) {
  const { t } = useI18n();
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full ${width} flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-slate-200 sm:rounded-2xl`}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="btn-ghost text-lg leading-none" aria-label={t('modal.close')}>
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-3">{footer}</footer>}
      </div>
    </div>
  );
}
