// Componente de zona de arrastrar y soltar archivos
import React, { useState, useCallback, useRef } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';
import { FileValidator } from '../services/fileValidator';
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from '../types/ocrTypes';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  accept?: string;
  className?: string;
}

interface FileItem {
  file: File;
  id: string;
  status: 'valid' | 'invalid' | 'processing';
  error?: string;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  maxFiles = 10,
  disabled = false,
  accept,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generar string de tipos aceptados
  const acceptedTypes = accept || SUPPORTED_FILE_TYPES.join(',');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    await processFiles(droppedFiles);
  }, [disabled, selectedFiles.length, maxFiles]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    await processFiles(selectedFiles);
    
    // Limpiar input para permitir seleccionar el mismo archivo otra vez
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedFiles.length, maxFiles]);

  const processFiles = async (files: File[]) => {
    // Verificar límite de archivos
    const totalFiles = selectedFiles.length + files.length;
    if (totalFiles > maxFiles) {
      alert(`Solo se pueden seleccionar hasta ${maxFiles} archivos. Se procesarán los primeros ${maxFiles - selectedFiles.length}.`);
      files = files.slice(0, maxFiles - selectedFiles.length);
    }

    // Crear items de archivo con ID único
    const fileItems: FileItem[] = files.map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'processing' as const
    }));

    // Agregar archivos a la lista
    setSelectedFiles(prev => [...prev, ...fileItems]);

    // Validar archivos asíncronamente
    const validationResults = await Promise.all(
      files.map(file => FileValidator.validateFile(file))
    );

    // Actualizar estado de los archivos según validación
    setSelectedFiles(prev => 
      prev.map(item => {
        const index = fileItems.findIndex(fi => fi.id === item.id);
        if (index !== -1) {
          const validation = validationResults[index];
          return {
            ...item,
            status: validation.valid ? 'valid' : 'invalid',
            error: validation.error
          };
        }
        return item;
      })
    );

    // Notificar archivos válidos al componente padre
    const validFiles = files.filter((_, index) => validationResults[index].valid);
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(item => item.id !== fileId));
    
    // Actualizar lista de archivos válidos
    const remainingValidFiles = selectedFiles
      .filter(item => item.id !== fileId && item.status === 'valid')
      .map(item => item.file);
    
    onFilesSelected(remainingValidFiles);
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    onFilesSelected([]);
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const validFiles = selectedFiles.filter(item => item.status === 'valid');
  const hasFiles = selectedFiles.length > 0;

  return (
    <div className={`w-full ${className}`}>
      {/* Zona de drag & drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : hasFiles 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center space-y-4">
          <Upload className={`h-12 w-12 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {hasFiles ? `${validFiles.length} archivo(s) seleccionado(s)` : 'Seleccionar archivos'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Formatos soportados: PDF, JPG, PNG, TIFF, BMP, WebP (máx. {Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)
            </p>
          </div>

          {hasFiles && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAllFiles();
              }}
              className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
              <span>Limpiar todo</span>
            </button>
          )}
        </div>
      </div>

      {/* Lista de archivos seleccionados */}
      {hasFiles && (
        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
          <div className="text-sm font-medium text-gray-700 flex items-center justify-between">
            <span>Archivos seleccionados ({selectedFiles.length}/{maxFiles})</span>
            {validFiles.length !== selectedFiles.length && (
              <span className="text-amber-600">
                {selectedFiles.length - validFiles.length} con errores
              </span>
            )}
          </div>
          
          {selectedFiles.map((item) => (
            <div
              key={item.id}
              className={`
                flex items-center justify-between p-3 rounded-lg border
                ${item.status === 'valid' 
                  ? 'border-green-200 bg-green-50' 
                  : item.status === 'invalid'
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                }
              `}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {item.status === 'valid' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {item.status === 'invalid' && <AlertCircle className="h-5 w-5 text-red-500" />}
                  {item.status === 'processing' && (
                    <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {item.file.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatFileSize(item.file.size)} • {item.file.type}
                  </div>
                  {item.error && (
                    <div className="text-xs text-red-600 mt-1">
                      {item.error}
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => removeFile(item.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 ml-2"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileDropZone;