import { useI18n } from '../i18n';

const MODALITY_COLOR = '#94A3B8';
const LUMINARY_GLYPHS = { sun: '☉', moon: '☽', ascendant: 'ASC' };

// Colour of the level tag and of the label for levels that need attention.
const LEVEL_CLASS = {
  absent: 'font-semibold text-red-700',
  deficit: 'font-medium text-red-600',
  low: 'text-amber-700',
  norm: 'text-slate-400',
  excess: 'font-medium text-indigo-700',
};

function BalanceBar({ label, score, percent, color, level }) {
  const { t } = useI18n();
  const flagged = level !== 'norm';
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={`w-32 shrink-0 ${flagged && level !== 'low' ? LEVEL_CLASS[level] : 'text-slate-700'}`}>{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-[width]" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
      <span className="w-10 text-right tabular-nums text-slate-600">{score}</span>
      <span className={`w-24 shrink-0 text-xs ${LEVEL_CLASS[level]}`}>{t(`balance.level.${level}`)}</span>
    </div>
  );
}

/** "Огонь, Воздух" for the items at the given levels, or a dash. */
const namesAt = (items, levels, kind, t) =>
  items.filter((i) => levels.includes(i.level)).map((i) => t(`${kind}.${i.id}`)).join(', ') || '—';

export function BalancePanel({ balance, elementColors }) {
  const { t } = useI18n();
  const { elements, modalities, dominantElements, dominantModalities, syntheticSigns, closestSign, luminaries } = balance;
  const tie = syntheticSigns.length > 1;
  // "Кардинальный = Фиксированный (5.5)" for every group that has a tie.
  const ties = [
    [dominantElements, 'element'],
    [dominantModalities, 'modality'],
  ]
    .filter(([leaders]) => leaders.length > 1)
    .map(([leaders, kind]) => `${leaders.map((l) => t(`${kind}.${l.id}`)).join(' = ')} (${leaders[0].score})`)
    .join('; ');

  return (
    <div>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t('balance.elements')}</h3>

      <div className="space-y-2">
        {elements.map((e) => (
          <BalanceBar
            key={e.id}
            label={t(`element.${e.id}`)}
            score={e.score}
            percent={e.percent}
            color={elementColors[e.id]}
            level={e.level}
          />
        ))}
      </div>

      <h3 className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t('balance.modalities')}</h3>
      <div className="space-y-2">
        {modalities.map((m) => (
          <BalanceBar key={m.id} label={t(`modality.${m.id}`)} score={m.score} percent={m.percent} color={MODALITY_COLOR} level={m.level} />
        ))}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-2 text-sm">
        <dt className="text-slate-500">{t(tie ? 'balance.syntheticMany' : 'balance.synthetic')}</dt>
        <dd className="font-medium">
          {syntheticSigns.map(({ sign }, i) => (
            <span key={sign.id} className="block">
              <span className="astro mr-1" style={{ color: elementColors[sign.element] }}>{sign.glyph}</span>
              {t(`sign.${sign.id}`)}
              {closestSign?.id === sign.id && (
                <span className="ml-1.5 rounded bg-slate-900 px-1 py-px text-[10px] font-semibold text-white">{t('balance.closest')}</span>
              )}
              {i < syntheticSigns.length - 1 && <span className="sr-only">,</span>}
            </span>
          ))}
          {tie && <span className="mt-0.5 block text-xs font-normal text-amber-700">{t('balance.tieNote', { ties })}</span>}
        </dd>
        {tie && (
          <>
            <dt className="text-slate-500">{t('balance.luminaries')}</dt>
            <dd>
              {luminaries.map((l) => (
                <span key={l.id} className="mr-3 inline-block whitespace-nowrap">
                  <span className={l.id === 'ascendant' ? 'text-[10px] font-bold' : 'astro'}>{LUMINARY_GLYPHS[l.id]}</span>{' '}
                  <span className="astro" style={{ color: elementColors[l.sign.element] }}>{l.sign.glyph}</span> {t(`sign.${l.sign.id}`)}
                </span>
              ))}
            </dd>
          </>
        )}
        <dt className="text-slate-500">{t('balance.dominantElement')}</dt>
        <dd className="font-medium">
          {dominantElements.map((e, i) => (
            <span key={e.id}>
              {i > 0 && ' = '}
              <span style={{ color: elementColors[e.id] }}>{t(`element.${e.id}`)}</span>
            </span>
          ))}
        </dd>
        <dt className="text-slate-500">{t('balance.dominantModality')}</dt>
        <dd className="font-medium">{dominantModalities.map((m) => t(`modality.${m.id}`)).join(' = ')}</dd>
        <dt className="text-slate-500">{t('balance.deficit')}</dt>
        <dd className="font-medium text-red-600">
          {[namesAt(elements, ['absent', 'deficit'], 'element', t), namesAt(modalities, ['deficit'], 'modality', t)]
            .filter((s) => s !== '—')
            .join(', ') || '—'}
        </dd>
        <dt className="text-slate-500">{t('balance.excess')}</dt>
        <dd className="font-medium text-indigo-700">
          {[namesAt(elements, ['excess'], 'element', t), namesAt(modalities, ['excess'], 'modality', t)]
            .filter((s) => s !== '—')
            .join(', ') || '—'}
        </dd>
      </dl>
      <p className="mt-4 text-xs text-slate-400">{t('balance.levelsNote')}</p>
    </div>
  );
}
