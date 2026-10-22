export function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div role="tablist" className={`flex gap-1 overflow-x-auto border-b border-slate-200 ${className}`}>
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
