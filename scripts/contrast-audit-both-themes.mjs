#!/usr/bin/env node
// Comprehensive contrast audit for BOTH light and dark themes
// Audits the configured default palette against WCAG AA standards

const DEFAULTS = {
  dashboard: '#4b5563', // gray-600
  patients: '#0369a1',  // sky-700
  resources: '#2563eb', // blue-600
  admin: '#4f46e5',     // indigo-600
};

// Light theme colors
const LIGHT = {
  bg: '#ffffff',
  text: '#111827',
  textSecondary: '#4b5563',
};

// Dark theme colors
const DARK = {
  bg: '#0b0b0b',
  text: '#ffffff',
  textSecondary: '#c7c7c7',
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

const auditTheme = (themeName, colors) => {
  console.log(`\n📊 ${themeName} THEME CONTRAST AUDIT\n${'='.repeat(60)}`);

  const rows = Object.entries(DEFAULTS).map(([section, accent]) => {
    const onAccent = getOnAccent(accent);
    const textAccentRatio = ratio(onAccent, accent);
    const accentBgRatio = ratio(accent, colors.bg);
    const textBgRatio = ratio(colors.text, colors.bg);
    const secondaryBgRatio = ratio(colors.textSecondary, colors.bg);

    return {
      section,
      'text/bg': textBgRatio.toFixed(2),
      'secondary/bg': secondaryBgRatio.toFixed(2),
      'accent/bg': accentBgRatio.toFixed(2),
      'text/accent': textAccentRatio.toFixed(2),
      'WCAG': textAccentRatio >= 4.5 ? '✅ PASS' : '❌ FAIL'
    };
  });

  console.table(rows);

  // Summary
  const failures = rows.filter(r => parseFloat(r['text/accent']) < 4.5);
  if (failures.length === 0) {
    console.log('✅ All sections PASS WCAG AA (4.5:1) for normal text\n');
  } else {
    console.log(`⚠️  ${failures.length} section(s) FAIL WCAG AA:\n`);
    failures.forEach(f => {
      console.log(`   - ${f.section}: ${f['text/accent']} (needs ≥ 4.5)`);
    });
    console.log();
  }
};

console.log('\n🎨 COMPREHENSIVE CONTRAST AUDIT - HUBJR V2');
console.log('WCAG AA Standard: ≥ 4.5:1 for normal text, ≥ 3:1 for large text\n');

auditTheme('LIGHT', LIGHT);
auditTheme('DARK', DARK);

console.log('✨ Audit complete!\n');
