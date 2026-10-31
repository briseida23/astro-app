import { useState } from 'react';
import { Modal } from './Modal';
import { Turnstile } from './Turnstile';
import { APP_NAME, GITHUB_URL } from '../appInfo';
import { sendFeedback } from '../utils/api';
import { useI18n } from '../i18n';

// What the app can do, as [icon, key]: texts are about.feature.<key> and about.feature.<key>.text.
const FEATURES = [
  ['⚡', 'speed'],
  ['🇺🇦', 'languages'],
  ['🔭', 'transits'],
  ['🌀', 'forecasts'],
  ['☀️', 'returns'],
  ['🌗', 'twoWheels'],
  ['🔍', 'search'],
  ['🎯', 'school'],
  ['⚖️', 'balance'],
  ['👥', 'clients'],
];
const FEEDBACK_KINDS = ['idea', 'bug', 'other'];

/** Ideas and bug reports, stored in the database. Guests may leave an email and pass Turnstile. */
function FeedbackForm({ user, turnstile }) {
  const { t, lang } = useI18n();
  const [kind, setKind] = useState('idea');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error | captcha
  const [captcha, setCaptcha] = useState(null);
  const [captchaRound, setCaptchaRound] = useState(0);
  const needsCaptcha = Boolean(turnstile) && !user;

  if (status === 'sent') {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-emerald-700">{t('feedback.sent')}</p>
        <button type="button" className="text-sm text-slate-600 underline hover:text-slate-900" onClick={() => setStatus('idle')}>
          {t('feedback.another')}
        </button>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (needsCaptcha && !captcha) {
      setStatus('captcha');
      return;
    }
    setStatus('sending');
    try {
      await sendFeedback({ kind, message, email: user ? undefined : email, lang }, captcha);
      setMessage('');
      setStatus('sent');
    } catch (err) {
      setStatus(err.code === 'VERIFICATION_FAILED' ? 'captcha' : 'error');
    } finally {
      // A Turnstile token works once.
      setCaptcha(null);
      setCaptchaRound((r) => r + 1);
    }
  };

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className="flex gap-1 rounded-lg bg-white p-0.5 text-sm ring-1 ring-slate-200">
        {FEEDBACK_KINDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setKind(id)}
            className={`flex-1 rounded-md px-3 py-1.5 transition ${kind === id ? 'bg-slate-900 font-medium text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {t(`feedback.kind.${id}`)}
          </button>
        ))}
      </div>
      <textarea
        className="input min-h-[110px] w-full resize-y"
        placeholder={t('feedback.placeholder')}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={4000}
        required
      />
      {!user && (
        <input type="email" className="input w-full" placeholder={t('feedback.email')} value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} autoComplete="email" />
      )}
      {needsCaptcha && <Turnstile siteKey={turnstile} lang={lang} round={captchaRound} onToken={setCaptcha} />}
      {status === 'error' && <p className="text-sm text-red-600">{t('feedback.error')}</p>}
      {status === 'captcha' && <p className="text-sm text-red-600">{t('feedback.captcha')}</p>}
      <button type="submit" className="btn-primary" disabled={status === 'sending' || !message.trim()}>
        {status === 'sending' ? '…' : t('feedback.send')}
      </button>
    </form>
  );
}

export function AboutModal({ open, onClose, user, turnstile }) {
  const { t, lang } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t('about.title')} width="max-w-2xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{APP_NAME}</p>
          <p className="font-display text-2xl font-semibold leading-tight">{t('about.hero')}</p>
          <p className="text-sm text-slate-600">{t('about.lead')}</p>
        </div>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('about.nowTitle')}</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map(([icon, key]) => (
              <li key={key} className="flex gap-3 rounded-xl border border-slate-200 p-3">
                <span aria-hidden className="text-xl leading-none">{icon}</span>
                <div>
                  <div className="text-sm font-semibold">{t(`about.feature.${key}`)}</div>
                  <div className="text-xs leading-relaxed text-slate-600">{t(`about.feature.${key}.text`)}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3 rounded-xl bg-slate-50 p-4">
          <h3 className="text-sm font-semibold">{t('about.nextTitle')}</h3>
          <p className="text-sm text-slate-600">{t('about.next')}</p>
          {open && <FeedbackForm user={user} turnstile={turnstile} />}
        </section>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-slate-600 underline hover:text-slate-900">
            {t('about.code')}
          </a>
          <a href={`/privacy?lang=${lang}`} target="_blank" rel="noreferrer" className="text-slate-600 underline hover:text-slate-900">
            {t('auth.privacy')}
          </a>
        </div>
      </div>
    </Modal>
  );
}
