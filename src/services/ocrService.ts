// Servicio principal unificado para OCR y procesamiento de documentos
import { PDFProcessor } from './pdfProcessor';
import { ImageOCR } from './imageOCR';
import { FileValidator } from './fileValidator';
import { 
  ProcessingResult, 
  BatchProcessingResult, 
  OCRProgress, 
  OCRSettings,
  DEFAULT_OCR_SETTINGS 
} from '../types/ocrTypes';

export class OCRService {
  private pdfProcessor: PDFProcessor;
  private imageOCR: ImageOCR;
  private settings: OCRSettings;

  constructor(settings: OCRSettings = DEFAULT_OCR_SETTINGS) {
    this.settings = settings;
    this.pdfProcessor = new PDFProcessor();
    this.imageOCR = new ImageOCR(settings);
  }

  /**
   * Procesa un archivo (PDF o imagen) y extrae el texto
   * @param file - Archivo a procesar
   * @param progressCallback - Callback para reportar progreso
   * @returns Resultado del procesamiento
   */
  async processFile(
    file: File,
    progressCallback?: (progress: OCRProgress) => void
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Reportar inicio
      progressCallback?.({
        progress: 0,
        status: 'initializing',
        currentFile: file.name
      });

      // Validar archivo
      console.log(`🔍 Validando archivo: ${file.name}`);
      const validation = await FileValidator.validateFile(file);
      
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      progressCallback?.({
        progress: 10,
        status: 'processing',
        currentFile: file.name
      });

      const fileType = file.type;
      let result: ProcessingResult;

      if (fileType === 'application/pdf') {
        // Procesar PDF
        console.log(`📄 Procesando archivo PDF: ${file.name}`);
        
        const pdfResult = await this.pdfProcessor.processPDF(file);
        
        result = {
          text: pdfResult.text,
          method: pdfResult.method,
          confidence: pdfResult.confidence,
          source_file: file.name,
          processing_time: Date.now() - startTime,
          file_size: file.size,
          pages: pdfResult.pages
        };
        
      } else if (fileType.startsWith('image/')) {
        // Procesar imagen
        console.log(`🖼️ Procesando imagen: ${file.name}`);
        
        const ocrResult = await this.imageOCR.performOCR(file, (progress) => {
          progressCallback?.({
            progress: 10 + (progress * 0.8), // 10-90%
            status: progress > 90 ? 'completed' : 'recognizing',
            currentFile: file.name
          });
        });
        
        result = {
          text: ocrResult.text,
          method: ocrResult.method,
          confidence: ocrResult.confidence,
          source_file: file.name,
          processing_time: ocrResult.processing_time,
          file_size: file.size,
          words: ocrResult.words,
          enhanced: this.settings.enhance
        };
        
      } else {
        throw new Error(`Tipo de archivo no soportado: ${fileType}`);
      }

      // Post-procesamiento del texto
      result.text = this.postProcessExtractedText(result.text);
      result.processing_time = Date.now() - startTime;

      progressCallback?.({
        progress: 100,
        status: 'completed',
        currentFile: file.name
      });

      console.log(`✅ Procesamiento completado: ${result.text.length} caracteres extraídos`);
      return result;

    } catch (error) {
      progressCallback?.({
        progress: 0,
        status: 'error',
        currentFile: file.name
      });

      console.error(`❌ Error procesando archivo ${file.name}:`, error);
      throw new Error(`Error procesando ${file.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Procesa múltiples archivos en lote
   * @param files - Array de archivos a procesar
   * @param progressCallback - Callback para reportar progreso general
   * @returns Resultado del procesamiento por lotes
   */
  async processFileBatch(
    files: File[],
    progressCallback?: (progress: OCRProgress) => void
  ): Promise<BatchProcessingResult> {
    const startTime = Date.now();
    const results: ProcessingResult[] = [];
    const errors: { file: string; error: string }[] = [];

    console.log(`🔄 Iniciando procesamiento por lotes: ${files.length} archivo(s)`);

    // Filtrar archivos válidos
    const { validFiles, invalidFiles } = await FileValidator.filterValidFiles(files);
    
    // Agregar errores de validación
    invalidFiles.forEach(({ file, error }) => {
      errors.push({ file: file.name, error });
    });

    // Procesar archivos válidos
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const fileProgress = (i / validFiles.length) * 100;

      try {
        progressCallback?.({
          progress: fileProgress,
          status: 'processing',
          currentFile: file.name,
          currentFileIndex: i + 1,
          totalFiles: validFiles.length
        });

        const result = await this.processFile(file, (fileProgress) => {
          const batchProgress = (i / validFiles.length) * 100;
          const totalProgress = batchProgress + (fileProgress.progress / validFiles.length);
          progressCallback?.({
            progress: Math.min(totalProgress, 99),
            status: fileProgress.status,
            currentFile: file.name,
            currentFileIndex: i + 1,
            totalFiles: validFiles.length
          });
        });

        results.push(result);
        console.log(`✅ ${file.name} procesado exitosamente`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        errors.push({ file: file.name, error: errorMessage });
        console.error(`❌ Error procesando ${file.name}:`, errorMessage);
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    const batchResult: BatchProcessingResult = {
      total: files.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
      totalProcessingTime
    };

    progressCallback?.({
      progress: 100,
      status: 'completed',
      currentFile: `${results.length}/${files.length} archivos procesados`
    });

    console.log(`🎯 Procesamiento por lotes completado: ${results.length}/${files.length} exitosos`);
    return batchResult;
  }

  /**
   * Post-procesa el texto extraído para mejorar su calidad
   * @param text - Texto a procesar
   * @returns Texto mejorado
   */
  private postProcessExtractedText(text: string): string {
    if (!text || text.trim().length === 0) {
      return '';
    }

    return text
      // Normalizar espacios en blanco
      .replace(/\s+/g, ' ')
      // Eliminar caracteres de control excepto saltos de línea importantes
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalizar saltos de línea múltiples
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      // Corregir espaciado alrededor de puntuación
      .replace(/\s+([.,;:!?])/g, '$1')
      .replace(/([.!?])\s+/g, '$1 ')
      // Capitalizar después de puntos
      .replace(/\.\s+([a-záéíóúñü])/gi, (_, letter) => '. ' + letter.toUpperCase())
      // Limpiar espacios al inicio y final
      .trim();
  }

  /**
   * Obtiene estadísticas del texto extraído
   * @param text - Texto a analizar
   * @returns Estadísticas del texto
   */
  getTextStatistics(text: string): {
    characters: number;
    charactersNoSpaces: number;
    words: number;
    lines: number;
    paragraphs: number;
    averageWordsPerLine: number;
    readabilityScore: number;
  } {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split('\n').length;
    const paragraphs = text.split(/\n\s*\n/).length;
    const averageWordsPerLine = lines > 0 ? words / lines : 0;
    
    // Puntaje de legibilidad simple (basado en caracteres alfanuméricos)
    const alphanumeric = text.match(/[a-zA-Z0-9áéíóúñüÁÉÍÓÚÑÜ]/g)?.length || 0;
    const readabilityScore = characters > 0 ? (alphanumeric / characters) * 100 : 0;

    return {
      characters,
      charactersNoSpaces,
      words,
      lines,
      paragraphs,
      averageWordsPerLine: Math.round(averageWordsPerLine * 100) / 100,
      readabilityScore: Math.round(readabilityScore * 100) / 100
    };
  }

  /**
   * Actualiza la configuración del servicio
   * @param newSettings - Nueva configuración
   */
  updateSettings(newSettings: Partial<OCRSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.imageOCR.updateSettings(this.settings);
  }

  /**
   * Obtiene la configuración actual
   * @returns Configuración actual
   */
  getSettings(): OCRSettings {
    return { ...this.settings };
  }

  /**
   * Verifica si el servicio está listo para usar
   * @returns true si está listo
   */
  isReady(): boolean {
    // Verificar que Tesseract esté disponible
    try {
      return typeof window !== 'undefined' && 'Worker' in window;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene información sobre los tipos de archivo soportados
   * @returns Información de soporte
   */
  getSupportedFormats(): {
    formats: string[];
    maxFileSize: string;
    recommendations: string[];
  } {
    return {
      formats: ['PDF', 'JPEG', 'PNG', 'TIFF', 'BMP', 'WebP'],
      maxFileSize: '10 MB',
      recommendations: [
        'Para mejores resultados, use imágenes con texto claro y buen contraste',
        'Los PDFs nativos (con texto seleccionable) se procesan más rápido que los escaneados',
        'Resolución recomendada: al menos 300 DPI para documentos escaneados',
        'Evite imágenes borrosas o con mucho ruido de fondo'
      ]
    };
  }
}