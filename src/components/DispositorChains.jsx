import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { PLANETS, SIGNS, ROMAN, normalize } from '../utils/ephemeris';

const GLYPH = Object.fromEntries(PLANETS.map((p) => [p.id, p.glyph]));

// Flow layout: the periphery on the left, the center block on the right.
const CHIP_W = 56;
const CHIP_H = 26;
const GAP = { max: 30, min: 14 }; // room between columns for the arrows, narrowed to fit the card
const MIN_SCALE = 0.8; // then drawn smaller, down to this; past it the drawing scrolls
const ROW = 36;
const CENTER_W = 100;
const PAD = 6;

/**
 * Positions for a chain drawn left to right. A node's column is its distance from the center
 * (the farthest on the left); leaves take consecutive rows and a node sits between its sources.
 * Center members stack in the center column, a spare row between them for the arrow inside the
 * center, and for a ring two more rows: an arrow and the first member again, closing it.
 */
function layoutChain(chain) {
  const pos = new Map();
  let rows = 0;
  const place = (id, depth) => {
    const sources = chain.sources.get(id) ?? [];
    const row = sources.length
      ? (() => {
          const at = sources.map((s) => place(s, depth + 1));
          return (at[0] + at[at.length - 1]) / 2;
        })()
      : rows++;
    pos.set(id, { depth, row });
    return row;
  };
  chain.center.forEach((id, i) => {
    if (i > 0) rows++;
    // Keep each member below the previous one with a row for the arrow between them.
    const prev = i > 0 ? pos.get(chain.center[i - 1]).row : -Infinity;
    rows = Math.max(rows, Math.ceil(prev + 2));
    place(id, 0);
  });
  const last = pos.get(chain.center.at(-1)).row;
  const closeRow = chain.type === 'cycle' ? Math.max(rows + 1, last + 2) : null;
  if (closeRow != null) rows = closeRow + 1;

  const depths = Math.max(...[...pos.values()].map((p) => p.depth));
  const y = (row) => PAD + row * ROW + ROW / 2;
  return { pos, depths, y, closeY: closeRow != null ? y(closeRow) : null, height: PAD * 2 + rows * ROW };
}

/** The node an arrow leaves from → the node it points at, for the arrows outside the center. */
const targetsOf = (chain) => {
  const next = new Map();
  for (const [to, from] of chain.sources) for (const f of from) next.set(f, to);
  return next;
};

function Chain({ chain, view, t }) {
  const markerId = useId();
  const [hovered, setActive] = useState(null);
  const layout = useMemo(() => layoutChain(chain), [chain]);
  const next = useMemo(() => targetsOf(chain), [chain]);
  const { pos, depths, y, height, closeY } = layout;
  // A node that left this chain (other settings, another chart) is no longer lit.
  const active = hovered != null && pos.has(hovered) && !chain.center.includes(hovered) ? hovered : null;

  // Fit the card: narrower gaps first, then a smaller drawing, then a scroll that starts at the center.
  // A callback ref: the drawing may appear later than the chain (when sources flow into its center).
  const scrollRef = useRef(null);
  const observerRef = useRef(null);
  const [avail, setAvail] = useState(null);
  const attachScroll = useCallback((el) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    scrollRef.current = el;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setAvail(entry.contentRect.width));
    observer.observe(el);
    observerRef.current = observer;
  }, []);
  const room = avail == null ? GAP.max : (avail - CENTER_W - depths * CHIP_W) / Math.max(depths, 1);
  const col = CHIP_W + Math.min(GAP.max, Math.max(GAP.min, room));
  const x = (depth) => (depths - depth) * col;
  const centerX = depths * col;
  const width = centerX + CENTER_W;
  const scale = avail == null || width <= avail ? 1 : Math.max(MIN_SCALE, avail / width);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [width, scale]);
  const { center, type, missing } = chain;

  // The hovered node's way to the center: the nodes on it, the center included.
  const path = useMemo(() => {
    if (active == null) return null;
    const on = new Set(center);
    for (let n = active; n != null && !center.includes(n); n = next.get(n)) on.add(n);
    return on;
  }, [active, center, next]);
  const dim = (id) => (path && !path.has(id) ? 'opacity-30' : '');

  const centerYs = center.map((id) => y(pos.get(id).row));
  const top = Math.min(...centerYs, closeY ?? Infinity) - ROW / 2;
  const bottom = Math.max(...centerYs, closeY ?? -Infinity) + ROW / 2;
  const missingType = type === 'missing';
  const blockClass = missingType
    ? 'border-amber-300 bg-amber-50 text-amber-900'
    : 'border-indigo-300 bg-indigo-50 text-indigo-950';
  const between = type === 'mutual' ? '⇅' : '↓';

  const caption = (
    <div className="mb-2 text-xs">
      <span className="font-medium text-slate-600">{t('chains.center')}</span>
      <span className={missingType ? 'text-amber-700' : 'text-slate-400'}>
        {' · '}
        {t(`chains.type.${type}`, { planet: missing ? t(`object.${missing}`) : '' })}
      </span>
    </div>
  );

  // Nothing flows into the center: the center alone, in one line.
  if (!chain.sources.size) {
    const arrow = <span className="opacity-50" aria-hidden="true">{type === 'mutual' ? '⇄' : '→'}</span>;
    return (
      <div className="rounded-lg border border-slate-100 p-3 text-sm">
        {caption}
        <div className={`inline-flex flex-wrap items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-base ${blockClass}`}>
          {center.map((id, i) => (
            <span key={id} className="inline-flex items-center gap-2">
              {i > 0 && arrow}
              {view.node(id)}
            </span>
          ))}
          {type === 'cycle' && (
            <>
              {arrow}
              {view.target(center[0])}
            </>
          )}
          {type === 'single' && <span className="opacity-50" aria-hidden="true">↺</span>}
          {missingType && (
            <span className="text-sm opacity-60">
              → <span className="astro">{GLYPH[missing]}</span>?
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-100 p-3 text-sm">
      {caption}
      <div ref={attachScroll} className="overflow-x-auto">
        <div style={{ width: width * scale, height: height * scale }}>
          <div
            className="relative origin-top-left"
            style={{ width, height, transform: scale < 1 ? `scale(${scale})` : undefined }}
            onMouseLeave={() => setActive(null)}
            // A tap on the empty space turns the highlight off (on touch screens there is no mouse leave).
            onClick={(e) => e.target === e.currentTarget && setActive(null)}
          >
            <svg className="pointer-events-none absolute inset-0" width={width} height={height} aria-hidden="true">
              <defs>
                {['off', 'on'].map((k) => (
                  <marker key={k} id={`${markerId}-${k}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                    <path d="M0,0 L8,4 L0,8 z" className={k === 'on' ? 'fill-slate-600' : 'fill-slate-300'} />
                  </marker>
                ))}
              </defs>
              {[...next].map(([from, to]) => {
                const x1 = x(pos.get(from).depth) + CHIP_W;
                const y1 = y(pos.get(from).row);
                const x2 = (pos.get(to).depth === 0 ? centerX : x(pos.get(to).depth)) - 2;
                const y2 = y(pos.get(to).row);
                const mid = (x1 + x2) / 2;
                const on = path?.has(from);
                return (
                  <path
                    key={from}
                    d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`}
                    fill="none"
                    strokeWidth={on ? 1.75 : 1.25}
                    className={`transition-opacity ${on ? 'stroke-slate-600' : 'stroke-slate-300'} ${path && !on ? 'opacity-30' : ''}`}
                    markerEnd={`url(#${markerId}-${on ? 'on' : 'off'})`}
                  />
                );
              })}
            </svg>

            {[...pos].map(([id, p]) =>
              p.depth === 0 ? null : (
                <button
                  key={id}
                  type="button"
                  onMouseEnter={() => setActive(id)}
                  onFocus={() => setActive(id)}
                  onBlur={() => setActive(null)}
                  // Only switches on: a tap also fires mouseenter and focus first, so a toggle would undo it.
                  onClick={() => setActive(id)}
                  className={`absolute flex items-center justify-center rounded-full border bg-white shadow-sm transition-opacity ${
                    active === id ? 'border-slate-500' : 'border-slate-200 hover:border-slate-400'
                  } ${dim(id)}`}
                  style={{ left: x(p.depth), top: y(p.row) - CHIP_H / 2, width: CHIP_W, height: CHIP_H }}
                >
                  {view.node(id)}
                </button>
              )
            )}

            <div
              className={`absolute rounded-xl border-2 ${blockClass}`}
              style={{ left: centerX, top, width: CENTER_W, height: bottom - top }}
            >
              {center.map((id, i) => (
                <div key={id}>
                  {i > 0 && (
                    <span
                      className="absolute inset-x-0 -translate-y-1/2 text-center text-xs opacity-50"
                      style={{ top: (centerYs[i - 1] + centerYs[i]) / 2 - top }}
                      aria-hidden="true"
                    >
                      {between}
                    </span>
                  )}
                  <div
                    className="absolute inset-x-0 flex -translate-y-1/2 items-center justify-center gap-1 text-base"
                    style={{ top: centerYs[i] - top }}
                  >
                    {view.node(id)}
                    {type === 'single' && <span className="opacity-50" aria-hidden="true">↺</span>}
                    {missingType && (
                      <span className="text-sm opacity-60">
                        → <span className="astro">{GLYPH[missing]}</span>?
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {closeY != null && (
                <>
                  <span
                    className="absolute inset-x-0 -translate-y-1/2 text-center text-xs opacity-50"
                    style={{ top: (centerYs.at(-1) + closeY) / 2 - top }}
                    aria-hidden="true"
                  >
                    ↓
                  </span>
                  <div className="absolute inset-x-0 -translate-y-1/2 text-center text-base opacity-70" style={{ top: closeY - top }}>
                    {view.target(center[0])}
                  </div>
                </>
              )}
            </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function ChainGroup({ title, hint, example, chains, view, t }) {
  if (!chains) {
    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-slate-700">{title}</h4>
        <p className="text-xs text-amber-700">{t('chains.unavailable')}</p>
      </div>
    );
  }
  if (!chains.length) return null;
  // A planet or house in its own domicile with nothing flowing in: listed together in one row.
  const alone = chains.filter((c) => c.type === 'single' && c.members.length === 1);
  const drawn = chains.filter((c) => !alone.includes(c));
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-slate-700">{title}</h4>
      <p className="text-xs text-slate-500">{hint}</p>
      <p className="mb-2 text-xs text-slate-400">{example}</p>
      <p className="mb-2 text-xs text-slate-500">
        {chains.length === 1 ? t('chains.oneCenter') : t('chains.manyCenters', { count: chains.length })}
      </p>
      <div className="space-y-2">
        {drawn.map((c) => (
          <Chain key={c.center.join()} chain={c} view={view} t={t} />
        ))}
      </div>
      {alone.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-500">
          <span>{t('chains.autonomous')}</span>
          {alone.map((c) => (
            <span key={c.center[0]} className="inline-flex items-center gap-1 rounded-full border border-indigo-300 bg-indigo-50 px-2.5 py-0.5 text-sm text-indigo-950">
              {view.node(c.center[0])}
              <span className="opacity-50" aria-hidden="true">↺</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** The note on how a planet's house is taken: by the cusp orb, strictly, or by sign (whole signs). */
const houseRuleKey = (houses, cuspOrb) =>
  houses?.wholeSign ? 'chains.cuspOrbWholeSign' : cuspOrb > 0 ? 'chains.cuspOrbNote' : 'chains.cuspOrbOff';

export function DispositorChains({ dispositors, cuspOrb, planets, elementColors }) {
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
  const rulers = dispositors.houses?.rulers;
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
        example={`${t('chains.housesExample')} ${t(houseRuleKey(dispositors.houses, cuspOrb), { orb: cuspOrb })}`}
        chains={dispositors.houses?.chains ?? null}
        view={houseView}
        t={t}
      />
    </div>
  );
}
