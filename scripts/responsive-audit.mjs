import { chromium } from 'playwright';

const VIEWPORTS = [
  { name: 'mobile-portrait', width: 375, height: 812 },
  { name: 'mobile-landscape', width: 812, height: 375 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'wide-desktop', width: 1440, height: 900 }
];

const targets = process.argv.slice(2);
const urls = targets.length ? targets : [process.env.AUDIT_URL || 'http://localhost:3000'];

function describeElement(el) {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const classes = Array.from(el.classList || []).map((cls) => `.${cls}`).join('');
  return `${tag}${id}${classes}` || tag;
}

async function collectOverflow(page) {
  return page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const docWidth = document.documentElement.scrollWidth;
    const hasOverflow = docWidth > viewportWidth + 1;

    if (!hasOverflow) {
      return { hasOverflow, viewportWidth, docWidth, offenders: [] };
    }

    const offenders = Array.from(document.body.querySelectorAll('*'))
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.right > viewportWidth + 1 || rect.width > viewportWidth + 1;
      })
      .slice(0, 15)
      .map((el) => {
        const rect = el.getBoundingClientRect();
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const classes = Array.from(el.classList || []).map((cls) => `.${cls}`).join('');
        return {
          selector: `${tag}${id}${classes}` || tag,
          width: Math.round(rect.width),
          right: Math.round(rect.right),
          top: Math.round(rect.top)
        };
      });

    return { hasOverflow, viewportWidth, docWidth, offenders };
  });
}

async function run() {
  const browser = await chromium.launch();
  const summary = [];

  try {
    for (const url of urls) {
      for (const viewport of VIEWPORTS) {
        const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1200);

        const overflow = await collectOverflow(page);
        const issues = [];

        if (overflow.hasOverflow) {
          issues.push(`Overflow: doc width ${overflow.docWidth}px exceeds viewport ${overflow.viewportWidth}px`);
          if (overflow.offenders.length) {
            issues.push('Top offending selectors:');
            overflow.offenders.forEach((offender) => {
              issues.push(`  - ${offender.selector} (width: ${offender.width}px, right edge: ${offender.right}px, top: ${offender.top}px)`);
            });
          }
        }

        const pageTitle = await page.title();
        summary.push({
          url,
          viewport: viewport.name,
          width: viewport.width,
          height: viewport.height,
          title: pageTitle,
          issues: issues.length ? issues : ['No horizontal overflow detected']
        });

        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  console.log('Responsive layout audit\n=========================');
  for (const entry of summary) {
    console.log(`\nURL: ${entry.url}`);
    console.log(`Viewport: ${entry.viewport} (${entry.width}x${entry.height})`);
    console.log(`Title: ${entry.title || 'n/a'}`);
    entry.issues.forEach((line) => console.log(line));
  }

  const problematic = summary.filter((entry) => entry.issues[0].startsWith('Overflow'));
  if (problematic.length) {
    console.error(`\nFound ${problematic.length} viewport(s) with horizontal overflow.`);
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('Responsive audit failed:', err);
  process.exitCode = 1;
});
