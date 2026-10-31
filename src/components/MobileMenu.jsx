import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n, LANGUAGES } from '../i18n';
import { APP_NAME } from '../appInfo';

// Width from which the desktop header is shown instead of this menu (Tailwind `lg`).
const DESKTOP = '(min-width: 1024px)';

// One collapsible group of the drawer ("Language", "Account"). Starts collapsed each time the drawer opens.
function Section({ title, value, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-slate-100">
      <button type="button" className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left text-sm font-medium" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{title}</span>
        <span className="flex min-w-0 items-center gap-2 text-slate-500">
          <span className="truncate font-normal">{value}</span>
          <span aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </span>
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}

/**
 * Header controls on phones and tablets: a ☰ button that slides a menu in from the left.
 * `modes`, `onModeChange` etc. are the same as in the desktop header.
 */
export function MobileMenu({ modes, mode, onModeChange, user, accountsEnabled, onData, onCharts, onSettings, onAbout, onHelp, onSignIn, onSignOut, onDelete }) {
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const drawer = drawerRef.current;
    drawer.querySelector('button')?.focus();

    // Escape closes; Tab cycles inside the drawer instead of reaching the page behind it.
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key !== 'Tab') return;
      const focusable = drawer.querySelectorAll('button, a[href]');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    // A tablet turned to landscape gets the desktop header, so the menu must not stay open.
    const desktop = window.matchMedia(DESKTOP);
    const onWiden = (e) => e.matches && setOpen(false);
    desktop.addEventListener('change', onWiden);

    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onWiden);
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, [open]);

  // Closes the menu, then runs the chosen action.
  const run = (action) => () => {
    setOpen(false);
    action();
  };
  const item = (label, action, icon = null) => (
    <button type="button" className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm hover:bg-slate-50" onClick={run(action)}>
      {icon && (
        <span aria-hidden className="w-4 text-center text-slate-500">
          {icon}
        </span>
      )}
      {label}
    </button>
  );
  const subItem = (key, label, action, { active = false, danger = false } = {}) => (
    <button
      key={key}
      type="button"
      className={`flex w-full items-center justify-between px-8 py-2 text-left text-sm hover:bg-slate-50 ${danger ? 'text-red-600' : ''} ${active ? 'font-semibold' : ''}`}
      onClick={action}
    >
      {label}
      {active && <span aria-hidden>✓</span>}
    </button>
  );

  return (
    <>
      <button ref={triggerRef} type="button" className="btn-secondary px-3 text-lg leading-none" onClick={() => setOpen(true)} aria-label={t('menu.open')} aria-expanded={open}>
        ☰
      </button>
      {/* Rendered into <body>: the header's backdrop blur would otherwise trap the fixed drawer inside it. */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 animate-[fade-in_150ms_ease-out] bg-slate-900/25" onClick={() => setOpen(false)} />
            <div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label={t('menu.open')}
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-[slide-in-left_200ms_ease-out] flex-col overflow-y-auto bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4">
                <span className="flex items-center gap-2 font-display text-2xl font-semibold">
                  <img src="/favicon.svg" alt="" className="h-7 w-7" />
                  {APP_NAME}
                </span>
                <button type="button" onClick={() => setOpen(false)} className="btn-ghost text-lg leading-none" aria-label={t('modal.close')}>
                  ✕
                </button>
              </div>

              <div className="mx-5 mb-3 flex rounded-lg bg-slate-100 p-0.5 text-sm">
                {modes.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={run(() => onModeChange(id))}
                    className={`flex-1 rounded-md px-3 py-1.5 transition ${mode === id ? 'bg-white font-semibold shadow-sm' : 'text-slate-600'}`}
                  >
                    {t(`mode.${id}`)}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 py-1">
                {item(t('header.data'), onData, '✎')}
                {user && item(t('clients.button'), onCharts, '☷')}
                {item(t('header.settings'), onSettings, '⚙')}
              </div>

              <Section title={t('app.language')} value={LANGUAGES.find((l) => l.id === lang)?.label}>
                {LANGUAGES.map((l) => subItem(l.id, l.label, () => setLang(l.id), { active: l.id === lang }))}
              </Section>

              {accountsEnabled &&
                (user ? (
                  <Section title={t('menu.account')} value={user.name || user.email}>
                    {/* Without a name the email is already the section's value. */}
                    {user.name && <div className="truncate px-8 py-1 text-xs text-slate-500">{user.email}</div>}
                    {subItem('signOut', t('auth.signOut'), run(onSignOut))}
                    {subItem('delete', t('account.delete'), run(onDelete), { danger: true })}
                  </Section>
                ) : (
                  <div className="border-t border-slate-100 px-5 py-3">
                    <button type="button" className="btn-primary w-full" onClick={run(onSignIn)}>
                      {t('auth.signIn')}
                    </button>
                  </div>
                ))}

              <div className="mt-auto border-t border-slate-100 py-1 text-slate-500">
                {item(t('help.title'), onHelp)}
                {item(t('app.about'), onAbout)}
                <a href={`/privacy?lang=${lang}`} target="_blank" rel="noreferrer" className="block px-5 py-3 text-sm hover:bg-slate-50">
                  {t('auth.privacy')}
                </a>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
