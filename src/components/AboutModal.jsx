import { useState } from 'react';
import { Modal } from './Modal';
import { Turnstile } from './Turnstile';
import { APP_NAME, GITHUB_URL } from '../appInfo';
import { sendFeedback } from '../utils/api';
import { useI18n } from '../i18n';

// Long texts of the window, per language (kept here rather than in translations.js).
const CONTENT = {
  ru: {
    title: 'О приложении',
    hero: 'Профессиональная астрология — быстро, красиво и на родном языке.',
    lead: 'Современный онлайн-инструмент для астрологов, созданный в Украине. Ничего не нужно устанавливать, нет подписки и рекламы — просто откройте сайт.',
    nowTitle: 'Что уже умеет',
    now: [
      ['⚡', 'Мгновенный расчёт', 'Карта считается прямо в браузере по Swiss Ephemeris — тем же эфемеридам, что и в профессиональных программах.'],
      ['🇺🇦', 'Українська, русский, English', 'Вся терминология — аспекты, дома, стихии, кресты, фигуры — переведена вручную, а не машинно.'],
      ['🔭', 'Транзиты и динамика', 'Свой город для транзитов, шаги вперёд и назад от минуты до года, гибридные фигуры «транзит + натал».'],
      ['🎯', 'Под вашу школу', 'Отдельные орбисы для натала и транзитов, веса планет, системы домов, Селена, Хирон, астероиды и фиктивные точки.'],
      ['⚖️', 'Баланс карты', 'Стихии и кресты с уровнями нормы и дефицита, синтетический знак, контрастный режим для чтения.'],
      ['👥', 'База клиентов', 'Сохраняйте данные рождения и находите клиента по имени, дате или городу. Настройки — на всех ваших устройствах.'],
    ],
    nextTitle: 'Что дальше — решаете вы',
    next: 'В планах — плавный слайдер времени, дирекции и соляры с переключением внешнего круга в один клик, ингрессии. Расскажите, что нужно именно вам: самые востребованные идеи сделаем первыми.',
    kinds: { idea: 'Идея', bug: 'Ошибка', other: 'Другое' },
    placeholder: 'Опишите идею или что работает не так…',
    email: 'Email для ответа (необязательно)',
    send: 'Отправить',
    sent: 'Спасибо! Сообщение получено — мы читаем каждое.',
    another: 'Написать ещё',
    error: 'Не удалось отправить. Попробуйте ещё раз.',
    captcha: 'Подтвердите, что вы не робот.',
    code: 'Открытый код на GitHub',
    privacy: 'Политика конфиденциальности',
  },
  uk: {
    title: 'Про застосунок',
    hero: 'Професійна астрологія — швидко, красиво й рідною мовою.',
    lead: 'Сучасний онлайн-інструмент для астрологів, створений в Україні. Нічого не треба встановлювати, немає підписки й реклами — просто відкрийте сайт.',
    nowTitle: 'Що вже вміє',
    now: [
      ['⚡', 'Миттєвий розрахунок', 'Карта рахується просто в браузері за Swiss Ephemeris — тими ж ефемеридами, що й у професійних програмах.'],
      ['🇺🇦', 'Українська, русский, English', 'Уся термінологія — аспекти, доми, стихії, хрести, фігури — перекладена вручну, а не машинно.'],
      ['🔭', 'Транзити й динаміка', 'Власне місто для транзитів, кроки вперед і назад від хвилини до року, гібридні фігури «транзит + натал».'],
      ['🎯', 'Під вашу школу', 'Окремі орбіси для наталу й транзитів, ваги планет, системи домів, Селена, Хірон, астероїди та фіктивні точки.'],
      ['⚖️', 'Баланс карти', 'Стихії та хрести з рівнями норми й дефіциту, синтетичний знак, контрастний режим для читання.'],
      ['👥', 'База клієнтів', 'Зберігайте дані народження й знаходьте клієнта за ім’ям, датою чи містом. Налаштування — на всіх ваших пристроях.'],
    ],
    nextTitle: 'Що далі — вирішуєте ви',
    next: 'У планах — плавний слайдер часу, дирекції та соляри з перемиканням зовнішнього кола в один клік, інгресії. Розкажіть, що потрібно саме вам: найзатребуваніші ідеї зробимо першими.',
    kinds: { idea: 'Ідея', bug: 'Помилка', other: 'Інше' },
    placeholder: 'Опишіть ідею або що працює не так…',
    email: 'Email для відповіді (необов’язково)',
    send: 'Надіслати',
    sent: 'Дякуємо! Повідомлення отримано — ми читаємо кожне.',
    another: 'Написати ще',
    error: 'Не вдалося надіслати. Спробуйте ще раз.',
    captcha: 'Підтвердьте, що ви не робот.',
    code: 'Відкритий код на GitHub',
    privacy: 'Політика конфіденційності',
  },
  en: {
    title: 'About',
    hero: 'Professional astrology — fast, beautiful and in your language.',
    lead: 'A modern online tool for astrologers, made in Ukraine. Nothing to install, no subscription, no ads — just open the site.',
    nowTitle: 'What it does today',
    now: [
      ['⚡', 'Instant calculation', 'Charts are calculated right in your browser with the Swiss Ephemeris — the same ephemeris professional software uses.'],
      ['🇺🇦', 'Ukrainian, Russian, English', 'All terminology — aspects, houses, elements, crosses, patterns — is translated by hand, not by machine.'],
      ['🔭', 'Transits and dynamics', 'A separate place for transits, steps back and forth from a minute to a year, hybrid transit + natal patterns.'],
      ['🎯', 'Fits your school', 'Separate natal and transit orbs, planet weights, house systems, Selena, Chiron, asteroids and fictitious points.'],
      ['⚖️', 'Chart balance', 'Elements and crosses with norm and deficit levels, the synthetic sign, a high-contrast reading mode.'],
      ['👥', 'Client base', 'Save birth data and find a client by name, date or city. Your settings follow you to every device.'],
    ],
    nextTitle: 'What comes next is up to you',
    next: 'Planned: a smooth time slider, directions and solar returns with a one-click switch of the outer wheel, ingresses. Tell us what you need most — the most requested ideas come first.',
    kinds: { idea: 'Idea', bug: 'Bug', other: 'Other' },
    placeholder: 'Describe your idea or what does not work…',
    email: 'Email for a reply (optional)',
    send: 'Send',
    sent: 'Thank you! Your message has arrived — we read every one.',
    another: 'Write another',
    error: 'Could not send. Please try again.',
    captcha: 'Please confirm you are not a robot.',
    code: 'Open source on GitHub',
    privacy: 'Privacy policy',
  },
};

/** Ideas and bug reports, stored in the database. Guests may leave an email and pass Turnstile. */
function FeedbackForm({ c, user, turnstile }) {
  const { lang } = useI18n();
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
        <p className="text-sm font-medium text-emerald-700">{c.sent}</p>
        <button type="button" className="text-sm text-slate-600 underline hover:text-slate-900" onClick={() => setStatus('idle')}>
          {c.another}
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
        {Object.entries(c.kinds).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setKind(id)}
            className={`flex-1 rounded-md px-3 py-1.5 transition ${kind === id ? 'bg-slate-900 font-medium text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <textarea
        className="input min-h-[110px] w-full resize-y"
        placeholder={c.placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={4000}
        required
      />
      {!user && (
        <input type="email" className="input w-full" placeholder={c.email} value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} autoComplete="email" />
      )}
      {needsCaptcha && <Turnstile siteKey={turnstile} lang={lang} round={captchaRound} onToken={setCaptcha} />}
      {status === 'error' && <p className="text-sm text-red-600">{c.error}</p>}
      {status === 'captcha' && <p className="text-sm text-red-600">{c.captcha}</p>}
      <button type="submit" className="btn-primary" disabled={status === 'sending' || !message.trim()}>
        {status === 'sending' ? '…' : c.send}
      </button>
    </form>
  );
}

export function AboutModal({ open, onClose, user, turnstile }) {
  const { lang } = useI18n();
  const c = CONTENT[lang] ?? CONTENT.en;
  return (
    <Modal open={open} onClose={onClose} title={c.title} width="max-w-2xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{APP_NAME}</p>
          <p className="font-display text-2xl font-semibold leading-tight">{c.hero}</p>
          <p className="text-sm text-slate-600">{c.lead}</p>
        </div>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{c.nowTitle}</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {c.now.map(([icon, title, text]) => (
              <li key={title} className="flex gap-3 rounded-xl border border-slate-200 p-3">
                <span aria-hidden className="text-xl leading-none">{icon}</span>
                <div>
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="text-xs leading-relaxed text-slate-600">{text}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3 rounded-xl bg-slate-50 p-4">
          <h3 className="text-sm font-semibold">{c.nextTitle}</h3>
          <p className="text-sm text-slate-600">{c.next}</p>
          {open && <FeedbackForm c={c} user={user} turnstile={turnstile} />}
        </section>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-slate-600 underline hover:text-slate-900">
            {c.code}
          </a>
          <a href={`/privacy?lang=${lang}`} target="_blank" rel="noreferrer" className="text-slate-600 underline hover:text-slate-900">
            {c.privacy}
          </a>
        </div>
      </div>
    </Modal>
  );
}
