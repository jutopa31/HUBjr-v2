// Procesador de PDF con extracción directa y OCR para documentos escaneados
import { PSM } from 'tesseract.js';
import { PDFResult } from '../types/ocrTypes';

export class PDFProcessor {

  /**
   * Procesa un archivo PDF usando el método más apropiado
   * @param file - Archivo PDF a procesar
   * @returns Resultado del procesamiento
   */
  async processPDF(file: File): Promise<PDFResult> {
    console.log(`🔄 Iniciando procesamiento de PDF: ${file.name}`);
    
    try {
      // Convertir File a ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Intentar extracción directa primero (más rápido para PDFs con texto)
      const directResult = await this.extractTextFromNativePDF(arrayBuffer);
      
      // Si la extracción directa tiene suficiente contenido, usarla
      if (directResult.text.length > 100 && this.hasReadableText(directResult.text)) {
        console.log(`✅ Extracción directa exitosa: ${directResult.text.length} caracteres`);
        
        return {
          text: directResult.text,
          method: 'direct',
          confidence: 0.99,
          pages: directResult.pages,
          source_file: file.name
        };
      }

      // Si la extracción directa no es suficiente, usar OCR
      console.log(`📸 Extracción directa insuficiente, usando OCR...`);
      const ocrResult = await this.extractTextFromScannedPDF(arrayBuffer, file.name);
      
      return {
        text: ocrResult.text,
        method: 'ocr',
        confidence: ocrResult.confidence,
        pages: ocrResult.pages,
        source_file: file.name
      };

    } catch (error) {
      console.error('❌ Error procesando PDF:', error);
      throw new Error(`Error procesando PDF ${file.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Extrae texto directamente de un PDF (para PDFs con texto seleccionable)
   * @param arrayBuffer - Buffer del PDF
   * @returns Texto extraído y número de páginas
   */
  private async extractTextFromNativePDF(arrayBuffer: ArrayBuffer): Promise<{ text: string; pages: number }> {
    try {
      // Importar pdfjs-dist dinámicamente (compatible con browser)
      const pdfjsLib = await import('pdfjs-dist');
      
      // Configurar worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

      // Cargar PDF
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      // Extraer texto de cada página
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      console.log(`✅ Extracción directa de PDF exitosa: ${fullText.length} caracteres, ${pdf.numPages} páginas`);

      return {
        text: fullText.trim(),
        pages: pdf.numPages
      };

    } catch (error) {
      console.warn('⚠️ Error en extracción directa de PDF:', error);
      return { text: '', pages: 0 };
    }
  }

  /**
   * Extrae texto de PDF usando OCR (para PDFs escaneados)
   * @param arrayBuffer - Buffer del PDF
   * @param filename - Nombre del archivo
   * @returns Resultado del OCR
   */
  private async extractTextFromScannedPDF(arrayBuffer: ArrayBuffer, _filename: string): Promise<{ text: string; confidence: number; pages: number }> {
    try {
      // Convertir PDF a imágenes usando Canvas API
      const images = await this.convertPDFToImages(arrayBuffer);
      console.log(`📄 PDF convertido a ${images.length} imagen(es)`);

      if (images.length === 0) {
        throw new Error('No se pudieron extraer páginas del PDF');
      }

      // Importar Tesseract dinámicamente
      const Tesseract = await import('tesseract.js');
      
      // Procesar cada página con OCR
      const ocrResults = await Promise.all(
        images.map(async (imageDataUrl, index) => {
          console.log(`🔍 Procesando página ${index + 1} con OCR...`);
          
          const worker = await Tesseract.createWorker('spa+eng');
          
          try {
            await worker.setParameters({
              tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,;:!?()[]{}"-\'áéíóúñüÁÉÍÓÚÑÜ',
              tessedit_pageseg_mode: PSM.AUTO,
            });

            const { data } = await worker.recognize(imageDataUrl);
            await worker.terminate();

            return {
              text: data.text,
              confidence: data.confidence
            };

          } catch (error) {
            await worker.terminate();
            console.error(`Error en OCR página ${index + 1}:`, error);
            return { text: '', confidence: 0 };
          }
        })
      );

      // Combinar resultados de todas las páginas
      const combinedText = ocrResults
        .map((result, index) => {
          return result.text ? `--- Página ${index + 1} ---\n${result.text}` : '';
        })
        .filter(text => text.length > 0)
        .join('\n\n');

      const averageConfidence = ocrResults
        .filter(r => r.confidence > 0)
        .reduce((sum, r) => sum + r.confidence, 0) / Math.max(1, ocrResults.filter(r => r.confidence > 0).length);

      return {
        text: this.cleanExtractedText(combinedText),
        confidence: averageConfidence / 100, // Convertir a 0-1
        pages: images.length
      };

    } catch (error) {
      console.error('❌ Error en OCR de PDF:', error);
      throw new Error(`Error en OCR: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Convierte PDF a imágenes usando PDF.js
   * @param arrayBuffer - Buffer del PDF
   * @returns Array de imágenes en formato DataURL
   */
  private async convertPDFToImages(arrayBuffer: ArrayBuffer): Promise<string[]> {
    try {
      // Importar PDF.js dinámicamente
      const pdfjsLib = await import('pdfjs-dist');

      // Configurar worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

      // Cargar el documento PDF
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;

      const images: string[] = [];

      // Procesar cada página
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);

        // Configurar escala para buena calidad OCR
        const scale = 2.0;
        const viewport = page.getViewport({ scale });

        // Crear canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('No se pudo crear contexto de canvas');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Renderizar página en canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;

        // Convertir canvas a imagen DataURL
        const imageDataUrl = canvas.toDataURL('image/png');
        images.push(imageDataUrl);

        console.log(`📄 Página ${pageNum}/${pdfDoc.numPages} convertida a imagen`);
      }

      console.log(`✅ PDF convertido a ${images.length} imagen(es)`);
      return images;

    } catch (error) {
      console.error('❌ Error convirtiendo PDF a imágenes:', error);
      throw new Error(`Error convirtiendo PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Verifica si el texto extraído es legible y tiene contenido útil
   * @param text - Texto a verificar
   * @returns true si el texto parece legible
   */
  private hasReadableText(text: string): boolean {
    const cleanText = text.trim();
    
    // Verificar longitud mínima
    if (cleanText.length < 50) return false;
    
    // Verificar que tenga palabras reconocibles (al menos 70% caracteres alfanuméricos)
    const alphanumericChars = cleanText.replace(/[^a-zA-Z0-9áéíóúñüÁÉÍÓÚÑÜ]/g, '').length;
    const alphanumericRatio = alphanumericChars / cleanText.length;
    
    return alphanumericRatio > 0.7;
  }

  /**
   * Limpia y mejora el texto extraído
   * @param text - Texto a limpiar
   * @returns Texto limpio
   */
  private cleanExtractedText(text: string): string {
    return text
      // Normalizar espacios en blanco
      .replace(/\s+/g, ' ')
      // Eliminar caracteres de control excepto saltos de línea
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalizar saltos de línea múltiples
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Trim general
      .trim();
  }

  /**
   * Obtiene metadatos del PDF
   * @param arrayBuffer - Buffer del PDF
   * @returns Metadatos del documento
   */
  async getPDFMetadata(arrayBuffer: ArrayBuffer): Promise<{
    title?: string;
    author?: string;
    creator?: string;
    pages: number;
    creationDate?: Date;
  }> {
    try {
      // Importar PDF.js dinámicamente
      const pdfjsLib = await import('pdfjs-dist');
      
      // Configurar worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
      
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const metadata = await pdfDoc.getMetadata();

      const info = metadata.info as any;
      return {
        title: info?.Title,
        author: info?.Author,
        creator: info?.Creator,
        pages: pdfDoc.numPages,
        creationDate: info?.CreationDate ? new Date(info.CreationDate) : undefined
      };

    } catch (error) {
      console.error('Error obteniendo metadatos del PDF:', error);
      return { pages: 0 };
    }
  }
}