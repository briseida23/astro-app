import { DEFICIT_THRESHOLD } from '../utils/balance';
import { useI18n } from '../i18n';

const MODALITY_COLOR = '#94A3B8';

function BalanceBar({ label, score, percent, color, deficient }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={`w-32 shrink-0 ${deficient ? 'font-medium text-red-600' : 'text-slate-700'}`}>{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-[width]" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
      <span className="w-12 text-right tabular-nums text-slate-600">{score}</span>
    </div>
  );
}

export function BalancePanel({ balance, elementColors }) {
  const { t } = useI18n();
  const {
    elements,
    modalities,
    dominantElement,
    dominantModality,
    elementTie,
    modalityTie,
    deficientElements,
    syntheticSign,
  } = balance;
  const deficientIds = new Set(deficientElements.map((e) => e.id));

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
            deficient={deficientIds.has(e.id)}
          />
        ))}
      </div>

      <h3 className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t('balance.modalities')}</h3>
      <div className="space-y-2">
        {modalities.map((m) => (
          <BalanceBar key={m.id} label={t(`modality.${m.id}`)} score={m.score} percent={m.percent} color={MODALITY_COLOR} />
        ))}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-2 text-sm">
        {syntheticSign && (
          <>
            <dt className="text-slate-500">{t('balance.synthetic')}</dt>
            <dd className="font-medium">
              <span className="astro mr-1" style={{ color: elementColors[syntheticSign.element] }}>{syntheticSign.glyph}</span>
              {t(`sign.${syntheticSign.id}`)}
              {(elementTie || modalityTie) && (
                <span className="block text-xs font-normal text-amber-700">{t('balance.tie')}</span>
              )}
            </dd>
          </>
        )}
        <dt className="text-slate-500">{t('balance.dominantElement')}</dt>
        <dd className="font-medium" style={{ color: elementColors[dominantElement.id] }}>{t(`element.${dominantElement.id}`)}</dd>
        <dt className="text-slate-500">{t('balance.dominantModality')}</dt>
        <dd className="font-medium">{t(`modality.${dominantModality.id}`)}</dd>
        <dt className="text-slate-500">{t('balance.deficit', { threshold: DEFICIT_THRESHOLD })}</dt>
        <dd className="font-medium text-red-600">
          {deficientElements.length ? deficientElements.map((e) => t(`element.${e.id}`)).join(', ') : '—'}
        </dd>
      </dl>
    </div>
  );
}
