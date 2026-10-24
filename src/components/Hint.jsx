/**
 * A glyph with its name in a small tooltip, shown on hover, on keyboard focus and on tap
 * (touch screens have no hover; a tap focuses the element). Screen readers get the name instead
 * of the glyph.
 */
export function Hint({ label, children }) {
  return (
    <span tabIndex={0} aria-label={label} className="group/hint relative inline-flex cursor-default rounded outline-none focus-visible:ring-2 focus-visible:ring-slate-300">
      <span aria-hidden className="inline-flex items-center">
        {children}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-0 z-20 mb-1 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 font-sans text-xs font-medium normal-case tracking-normal text-white opacity-0 shadow-lg transition-opacity group-hover/hint:visible group-hover/hint:opacity-100 group-focus/hint:visible group-focus/hint:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
