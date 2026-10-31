import { useState } from 'react';
import { SIGNS, ROMAN, normalize, formatDegree, formatOrb } from '../utils/ephemeris';
import { useI18n } from '../i18n';
import { Glyph, SelenaShape } from './Glyph';

const SIZE = 640;
const C = SIZE / 2;
const R_OUTER = 280; // outer edge of the zodiac band
const R_ZODIAC = 243; // inner edge of the zodiac band
const MIN_GAP = 7.5; // degrees between planet glyphs before they are spread apart
const ANGLE_LABELS = { 0: 'ASC', 3: 'IC', 6: 'DSC', 9: 'MC' };
// The symbol font draws ♂, ♀ and ☿ smaller (shorter or narrower) than the other planets.
const GLYPH_SCALE = { mars: 1.3, venus: 1.2, mercury: 1.12 };
// Text labels (ASC, Cup, Pho…) need a smaller size to fit the planet circle.
const glyphSize = (planet) => (planet.textGlyph ? (planet.glyph.length > 2 ? 10 : 11.5) : 20 * (GLYPH_SCALE[planet.id] ?? 1));

/** Standard notation after the orb: A — applying, S — separating. */
function Motion({ applying }) {
  const { t } = useI18n();
  return (
    <span
      title={t(applying ? 'aspects.applying' : 'aspects.separating')}
      className={`font-semibold ${applying ? 'text-emerald-700' : 'text-slate-500'}`}
    >
      {applying ? 'A' : 'S'}
    </span>
  );
}

const LINE_STRONG = '#0F172A';

/** `hex` mixed with black by `amount` (0–1): element colours darkened enough to read on white. */
function darken(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const channel = (shift) => Math.round(((n >> shift) & 255) * (1 - amount));
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

/** Line colours, text scale and glyph ink; high contrast is darker, thicker and larger. */
const theme = (highContrast) =>
  highContrast
    ? { LINE: '#334155', MUTED: '#0F172A', LABEL: '#000000', fs: 1.3, glyphScale: 1.2, ink: (hex) => darken(hex, 0.55), aspectWidth: 2.4, cuspWidth: 1.3, glyphStroke: 0.7 }
    : { LINE: '#94A3B8', MUTED: '#475569', LABEL: '#1E293B', fs: 1.1, glyphScale: 1, ink: (hex) => darken(hex, 0.25), aspectWidth: 1.4, cuspWidth: 0.8, glyphStroke: 0 };

// Ring radii. The bi-wheel adds a transit ring inside the zodiac band.
const LAYOUT = {
  natal: { natalGlyph: 224, natalDegree: 204, houseOuter: 188, houseNumber: 176, aspects: 164 },
  transit: {
    transitGlyph: 233, transitDegree: 213, transitInner: 203,
    natalGlyph: 188, natalDegree: 171, houseOuter: 160, houseNumber: 149, aspects: 138,
  },
};

// Ascendant on the left, zodiac running counter-clockwise.
function point(longitude, radius, ascendant) {
  const theta = ((normalize(longitude - ascendant) + 180) * Math.PI) / 180;
  return { x: C + radius * Math.cos(theta), y: C - radius * Math.sin(theta) };
}

function sectorPath(startLon, endLon, rOuter, rInner, ascendant) {
  const a = point(startLon, rOuter, ascendant);
  const b = point(endLon, rOuter, ascendant);
  const c = point(endLon, rInner, ascendant);
  const d = point(startLon, rInner, ascendant);
  return `M${a.x},${a.y} A${rOuter},${rOuter} 0 0 0 ${b.x},${b.y} L${c.x},${c.y} A${rInner},${rInner} 0 0 1 ${d.x},${d.y} Z`;
}

// Conjunction loop: how far it reaches into the chart (px) and how wide it opens (degrees).
const LOOP_DEPTH = 28;
const LOOP_SPREAD = 5;

/**
 * Path of an aspect line on the aspect circle of radius `r`. A conjunction joins two nearly
 * coinciding points, so a straight line would be invisible: it is drawn as a teardrop loop
 * reaching into the chart instead.
 */
function aspectPath(aspect, r, ascendant) {
  const a = point(aspect.a.longitude, r, ascendant);
  const b = point(aspect.b.longitude, r, ascendant);
  if (aspect.type !== 'conjunction') return `M${a.x},${a.y} L${b.x},${b.y}`;
  // Order the ends along the zodiac so the loop opens the same way whatever their order.
  const delta = normalize(aspect.b.longitude - aspect.a.longitude);
  const [from, to] = delta <= 180 ? [aspect.a.longitude, aspect.b.longitude] : [aspect.b.longitude, aspect.a.longitude];
  const start = point(from, r, ascendant);
  const end = point(to, r, ascendant);
  const c1 = point(from - LOOP_SPREAD, r - LOOP_DEPTH, ascendant);
  const c2 = point(to + LOOP_SPREAD, r - LOOP_DEPTH, ascendant);
  return `M${start.x},${start.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`;
}

function spreadPlanets(planets) {
  const sorted = [...planets].sort((a, b) => a.longitude - b.longitude);
  if (sorted.length < 2) return sorted.map((p) => ({ ...p, displayLon: p.longitude }));
  // Start after the widest empty arc, so a cluster around 0° Aries is spread as one group.
  let start = 0;
  let widest = -1;
  sorted.forEach((p, i) => {
    const next = sorted[(i + 1) % sorted.length];
    const gap = normalize(next.longitude - p.longitude);
    if (gap > widest) {
      widest = gap;
      start = (i + 1) % sorted.length;
    }
  });
  const base = sorted[start].longitude;
  const display = [...sorted.slice(start), ...sorted.slice(0, start)].map((p) => ({
    ...p,
    displayLon: base + normalize(p.longitude - base),
  }));
  for (let i = 1; i < display.length; i++) {
    const gap = display[i].displayLon - display[i - 1].displayLon;
    if (gap < MIN_GAP) display[i].displayLon = display[i - 1].displayLon + MIN_GAP;
  }
  return display;
}

function TooltipBody({ hover, aspects, points, houses, angleCusps, isBiWheel }) {
  const { t } = useI18n();
  const ringLabel = (p) => (isBiWheel ? t(`wheel.${p.ring}Prefix`) : '');
  const name = (p) => t(`object.${p.id}`);
  if (hover.type === 'aspect') {
    const aspect = aspects.find((a) => a.id === hover.id);
    if (!aspect) return null;
    return (
      <>
        <div className="font-semibold">
          <span className="astro">{aspect.glyph}</span> {t(`aspect.${aspect.type}`)} {aspect.angle}°
          {aspect.exact && <span className="ml-1.5 rounded bg-slate-900 px-1 text-[10px] text-white">{t('legend.exact')}</span>}
        </div>
        <div>
          {ringLabel(aspect.a)}{name(aspect.a)} <span className="astro">{aspect.glyph}</span>{' '}
          {ringLabel(aspect.b)}{name(aspect.b)}
        </div>
        <div className="tabular-nums">
          {t('wheel.orb', { orb: formatOrb(aspect.orb) })} <Motion applying={aspect.applying} />{' '}
          <span className="text-slate-400">{t('wheel.orbOf', { allowed: formatOrb(aspect.allowed) })}</span>
        </div>
      </>
    );
  }
  if (hover.type === 'planet') {
    const planet = points.find((p) => p.key === hover.key);
    if (!planet) return null;
    const own = aspects.filter((a) => a.a.key === hover.key || a.b.key === hover.key);
    return (
      <>
        <div className="font-semibold">
          <Glyph of={planet} /> {ringLabel(planet)}{name(planet)}
          {planet.retrograde && <span className="ml-1 text-red-600">R</span>}
        </div>
        <div>
          <span className="astro">{planet.sign.glyph}</span> {t(`sign.${planet.sign.id}`)} {planet.degree} ·{' '}
          {t('wheel.house', { house: ROMAN[planet.house - 1] })}
        </div>
        {own.length > 0 && (
          <ul className="mt-1.5 space-y-0.5 border-t border-slate-100 pt-1.5">
            {own.map((a) => {
              const other = a.a.key === hover.key ? a.b : a.a;
              return (
                <li key={a.id} className="tabular-nums">
                  <span className="astro">{a.glyph}</span> {ringLabel(other)}{name(other)} — {formatOrb(a.orb)}{' '}
                  <Motion applying={a.applying} />
                </li>
              );
            })}
          </ul>
        )}
      </>
    );
  }
  if (hover.type === 'sign') {
    const sign = SIGNS[hover.index];
    return (
      <>
        <div className="font-semibold">
          <span className="astro">{sign.glyph}</span> {t(`sign.${sign.id}`)}
        </div>
        <div>
          {t(`element.${sign.element}`)} · {t('balance.cross', { modality: t(`modality.${sign.modality}`) })}
        </div>
      </>
    );
  }
  if (hover.type === 'house') {
    const cusp = houses[hover.index];
    const sign = SIGNS[Math.floor(cusp / 30)];
    return (
      <>
        <div className="font-semibold">
          {t('wheel.house', { house: ROMAN[hover.index] })}{angleCusps.has(hover.index) ? ` · ${ANGLE_LABELS[hover.index]}` : ''}
        </div>
        <div>
          {t('wheel.cusp')} <span className="astro">{sign.glyph}</span> {t(`sign.${sign.id}`)} {formatDegree(cusp)}
        </div>
      </>
    );
  }
  return null;
}

export function ChartWheel({ chartData, planets, angles, transitPlanets, aspects, elementColors, aspectColors, hover, focus, onHover, highContrast = false }) {
  const { LINE, MUTED, LABEL, fs, glyphScale, ink, aspectWidth, cuspWidth, glyphStroke } = theme(highContrast);
  const [pointer, setPointer] = useState(null);
  const { t } = useI18n();
  const { ascendant, mc, houses } = chartData;
  // Cusps 1, 4, 7 and 10 are the angles in quadrant systems; with Equal or Whole Sign houses
  // they need not be, and the real axes are drawn separately.
  const axes = [
    { label: 'ASC', lon: ascendant, cusp: 0 },
    { label: 'IC', lon: normalize(mc + 180), cusp: 3 },
    { label: 'DSC', lon: normalize(ascendant + 180), cusp: 6 },
    { label: 'MC', lon: mc, cusp: 9 },
  ];
  const onCusp = (axis) => Math.abs(normalize(houses[axis.cusp] - axis.lon + 180) - 180) < 0.01;
  const angleCusps = new Set(axes.filter(onCusp).map((a) => a.cusp));
  const isBiWheel = Boolean(transitPlanets);
  const layout = isBiWheel ? LAYOUT.transit : LAYOUT.natal;
  const allPoints = [...planets, ...angles, ...(transitPlanets ?? [])];

  const trackPointer = (e) => {
    const rect = e.currentTarget.closest('[data-wheel]').getBoundingClientRect();
    setPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top, width: rect.width });
  };
  const hoverProps = (h) => ({
    onMouseEnter: (e) => {
      trackPointer(e);
      onHover(h);
    },
    onMouseMove: trackPointer,
    onMouseLeave: () => {
      setPointer(null);
      onHover(null);
    },
    className: 'cursor-pointer',
  });

  const renderPlanets = (list, glyphRadius, degreeRadius, outer = false) =>
    spreadPlanets(list).map((planet) => {
      const glyph = point(planet.displayLon, glyphRadius, ascendant);
      const degree = point(planet.displayLon, degreeRadius, ascendant);
      const tickA = point(planet.longitude, R_ZODIAC, ascendant);
      const tickB = point(planet.longitude, R_ZODIAC - 7, ascendant);
      const leader = point(planet.displayLon, glyphRadius + 12, ascendant);
      const active = focus?.planets.has(planet.key);
      const dimmed = focus && !active;
      const color = planet.ink ?? ink(elementColors[planet.element]);
      const isTransit = outer;
      return (
        <g key={planet.key} {...hoverProps({ type: 'planet', key: planet.key })} opacity={dimmed ? 0.45 : 1}>
          <line x1={tickA.x} y1={tickA.y} x2={tickB.x} y2={tickB.y} stroke={color} strokeWidth={1.5} />
          <line x1={tickB.x} y1={tickB.y} x2={leader.x} y2={leader.y} stroke={color} strokeOpacity={0.5} strokeWidth={0.7} />
          <circle
            cx={glyph.x}
            cy={glyph.y}
            r={13.5}
            fill={active ? color : '#ffffff'}
            fillOpacity={active ? 0.14 : 0}
            stroke={isTransit ? color : 'none'}
            strokeOpacity={0.5}
            strokeWidth={0.75}
            strokeDasharray={isTransit ? '2 2' : undefined}
          />
          {planet.hollow ? (
            <g transform={`translate(${glyph.x},${glyph.y}) scale(${glyphScale})`}>
              <SelenaShape color={color} strokeWidth={highContrast ? 1.9 : 1.5} />
            </g>
          ) : (
            <text
              x={glyph.x}
              y={glyph.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={glyphSize(planet) * glyphScale}
              fontWeight={planet.textGlyph ? 700 : undefined}
              fill={color}
              // Symbol fonts have no bold: a thin outline in the same colour thickens the strokes.
              stroke={glyphStroke ? color : undefined}
              strokeWidth={glyphStroke || undefined}
              className={planet.textGlyph ? undefined : 'astro'}
            >
              {planet.glyph}
            </text>
          )}
          {planet.retrograde && (
            <text x={glyph.x + 10} y={glyph.y + 10} fontSize={9 * fs} fontWeight="700" fill="#B91C1C">R</text>
          )}
          {degreeRadius && (
            <text x={degree.x} y={degree.y} textAnchor="middle" dominantBaseline="central" fontSize={9.5 * fs} fontWeight={600} fill={LABEL} className="tabular-nums">
              {Math.floor(planet.longitude % 30)}°
            </text>
          )}
        </g>
      );
    });

  const flipX = pointer && pointer.x > pointer.width * 0.58;

  return (
    <div data-wheel className="relative mx-auto w-full max-w-[680px]">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full select-none" role="img" aria-label={t('wheel.label')}>
        {/* Zodiac band */}
        {SIGNS.map((sign, i) => {
          const start = i * 30;
          const mid = point(start + 15, (R_OUTER + R_ZODIAC) / 2, ascendant);
          const boundaryA = point(start, R_OUTER, ascendant);
          const boundaryB = point(start, R_ZODIAC, ascendant);
          return (
            <g key={sign.name} {...hoverProps({ type: 'sign', index: i })}>
              <path d={sectorPath(start, start + 30, R_OUTER, R_ZODIAC, ascendant)} fill={elementColors[sign.element]} fillOpacity={highContrast ? 0.14 : 0.1} />
              <line x1={boundaryA.x} y1={boundaryA.y} x2={boundaryB.x} y2={boundaryB.y} stroke={LINE} strokeWidth={0.75} />
              <text x={mid.x} y={mid.y} textAnchor="middle" dominantBaseline="central" fontSize={19 * glyphScale} fill={ink(elementColors[sign.element])} className="astro">
                {sign.glyph}
              </text>
            </g>
          );
        })}

        {/* Degree scale on the inner edge of the zodiac */}
        {Array.from({ length: 360 }, (_, deg) => {
          const len = deg % 10 === 0 ? 7 : deg % 5 === 0 ? 4.5 : 2.5;
          const a = point(deg, R_ZODIAC, ascendant);
          const b = point(deg, R_ZODIAC + len, ascendant);
          return <line key={deg} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={MUTED} strokeWidth={deg % 5 === 0 ? 0.6 : 0.4} />;
        })}

        <circle cx={C} cy={C} r={R_OUTER} fill="none" stroke={LINE} strokeWidth={0.9} />
        <circle cx={C} cy={C} r={R_ZODIAC} fill="none" stroke={LINE} strokeWidth={0.9} />
        {isBiWheel && <circle cx={C} cy={C} r={layout.transitInner} fill="none" stroke={LINE} strokeWidth={0.6} strokeDasharray="1.5 3" />}
        <circle cx={C} cy={C} r={layout.houseOuter} fill="none" stroke={LINE} strokeWidth={0.6} />
        <circle cx={C} cy={C} r={layout.aspects} fill="#FCFCFD" stroke={LINE} strokeWidth={0.9} />

        {/* House cusps: extended through the zodiac band, angles emphasised */}
        {houses.map((cusp, i) => {
          const isAngle = angleCusps.has(i);
          const active = focus?.house === i;
          const inner = point(cusp, layout.aspects, ascendant);
          const outer = point(cusp, isAngle ? R_OUTER + 9 : R_OUTER, ascendant);
          const next = houses[(i + 1) % 12];
          const number = point(cusp + normalize(next - cusp) / 2, layout.houseNumber, ascendant);
          const label = point(cusp, isAngle ? R_OUTER + 13 : R_OUTER + 7, ascendant);
          // Anchor labels away from the circle so they never overlap the ring.
          const anchor = label.x < C - 12 ? 'end' : label.x > C + 12 ? 'start' : 'middle';
          const sign = SIGNS[Math.floor(cusp / 30)];
          return (
            <g key={i} {...hoverProps({ type: 'house', index: i })}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="transparent" strokeWidth={8} />
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={isAngle || active ? LINE_STRONG : MUTED}
                strokeWidth={active ? 2 : isAngle ? 1.6 : cuspWidth}
                strokeOpacity={isAngle || active ? 0.9 : 0.8}
              />
              <text
                x={number.x}
                y={number.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11 * fs}
                letterSpacing="0.5"
                fontWeight={active ? 800 : 600}
                fill={active ? LINE_STRONG : LABEL}
                className="font-display"
              >
                {ROMAN[i]}
              </text>
              {isAngle ? (
                <text x={label.x} y={label.y - 5} textAnchor={anchor} fontSize={9.5 * fs} fill={LINE_STRONG}>
                  <tspan fontWeight={700} letterSpacing="0.5">{ANGLE_LABELS[i]}</tspan>
                  <tspan x={label.x} dy="11" fontSize={8.5 * fs} className="tabular-nums">{Math.floor(cusp % 30)}°</tspan>
                  <tspan className="astro" fontSize={8.5 * fs} fill={ink(elementColors[sign.element])}>{sign.glyph}</tspan>
                </text>
              ) : (
                <text x={label.x} y={label.y} textAnchor={anchor} dominantBaseline="central" fontSize={9 * fs} fontWeight={600} fill={LABEL}>
                  <tspan className="tabular-nums">{Math.floor(cusp % 30)}°</tspan>
                  <tspan className="astro" fill={ink(elementColors[sign.element])}>{sign.glyph}</tspan>
                </text>
              )}
            </g>
          );
        })}

        {/* Angles that do not fall on a cusp (Equal, Whole Sign houses): their own axis lines */}
        {axes
          .filter((axis) => !angleCusps.has(axis.cusp))
          .map((axis) => {
            const inner = point(axis.lon, layout.aspects, ascendant);
            const outer = point(axis.lon, R_OUTER + 9, ascendant);
            const label = point(axis.lon, R_OUTER + 13, ascendant);
            const anchor = label.x < C - 12 ? 'end' : label.x > C + 12 ? 'start' : 'middle';
            const sign = SIGNS[Math.floor(axis.lon / 30)];
            return (
              <g key={axis.label}>
                <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={LINE_STRONG} strokeWidth={1.4} strokeOpacity={0.9} />
                <text x={label.x} y={label.y - 5} textAnchor={anchor} fontSize={9.5 * fs} fill={LINE_STRONG}>
                  <tspan fontWeight={700} letterSpacing="0.5">{axis.label}</tspan>
                  <tspan x={label.x} dy="11" fontSize={8.5 * fs} className="tabular-nums">{Math.floor(axis.lon % 30)}°</tspan>
                  <tspan className="astro" fontSize={8.5 * fs} fill={ink(elementColors[sign.element])}>{sign.glyph}</tspan>
                </text>
              </g>
            );
          })}

        {/* Aspect lines; exact aspects (within the set % of the orb) are drawn heavier */}
        {aspects.map((aspect) => {
          const d = aspectPath(aspect, layout.aspects, ascendant);
          const active = focus?.aspects.has(aspect.id);
          const dimmed = focus && !active;
          return (
            <g key={aspect.id} {...hoverProps({ type: 'aspect', id: aspect.id })}>
              {/* Soft halo behind highlighted lines so they stand out from the rest. */}
              {active && (
                <path d={d} fill="none" stroke={aspectColors[aspect.type]} strokeWidth={7} strokeOpacity={0.15} strokeLinecap="round" />
              )}
              <path
                d={d}
                fill="none"
                stroke={aspectColors[aspect.type]}
                strokeWidth={(active ? 1.5 : 0) + (aspect.exact ? aspectWidth + 1.2 : aspectWidth)}
                strokeOpacity={dimmed ? 0.15 : active ? 1 : aspect.faded ? 0.35 : highContrast ? 1 : 0.9}
                strokeDasharray={aspect.applying ? undefined : '4 3'}
                strokeLinecap="round"
              />
              {/* Wider invisible stroke so thin lines are easy to hover. */}
              <path d={d} fill="none" stroke="transparent" strokeWidth={9} />
            </g>
          );
        })}

        {renderPlanets(planets, layout.natalGlyph, layout.natalDegree)}
        {isBiWheel && renderPlanets(transitPlanets, layout.transitGlyph, layout.transitDegree, true)}
      </svg>

      {pointer && hover && hover.type !== 'pattern' && (
        <div
          className="pointer-events-none absolute z-10 w-max max-w-64 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs leading-relaxed text-slate-900 shadow-xl backdrop-blur"
          style={{ left: pointer.x, top: pointer.y, transform: `translate(${flipX ? 'calc(-100% - 14px)' : '14px'}, 14px)` }}
        >
          <TooltipBody hover={hover} aspects={aspects} points={allPoints} houses={houses} angleCusps={angleCusps} isBiWheel={isBiWheel} />
        </div>
      )}
    </div>
  );
}
