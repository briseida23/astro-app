import { formatOrb } from '../utils/ephemeris';
import { useI18n } from '../i18n';
import { glyphClass } from './glyph';


export function AspectTable({ aspects, aspectColors, isBiWheel, focus, onHover }) {
  const { t } = useI18n();
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
            <th className="px-3 py-2 font-medium">{t(isBiWheel ? 'table.transit' : 'table.object')}</th>
            <th className="px-3 py-2 font-medium">{t('table.aspect')}</th>
            <th className="px-3 py-2 font-medium">{t(isBiWheel ? 'table.natal' : 'table.object')}</th>
            <th className="px-3 py-2 text-right font-medium">{t('table.orb')}</th>
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
              <td className="px-3 py-2">
                <span className={`mr-1.5 inline-block w-6 text-center ${glyphClass(a.a)}`}>{a.a.glyph}</span>
                {t(`object.${a.a.id}`)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className="astro mr-1.5 text-base" style={{ color: a.type === 'opposition' ? undefined : aspectColors[a.type] }}>
                  {a.glyph}
                </span>
                {t(`aspect.${a.type}`)}
                {a.exact && <span className="ml-1.5 rounded bg-slate-900 px-1 py-px text-[9px] font-semibold uppercase text-white">{t('aspects.exactShort')}</span>}
              </td>
              <td className="px-3 py-2">
                <span className={`mr-1.5 inline-block w-6 text-center ${glyphClass(a.b)}`}>{a.b.glyph}</span>
                {t(`object.${a.b.id}`)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{formatOrb(a.orb)}</td>
              <td className={`px-3 py-2 text-xs ${a.applying ? 'text-emerald-700' : 'text-slate-400'}`}>
                {t(a.applying ? 'aspects.applying' : 'aspects.separating')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
