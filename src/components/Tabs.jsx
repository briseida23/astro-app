import { useEffect, useRef, useState } from 'react';

// How wide the fade at a scrollable edge is, in pixels.
const FADE = 24;

/**
 * A row of tabs. When it is wider than the screen it scrolls sideways: an edge that has more tabs
 * beyond it fades out, and the active tab is scrolled into view.
 */
export function Tabs({ tabs, active, onChange, className = '' }) {
  const row = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const update = () => setEdges({ left: el.scrollLeft > 1, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 });
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [tabs.length]);

  // Only the row scrolls (scrollIntoView would move the page too); also when the order changes with the mode.
  const order = tabs.map((t) => t.id).join();
  useEffect(() => {
    const el = row.current;
    const tab = el?.querySelector('[aria-selected="true"]');
    if (!tab) return;
    if (tab.offsetLeft < el.scrollLeft || tab.offsetLeft + tab.offsetWidth > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: tab.offsetLeft - FADE, behavior: 'smooth' });
    }
  }, [active, order]);

  const mask = `linear-gradient(to right, ${edges.left ? 'transparent' : 'black'}, black ${FADE}px, black calc(100% - ${FADE}px), ${edges.right ? 'transparent' : 'black'})`;
  return (
    <div
      ref={row}
      role="tablist"
      className={`no-scrollbar relative flex gap-1 overflow-x-auto border-b border-slate-200 ${className}`}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
            active === tab.id
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {tab.label}
          {tab.badge != null && (
            <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] tabular-nums text-slate-500">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
