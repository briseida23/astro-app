import { formatOrb } from '../utils/ephemeris';
import { useI18n } from '../i18n';
import { Glyph } from './Glyph';
import { Hint } from './Hint';

/** The transit member of a figure, its widest orb to the natal members and whether it is still closing in. */
function transitContact(pattern, aspects) {
  const transit = pattern.members.find((m) => m.ring !== 'natal');
  const natal = pattern.members.filter((m) => m.ring === 'natal');
  const keys = new Set(natal.map((m) => m.key));
  const own = aspects.filter((a) => a.a.key === transit.key && keys.has(a.b.key));
  return {
    transit,
    natal,
    orb: Math.max(...own.map((a) => a.orb)),
    applying: own.every((a) => a.applying),
  };
}

/** Figures completed by transits, as event cards under the wheel. */
export function TransitEvents({ patterns, aspects, hover, onHover }) {
  const { t } = useI18n();
  if (patterns.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="px-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">{t('events.title')}</h3>
      {patterns.map((pattern, i) => {
        const { transit, natal, orb, applying } = transitContact(pattern, aspects);
        const active = hover?.type === 'pattern' && hover.index === i;
        return (
          <div
            key={i}
            onMouseEnter={() => onHover({ type: 'pattern', index: i })}
            onMouseLeave={() => onHover(null)}
            className={`flex gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
              active ? 'border-amber-300 bg-amber-50' : 'border-amber-200/70 bg-amber-50/40'
            }`}
          >
            <span aria-hidden className="text-base leading-5">⚠️</span>
            <div>
              <span className="font-semibold">
                {t(`wheel.${transit.ring}Prefix`)}
                <Glyph of={transit} /> {t(`object.${transit.id}`)}
              </span>{' '}
              {t('events.completes')} <span className="font-semibold">{t(`pattern.${pattern.type}`)}</span>{' '}
              {t('events.withNatal')}{' '}
              {natal.map((m, j) => (
                <span key={m.key}>
                  {j > 0 && ', '}
                  <Glyph of={m} /> {t(`object.${m.id}`)}
                </span>
              ))}
              <div className="mt-0.5 text-xs text-slate-500">
                {t('events.orb', { orb: formatOrb(orb) })} ·{' '}
                <span className={applying ? 'text-emerald-700' : ''}>{t(applying ? 'aspects.applying' : 'aspects.separating')}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Switch and orb for the figures transits complete with natal planets. */
function TransitPatternControls({ settings, onChange }) {
  const { t } = useI18n();
  return (
    <div className="mb-4 space-y-2 rounded-xl bg-slate-50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
          <span className="relative inline-flex items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={settings.enabled}
              onChange={(e) => onChange({ ...settings, enabled: e.target.checked })}
            />
            <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-slate-900 peer-focus-visible:ring-4 peer-focus-visible:ring-slate-200" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
          </span>
          {t('patterns.transitToggle')}
        </label>
        <label className={`flex items-center gap-2 text-sm text-slate-600 ${settings.enabled ? '' : 'opacity-40'}`}>
          {t('patterns.transitOrb')}
          <input
            type="number"
            className="input-sm w-16 text-right"
            min={0.5}
            max={5}
            step={0.5}
            disabled={!settings.enabled}
            value={settings.orb}
            onChange={(e) => {
              const orb = Number(e.target.value);
              if (e.target.value !== '' && orb > 0 && orb <= 5) onChange({ ...settings, orb });
            }}
          />
          °
        </label>
      </div>
      <label className={`flex cursor-pointer items-center gap-2 text-sm ${settings.enabled ? '' : 'opacity-40'}`}>
        <input
          type="checkbox"
          className="h-4 w-4 accent-slate-900"
          disabled={!settings.enabled}
          checked={settings.contours}
          onChange={(e) => onChange({ ...settings, contours: e.target.checked })}
        />
        {t('patterns.contours')}
      </label>
      <p className="text-xs text-slate-500">{t('patterns.transitHint')}</p>
    </div>
  );
}

/**
 * Aspect figures. With `transitSettings` (transit mode) the list holds figures made of transit
 * and natal planets, and the switch/orb for them are shown on top.
 */
export function PatternsPanel({ patterns, hover, onHover, transitSettings, onTransitSettingsChange }) {
  const { t } = useI18n();
  const ringLabel = (p) => (transitSettings ? t(`wheel.${p.ring}Prefix`) : '');
  const controls = transitSettings && <TransitPatternControls settings={transitSettings} onChange={onTransitSettingsChange} />;
  if (patterns.length === 0) {
    const empty = transitSettings ? (transitSettings.enabled ? 'patterns.transitEmpty' : 'patterns.transitOff') : 'patterns.empty';
    return (
      <>
        {controls}
        <p className="py-6 text-center text-sm text-slate-500">{t(empty)}</p>
      </>
    );
  }
  return (
    <>
    {controls}
    <ul className="space-y-2">
      {patterns.map((pattern, i) => (
        <li
          key={i}
          onMouseEnter={() => onHover({ type: 'pattern', index: i })}
          onMouseLeave={() => onHover(null)}
          className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
            hover?.type === 'pattern' && hover.index === i ? 'border-slate-300 bg-slate-50' : 'border-slate-100'
          }`}
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-lg font-semibold">{t(`pattern.${pattern.type}`)}</span>
            {pattern.apex && (
              <span className="text-xs text-slate-500">
                {t(pattern.type === 'kite' ? 'patterns.axis' : 'patterns.apex')}: {ringLabel(pattern.apex)}
                <Hint label={t(`object.${pattern.apex.id}`)}>
                  <span className="astro text-sm">{pattern.apex.glyph}</span>
                </Hint>
              </span>
            )}
          </div>
          <div className="mt-1 text-slate-600">
            {pattern.members.map((m, j) => (
              <span key={m.key}>
                {j > 0 && <span className="mx-1.5 text-slate-300">·</span>}
                {ringLabel(m)}
                <Hint label={t(`object.${m.id}`)}>
                  <span className="astro text-base">{m.glyph}</span>
                </Hint>
              </span>
            ))}
          </div>
          <div className="mt-1 text-xs text-slate-400">{t(`pattern.${pattern.type}.hint`)}</div>
        </li>
      ))}
    </ul>
    </>
  );
}
