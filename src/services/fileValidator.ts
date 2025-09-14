// Validador de archivos para el sistema OCR
import { FileValidationResult, SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from '../types/ocrTypes';

export class FileValidator {
  /**
   * Valida un archivo para procesamiento OCR
   * @param file - Archivo a validar
   * @returns Resultado de validación
   */
  static async validateFile(file: File): Promise<FileValidationResult> {
    try {
      // Validar tamaño
      if (file.size > MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `Archivo demasiado grande. Máximo permitido: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
          size: file.size
        };
      }

      // Validar que no esté vacío
      if (file.size === 0) {
        return {
          valid: false,
          error: 'El archivo está vacío',
          size: file.size
        };
      }

      // Validar tipo MIME
      if (!SUPPORTED_FILE_TYPES.includes(file.type as any)) {
        return {
          valid: false,
          error: `Tipo de archivo no soportado: ${file.type}. Tipos permitidos: PDF, JPG, PNG, TIFF, BMP, WebP`,
          fileType: file.type
        };
      }

      // Validar extensión del archivo
      const extension = this.getFileExtension(file.name).toLowerCase();
      if (!this.isValidExtension(extension, file.type)) {
        return {
          valid: false,
          error: `Extensión de archivo no coincide con el tipo MIME: ${extension} vs ${file.type}`,
          fileType: file.type
        };
      }

      // Validar que sea un archivo real (verificación de magic bytes)
      const isRealFile = await this.validateFileSignature(file);
      if (!isRealFile) {
        return {
          valid: false,
          error: 'El archivo parece estar corrupto o no es un archivo válido del tipo especificado'
        };
      }

      return {
        valid: true,
        fileType: file.type,
        size: file.size
      };

    } catch (error) {
      return {
        valid: false,
        error: `Error validando archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Valida múltiples archivos
   * @param files - Lista de archivos a validar
   * @returns Array de resultados de validación
   */
  static async validateFiles(files: File[]): Promise<FileValidationResult[]> {
    const results = await Promise.all(
      files.map(file => this.validateFile(file))
    );

    return results;
  }

  /**
   * Filtra archivos válidos de una lista
   * @param files - Lista de archivos
   * @returns Archivos válidos y errores
   */
  static async filterValidFiles(files: File[]): Promise<{
    validFiles: File[];
    invalidFiles: { file: File; error: string }[];
  }> {
    const validFiles: File[] = [];
    const invalidFiles: { file: File; error: string }[] = [];

    const validationResults = await this.validateFiles(files);

    files.forEach((file, index) => {
      const result = validationResults[index];
      if (result.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({
          file,
          error: result.error || 'Error de validación desconocido'
        });
      }
    });

    return { validFiles, invalidFiles };
  }

  /**
   * Obtiene la extensión de un archivo
   */
  private static getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }

  /**
   * Verifica que la extensión coincida con el tipo MIME
   */
  private static isValidExtension(extension: string, mimeType: string): boolean {
    const validExtensions: Record<string, string[]> = {
      'application/pdf': ['pdf'],
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/tiff': ['tiff', 'tif'],
      'image/bmp': ['bmp'],
      'image/webp': ['webp']
    };

    const allowedExtensions = validExtensions[mimeType] || [];
    return allowedExtensions.includes(extension);
  }

  /**
   * Valida la firma del archivo (magic bytes) para verificar que es realmente del tipo especificado
   */
  private static async validateFileSignature(file: File): Promise<boolean> {
    try {
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      // Obtener los primeros bytes del archivo
      const header = uint8Array.slice(0, 8);
      const headerHex = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join('');

      // Firmas de archivos conocidas
      const signatures: Record<string, RegExp[]> = {
        'application/pdf': [/^25504446/], // %PDF
        'image/jpeg': [/^ffd8ff/], // JPEG
        'image/png': [/^89504e47/], // PNG
        'image/tiff': [/^49492a00/, /^4d4d002a/], // TIFF (little/big endian)
        'image/bmp': [/^424d/], // BMP
        'image/webp': [/^52494646.{8}57454250/] // RIFF....WEBP
      };

      const fileSignatures = signatures[file.type];
      if (!fileSignatures) {
        return true; // Si no tenemos firmas para este tipo, aceptamos
      }

      return fileSignatures.some(signature => signature.test(headerHex));

    } catch (error) {
      console.warn('No se pudo validar la firma del archivo:', error);
      return true; // En caso de error, permitir el archivo
    }
  }

  /**
   * Obtiene información detallada de un archivo
   */
  static getFileInfo(file: File): {
    name: string;
    size: string;
    type: string;
    lastModified: string;
  } {
    return {
      name: file.name,
      size: this.formatFileSize(file.size),
      type: file.type,
      lastModified: new Date(file.lastModified).toLocaleString('es-AR')
    };
  }

  /**
   * Formatea el tamaño del archivo en formato legible
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}