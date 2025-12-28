// Script de validación de diseño responsivo para Interconsultas
// Usa Playwright para capturar screenshots en diferentes viewports móviles

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const screenshotsDir = join(projectRoot, 'screenshots');

// Asegurar que existe el directorio de screenshots
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const viewports = [
  { name: 'iPhone-SE', width: 375, height: 667, description: 'iPhone SE (caso más restrictivo)' },
  { name: 'iPhone-12-Pro', width: 390, height: 844, description: 'iPhone 12/13 Pro (estándar actual)' },
  { name: 'iPhone-14-Pro-Max', width: 428, height: 926, description: 'iPhone 14 Pro Max (pantalla grande)' },
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

console.log('🚀 Iniciando validación de diseño responsivo para Interconsultas...\n');
console.log(`📍 URL base: ${BASE_URL}`);
console.log(`📁 Screenshots: ${screenshotsDir}\n`);

async function validateInterconsultas() {
  const browser = await chromium.launch({
    headless: false, // Modo visual para debugging
    slowMo: 100, // Ralentizar para ver las interacciones
  });

  const results = {
    viewports: [],
    screenshots: [],
    errors: [],
  };

  for (const viewport of viewports) {
    console.log(`\n📱 Probando viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
    console.log(`   ${viewport.description}`);

    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    });

    const page = await context.newPage();

    try {
      // Navegar a la aplicación
      console.log('   → Navegando a la página principal...');
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

      // Esperar un poco para que cargue
      await page.waitForTimeout(1000);

      // Buscar el botón/link de Interconsultas en la navegación
      console.log('   → Buscando navegación a Interconsultas...');

      // Intentar hacer click en Interconsultas (ajustar selector según la implementación)
      const interconsultasButton = await page.locator('text=Interconsultas').first();
      if (await interconsultasButton.isVisible({ timeout: 5000 })) {
        await interconsultasButton.click();
        await page.waitForTimeout(1500);
        console.log('   ✓ Navegado a Interconsultas');
      } else {
        console.log('   ⚠️  No se encontró botón de navegación, asumiendo que ya estamos en Interconsultas');
      }

      // Escenario 1: Header completo
      console.log('   → Capturando header...');
      const headerPath = join(screenshotsDir, `${viewport.name}-01-header.png`);
      await page.screenshot({
        path: headerPath,
        fullPage: false,
      });
      results.screenshots.push({ viewport: viewport.name, scenario: 'header', path: headerPath });
      console.log(`   ✓ Screenshot guardado: ${viewport.name}-01-header.png`);

      // Escenario 2: Filtros
      console.log('   → Capturando filtros...');
      const filtersPath = join(screenshotsDir, `${viewport.name}-02-filters.png`);

      // Buscar el componente de filtros
      const filtersComponent = await page.locator('[class*="flex"][class*="flex-wrap"]').first();
      if (await filtersComponent.isVisible({ timeout: 3000 })) {
        await filtersComponent.screenshot({ path: filtersPath });
        results.screenshots.push({ viewport: viewport.name, scenario: 'filters', path: filtersPath });
        console.log(`   ✓ Screenshot guardado: ${viewport.name}-02-filters.png`);
      } else {
        console.log('   ⚠️  No se encontró componente de filtros visible');
      }

      // Escenario 3: Formulario de creación
      console.log('   → Capturando formulario de creación...');

      // Buscar el botón "Nueva Interconsulta"
      const newButton = await page.locator('text=Nueva Interconsulta').or(page.locator('button:has-text("Nueva")')).first();
      if (await newButton.isVisible({ timeout: 3000 })) {
        await newButton.click();
        await page.waitForTimeout(800);

        const formPath = join(screenshotsDir, `${viewport.name}-03-create-form.png`);
        await page.screenshot({
          path: formPath,
          fullPage: true,
        });
        results.screenshots.push({ viewport: viewport.name, scenario: 'create-form', path: formPath });
        console.log(`   ✓ Screenshot guardado: ${viewport.name}-03-create-form.png`);

        // Cerrar el formulario (si hay botón de cerrar)
        const closeButton = await page.locator('button:has-text("Cancelar")').or(page.locator('[class*="ChevronUp"]')).first();
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      } else {
        console.log('   ⚠️  No se encontró botón para crear nueva interconsulta');
      }

      // Escenario 4: Grid de cards
      console.log('   → Capturando grid de cards...');
      const cardsPath = join(screenshotsDir, `${viewport.name}-04-cards-grid.png`);
      await page.screenshot({
        path: cardsPath,
        fullPage: true,
      });
      results.screenshots.push({ viewport: viewport.name, scenario: 'cards-grid', path: cardsPath });
      console.log(`   ✓ Screenshot guardado: ${viewport.name}-04-cards-grid.png`);

      // Escenario 5: Card individual con mediciones
      console.log('   → Capturando card individual...');
      const card = await page.locator('.medical-card').first();
      if (await card.isVisible({ timeout: 3000 })) {
        const cardPath = join(screenshotsDir, `${viewport.name}-05-single-card.png`);
        await card.screenshot({ path: cardPath });
        results.screenshots.push({ viewport: viewport.name, scenario: 'single-card', path: cardPath });
        console.log(`   ✓ Screenshot guardado: ${viewport.name}-05-single-card.png`);

        // Mediciones de la card
        const cardBox = await card.boundingBox();
        if (cardBox) {
          console.log(`   📏 Dimensiones de card: ${Math.round(cardBox.width)}x${Math.round(cardBox.height)}px`);
        }
      } else {
        console.log('   ⚠️  No se encontraron cards de interconsultas (puede que no haya datos)');
      }

      // Escenario 6: Modal de detalle
      console.log('   → Intentando abrir modal de detalle...');
      const firstCard = await page.locator('.medical-card').first();
      if (await firstCard.isVisible({ timeout: 3000 })) {
        await firstCard.click();
        await page.waitForTimeout(1000);

        // Verificar si se abrió un modal
        const modal = await page.locator('[class*="fixed"][class*="inset-0"]').first();
        if (await modal.isVisible({ timeout: 3000 })) {
          const modalPath = join(screenshotsDir, `${viewport.name}-06-detail-modal.png`);
          await page.screenshot({
            path: modalPath,
            fullPage: true,
          });
          results.screenshots.push({ viewport: viewport.name, scenario: 'detail-modal', path: modalPath });
          console.log(`   ✓ Screenshot guardado: ${viewport.name}-06-detail-modal.png`);

          // Capturar header del modal específicamente
          const modalHeaderPath = join(screenshotsDir, `${viewport.name}-07-modal-header.png`);
          const modalHeader = await page.locator('[class*="sticky"][class*="top-0"]').first();
          if (await modalHeader.isVisible({ timeout: 2000 })) {
            await modalHeader.screenshot({ path: modalHeaderPath });
            results.screenshots.push({ viewport: viewport.name, scenario: 'modal-header', path: modalHeaderPath });
            console.log(`   ✓ Screenshot guardado: ${viewport.name}-07-modal-header.png`);
          }

          // Cerrar modal
          const closeModalButton = await page.locator('button:has-text("Cerrar")').or(page.locator('[aria-label="Cerrar"]')).first();
          if (await closeModalButton.isVisible({ timeout: 2000 })) {
            await closeModalButton.click();
            await page.waitForTimeout(500);
          } else {
            // Si no hay botón cerrar, intentar ESC
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          }
        } else {
          console.log('   ⚠️  No se abrió modal de detalle al hacer click en card');
        }
      }

      // Escenario 7: Interacciones táctiles - verificar tamaños de touch targets
      console.log('   → Verificando touch targets...');
      const checkboxes = await page.locator('input[type="checkbox"]').all();
      console.log(`   📌 Checkboxes encontrados: ${checkboxes.length}`);

      for (let i = 0; i < Math.min(checkboxes.length, 3); i++) {
        const box = await checkboxes[i].boundingBox();
        if (box) {
          const sizeOk = box.width >= 44 && box.height >= 44 ? '✓' : '⚠️';
          console.log(`   ${sizeOk} Checkbox ${i + 1}: ${Math.round(box.width)}x${Math.round(box.height)}px`);
        }
      }

      const buttons = await page.locator('button').all();
      console.log(`   🔘 Botones encontrados: ${buttons.length}`);

      // Screenshot final de página completa
      console.log('   → Capturando página completa...');
      const fullPagePath = join(screenshotsDir, `${viewport.name}-08-full-page.png`);
      await page.screenshot({
        path: fullPagePath,
        fullPage: true,
      });
      results.screenshots.push({ viewport: viewport.name, scenario: 'full-page', path: fullPagePath });
      console.log(`   ✓ Screenshot guardado: ${viewport.name}-08-full-page.png`);

      results.viewports.push({
        name: viewport.name,
        width: viewport.width,
        height: viewport.height,
        success: true,
      });

      console.log(`   ✅ Validación completada para ${viewport.name}`);

    } catch (error) {
      console.error(`   ❌ Error en viewport ${viewport.name}:`, error.message);
      results.errors.push({
        viewport: viewport.name,
        error: error.message,
      });
      results.viewports.push({
        name: viewport.name,
        width: viewport.width,
        height: viewport.height,
        success: false,
        error: error.message,
      });
    } finally {
      await context.close();
    }
  }

  await browser.close();

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE VALIDACIÓN');
  console.log('='.repeat(60));
  console.log(`\n✅ Screenshots capturados: ${results.screenshots.length}`);
  console.log(`📱 Viewports probados: ${results.viewports.length}`);
  console.log(`❌ Errores: ${results.errors.length}\n`);

  if (results.errors.length > 0) {
    console.log('⚠️  ERRORES ENCONTRADOS:');
    results.errors.forEach(err => {
      console.log(`   - ${err.viewport}: ${err.error}`);
    });
  }

  console.log('\n📁 Screenshots guardados en:', screenshotsDir);
  console.log('\n✨ Validación completada. Revisa los screenshots para análisis.\n');

  return results;
}

// Ejecutar validación
validateInterconsultas()
  .then(() => {
    console.log('✅ Proceso finalizado exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
