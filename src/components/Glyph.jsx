import { glyphClass, crescentPath } from './glyphStyle';

/**
 * Selena (White Moon): Lilith's glyph ⚸ — a crescent over a cross — drawn hollow, white
 * inside a dark outline. Fits a box from -9.5 to 9.5 around 0,0.
 */
export function SelenaShape({ color, strokeWidth = 1.5 }) {
  return (
    <g stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
      <path d={crescentPath(6)} transform="translate(0,-3.5)" fill="#ffffff" />
      <path d="M0,2.5 V9.5 M-3.2,6.2 H3.2" fill="none" />
    </g>
  );
}

/** An object's glyph in text: font symbol, text label, or the drawn Selena glyph. */
export function Glyph({ of: p, className = '', symbolClass }) {
  if (p.hollow) {
    return (
      <span className={`${className} inline-flex items-center justify-center align-[-0.2em]`}>
        <svg viewBox="-10 -10 20 20" width="1em" height="1em" aria-hidden>
          <SelenaShape color={p.ink ?? 'currentColor'} />
        </svg>
      </span>
    );
  }
  return <span className={`${className} ${glyphClass(p, symbolClass)}`}>{p.glyph}</span>;
}
