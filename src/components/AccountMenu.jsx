import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';

/** Header control: "Sign in" when signed out, otherwise the user's menu. */
export function AccountMenu({ user, onSignIn, onCharts, onSignOut, onDelete }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!user) {
    return (
      <button type="button" className="btn-primary" onClick={onSignIn}>
        {t('auth.signIn')}
      </button>
    );
  }

  const item = (label, action, danger = false) => (
    <button
      type="button"
      className={`block w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${danger ? 'text-red-600' : ''}`}
      onClick={() => {
        setOpen(false);
        action();
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button type="button" className="btn-secondary flex max-w-[12rem] items-center gap-2" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
          {(user.name || user.email).slice(0, 1).toUpperCase()}
        </span>
        <span className="truncate">{user.name || user.email}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <div className="truncate px-4 py-2 text-xs text-slate-500">{user.email}</div>
          {item(t('charts.title'), onCharts)}
          {item(t('auth.signOut'), onSignOut)}
          <div className="my-1 h-px bg-slate-100" />
          {item(t('account.delete'), onDelete, true)}
        </div>
      )}
    </div>
  );
}
