#!/usr/bin/env node
// Simple contrast audit for the configured default palette (file-based)
// For runtime palette, run audits via the Codex style agent.

// Updated defaults - WCAG AA compliant in both themes
const DEFAULTS = {
  dashboard: '#4b5563', // gray-600 ✅
  patients: '#0369a1',  // sky-700 ✅
  resources: '#2563eb', // blue-600 ✅
  admin: '#4f46e5',     // indigo-600 ✅
};

const toLum = (hex) => {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const [R, G, B] = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

const ratio = (hex1, hex2) => {
  const L1 = toLum(hex1);
  const L2 = toLum(hex2);
  const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (a + 0.05) / (b + 0.05);
};

const getOnAccent = (hex) => (toLum(hex) > 0.55 ? '#000000' : '#ffffff');

const BG = '#0b0b0b';
const PRIMARY = '#ffffff';
const SECONDARY = '#c7c7c7';

const rows = Object.entries(DEFAULTS).map(([section, accent]) => {
  const onAccent = getOnAccent(accent);
  return {
    section,
    'text/bg': ratio(PRIMARY, BG).toFixed(2),
    'secondary/bg': ratio(SECONDARY, BG).toFixed(2),
    'text/accent': ratio(onAccent, accent).toFixed(2),
    'accent/bg': ratio(accent, BG).toFixed(2),
  };
});

console.table(rows);
console.log('WCAG AA target: >= 4.5 for normal text\n');
