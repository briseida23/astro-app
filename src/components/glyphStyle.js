/** Class for an object's glyph: text labels (ASC, Cup…) small and bold, symbols in the symbol font. */
export const glyphClass = (p, symbolClass = 'astro') => (p.textGlyph ? 'text-[10px] font-bold' : symbolClass);

/** Outline of a crescent open to the right, centred on 0,0 with outer radius `r`. */
export function crescentPath(r) {
  // Offset of the circle cut out of the disc: wide enough that the crescent stays white
  // inside its outline even at small sizes.
  const d = r * 1.05;
  const h = Math.sqrt(r * r - (d * d) / 4);
  return `M${d / 2},${-h} A${r},${r} 0 1 0 ${d / 2},${h} A${r},${r} 0 0 1 ${d / 2},${-h} Z`;
}
