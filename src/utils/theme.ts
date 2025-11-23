export type SectionKey = 'dashboard' | 'patients' | 'resources' | 'admin';

export type SectionPalette = Record<SectionKey, string>;

export const DEFAULT_SECTION_PALETTE: SectionPalette = {
  dashboard: '#4b5563', /* gray-600 - WCAG AA ✅ (7.56:1) */
  patients: '#0369a1',  /* sky-700 - WCAG AA ✅ (5.88:1) */
  resources: '#2563eb', /* blue-600 - WCAG AA ✅ (5.17:1) */
  admin: '#4f46e5',     /* indigo-600 - WCAG AA ✅ (6.29:1) */
};

export const SECTION_FROM_PATH = (pathname: string): SectionKey => {
  const p = pathname.toLowerCase();
  if (p.includes('/patients')) return 'patients';
  if (p.includes('/resources')) return 'resources';
  if (p.includes('/admin')) return 'admin';
  return 'dashboard';
};

export const getContrastOnAccent = (hexColor: string): '#000000' | '#ffffff' => {
  const c = hexColor.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const srgb = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  const [R, G, B] = srgb as [number, number, number];
  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  // Choose text color with better contrast on the accent background
  return luminance > 0.55 ? '#000000' : '#ffffff';
};

export const applyPaletteToDocument = (palette: SectionPalette, section: SectionKey) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--accent-dashboard', palette.dashboard);
  root.style.setProperty('--accent-patients', palette.patients);
  root.style.setProperty('--accent-resources', palette.resources);
  root.style.setProperty('--accent-admin', palette.admin);
  const onAccent = getContrastOnAccent(palette[section]);
  root.style.setProperty('--on-accent', onAccent);
  document.body.dataset.section = section;
};

export const loadPalette = (): SectionPalette => {
  try {
    const raw = localStorage.getItem('hubjr_style_palette');
    if (!raw) return DEFAULT_SECTION_PALETTE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SECTION_PALETTE, ...parsed } as SectionPalette;
  } catch {
    return DEFAULT_SECTION_PALETTE;
  }
};

export const savePalette = (palette: SectionPalette) => {
  try {
    localStorage.setItem('hubjr_style_palette', JSON.stringify(palette));
  } catch {}
};

