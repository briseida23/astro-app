import { useState } from 'react';
import { Modal } from './Modal';
import { Tabs } from './Tabs';
import { signIn, signUp, signInWithGoogle } from '../utils/api';
import { useI18n } from '../i18n';

// Better Auth error codes → our messages.
function errorKey(error) {
  const code = error?.code ?? '';
  if (code.includes('INVALID_EMAIL_OR_PASSWORD')) return 'auth.error.invalid';
  if (code.includes('ALREADY_EXISTS')) return 'auth.error.exists';
  if (code.includes('PASSWORD_TOO_SHORT')) return 'auth.error.short';
  if (code.includes('INVALID_EMAIL')) return 'auth.error.email';
  return 'auth.error.generic';
}

function AuthForm({ google, onSignedIn }) {
  const { t } = useI18n();
  const [tab, setTab] = useState('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = tab === 'signIn' ? await signIn(email, password) : await signUp(name || email.split('@')[0], email, password);
      onSignedIn(result.user);
    } catch (err) {
      setError(errorKey(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Tabs
        tabs={['signIn', 'signUp'].map((id) => ({ id, label: t(`auth.tab.${id}`) }))}
        active={tab}
        onChange={(id) => {
          setTab(id);
          setError(null);
        }}
        className="-mt-2"
      />

      {google && (
        <>
          <button
            type="button"
            className="btn-secondary flex w-full items-center justify-center gap-2"
            onClick={() => signInWithGoogle().catch(() => setError('auth.error.generic'))}
          >
            <span aria-hidden className="font-bold text-[#4285F4]">G</span> {t('auth.google')}
          </button>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            {t('auth.or')}
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      )}

      <form className="space-y-3" onSubmit={submit}>
        {tab === 'signUp' && (
          <label className="field">
            <span>{t('auth.name')}</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
        )}
        <label className="field">
          <span>{t('auth.email')}</span>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="field">
          <span>{t('auth.password')}</span>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={tab === 'signIn' ? 'current-password' : 'new-password'}
            minLength={8}
            required
          />
          {tab === 'signUp' && <span className="normal-case tracking-normal text-slate-400">{t('auth.passwordHint')}</span>}
        </label>
        {error && <p className="text-sm text-red-600">{t(error)}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? '…' : t(tab === 'signIn' ? 'auth.submit.signIn' : 'auth.submit.signUp')}
        </button>
      </form>
      <p className="text-xs text-slate-500">{t('auth.note')}</p>
    </div>
  );
}

export function AuthModal({ open, onClose, google, onSignedIn }) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t('auth.title')} width="max-w-md">
      {/* Remount on open so the form starts empty. */}
      {open && (
        <AuthForm
          google={google}
          onSignedIn={(user) => {
            onSignedIn(user);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}
