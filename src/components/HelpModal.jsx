import { useRef } from 'react';
import { Modal } from './Modal';
import { HELP } from '../i18n/help';
import { useI18n } from '../i18n';

/**
 * How the app works, section by section, with buttons that open the settings tab, chart mode or
 * tab under the chart a section talks about.
 */
export function HelpModal({ open, onClose, onOpenSettings, onOpenMode, onOpenTab }) {
  const { lang, t } = useI18n();
  const sections = HELP[lang] ?? HELP.ru;
  const refs = useRef({});

  const linkLabel = (link) => {
    if (link.settings) return t('help.openSettings', { tab: t(`settings.tab.${link.settings}`) });
    if (link.mode) return t('help.openMode', { mode: t(`mode.${link.mode}`) });
    return t('help.openTab', { tab: t(`tab.${link.tab}`) });
  };
  const follow = (link) => {
    onClose();
    if (link.settings) onOpenSettings(link.settings);
    else if (link.mode) onOpenMode(link.mode);
    else onOpenTab(link.tab);
  };

  return (
    <Modal open={open} onClose={onClose} title={t('help.title')} width="max-w-3xl">
      <nav aria-label={t('help.contents')} className="mb-6 flex flex-wrap gap-1.5">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => refs.current[s.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
          >
            {s.title}
          </button>
        ))}
      </nav>
      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.id} ref={(el) => (refs.current[s.id] = el)} className="scroll-mt-2">
            <h3 className="mb-3 font-display text-xl font-semibold">{s.title}</h3>
            <dl className="space-y-2.5 text-sm leading-relaxed text-slate-700">
              {s.items.map((item, i) => (
                <div key={i}>
                  {item.term && <dt className="inline font-semibold text-slate-900">{item.term}. </dt>}
                  <dd className="inline">{item.text}</dd>
                </div>
              ))}
            </dl>
            {s.links.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {s.links.map((link) => (
                  <button key={linkLabel(link)} type="button" className="btn-ghost border border-slate-200 text-xs" onClick={() => follow(link)}>
                    {linkLabel(link)} →
                  </button>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </Modal>
  );
}
