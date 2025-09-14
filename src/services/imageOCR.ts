// Sistema OCR para imágenes con mejoras de calidad
import { PSM } from 'tesseract.js';
import { OCRResult, OCRSettings, DEFAULT_OCR_SETTINGS } from '../types/ocrTypes';

export class ImageOCR {
  private settings: OCRSettings;

  constructor(settings: OCRSettings = DEFAULT_OCR_SETTINGS) {
    this.settings = settings;
  }

  /**
   * Realiza OCR en una imagen
   * @param imageFile - Archivo de imagen o DataURL
   * @param progressCallback - Callback para reportar progreso
   * @returns Resultado del OCR
   */
  async performOCR(
    imageFile: File | string,
    progressCallback?: (progress: number) => void
  ): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Iniciando OCR en imagen...`);
      
      // Importar Tesseract dinámicamente
      const Tesseract = await import('tesseract.js');
      
      // Preparar imagen (mejorar calidad si está habilitado)
      let processedImage: string | File = imageFile;
      
      if (this.settings.enhance && typeof imageFile !== 'string') {
        console.log(`🎨 Mejorando calidad de imagen...`);
        progressCallback?.(10);
        processedImage = await this.enhanceImageForOCR(imageFile);
        progressCallback?.(30);
      }

      // Crear worker de Tesseract
      console.log(`⚙️ Configurando OCR worker...`);
      const worker = await Tesseract.createWorker(this.settings.language, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = 30 + (m.progress * 60); // 30-90% del progreso total
            progressCallback?.(progress);
          }
        }
      });

      try {
        // Configurar parámetros del OCR
        await worker.setParameters({
          tessedit_char_whitelist: this.settings.characterWhitelist || '',
          tessedit_pageseg_mode: PSM.AUTO,
        });

        progressCallback?.(35);

        // Realizar OCR
        console.log(`🤖 Ejecutando reconocimiento de texto...`);
        const { data } = await worker.recognize(processedImage);
        
        progressCallback?.(90);

        // Limpiar worker
        await worker.terminate();
        
        progressCallback?.(100);

        const processingTime = Date.now() - startTime;
        console.log(`✅ OCR completado en ${processingTime}ms`);

        const result: OCRResult = {
          text: this.postProcessText(data.text),
          confidence: data.confidence / 100, // Convertir a 0-1
          words: (data as any).words?.length || data.text.split(/\s+/).filter(word => word.length > 0).length,
          processing_time: processingTime,
          method: 'image_ocr',
          source_file: typeof imageFile === 'string' ? 'data_url' : imageFile.name
        };

        return result;

      } catch (error) {
        await worker.terminate();
        throw error;
      }

    } catch (error) {
      console.error('❌ Error en OCR:', error);
      throw new Error(`Error en OCR: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Mejora la calidad de una imagen antes del OCR
   * @param imageFile - Archivo de imagen
   * @returns DataURL de la imagen mejorada
   */
  async enhanceImageForOCR(imageFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      if (!ctx) {
        reject(new Error('No se pudo obtener contexto del canvas'));
        return;
      }

      img.onload = () => {
        try {
          const settings = this.settings.enhancementSettings;
          
          // Configurar tamaño del canvas
          let width = img.width;
          let height = img.height;
          
          // Upscaling si está habilitado
          if (settings.upscale) {
            width *= 2;
            height *= 2;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Dibujar imagen original
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Aplicar mejoras
          if (settings.contrast !== 1.0 || settings.brightness !== 1.0) {
            this.adjustContrastAndBrightness(ctx, width, height, settings.contrast, settings.brightness);
          }
          
          if (settings.binarization) {
            this.applyBinarization(ctx, width, height);
          }
          
          if (settings.denoising) {
            this.applyDenoising(ctx, width, height);
          }
          
          // Convertir a DataURL
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Error cargando imagen'));
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Ajusta contraste y brillo de la imagen
   */
  private adjustContrastAndBrightness(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    contrast: number,
    brightness: number
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
    
    for (let i = 0; i < data.length; i += 4) {
      // Aplicar contraste
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));     // R
      data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128)); // G
      data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128)); // B
      
      // Aplicar brillo
      data[i] = Math.max(0, Math.min(255, data[i] * brightness));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * brightness));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * brightness));
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Aplica binarización (convierte a blanco y negro)
   */
  private applyBinarization(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Convertir a escala de grises
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      
      // Binarización con umbral adaptativo
      const threshold = 128;
      const binaryValue = gray > threshold ? 255 : 0;
      
      data[i] = binaryValue;     // R
      data[i + 1] = binaryValue; // G
      data[i + 2] = binaryValue; // B
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Aplica filtro de reducción de ruido
   */
  private applyDenoising(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const newData = new Uint8ClampedArray(data);
    
    // Filtro de mediana 3x3 para reducir ruido
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB
          const values = [];
          
          // Obtener valores del kernel 3x3
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4 + c;
              values.push(data[idx]);
            }
          }
          
          // Ordenar y tomar mediana
          values.sort((a, b) => a - b);
          const median = values[4]; // Elemento central
          
          const idx = (y * width + x) * 4 + c;
          newData[idx] = median;
        }
      }
    }
    
    // Aplicar datos filtrados
    for (let i = 0; i < data.length; i++) {
      data[i] = newData[i];
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Post-procesa el texto extraído para mejorar legibilidad
   */
  private postProcessText(text: string): string {
    return text
      // Eliminar caracteres de control
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalizar espacios
      .replace(/\s+/g, ' ')
      // Corregir algunos errores comunes de OCR
      .replace(/([a-z])(\d)/g, '$1 $2') // Separar letras de números
      .replace(/(\d)([a-z])/gi, '$1 $2') // Separar números de letras
      .replace(/[|]/g, 'I') // Convertir | a I
      .replace(/[0]/g, 'O') // Convertir 0 a O cuando corresponda
      // Corregir puntuación
      .replace(/\s+([.,;:!?])/g, '$1')
      .replace(/([.!?])\s*([a-záéíóúñü])/gi, '$1 $2')
      .trim();
  }

  /**
   * Procesa múltiples imágenes en lote
   */
  async processImageBatch(
    files: File[],
    progressCallback?: (overall: number, current: string) => void
  ): Promise<OCRResult[]> {
    const results: OCRResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      progressCallback?.(0, `Procesando ${file.name}...`);
      
      try {
        const result = await this.performOCR(file, (progress) => {
          const overallProgress = ((i / files.length) * 100) + (progress / files.length);
          progressCallback?.(overallProgress, `Procesando ${file.name}...`);
        });
        
        results.push(result);
        
      } catch (error) {
        console.error(`Error procesando ${file.name}:`, error);
        // Continuar con el siguiente archivo en caso de error
        results.push({
          text: '',
          confidence: 0,
          words: 0,
          processing_time: 0,
          method: 'image_ocr',
          source_file: file.name
        });
      }
    }
    
    progressCallback?.(100, 'Procesamiento completado');
    return results;
  }

  /**
   * Actualiza la configuración del OCR
   */
  updateSettings(newSettings: Partial<OCRSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Obtiene la configuración actual
   */
  getSettings(): OCRSettings {
    return { ...this.settings };
  }
}