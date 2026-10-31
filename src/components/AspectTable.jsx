import { formatOrb, ROMAN, momentAt } from '../utils/ephemeris';
import { useI18n, formatShortDate } from '../i18n';
import { Glyph } from './Glyph';
import { Hint } from './Hint';

/**
 * When a forecast aspect is exact (applying) or leaves its orb (separating), with the whole window
 * in a tooltip. `orbWindow` is from orbWindows; dates are read on `moment`'s clock, with the time
 * when the window is shorter than three days (the transiting Moon, Mercury at a station…).
 */
export function OrbWindowNote({ orbWindow, applying, moment, className = '' }) {
  const { lang, t } = useI18n();
  if (!orbWindow) return null;
  const short = orbWindow.enter && orbWindow.exit && orbWindow.exit - orbWindow.enter < 3 * 86400000;
  const format = (date) => {
    if (!date) return t('window.beyond');
    const local = momentAt(moment, date.getTime());
    return short ? `${formatShortDate(local.date, lang)}, ${local.time}` : formatShortDate(local.date, lang);
  };
  const note = applying && orbWindow.exact ? t('window.exact', { date: format(orbWindow.exact) }) : t('window.exit', { date: format(orbWindow.exit) });
  const exact = orbWindow.exact ?? orbWindow.lastExact;
  const full = t('window.full', { enter: format(orbWindow.enter), exact: exact ? format(exact) : t('window.noExact'), exit: format(orbWindow.exit) });
  return (
    <span className={`whitespace-nowrap text-[11px] tabular-nums text-slate-500 ${className}`} title={full}>
      {note}
    </span>
  );
}

export function AspectTable({ aspects, aspectColors, isBiWheel, focus, onHover, windows, moment }) {
  const { t } = useI18n();
  // An aspect is read with the houses of both planets: transits are placed in the natal houses.
  const houseOf = (p) => (p.house ? ROMAN[p.house - 1] : '');
  const pointLabel = (p) =>
    `${isBiWheel ? t(`wheel.${p.ring}Prefix`) : ''}${t(`object.${p.id}`)}${p.house ? ` · ${houseOf(p)} ${t('table.house').toLowerCase()}` : ''}`;
  const point = (p) => (
    <>
      <Hint label={pointLabel(p)}>
        <Glyph of={p} className="inline-block w-6 text-center" symbolClass="astro text-base" />
      </Hint>
      <span className="inline-block w-8 font-display text-xs text-slate-400">{houseOf(p)}</span>
    </>
  );
  if (aspects.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">{t('aspects.empty')}</p>;
  }
  // Under transits applying aspects come first: they are the ones still building to an event.
  const sorted = [...aspects].sort(
    (a, b) => (isBiWheel ? b.applying - a.applying : 0) || a.orb / a.allowed - b.orb / b.allowed
  );
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-[11px] uppercase tracking-wider text-slate-400">
          <tr>
            {/* Columns hug their content (w-px); the last one takes the spare width. */}
            <th className="w-px px-3 py-2 font-medium">{t('table.aspect')}</th>
            <th className="w-px px-3 py-2 text-right font-medium">{t('table.orb')}</th>
            <th className="px-3 py-2 font-medium">{t('table.motion')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr
              key={a.id}
              onMouseEnter={() => onHover({ type: 'aspect', id: a.id })}
              onMouseLeave={() => onHover(null)}
              className={`border-t border-slate-100 transition-colors ${focus?.aspects.has(a.id) ? 'bg-slate-100' : ''} ${a.faded ? 'text-slate-400' : ''}`}
            >
              {/* "☉ VII ☌ ☽ I": first object (the transit one under transits) with its house, aspect, second object. */}
              <td className="px-3 py-2 whitespace-nowrap">
                <span className="inline-flex items-center">
                  {point(a.a)}
                  <Hint label={t(`aspect.${a.type}`)}>
                    <span className="astro w-6 text-center text-base" style={{ color: a.type === 'opposition' ? undefined : aspectColors[a.type] }}>
                      {a.glyph}
                    </span>
                  </Hint>
                  {point(a.b)}
                  {a.exact && <span className="rounded bg-slate-900 px-1 py-px text-[9px] font-semibold uppercase text-white">{t('aspects.exactShort')}</span>}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatOrb(a.orb)}</td>
              <td className={`px-3 py-2 text-xs ${a.applying ? 'text-emerald-700' : 'text-slate-400'}`}>
                {t(a.applying ? 'aspects.applying' : 'aspects.separating')}
                <OrbWindowNote orbWindow={windows?.get(a.id)} applying={a.applying} moment={moment} className="block" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
