import React, { useEffect, useMemo, useState } from 'react';
import { SECTION_FROM_PATH, DEFAULT_SECTION_PALETTE, SectionKey, SectionPalette, applyPaletteToDocument, loadPalette, savePalette, getContrastOnAccent } from './utils/theme';

type Props = {
  pathname?: string;
};

const SECTIONS: Array<{ id: SectionKey; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'patients', label: 'Pacientes' },
  { id: 'resources', label: 'Recursos' },
  { id: 'admin', label: 'Admin' },
];

const StyleAgent: React.FC<Props> = ({ pathname }) => {
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState<SectionPalette>(DEFAULT_SECTION_PALETTE);
  const section: SectionKey = useMemo(() => SECTION_FROM_PATH(pathname || (typeof window !== 'undefined' ? window.location.pathname : '/')), [pathname]);

  useEffect(() => {
    const p = loadPalette();
    setPalette(p);
  }, []);

  useEffect(() => {
    applyPaletteToDocument(palette, section);
  }, [palette, section]);

  const updateColor = (id: SectionKey, value: string) => {
    const next = { ...palette, [id]: value } as SectionPalette;
    setPalette(next);
    savePalette(next);
    if (id === section) {
      const onAccent = getContrastOnAccent(value);
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--on-accent', onAccent);
      }
    }
  };

  const auditContrast = () => {
    if (typeof window === 'undefined') return;
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#000000';
    const accent = palette[section];
    const onAccent = getContrastOnAccent(accent);
    const ratio = (hex1: string, hex2: string) => {
      const toLum = (hex: string) => {
        const c = hex.replace('#', '');
        const r = parseInt(c.substring(0, 2), 16) / 255;
        const g = parseInt(c.substring(2, 4), 16) / 255;
        const b = parseInt(c.substring(4, 6), 16) / 255;
        const [R, G, B] = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
        return 0.2126 * (R as number) + 0.7152 * (G as number) + 0.0722 * (B as number);
      };
      const L1 = toLum(hex1);
      const L2 = toLum(hex2);
      const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
      return (a + 0.05) / (b + 0.05);
    };
    const results = {
      textOnBg: ratio('#ffffff', bg),
      textSecondaryOnBg: ratio('#c7c7c7', bg),
      onAccentText: ratio(onAccent === '#000000' ? '#000000' : '#ffffff', accent),
      accentBorderOnBg: ratio(accent, bg),
    };
    // Simple console report
    // eslint-disable-next-line no-console
    console.table(results);
    alert(
      `Contrast ratios (WCAG ≥ 4.5 recommended):\n` +
        `- Primary text on bg: ${results.textOnBg.toFixed(2)}\n` +
        `- Secondary text on bg: ${results.textSecondaryOnBg.toFixed(2)}\n` +
        `- Text on accent: ${results.onAccentText.toFixed(2)}\n` +
        `- Accent/border on bg: ${results.accentBorderOnBg.toFixed(2)}`
    );
  };

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1000 }}>
      {!open ? (
        <button
          type="button"
          aria-label="Open Style Agent"
          className="btn-accent rounded-full px-4 py-2 text-sm"
          onClick={() => setOpen(true)}
        >
          Style
        </button>
      ) : (
        <div className="medical-card" style={{ padding: '12px', width: 320 }}>
          <div className="flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong className="text-accent">Style Agent</strong>
            <button type="button" className="btn-soft rounded px-2 py-1 text-sm" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            Base is black/white. Pick sober accents per section.
          </div>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {SECTIONS.map((s) => (
              <label key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: 'var(--text-primary)' }}>{s.label}</span>
                <input
                  type="color"
                  value={palette[s.id]}
                  onChange={(e) => updateColor(s.id, e.target.value)}
                  aria-label={`Accent color for ${s.label}`}
                  style={{ width: 40, height: 24, border: '1px solid var(--border-primary)', background: 'transparent' }}
                />
              </label>
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="button" className="btn-accent rounded px-3 py-2 text-sm" onClick={auditContrast}>
              Audit Contrast
            </button>
            <button
              type="button"
              className="btn-soft rounded px-3 py-2 text-sm"
              onClick={() => {
                setPalette(DEFAULT_SECTION_PALETTE);
                savePalette(DEFAULT_SECTION_PALETTE);
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleAgent;

