import { useState } from 'react';
import { Modal } from './Modal';
import { Tabs } from './Tabs';
import { OBJECTS, EXTRA_OBJECTS, EXTRA_GROUPS, ASPECTS, HOUSE_SYSTEMS, NODE_TYPES, LILITH_TYPES } from '../utils/ephemeris';
import { ORB_METHODS, SEPARATING_MODES, ORB_PRESET_KEYS } from '../utils/aspects';
import { ELEMENTS } from '../utils/balance';
import { DEFAULT_SETTINGS } from '../utils/settings';
import { useI18n } from '../i18n';
import { Glyph } from './Glyph';

const TABS = ['params', 'objects', 'extras', 'orbs', 'method', 'colors'];

// Which settings keys each tab owns, for "reset tab". Objects and extras share `visible`
// and each resets only its own entries (see resetTab).
const TAB_KEYS = {
  params: ['houseSystem', 'nodeType', 'lilithType', 'highContrast'],
  orbs: ['aspects', 'returnOrbPreset', ...Object.values(ORB_PRESET_KEYS)],
  method: ['weights'],
  colors: ['colors'],
};
const TAB_OBJECTS = { objects: OBJECTS, extras: EXTRA_OBJECTS };

// Point groups that can be switched on for aspects (planets and Chiron always count).
const INCLUDE_GROUPS = ['angles', 'nodes', 'extras', 'moon'];


// Aspects that share one colour.
const ASPECT_COLOR_GROUPS = [['conjunction'], ['sextile', 'trine'], ['square'], ['opposition']];

const parseNumber = (value, fallback) => {
  const n = Number(value);
  return value !== '' && Number.isFinite(n) && n >= 0 ? n : fallback;
};

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-slate-500">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function ColorRow({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-xs text-slate-400">{value.toUpperCase()}</span>
        <input type="color" className="h-7 w-9 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5" value={value} onChange={(e) => onChange(e.target.value)} />
      </span>
    </label>
  );
}

function ParamsTab({ settings, update }) {
  const { t } = useI18n();
  return (
    <div>
      <Row label={t('settings.houseSystem')}>
        <select className="input" value={settings.houseSystem} onChange={(e) => update({ houseSystem: e.target.value })}>
          {HOUSE_SYSTEMS.map((h) => (
            <option key={h.id} value={h.id}>{t(`houseSystem.${h.key}`)}</option>
          ))}
        </select>
      </Row>
      <Row label={t('settings.nodeType')} hint={t('settings.nodeTypeHint')}>
        <select className="input" value={settings.nodeType} onChange={(e) => update({ nodeType: e.target.value })}>
          {NODE_TYPES.map((id) => (
            <option key={id} value={id}>{t(`nodeType.${id}`)}</option>
          ))}
        </select>
      </Row>
      <Row label={t('settings.lilithType')} hint={t('settings.lilithTypeHint')}>
        <select className="input" value={settings.lilithType} onChange={(e) => update({ lilithType: e.target.value })}>
          {LILITH_TYPES.map((id) => (
            <option key={id} value={id}>{t(`lilithType.${id}`)}</option>
          ))}
        </select>
      </Row>
      <Row label={t('settings.highContrast')} hint={t('settings.highContrastHint')}>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={settings.highContrast}
            onChange={(e) => update({ highContrast: e.target.checked })}
          />
          <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-slate-900 peer-focus-visible:ring-4 peer-focus-visible:ring-slate-200" />
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
        </label>
      </Row>
      <Row label={t('settings.zodiac')} hint={t('settings.zodiacHint')}>
        <select className="input" disabled value="tropical">
          <option value="tropical">{t('settings.zodiacValue')}</option>
        </select>
      </Row>
      <Row label={t('settings.orientation')} hint={t('settings.orientationHint')}>
        <span className="text-sm text-slate-500">ASC ←</span>
      </Row>
    </div>
  );
}

function ObjectsTab({ settings, update }) {
  const { t } = useI18n();
  const setAll = (value) => update({ visible: { ...settings.visible, ...Object.fromEntries(OBJECTS.map((o) => [o.id, value])) } });
  return (
    <div>
      <div className="mb-3 flex gap-2">
        <button type="button" className="btn-ghost" onClick={() => setAll(true)}>{t('settings.showAll')}</button>
        <button type="button" className="btn-ghost" onClick={() => setAll(false)}>{t('settings.hideAll')}</button>
      </div>
      <div className="grid gap-1 sm:grid-cols-2">
        {OBJECTS.map((o) => (
          <label key={o.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
            <input
              type="checkbox"
              className="h-4 w-4 accent-slate-900"
              checked={settings.visible[o.id]}
              onChange={(e) => update({ visible: { ...settings.visible, [o.id]: e.target.checked } })}
            />
            <span className="astro w-7 text-center text-base">{o.glyph}</span>
            {t(`object.${o.id}`)}
          </label>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {t('settings.objectsNote')}
      </p>
    </div>
  );
}

/** Search through the additional asteroids and points and switch them on or off. */
function ExtrasTab({ settings, update }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const toggle = (id, value) => update({ visible: { ...settings.visible, [id]: value } });
  const q = query.trim().toLowerCase();
  const matches = (o) =>
    !q || [t(`object.${o.id}`), t(`extra.${o.id}.hint`), o.glyph, o.id].some((s) => s.toLowerCase().includes(q));
  const added = EXTRA_OBJECTS.filter((o) => settings.visible[o.id]);

  const item = (o) => (
    <label key={o.id} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 accent-slate-900"
        checked={settings.visible[o.id]}
        onChange={(e) => toggle(o.id, e.target.checked)}
      />
      <Glyph of={o} className="w-7 shrink-0 text-center" symbolClass="astro text-base" />
      <span>
        <span className="font-medium">{t(`object.${o.id}`)}</span>
        <span className="block text-xs text-slate-500">{t(`extra.${o.id}.hint`)}</span>
      </span>
    </label>
  );

  return (
    <div className="space-y-5">
      <input
        type="search"
        className="input w-full"
        placeholder={t('extras.search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {!q && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{t('extras.added')}</h3>
          {added.length === 0 ? (
            <p className="text-sm text-slate-500">{t('extras.none')}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {added.map((o) => (
                <span key={o.id} className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-sm">
                  <Glyph of={o} symbolClass="astro text-base" />
                  {t(`object.${o.id}`)}
                  <button
                    type="button"
                    className="rounded-full px-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-900"
                    onClick={() => toggle(o.id, false)}
                    aria-label={t('extras.remove', { name: t(`object.${o.id}`) })}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {EXTRA_GROUPS.map((group) => {
        const items = EXTRA_OBJECTS.filter((o) => o.group === group && matches(o));
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{t(`extras.group.${group}`)}</h3>
            <div className="grid gap-1 sm:grid-cols-2">{items.map(item)}</div>
          </div>
        );
      })}
      {q && !EXTRA_OBJECTS.some(matches) && <p className="text-sm text-slate-500">{t('extras.notFound')}</p>}

      <p className="text-xs text-slate-500">{t('extras.note')}</p>
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap rounded-lg bg-slate-100 p-0.5 text-sm">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-md px-3 py-1 ${value === o.id ? 'bg-white font-semibold shadow-sm' : 'text-slate-600'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function OrbsTab({ settings, update }) {
  const { t } = useI18n();
  // Which orb table and formula are being edited: the natal chart or a forecast method.
  const [chart, setChart] = useState('natal');
  const aspects = settings.aspects;
  const setAspects = (patch) => update({ aspects: { ...aspects, ...patch } });
  // Forecast methods (aspects to the natal chart) have separating aspects and the forecast Moon.
  const forecast = chart in ORB_PRESET_KEYS;
  const presetKey = chart === 'returns' ? 'returnOrbPreset' : ORB_PRESET_KEYS[chart];
  const orbSource = presetKey ? settings[presetKey] : aspects;
  const setOrbSource = (patch) => (presetKey ? update({ [presetKey]: { ...orbSource, ...patch } }) : setAspects(patch));
  const setOrb = (objectId, aspectId, value) =>
    setOrbSource({ orbs: { ...orbSource.orbs, [objectId]: { ...orbSource.orbs[objectId], [aspectId]: value } } });
  const methods = ORB_METHODS.filter((m) => forecast || !m.transitOnly);

  return (
    <div className="space-y-5">
      <Row label={t('settings.orbChart')} hint={t(`settings.orbChart.${chart}Hint`)}>
        <Segmented
          options={['natal', ...Object.keys(ORB_PRESET_KEYS), 'returns'].map((id) => ({ id, label: t(`settings.orbChart.${id}`) }))}
          value={chart}
          onChange={setChart}
        />
      </Row>
      <Row label={t('settings.orbFormula')} hint={t(`orbMethod.${orbSource.method}.hint`)}>
        <Segmented
          options={methods.map((m) => ({ id: m.id, label: t(`orbMethod.${m.id}`) }))}
          value={orbSource.method}
          onChange={(method) => setOrbSource({ method })}
        />
      </Row>
      {forecast && (
        <Row label={t('settings.separating')} hint={t('settings.separatingHint', { orb: orbSource.separatingOrb })}>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <label className="flex items-center gap-1 text-sm text-slate-600">
              &gt;
              <input
                type="number"
                className="input-sm w-16 text-right"
                min={0}
                max={5}
                step={0.1}
                value={orbSource.separatingOrb}
                onChange={(e) => setOrbSource({ separatingOrb: Math.min(5, parseNumber(e.target.value, orbSource.separatingOrb)) })}
              />
              °
            </label>
            <Segmented
              options={SEPARATING_MODES.map((id) => ({ id, label: t(`settings.separating.${id}`) }))}
              value={orbSource.separating}
              onChange={(separating) => setOrbSource({ separating })}
            />
          </div>
        </Row>
      )}
      <Row label={t('settings.include')} hint={t(`settings.include.${chart}Hint`)}>
        <div className="flex flex-col items-start gap-1.5">
          {INCLUDE_GROUPS.filter((g) => forecast || g !== 'moon').map((g) => (
            <label key={g} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-slate-900"
                checked={Boolean(orbSource.include[g])}
                onChange={(e) => setOrbSource({ include: { ...orbSource.include, [g]: e.target.checked } })}
              />
              {t(g === 'moon' && chart !== 'transit' ? `settings.include.${chart}Moon` : `settings.include.${g}`)}
            </label>
          ))}
        </div>
      </Row>
      <Row label={t('settings.exact')} hint={t('settings.exactHint')}>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="number"
            className="input-sm w-16 text-right"
            min={0}
            max={100}
            step={5}
            value={aspects.exactPercent}
            onChange={(e) => setAspects({ exactPercent: Math.min(100, parseNumber(e.target.value, aspects.exactPercent)) })}
          />
          %
        </label>
      </Row>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">{t('table.object')}</th>
              {ASPECTS.map((a) => (
                <th key={a.id} className="px-2 py-2 font-medium">
                  <label className="flex cursor-pointer flex-col items-center gap-1" title={t('settings.aspectToggle', { aspect: t(`aspect.${a.id}`) })}>
                    <span className="astro text-base text-slate-700">{a.glyph}</span>
                    <span className="text-[10px] tabular-nums">{a.angle}°</span>
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-slate-900"
                      checked={aspects.enabled[a.id]}
                      onChange={(e) => setAspects({ enabled: { ...aspects.enabled, [a.id]: e.target.checked } })}
                    />
                  </label>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...OBJECTS, ...EXTRA_OBJECTS.filter((o) => settings.visible[o.id])].map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="whitespace-nowrap px-3 py-1.5">
                  <Glyph of={o} className="mr-2 inline-block w-6 text-center" symbolClass="astro text-base" />
                  {t(`object.${o.id}`)}
                </td>
                {ASPECTS.map((a) => (
                  <td key={a.id} className="px-1.5 py-1 text-center">
                    <input
                      type="number"
                      className={`input-sm w-14 text-right ${aspects.enabled[a.id] ? '' : 'opacity-40'}`}
                      min={0}
                      max={15}
                      step={0.5}
                      value={orbSource.orbs[o.id][a.id]}
                      onChange={(e) => setOrb(o.id, a.id, parseNumber(e.target.value, orbSource.orbs[o.id][a.id]))}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">{t('settings.orbsNote')}</p>
    </div>
  );
}

function MethodTab({ settings, update }) {
  const { t } = useI18n();
  const total = OBJECTS.reduce((sum, o) => sum + (settings.weights[o.id] ?? 0), 0);
  return (
    <div>
      <p className="mb-3 text-sm text-slate-600">
        {t('settings.methodNote')}
      </p>
      <div className="grid gap-x-8 sm:grid-cols-2">
        {OBJECTS.map((o) => (
          <label key={o.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 text-sm">
            <span>
              <span className="astro mr-2 inline-block w-6 text-center">{o.glyph}</span>
              {t(`object.${o.id}`)}
            </span>
            <input
              type="number"
              className="input-sm w-16 text-right"
              min={0}
              step={0.5}
              value={settings.weights[o.id] ?? 0}
              onChange={(e) =>
                update({ weights: { ...settings.weights, [o.id]: parseNumber(e.target.value, settings.weights[o.id] ?? 0) } })
              }
            />
          </label>
        ))}
      </div>
      <p className="mt-3 text-sm">
        {t('settings.total')} <span className="font-semibold tabular-nums">{total}</span> {t('settings.points')}
      </p>
    </div>
  );
}

function ColorsTab({ settings, update }) {
  const { t } = useI18n();
  const { elements, aspects } = settings.colors;
  const setColors = (patch) => update({ colors: { ...settings.colors, ...patch } });
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{t('balance.elements')}</h3>
        {ELEMENTS.map((e) => (
          <ColorRow key={e.id} label={t(`element.${e.id}`)} value={elements[e.id]} onChange={(v) => setColors({ elements: { ...elements, [e.id]: v } })} />
        ))}
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{t('tab.aspects')}</h3>
        {ASPECT_COLOR_GROUPS.map((ids) => {
          const group = ids.map((id) => ASPECTS.find((a) => a.id === id));
          const label = `${group.map((a) => a.glyph).join(' ')} ${group.map((a) => t(`aspect.${a.id}`)).join(' / ')}`;
          return (
            <ColorRow
              key={ids[0]}
              label={label}
              value={aspects[ids[0]]}
              onChange={(v) => setColors({ aspects: { ...aspects, ...Object.fromEntries(ids.map((id) => [id, v])) } })}
            />
          );
        })}
      </div>
    </div>
  );
}

export function SettingsModal({ open, initialTab = 'params', onClose, settings, onChange }) {
  const [tab, setTab] = useState(initialTab);
  const { t } = useI18n();
  const update = (patch) => onChange({ ...settings, ...patch });
  const resetTab = () =>
    TAB_OBJECTS[tab]
      ? update({ visible: { ...settings.visible, ...Object.fromEntries(TAB_OBJECTS[tab].map((o) => [o.id, DEFAULT_SETTINGS.visible[o.id]])) } })
      : update(Object.fromEntries(TAB_KEYS[tab].map((k) => [k, DEFAULT_SETTINGS[k]])));
  const props = { settings, update };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('settings.title')}
      width="max-w-3xl"
      footer={
        <>
          <div className="flex gap-1">
            <button type="button" className="btn-ghost" onClick={resetTab}>{t('settings.resetTab')}</button>
            <button type="button" className="btn-ghost" onClick={() => onChange(DEFAULT_SETTINGS)}>{t('settings.resetAll')}</button>
          </div>
          <button type="button" className="btn-primary" onClick={onClose}>{t('settings.done')}</button>
        </>
      }
    >
      <Tabs tabs={TABS.map((id) => ({ id, label: t(`settings.tab.${id}`) }))} active={tab} onChange={setTab} className="-mt-2 mb-5" />
      {tab === 'params' && <ParamsTab {...props} />}
      {tab === 'objects' && <ObjectsTab {...props} />}
      {tab === 'extras' && <ExtrasTab {...props} />}
      {tab === 'orbs' && <OrbsTab {...props} />}
      {tab === 'method' && <MethodTab {...props} />}
      {tab === 'colors' && <ColorsTab {...props} />}
    </Modal>
  );
}
