/** Class for an object's glyph: text labels (ASC, Cup…) small and bold, symbols in the symbol font. */
export const glyphClass = (p, symbolClass = 'astro') => (p.textGlyph ? 'text-[10px] font-bold' : symbolClass);
