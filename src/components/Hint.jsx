/**
 * A glyph with its name in a small tooltip, shown on hover, on keyboard focus and on tap
 * (touch screens have no hover; a tap focuses the element). Screen readers get the name instead
 * of the glyph. Hidden with display: none, so a tooltip near the screen's edge does not widen the page.
 */
export function Hint({ label, children }) {
  return (
    <span tabIndex={0} aria-label={label} className="group/hint relative inline-flex cursor-default rounded outline-none focus-visible:ring-2 focus-visible:ring-slate-300">
      <span aria-hidden className="inline-flex items-center">
        {children}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-20 mb-1 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 font-sans text-xs font-medium normal-case tracking-normal text-white shadow-lg group-hover/hint:block group-focus/hint:block"
      >
        {label}
      </span>
    </span>
  );
}
