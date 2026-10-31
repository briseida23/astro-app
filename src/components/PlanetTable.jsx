import { ROMAN } from '../utils/ephemeris';
import { useI18n } from '../i18n';
import { Glyph } from './Glyph';
import { Hint } from './Hint';

/** Retrograde mark beside the object's glyph; the slot is always there so the columns stay aligned. */
const Retro = ({ point }) => (
  <span className="inline-block w-3 text-[10px] font-semibold text-red-600">{point.retrograde && 'R'}</span>
);

/** "1°10′ ♏" as in astrological notation: degrees right-aligned so the signs line up in a column. */
function Position({ point }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center whitespace-nowrap">
      <span className="inline-block w-[3.6rem] text-right tabular-nums">{point.degree}</span>
      <Hint label={t(`sign.${point.sign.id}`)}>
        <span className="astro ml-1.5 text-base">{point.sign.glyph}</span>
      </Hint>
    </span>
  );
}

export function PlanetTable({ points, transitPlanets, focus, onHover }) {
  const { t } = useI18n();
  const transitById = Object.fromEntries((transitPlanets ?? []).map((p) => [p.id, p]));
  const hoverProps = (key) => ({
    onMouseEnter: () => onHover({ type: 'planet', key }),
    onMouseLeave: () => onHover(null),
  });

  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-[11px] uppercase tracking-wider text-slate-400">
          <tr>
            {/* Columns hug their content (w-px); the last one takes the spare width. */}
            <th className="w-px px-3 py-2 font-medium">{t('table.object')}</th>
            <th className="w-px px-3 py-2 font-medium">{t(transitPlanets ? 'table.natal' : 'table.position')}</th>
            <th className={`${transitPlanets ? 'w-px' : ''} px-3 py-2 font-medium`}>{t('table.house')}</th>
            {transitPlanets && <th className="px-3 py-2 font-medium">{t(`table.${transitPlanets[0]?.ring ?? 'transit'}`)}</th>}
          </tr>
        </thead>
        <tbody>
          {points.map((p) => {
            const transit = transitById[p.id];
            const rowActive = focus?.planets.has(p.key);
            const transitActive = transit && focus?.planets.has(transit.key);
            return (
              <tr key={p.key} className={`border-t border-slate-100 transition-colors ${rowActive ? 'bg-slate-100' : ''}`}>
                <td className="px-3 py-2" {...hoverProps(p.key)}>
                  <Hint label={t(`object.${p.id}`)}>
                    <Glyph of={p} className="inline-block w-7 text-center" symbolClass="astro text-base" />
                  </Hint>
                  <Retro point={p} />
                </td>
                <td className="px-3 py-2" {...hoverProps(p.key)}>
                  <Position point={p} />
                </td>
                <td className="px-3 py-2 font-display text-base" {...hoverProps(p.key)}>{ROMAN[p.house - 1]}</td>
                {transitPlanets && (
                  <td
                    className={`px-3 py-2 text-slate-600 ${transitActive ? 'bg-slate-100' : ''}`}
                    {...(transit ? hoverProps(transit.key) : {})}
                  >
                    {transit && (
                      <span className="inline-flex items-center whitespace-nowrap">
                        {/* The transit planet's own glyph, so its R mark sits by a planet as in the natal column. */}
                        <Hint label={`${t(`wheel.${transit.ring}Prefix`)}${t(`object.${transit.id}`)}`}>
                          <Glyph of={transit} className="inline-block w-6 text-center" symbolClass="astro text-base" />
                        </Hint>
                        <Retro point={transit} />
                        <Position point={transit} />
                        <span className="ml-2 font-display text-slate-400">{ROMAN[transit.house - 1]}</span>
                      </span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
