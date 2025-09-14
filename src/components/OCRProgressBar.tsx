// Componente de barra de progreso para OCR
import React from 'react';
import { FileText, Eye, Cpu, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { OCRProgress } from '../types/ocrTypes';

interface OCRProgressBarProps {
  progress: OCRProgress;
  className?: string;
}

const OCRProgressBar: React.FC<OCRProgressBarProps> = ({
  progress,
  className = ''
}) => {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'initializing':
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'processing':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'enhancing':
        return <Eye className="h-5 w-5 text-purple-500" />;
      case 'recognizing':
        return <Cpu className="h-5 w-5 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'initializing':
        return 'Inicializando...';
      case 'processing':
        return 'Procesando archivo...';
      case 'enhancing':
        return 'Mejorando calidad de imagen...';
      case 'recognizing':
        return 'Reconociendo texto...';
      case 'completed':
        return 'Procesamiento completado';
      case 'error':
        return 'Error en el procesamiento';
      default:
        return 'Procesando...';
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'recognizing':
        return 'bg-orange-500';
      case 'enhancing':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  const progressPercentage = Math.min(Math.max(progress.progress, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      {/* Header con información del archivo actual */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              {getStatusText()}
            </div>
            {progress.currentFile && (
              <div className="text-xs text-gray-600 mt-1">
                {progress.currentFile}
              </div>
            )}
          </div>
        </div>
        
        {/* Contador de archivos si es procesamiento por lotes */}
        {progress.totalFiles && progress.totalFiles > 1 && (
          <div className="text-sm text-gray-600">
            {progress.currentFileIndex || 0} / {progress.totalFiles}
          </div>
        )}
      </div>

      {/* Barra de progreso principal */}
      <div className="relative">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progreso</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-out rounded-full ${getStatusColor()}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Progreso por lotes si aplica */}
      {progress.totalFiles && progress.totalFiles > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progreso general</span>
            <span>
              {progress.currentFileIndex || 0} de {progress.totalFiles} archivos
            </span>
          </div>
          
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 transition-all duration-300 ease-out rounded-full"
              style={{ 
                width: `${((progress.currentFileIndex || 0) / progress.totalFiles) * 100}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Información adicional según el estado */}
      {progress.status === 'recognizing' && (
        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-800">
              Analizando contenido con OCR... Esto puede tomar algunos minutos.
            </span>
          </div>
        </div>
      )}

      {progress.status === 'enhancing' && (
        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-purple-800">
              Mejorando calidad de imagen para mejor reconocimiento de texto.
            </span>
          </div>
        </div>
      )}

      {progress.status === 'completed' && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              ¡Procesamiento completado exitosamente!
            </span>
          </div>
        </div>
      )}

      {progress.status === 'error' && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">
              Error durante el procesamiento. Verifique el archivo e intente nuevamente.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRProgressBar;