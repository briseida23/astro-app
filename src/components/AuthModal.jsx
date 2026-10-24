import { useState } from 'react';
import { Modal } from './Modal';
import { Tabs } from './Tabs';
import { Turnstile } from './Turnstile';
import { signIn, signUp, signInWithGoogle } from '../utils/api';
import { useI18n } from '../i18n';

// Better Auth error codes → our messages.
function errorKey(error) {
  const code = error?.code ?? '';
  if (code.includes('INVALID_EMAIL_OR_PASSWORD')) return 'auth.error.invalid';
  if (code.includes('ALREADY_EXISTS')) return 'auth.error.exists';
  if (code.includes('PASSWORD_TOO_SHORT')) return 'auth.error.short';
  if (code.includes('INVALID_EMAIL')) return 'auth.error.email';
  if (code.includes('CAPTCHA') || code === 'VERIFICATION_FAILED' || code === 'MISSING_RESPONSE') return 'auth.error.captcha';
  return 'auth.error.generic';
}

// Google's multicolour "G" mark.
function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function AuthForm({ google, turnstile, onSignedIn }) {
  const { lang, t } = useI18n();
  const [tab, setTab] = useState('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // Turnstile token for the next submit; every attempt uses it up and gets a fresh widget.
  const [captcha, setCaptcha] = useState(null);
  const [captchaRound, setCaptchaRound] = useState(0);
  // With Google available it is the main way in; email and password are one click away.
  const [emailOpen, setEmailOpen] = useState(!google);

  const submit = async (e) => {
    e.preventDefault();
    if (turnstile && !captcha) {
      setError('auth.error.captcha');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = tab === 'signIn' ? await signIn(email, password, captcha) : await signUp(name || email.split('@')[0], email, password, captcha);
      onSignedIn(result.user);
    } catch (err) {
      setError(errorKey(err));
      setCaptcha(null);
      setCaptchaRound((r) => r + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {google && (
        <div className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium shadow-sm transition hover:bg-slate-50"
            onClick={() => signInWithGoogle().catch(() => setError('auth.error.generic'))}
          >
            <GoogleMark /> {t('auth.google')}
          </button>
          <p className="text-center text-xs text-slate-500">{t('auth.googleHint')}</p>
        </div>
      )}

      {google && !emailOpen && (
        <>
          {error && <p className="text-sm text-red-600">{t(error)}</p>}
          <button
            type="button"
            className="w-full text-sm text-slate-600 underline hover:text-slate-900"
            onClick={() => setEmailOpen(true)}
          >
            {t('auth.emailToggle')}
          </button>
        </>
      )}

      {emailOpen && google && (
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          {t('auth.or')}
          <span className="h-px flex-1 bg-slate-200" />
        </div>
      )}

      {emailOpen && (
        <>
          <Tabs
            tabs={['signIn', 'signUp'].map((id) => ({ id, label: t(`auth.tab.${id}`) }))}
            active={tab}
            onChange={(id) => {
              setTab(id);
              setError(null);
            }}
          />

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
            {turnstile && <Turnstile siteKey={turnstile} lang={lang} round={captchaRound} onToken={setCaptcha} />}
            {error && <p className="text-sm text-red-600">{t(error)}</p>}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? '…' : t(tab === 'signIn' ? 'auth.submit.signIn' : 'auth.submit.signUp')}
            </button>
          </form>
        </>
      )}
      <p className="text-xs text-slate-500">
        {t('auth.note')}{' '}
        <a href={`/privacy?lang=${lang}`} target="_blank" rel="noreferrer" className="underline hover:text-slate-700">
          {t('auth.privacy')}
        </a>
      </p>
    </div>
  );
}

export function AuthModal({ open, onClose, google, turnstile, onSignedIn }) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t('auth.title')} width="max-w-md">
      {/* Remount on open so the form starts empty. */}
      {open && (
        <AuthForm
          google={google}
          turnstile={turnstile}
          onSignedIn={(user) => {
            onSignedIn(user);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}
