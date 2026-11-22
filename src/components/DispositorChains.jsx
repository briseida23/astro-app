import { useI18n } from '../i18n';
import { PLANETS, SIGNS, ROMAN, normalize } from '../utils/ephemeris';

const GLYPH = Object.fromEntries(PLANETS.map((p) => [p.id, p.glyph]));
const CENTER_JOIN = { mutual: ' ⇄ ', cycle: ' → ' };

/** The nodes whose arrows point at `id`, each with its own branch below it. */
function Branches({ id, chain, renderNode }) {
  const sources = chain.sources.get(id);
  if (!sources) return null;
  return (
    <ul className="ml-2 border-l border-slate-200 pl-3">
      {sources.map((s) => (
        <li key={s} className="py-0.5">
          <span className="mr-1.5 text-slate-300">↑</span>
          {renderNode(s)}
          <Branches id={s} chain={chain} renderNode={renderNode} />
        </li>
      ))}
    </ul>
  );
}

function Chain({ chain, renderNode, t }) {
  const { center, type } = chain;
  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-dashed border-slate-500 px-2.5 py-0.5">
          {center.map((id, i) => (
            <span key={id}>
              {i > 0 && <span className="text-slate-400">{CENTER_JOIN[type]}</span>}
              {renderNode(id)}
            </span>
          ))}
          {type === 'cycle' && (
            <>
              <span className="text-slate-400">{CENTER_JOIN.cycle}</span>
              {renderNode(center[0])}
            </>
          )}
        </span>
        <span className="text-xs text-slate-400">{t(`chains.type.${type}`)}</span>
      </div>
      {center.map((id) =>
        chain.sources.has(id) ? (
          <div key={id}>
            {center.length > 1 && <div className="mt-1 text-xs text-slate-400">{renderNode(id)}</div>}
            <Branches id={id} chain={chain} renderNode={renderNode} />
          </div>
        ) : null
      )}
    </div>
  );
}

function ChainGroup({ title, hint, chains, renderNode, t }) {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-slate-700">{title}</h4>
      <p className="mb-2 text-xs text-slate-500">{hint}</p>
      <p className="mb-2 text-xs text-slate-500">
        {chains.length === 1 ? t('chains.oneCenter') : t('chains.manyCenters', { count: chains.length })}
      </p>
      <div className="grid gap-2 @lg:grid-cols-2">
        {chains.map((c) => (
          <Chain key={c.center.join()} chain={c} renderNode={renderNode} t={t} />
        ))}
      </div>
    </div>
  );
}

export function DispositorChains({ dispositors, planets, elementColors }) {
  const { t } = useI18n();
  const byId = new Map(planets.map((p) => [p.id, p]));

  const planetNode = (id) => {
    const sign = SIGNS[Math.floor(normalize(byId.get(id).longitude) / 30)];
    return (
      <span className="whitespace-nowrap" title={`${t(`object.${id}`)} — ${t(`sign.${sign.id}`)}`}>
        <span className="astro">{GLYPH[id]}</span>
        <span className="astro ml-0.5 text-xs" style={{ color: elementColors[sign.element] }}>{sign.glyph}</span>
      </span>
    );
  };

  const houseNode = (house) => {
    const ruler = dispositors.houses.rulers.get(house);
    return (
      <span className="whitespace-nowrap" title={t('chains.houseTitle', { house: ROMAN[house - 1], ruler: t(`object.${ruler}`) })}>
        <span className="font-display">{ROMAN[house - 1]}</span>
        <span className="astro ml-1 text-xs text-slate-400">{GLYPH[ruler]}</span>
      </span>
    );
  };

  return (
    <div>
      <h3 className="mb-1 mt-8 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t('chains.title')}</h3>
      <p className="text-xs text-slate-400">{t('chains.note')}</p>
      <ChainGroup
        title={t('chains.planetary')}
        hint={t('chains.planetaryHint')}
        chains={dispositors.planetary}
        renderNode={planetNode}
        t={t}
      />
      {dispositors.houses && (
        <ChainGroup
          title={t('chains.houses')}
          hint={t('chains.housesHint')}
          chains={dispositors.houses.chains}
          renderNode={houseNode}
          t={t}
        />
      )}
    </div>
  );
}
