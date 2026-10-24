import { ROMAN } from '../utils/ephemeris';
import { useI18n } from '../i18n';
import { Glyph } from './Glyph';
import { Hint } from './Hint';

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
            <th className="px-3 py-2 font-medium">{t('table.object')}</th>
            <th className="px-3 py-2 font-medium">{t('table.sign')}</th>
            <th className="px-3 py-2 font-medium">{t('table.degree')}</th>
            <th className="px-3 py-2 font-medium">{t('table.house')}</th>
            {transitPlanets && <th className="px-3 py-2 font-medium">{t('table.transit')}</th>}
          </tr>
        </thead>
        <tbody>
          {points.map((p) => {
            const transit = transitById[p.id];
            const rowActive = focus?.planets.has(p.key);
            const transitActive = transit && focus?.planets.has(transit.key);
            return (
              <tr key={p.key} className={`border-t border-slate-100 transition-colors ${rowActive ? 'bg-slate-100' : ''}`}>
                <td className="px-3 py-2 whitespace-nowrap" {...hoverProps(p.key)}>
                  <Hint label={t(`object.${p.id}`)}>
                    <Glyph of={p} className="inline-block w-7 text-center" symbolClass="astro text-base" />
                  </Hint>
                  {p.retrograde && <span className="ml-0.5 text-[10px] font-semibold text-red-600">R</span>}
                </td>
                <td className="px-3 py-2" {...hoverProps(p.key)}>
                  <Hint label={t(`sign.${p.sign.id}`)}>
                    <span className="astro text-base">{p.sign.glyph}</span>
                  </Hint>
                </td>
                <td className="px-3 py-2 tabular-nums" {...hoverProps(p.key)}>{p.degree}</td>
                <td className="px-3 py-2 font-display text-base" {...hoverProps(p.key)}>{ROMAN[p.house - 1]}</td>
                {transitPlanets && (
                  <td
                    className={`px-3 py-2 text-slate-600 ${transitActive ? 'bg-slate-100' : ''}`}
                    {...(transit ? hoverProps(transit.key) : {})}
                  >
                    {transit && (
                      <span className="whitespace-nowrap">
                        <Hint label={t(`sign.${transit.sign.id}`)}>
                          <span className="astro mr-1">{transit.sign.glyph}</span>
                        </Hint>
                        <span className="tabular-nums">{transit.degree}</span>
                        {transit.retrograde && <span className="ml-1 text-[10px] font-semibold text-red-600">R</span>}
                        <span className="ml-1.5 font-display text-slate-400">{ROMAN[transit.house - 1]}</span>
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
