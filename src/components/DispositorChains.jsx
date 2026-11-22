import { useI18n } from '../i18n';
import { PLANETS, SIGNS, ROMAN, normalize } from '../utils/ephemeris';

const GLYPH = Object.fromEntries(PLANETS.map((p) => [p.id, p.glyph]));

function Arrow({ double = false }) {
  return <span className="mx-1.5 text-slate-400" aria-hidden="true">{double ? '⇄' : '→'}</span>;
}

/**
 * Every node pointing at `id`, one per row as "♂♌ → ☉", each followed by the nodes pointing at it.
 * The row says where the arrow goes, so it reads without the indentation too.
 */
function Branches({ id, chain, view, depth = 0 }) {
  const sources = chain.sources.get(id);
  if (!sources) return null;
  return (
    <ul className={depth ? 'ml-3 border-l border-slate-200 pl-3' : ''}>
      {sources.map((s) => (
        <li key={s}>
          <div className="flex items-center py-0.5">
            {view.node(s)}
            <Arrow />
            {view.target(id)}
          </div>
          <Branches id={s} chain={chain} view={view} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}

/** The center, circled with a dashed line: "☉♐ ⇄ ♃♌", "♀♒ → ♅♓ → ♆♎ → ♀", or a dead end. */
function Center({ chain, view, t }) {
  const { center, type, missing } = chain;
  return (
    <div className="mb-1.5 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center rounded-full border border-dashed border-slate-500 px-3 py-1">
        {center.map((id, i) => (
          <span key={id} className="inline-flex items-center">
            {i > 0 && <Arrow double={type === 'mutual'} />}
            {view.node(id)}
          </span>
        ))}
        {type === 'single' && <span className="ml-1.5 text-base leading-none text-slate-400" aria-hidden="true">↺</span>}
        {type === 'cycle' && (
          <>
            <Arrow />
            {view.target(center[0])}
          </>
        )}
        {type === 'missing' && (
          <>
            <Arrow />
            <span className="astro text-slate-400">{GLYPH[missing]}</span>
            <span className="ml-0.5 text-slate-400">?</span>
          </>
        )}
      </span>
      <span className={`text-xs ${type === 'missing' ? 'text-amber-700' : 'text-slate-400'}`}>
        {t(`chains.type.${type}`, { planet: missing ? t(`object.${missing}`) : '' })}
      </span>
    </div>
  );
}

function Chain({ chain, view, t }) {
  return (
    <div className="rounded-lg border border-slate-100 p-3 text-sm">
      <Center chain={chain} view={view} t={t} />
      <div className="pl-2">
        {chain.center.map((id) => (
          <Branches key={id} id={id} chain={chain} view={view} />
        ))}
      </div>
    </div>
  );
}

function ChainGroup({ title, hint, example, chains, view, t }) {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-slate-700">{title}</h4>
      <p className="text-xs text-slate-500">{hint}</p>
      <p className="mb-2 text-xs text-slate-400">{example}</p>
      <p className="mb-2 text-xs text-slate-500">
        {chains.length === 1 ? t('chains.oneCenter') : t('chains.manyCenters', { count: chains.length })}
      </p>
      <div className="grid gap-2 @lg:grid-cols-2">
        {chains.map((c) => (
          <Chain key={c.center.join()} chain={c} view={view} t={t} />
        ))}
      </div>
    </div>
  );
}

export function DispositorChains({ dispositors, planets, elementColors }) {
  const { t } = useI18n();
  const byId = new Map(planets.map((p) => [p.id, p]));

  // A planet with its sign; as an arrow's target, the planet alone.
  const planetView = {
    node: (id) => {
      const sign = SIGNS[Math.floor(normalize(byId.get(id).longitude) / 30)];
      return (
        <span className="whitespace-nowrap" title={`${t(`object.${id}`)} — ${t(`sign.${sign.id}`)}`}>
          <span className="astro">{GLYPH[id]}</span>
          <span className="astro ml-0.5 text-xs" style={{ color: elementColors[sign.element] }}>{sign.glyph}</span>
        </span>
      );
    },
    target: (id) => (
      <span className="astro" title={t(`object.${id}`)}>{GLYPH[id]}</span>
    ),
  };

  // A house with the ruler of its cusp; as an arrow's target, the house alone.
  const { rulers } = dispositors.houses;
  const houseView = {
    node: (house) => (
      <span
        className="whitespace-nowrap"
        title={t('chains.houseTitle', { house: ROMAN[house - 1], ruler: t(`object.${rulers.get(house)}`) })}
      >
        <span className="font-display">{ROMAN[house - 1]}</span>
        <span className="astro ml-1 text-xs text-slate-400">{GLYPH[rulers.get(house)]}</span>
      </span>
    ),
    target: (house) => <span className="font-display">{ROMAN[house - 1]}</span>,
  };

  return (
    <div>
      <h3 className="mb-1 mt-8 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t('chains.title')}</h3>
      <p className="text-xs text-slate-400">{t('chains.note')}</p>
      <ChainGroup
        title={t('chains.planetary')}
        hint={t('chains.planetaryHint')}
        example={t('chains.planetaryExample')}
        chains={dispositors.planetary}
        view={planetView}
        t={t}
      />
      <ChainGroup
        title={t('chains.houses')}
        hint={t('chains.housesHint')}
        example={t('chains.housesExample')}
        chains={dispositors.houses.chains}
        view={houseView}
        t={t}
      />
    </div>
  );
}
