import { useMemo, useState, useEffect, useRef, useContext, useCallback } from 'react';
import { AlignLeft } from 'lucide-react';
import policyContent from '../../../docs/legal/PRIVACY_POLICY.md?raw';
import { extractToc, mdToHtml, TocItem } from './legalUtils';
import { LegalHeaderSlotContext } from '.';

// Height of the LegalShell sticky header (logo bar 56px + tabs ~48px + 4px buffer)
const HEADER_H = 108;

// ── TOC component ─────────────────────────────────────────────────────────────

function Toc({
  items,
  activeId,
  onSelect,
}: {
  items: TocItem[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);

  // Keep active item visible within the sidebar without a page scroll
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  return (
    <nav className="space-y-0.5">
      {items.map(item => {
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            ref={isActive ? activeRef : null}
            onClick={() => onSelect(item.id)}
            className={[
              'block w-full text-left py-1 text-xs leading-snug transition-colors rounded',
              item.level === 3 ? 'pl-3' : 'pl-0',
              isActive
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {item.title.replace(/^[\d.]+\s/, '')}
          </button>
        );
      })}
    </nav>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PrivacyPolicy = () => {
  const html    = useMemo(() => mdToHtml(policyContent), []);
  const toc     = useMemo(() => extractToc(policyContent), []);
  const h2Items = useMemo(() => toc.filter(t => t.level === 2), [toc]);

  const [activeId, setActiveId] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const setHeaderSlot = useContext(LegalHeaderSlotContext);

  // ── Scroll-based active section tracking ──────────────────────────────────
  useEffect(() => {
    const ids = toc.map(t => t.id);

    const update = () => {
      const threshold = HEADER_H + 16;
      let active = ids[0] ?? '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= threshold) {
          active = id;
        }
      }
      setActiveId(active);
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, [toc]);

  // ── Smooth scroll to section ───────────────────────────────────────────────
  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - HEADER_H - 8;
    window.scrollTo({ top: y, behavior: 'smooth' });
    setPanelOpen(false);
  }, []);

  // ── Close floating panel on outside click ─────────────────────────────────
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen]);

  // ── Inject Contents button into LegalShell header (mobile only) ───────────
  useEffect(() => {
    setHeaderSlot(
      <button
        onClick={() => setPanelOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Toggle table of contents"
      >
        <AlignLeft className="w-4 h-4" />
        Contents
      </button>,
    );
    return () => setHeaderSlot(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20">

      {/* ── Floating mobile TOC panel ─────────────────────────────────────── */}
      {panelOpen && (
        <div
          ref={panelRef}
          className="fixed right-4 z-50 w-72 bg-background border border-border shadow-xl rounded py-3 px-4 max-h-[65vh] overflow-y-auto lg:hidden"
          style={{ top: HEADER_H + 8 }}
        >
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">
            Sections
          </p>
          <Toc items={h2Items} activeId={activeId} onSelect={scrollTo} />
        </div>
      )}

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">

        {/* Sidebar — desktop only */}
        <aside className="hidden lg:block">
          <div className="sticky" style={{ top: HEADER_H + 16 }}>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">
              Contents
            </p>
            <Toc items={h2Items} activeId={activeId} onSelect={scrollTo} />
          </div>
        </aside>

        {/* Document */}
        <main>
          <div
            className="
              prose prose-sm sm:prose-base max-w-none
              prose-headings:font-display prose-headings:font-normal
              prose-h1:text-3xl prose-h1:mb-2
              prose-h2:text-xl prose-h2:mt-12 prose-h2:mb-4
                prose-h2:border-b prose-h2:border-border prose-h2:pb-2
              prose-h3:text-base prose-h3:mt-8 prose-h3:mb-3
              prose-h4:text-xs prose-h4:uppercase prose-h4:tracking-wider
                prose-h4:mt-6 prose-h4:mb-2 prose-h4:text-muted-foreground
              prose-p:text-sm prose-p:leading-relaxed
              prose-a:text-foreground prose-a:font-normal prose-a:underline-offset-2
              prose-strong:font-semibold
              prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5
                prose-code:rounded prose-code:font-normal
                prose-code:before:content-none prose-code:after:content-none
              prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-li:text-sm
              prose-hr:border-border prose-hr:my-8
              prose-table:text-xs prose-th:text-left prose-th:font-medium
                prose-th:py-2 prose-td:py-2 prose-td:align-top
            "
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </main>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
