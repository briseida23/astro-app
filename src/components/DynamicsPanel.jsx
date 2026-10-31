import { STEP_UNITS, ROMAN, formatOffset, formatOrb, momentAt } from '../utils/ephemeris';
import { useI18n, placeName, formatShortDate } from '../i18n';
import { Glyph } from './Glyph';
import { Hint } from './Hint';

const PRESETS = [
  { step: 1, unit: 'minute' },
  { step: 10, unit: 'minute' },
  { step: 1, unit: 'hour' },
  { step: 1, unit: 'day' },
  { step: 1, unit: 'week' },
  { step: 1, unit: 'month' },
  { step: 1, unit: 'year' },
];


/** 2026-10-13 + 14:05 → "вт, 13 октября 2026 г., 14:05". */
const formatMoment = (moment, lang) => {
  const [y, m, d] = moment.date.split('-').map(Number);
  const date = new Intl.DateTimeFormat(lang, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(y, m - 1, d));
  return `${date}, ${moment.time}`;
};


/** Arrow button with the shift it makes written underneath and a tooltip on hover/focus. */
function StepButton({ onClick, label, caption, children }) {
  return (
    <div className="group relative flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="flex h-10 min-w-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-base text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
      >
        {children}
      </button>
      <span className="text-[11px] tabular-nums text-slate-500">{caption}</span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full mb-1.5 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </div>
  );
}

/** Moves the transit moment (or, with `natal`, the birth moment) back and forth by a chosen interval. */
export function DynamicsPanel({ natal, moment, dynamics, onDynamicsChange, onStep, onNow, aspects, aspectColors, lunation, ingresses, showPlace = true }) {
  const { lang, t } = useI18n();
  const { step, unit } = dynamics;
  const set = (patch) => onDynamicsChange({ ...dynamics, ...patch });
  const exact = aspects.filter((a) => a.orb < 1).sort((a, b) => a.orb - b.orb);
  // How far a button moves, e.g. "10 дн" for 10 steps of 1 day.
  const amount = (count) => t(`dynamics.preset.${unit}`, { n: Math.abs(count) * step });
  const stepButton = (count, arrow) => (
    <StepButton
      onClick={() => onStep(count)}
      label={t(count < 0 ? 'dynamics.back' : 'dynamics.forward', { amount: amount(count) })}
      caption={`${count < 0 ? '−' : '+'}${amount(count)}`}
    >
      {arrow}
    </StepButton>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">
        <div className="font-display text-xl font-semibold tabular-nums">{formatMoment(moment, lang)}</div>
        <div className="mt-0.5 text-xs text-slate-500">
          {formatOffset(moment.utcOffset)}
          {showPlace && ` · ${placeName(moment, t)}`}
        </div>
        {lunation && (
          <div className="mt-2 text-sm">
            {t('dynamics.lunation')}: <span className="font-semibold">{t(`lunation.${lunation.phase}`)}</span>{' '}
            <span className="tabular-nums text-slate-500">({Math.floor(lunation.angle)}°)</span>
          </div>
        )}
      </div>

      <div className="flex items-start justify-center gap-2">
        {stepButton(-10, '«')}
        {stepButton(-1, '‹')}
        {stepButton(1, '›')}
        {stepButton(10, '»')}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="field">
          <span>{t('dynamics.step')}</span>
          <input
            type="number"
            min={1}
            className="input"
            value={step}
            onChange={(e) => set({ step: Math.max(1, Math.round(Number(e.target.value)) || 1) })}
          />
        </label>
        <label className="field">
          <span>{t('dynamics.unit')}</span>
          <select className="input" value={unit} onChange={(e) => set({ unit: e.target.value })}>
            {STEP_UNITS.map((u) => (
              <option key={u} value={u}>{t(`dynamics.unit.${u}`)}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => {
          const active = p.step === step && p.unit === unit;
          return (
            <button
              key={`${p.step}${p.unit}`}
              type="button"
              onClick={() => set({ step: p.step, unit: p.unit })}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t(`dynamics.preset.${p.unit}`, { n: p.step })}
            </button>
          );
        })}
        {onNow && (
          <button type="button" className="btn-ghost ml-auto" onClick={onNow}>
            {t('transit.now')}
          </button>
        )}
      </div>

      {ingresses && (
        <div>
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">{t('dynamics.ingresses')}</h3>
          {ingresses.length === 0 ? (
            <p className="text-sm text-slate-500">{t('dynamics.ingressesEmpty')}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {ingresses.map((i) => (
                <li key={`${i.point.key}:${i.kind}`} className="flex items-center gap-1.5">
                  <Hint label={`${t(`wheel.${i.point.ring}Prefix`)}${t(`object.${i.point.id}`)}`}>
                    <Glyph of={i.point} className="inline-block w-6 text-center" symbolClass="astro text-base" />
                  </Hint>
                  <span className="text-slate-400">→</span>
                  {i.kind === 'sign' ? (
                    <Hint label={t(`sign.${i.to.id}`)}>
                      <span className="astro w-6 text-center text-base">{i.to.glyph}</span>
                    </Hint>
                  ) : (
                    <span className="font-display text-base">{t('ingress.house', { n: ROMAN[i.to - 1] })}</span>
                  )}
                  <span className="ml-auto tabular-nums text-slate-500">{formatShortDate(momentAt(moment, i.date.getTime()).date, lang)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div>
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">{t('dynamics.exact')}</h3>
        {exact.length === 0 ? (
          <p className="text-sm text-slate-500">{t(natal ? 'dynamics.exactEmptyNatal' : 'dynamics.exactEmpty')}</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {exact.map((a) => (
              <li key={a.id} className="flex items-center gap-1.5">
                <Hint label={`${natal ? '' : t(`wheel.${a.a.ring}Prefix`)}${t(`object.${a.a.id}`)}`}>
                  <Glyph of={a.a} className="inline-block w-6 text-center" symbolClass="astro text-base" />
                </Hint>
                <Hint label={t(`aspect.${a.type}`)}>
                  <span className="astro w-6 text-center text-base" style={{ color: a.type === 'opposition' ? undefined : aspectColors[a.type] }}>
                    {a.glyph}
                  </span>
                </Hint>
                <Hint label={`${natal ? '' : t('wheel.natalPrefix')}${t(`object.${a.b.id}`)}`}>
                  <Glyph of={a.b} className="inline-block w-6 text-center" symbolClass="astro text-base" />
                </Hint>
                <span className="ml-auto tabular-nums text-slate-500">{formatOrb(a.orb)}</span>
                <Hint label={t(a.applying ? 'aspects.applying' : 'aspects.separating')}>
                  <span className={`w-4 text-xs font-semibold ${a.applying ? 'text-emerald-700' : 'text-slate-400'}`}>{a.applying ? 'A' : 'S'}</span>
                </Hint>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
