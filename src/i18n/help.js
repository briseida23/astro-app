// The help guide per language: sections of { id, title, items: [{ term?, text }], links }.
// A link opens a settings tab ({ settings }), a chart mode ({ mode }) or a tab under the chart ({ tab }).

const ru = [
  {
    id: 'start',
    title: 'Начало работы',
    items: [
      { term: 'Данные рождения', text: 'Кнопка «Данные» в шапке: дата, время, город. Часовой пояс и летнее время подставляются по городу; если время рождения неизвестно, ставьте 12:00 и не опирайтесь на дома и ASC/MC.' },
      { term: 'Клиенты', text: 'Кнопка «Клиенты» сохраняет карту под именем и открывает сохранённые. Есть поиск по имени, дате и городу. Без входа клиенты хранятся в этом браузере, после входа — в аккаунте и синхронизируются между устройствами.' },
      { term: 'Сейчас', text: 'В «Динамике» натала кнопка «Сейчас» открывает карту текущего момента вместо клиента; сам клиент в списке не меняется.' },
    ],
    links: [],
  },
  {
    id: 'modes',
    title: 'Режимы карты',
    items: [
      { term: 'Натал', text: 'Карта рождения: круг, планеты, аспекты, фигуры, баланс стихий.' },
      { term: 'Транзиты', text: 'Внешнее кольцо — положение планет на дату под кругом, аспекты транзитов к натальным точкам. Место транзита по умолчанию — место рождения; его можно сменить или определить «Где я сейчас». Если дата стоит «Сейчас», после обновления страницы она снова станет текущей.' },
      { term: 'Прогрессии', text: 'Вторичные прогрессии: один день после рождения — один год жизни. Прогрессивные ASC и MC идут по солнечной дуге. В «Динамике» видны прогрессивная лунация и ближайшие ингрессии прогрессивной Луны.' },
      { term: 'Дирекции', text: 'Все натальные точки смещаются на одну дугу: символическую (1° в год), Наибода или солнечную. Под кругом выбираются дуга и направление (прямые или конверсные). В «Динамике» — ингрессии дирекционных точек на 10 лет.' },
      { term: 'Соляр и лунар', text: 'Карта возвращения Солнца (Луны) на натальный градус, со своими домами для выбранного места. Стрелки ‹ › и список под кругом переключают соляры за ±5 лет и лунары за полгода.' },
    ],
    links: [{ mode: 'transit' }, { mode: 'progressions' }, { mode: 'directions' }, { mode: 'solar' }],
  },
  {
    id: 'second',
    title: 'Два круга',
    items: [
      { text: 'На широком экране кнопка «+ Вторая карта» открывает справа второй круг с любым другим режимом — например, соляр рядом с транзитами. Режим выбирается в заголовке второго круга, ✕ закрывает его.' },
      { text: 'Дата второго круга сначала совпадает с основной; если сменить её в строке под вторым кругом, она становится своей. «Как в основной» снова привязывает её к основной дате.' },
      { text: 'Наведение на планету в одном круге подсвечивает её и в другом. На телефоне второго круга нет: режим выбирается в меню.' },
    ],
    links: [],
  },
  {
    id: 'tabs',
    title: 'Вкладки под картой',
    items: [
      { term: 'Динамика', text: 'Двигает дату карты шагами (минута, час, день… год) и показывает аспекты точнее 1°. Шаг и единица задаются там же.' },
      { term: 'Баланс стихий', text: 'Сумма весов объектов по стихиям и крестам (только для натала). Веса настраиваются во вкладке «Методика».' },
      { term: 'Планеты', text: 'Положения по знакам и домам; R — ретроградное движение. При двух кругах есть колонка второй карты.' },
      { term: 'Аспекты', text: 'Список аспектов с орбисом; A — сходящийся, S — расходящийся. При двух кругах переключатель показывает аспекты основной или второй карты.' },
      { term: 'Фигуры', text: 'Тау-квадраты, большие трины, йоды и другие конфигурации. Для транзитов можно оставить контуры фигур на круге.' },
      { term: 'Поиск', text: 'Когда транзитная, прогрессивная или дирекционная планета сделает точный аспект к натальной точке или войдёт в дом. Выберите метод, планету, аспект, цель и период; щелчок по строке открывает карту на этот момент. R отмечает касание в ретроградном движении — так видны тройные прохождения.' },
    ],
    links: [{ tab: 'search' }, { tab: 'dynamics' }],
  },
  {
    id: 'settings',
    title: 'Настройки',
    items: [
      { term: 'Параметры', text: 'Система домов (по умолчанию Плацидус), лунные узлы (средний или истинный; Южный узел всегда напротив Северного), Лилит (средняя или истинная), высокая контрастность для слабого зрения.' },
      { term: 'Объекты и доп. объекты', text: 'Какие планеты и точки показывать. Хирон и Селена включены по умолчанию; астероиды, лунные, уранические и гипотетические точки добавляются в «Доп. объектах».' },
      { term: 'Орбисы', text: 'Отдельные таблицы для натала, транзитов, прогрессий, дирекций, соляра и лунара: орбис каждого объекта, какие аспекты учитывать, аспекты к углам, узлам и доп. объектам, что делать с расходящимися аспектами. Кнопка «Сбросить вкладку» возвращает значения по умолчанию.' },
      { term: 'Методика', text: 'Веса объектов для баланса стихий и крестов.' },
      { term: 'Цвета', text: 'Цвета аспектов и стихий на круге и в таблицах.' },
    ],
    links: [{ settings: 'params' }, { settings: 'objects' }, { settings: 'extras' }, { settings: 'orbs' }, { settings: 'method' }, { settings: 'colors' }],
  },
  {
    id: 'signs',
    title: 'Обозначения',
    items: [
      { term: 'R', text: 'Ретроградное движение (у узлов не показывается — они почти всегда идут назад).' },
      { term: 'A / S', text: 'Сходящийся (applying) / расходящийся (separating) аспект.' },
      { term: '☊ ☋', text: 'Северный и Южный лунные узлы. ⚸ — Лилит, ⚷ — Хирон.' },
      { term: 'Толстая линия', text: 'Точный аспект: орбис не больше доли от допустимого, заданной в «Орбисах».' },
      { term: 'Пунктир', text: 'Расходящийся аспект, если в настройках выбрано «Приглушать».' },
    ],
    links: [],
  },
  {
    id: 'account',
    title: 'Аккаунт и данные',
    items: [
      { text: 'Вход (почта или Google) сохраняет клиентов и настройки на сервере и синхронизирует их между устройствами. Без входа всё хранится только в этом браузере.' },
      { text: 'Удалить аккаунт со всеми данными можно в меню аккаунта. Идеи и ошибки присылайте через форму в «О приложении».' },
    ],
    links: [],
  },
];

const uk = [
  {
    id: 'start',
    title: 'Початок роботи',
    items: [
      { term: 'Дані народження', text: 'Кнопка «Дані» у шапці: дата, час, місто. Часовий пояс і літній час підставляються за містом; якщо час народження невідомий, ставте 12:00 і не спирайтеся на доми та ASC/MC.' },
      { term: 'Клієнти', text: 'Кнопка «Клієнти» зберігає карту під іменем і відкриває збережені. Є пошук за іменем, датою та містом. Без входу клієнти зберігаються в цьому браузері, після входу — в акаунті й синхронізуються між пристроями.' },
      { term: 'Зараз', text: 'У «Динаміці» наталу кнопка «Зараз» відкриває карту поточного моменту замість клієнта; сам клієнт у списку не змінюється.' },
    ],
    links: [],
  },
  {
    id: 'modes',
    title: 'Режими карти',
    items: [
      { term: 'Натал', text: 'Карта народження: коло, планети, аспекти, фігури, баланс стихій.' },
      { term: 'Транзити', text: 'Зовнішнє кільце — положення планет на дату під колом, аспекти транзитів до натальних точок. Місце транзиту за замовчуванням — місце народження; його можна змінити або визначити «Де я зараз». Якщо дата стоїть «Зараз», після оновлення сторінки вона знову стане поточною.' },
      { term: 'Прогресії', text: 'Вторинні прогресії: один день після народження — один рік життя. Прогресивні ASC і MC рухаються сонячною дугою. У «Динаміці» видно прогресивну лунацію і найближчі інгресії прогресивного Місяця.' },
      { term: 'Дирекції', text: 'Усі натальні точки зміщуються на одну дугу: символічну (1° на рік), Наїбода або сонячну. Під колом обираються дуга й напрям (прямі або конверсні). У «Динаміці» — інгресії дирекційних точок на 10 років.' },
      { term: 'Соляр і лунар', text: 'Карта повернення Сонця (Місяця) на натальний градус, зі своїми домами для обраного місця. Стрілки ‹ › і список під колом перемикають соляри за ±5 років і лунари за пів року.' },
    ],
    links: [{ mode: 'transit' }, { mode: 'progressions' }, { mode: 'directions' }, { mode: 'solar' }],
  },
  {
    id: 'second',
    title: 'Два кола',
    items: [
      { text: 'На широкому екрані кнопка «+ Друга карта» відкриває праворуч друге коло з будь-яким іншим режимом — наприклад, соляр поруч із транзитами. Режим обирається в заголовку другого кола, ✕ закриває його.' },
      { text: 'Дата другого кола спершу збігається з основною; якщо змінити її в рядку під другим колом, вона стає своєю. «Як в основній» знову прив’язує її до основної дати.' },
      { text: 'Наведення на планету в одному колі підсвічує її і в іншому. На телефоні другого кола немає: режим обирається в меню.' },
    ],
    links: [],
  },
  {
    id: 'tabs',
    title: 'Вкладки під картою',
    items: [
      { term: 'Динаміка', text: 'Рухає дату карти кроками (хвилина, година, день… рік) і показує аспекти точніші за 1°. Крок і одиниця задаються там само.' },
      { term: 'Баланс стихій', text: 'Сума ваг об’єктів за стихіями та хрестами (лише для наталу). Ваги налаштовуються у вкладці «Методика».' },
      { term: 'Планети', text: 'Положення за знаками й домами; R — ретроградний рух. Із двома колами є колонка другої карти.' },
      { term: 'Аспекти', text: 'Список аспектів з орбісом; A — сходжий, S — розбіжний. Із двома колами перемикач показує аспекти основної або другої карти.' },
      { term: 'Фігури', text: 'Тау-квадрати, великі трини, йоди та інші конфігурації. Для транзитів можна залишити контури фігур на колі.' },
      { term: 'Пошук', text: 'Коли транзитна, прогресивна чи дирекційна планета зробить точний аспект до натальної точки або увійде в дім. Оберіть метод, планету, аспект, ціль і період; клік по рядку відкриває карту на цей момент. R позначає дотик у ретроградному русі — так видно потрійні проходження.' },
    ],
    links: [{ tab: 'search' }, { tab: 'dynamics' }],
  },
  {
    id: 'settings',
    title: 'Налаштування',
    items: [
      { term: 'Параметри', text: 'Система домів (за замовчуванням Плацідус), місячні вузли (середній або істинний; Південний вузол завжди навпроти Північного), Ліліт (середня або істинна), висока контрастність для слабкого зору.' },
      { term: 'Об’єкти й дод. об’єкти', text: 'Які планети й точки показувати. Хірон і Селена увімкнені за замовчуванням; астероїди, місячні, уранічні та гіпотетичні точки додаються в «Дод. об’єктах».' },
      { term: 'Орбіси', text: 'Окремі таблиці для наталу, транзитів, прогресій, дирекцій, соляра й лунара: орбіс кожного об’єкта, які аспекти враховувати, аспекти до кутів, вузлів і дод. об’єктів, що робити з розбіжними аспектами. Кнопка «Скинути вкладку» повертає значення за замовчуванням.' },
      { term: 'Методика', text: 'Ваги об’єктів для балансу стихій і хрестів.' },
      { term: 'Кольори', text: 'Кольори аспектів і стихій на колі та в таблицях.' },
    ],
    links: [{ settings: 'params' }, { settings: 'objects' }, { settings: 'extras' }, { settings: 'orbs' }, { settings: 'method' }, { settings: 'colors' }],
  },
  {
    id: 'signs',
    title: 'Позначення',
    items: [
      { term: 'R', text: 'Ретроградний рух (у вузлів не показується — вони майже завжди йдуть назад).' },
      { term: 'A / S', text: 'Сходжий (applying) / розбіжний (separating) аспект.' },
      { term: '☊ ☋', text: 'Північний і Південний місячні вузли. ⚸ — Ліліт, ⚷ — Хірон.' },
      { term: 'Товста лінія', text: 'Точний аспект: орбіс не більший за частку від допустимого, задану в «Орбісах».' },
      { term: 'Пунктир', text: 'Розбіжний аспект, якщо в налаштуваннях обрано «Приглушувати».' },
    ],
    links: [],
  },
  {
    id: 'account',
    title: 'Акаунт і дані',
    items: [
      { text: 'Вхід (пошта або Google) зберігає клієнтів і налаштування на сервері та синхронізує їх між пристроями. Без входу все зберігається лише в цьому браузері.' },
      { text: 'Видалити акаунт з усіма даними можна в меню акаунта. Ідеї та помилки надсилайте через форму в «Про застосунок».' },
    ],
    links: [],
  },
];

const en = [
  {
    id: 'start',
    title: 'Getting started',
    items: [
      { term: 'Birth data', text: 'The “Data” button in the header: date, time, city. The time zone and daylight saving come from the city; if the birth time is unknown, use 12:00 and do not rely on the houses and ASC/MC.' },
      { term: 'Clients', text: 'The “Clients” button saves a chart under a name and opens saved ones, with search by name, date and city. Signed out, clients live in this browser; signed in, they are kept in your account and synced across devices.' },
      { term: 'Now', text: 'In the natal Dynamics tab, “Now” opens the chart of the current moment instead of the client; the saved client stays as it is.' },
    ],
    links: [],
  },
  {
    id: 'modes',
    title: 'Chart modes',
    items: [
      { term: 'Natal', text: 'The birth chart: wheel, planets, aspects, patterns, element balance.' },
      { term: 'Transits', text: 'The outer ring shows the planets at the date under the wheel, with transit-to-natal aspects. The transit place defaults to the birth place; change it or use “Where I am”. A date set to “Now” becomes current again when the page reloads.' },
      { term: 'Progressions', text: 'Secondary progressions: one day after birth for each year of life. The progressed ASC and MC move by the solar arc. Dynamics shows the progressed lunation and the progressed Moon’s coming ingresses.' },
      { term: 'Directions', text: 'Every natal point moves by the same arc: symbolic (1° a year), Naibod or solar arc. The arc and the direction (direct or converse) are chosen under the wheel. Dynamics lists the directed points’ ingresses for 10 years.' },
      { term: 'Solar and lunar returns', text: 'The chart of the Sun (Moon) returning to its natal degree, with its own houses for the chosen place. The ‹ › arrows and the list under the wheel switch between solar returns ±5 years and lunar returns over half a year.' },
    ],
    links: [{ mode: 'transit' }, { mode: 'progressions' }, { mode: 'directions' }, { mode: 'solar' }],
  },
  {
    id: 'second',
    title: 'Two wheels',
    items: [
      { text: 'On a wide screen “+ Second chart” opens a second wheel on the right with any other mode — a solar return next to transits, for example. Pick the mode in the second wheel’s title; ✕ closes it.' },
      { text: 'The second wheel follows the main date until you change its own date in the bar under it. “Same as main” ties it back to the main date.' },
      { text: 'Hovering a planet in one wheel highlights it in the other. Phones have no second wheel: pick the mode in the menu.' },
    ],
    links: [],
  },
  {
    id: 'tabs',
    title: 'Tabs under the chart',
    items: [
      { term: 'Dynamics', text: 'Steps the chart date (minute, hour, day… year) and lists aspects within 1°. The step and unit are set there too.' },
      { term: 'Element balance', text: 'Object weights summed by element and cross (natal only). The weights are set in the Method tab of the settings.' },
      { term: 'Planets', text: 'Positions by sign and house; R marks retrograde motion. With two wheels there is a column for the second chart.' },
      { term: 'Aspects', text: 'Aspects with their orbs; A is applying, S separating. With two wheels a switch shows the main or the second chart’s aspects.' },
      { term: 'Patterns', text: 'T-squares, grand trines, yods and other configurations. Transit pattern outlines can stay drawn on the wheel.' },
      { term: 'Search', text: 'When a transiting, progressed or directed planet makes an exact aspect to a natal point or enters a house. Choose the method, planet, aspect, target and period; click a row to open the chart at that moment. R marks a contact made in retrograde motion, which shows triple passes.' },
    ],
    links: [{ tab: 'search' }, { tab: 'dynamics' }],
  },
  {
    id: 'settings',
    title: 'Settings',
    items: [
      { term: 'Parameters', text: 'House system (Placidus by default), lunar nodes (mean or true; the South Node is always opposite the North), Lilith (mean or true), high contrast for low vision.' },
      { term: 'Objects and extra objects', text: 'Which planets and points are shown. Chiron and Selena are on by default; asteroids, lunar, Uranian and hypothetical points are added under Extra objects.' },
      { term: 'Orbs', text: 'Separate tables for natal, transits, progressions, directions and solar/lunar returns: each object’s orb, which aspects count, aspects to the angles, nodes and extra objects, and what to do with separating aspects. “Reset tab” restores the defaults.' },
      { term: 'Method', text: 'Object weights for the element and cross balance.' },
      { term: 'Colours', text: 'Aspect and element colours on the wheel and in the tables.' },
    ],
    links: [{ settings: 'params' }, { settings: 'objects' }, { settings: 'extras' }, { settings: 'orbs' }, { settings: 'method' }, { settings: 'colors' }],
  },
  {
    id: 'signs',
    title: 'Symbols',
    items: [
      { term: 'R', text: 'Retrograde motion (not shown for the nodes, which move backwards almost all the time).' },
      { term: 'A / S', text: 'Applying / separating aspect.' },
      { term: '☊ ☋', text: 'North and South lunar nodes. ⚸ is Lilith, ⚷ Chiron.' },
      { term: 'Thick line', text: 'An exact aspect: the orb is within the share of the allowed orb set under Orbs.' },
      { term: 'Dashed line', text: 'A separating aspect, when the settings say “Dim”.' },
    ],
    links: [],
  },
  {
    id: 'account',
    title: 'Account and data',
    items: [
      { text: 'Signing in (email or Google) keeps your clients and settings on the server and syncs them across devices. Signed out, everything stays in this browser only.' },
      { text: 'You can delete your account with all its data from the account menu. Send ideas and bug reports through the form in About.' },
    ],
    links: [],
  },
];

export const HELP = { ru, uk, en };
