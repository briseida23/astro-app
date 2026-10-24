import { Modal } from './Modal';
import { APP_NAME, GITHUB_URL, FEEDBACK_URL } from '../appInfo';
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
    feedback: 'Предложить идею или сообщить об ошибке',
    feedbackNote: 'Откроется GitHub — понадобится бесплатный аккаунт.',
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
    feedback: 'Запропонувати ідею або повідомити про помилку',
    feedbackNote: 'Відкриється GitHub — знадобиться безкоштовний акаунт.',
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
    feedback: 'Suggest an idea or report a bug',
    feedbackNote: 'Opens GitHub — a free account is needed.',
    code: 'Open source on GitHub',
    privacy: 'Privacy policy',
  },
};

export function AboutModal({ open, onClose }) {
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
          <a href={FEEDBACK_URL} target="_blank" rel="noreferrer" className="btn-primary inline-block">
            {c.feedback}
          </a>
          <p className="text-xs text-slate-500">{c.feedbackNote}</p>
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
