import React, { useCallback, useRef, useState } from 'react';
import { Upload, Clipboard } from 'lucide-react';
import type { MediaCategory } from '../../../types/evolucionadorStructured';
import { getFilesFromClipboardEvent, isClipboardSupported, readImageFromClipboard } from '../../../services/clipboardService';

interface MediaUploaderProps {
  onUpload: (files: File[], category: MediaCategory) => Promise<void> | void;
  isUploading?: boolean;
}

const acceptedTypes = ['image/*', 'video/mp4', 'video/webm', 'video/quicktime'];

const MediaUploader: React.FC<MediaUploaderProps> = ({ onUpload, isUploading = false }) => {
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory>('Estudio');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files || []);
      if (fileArray.length === 0) return;
      void onUpload(fileArray, selectedCategory);
    },
    [onUpload, selectedCategory]
  );

  const handlePaste = async (event: React.ClipboardEvent) => {
    const files = getFilesFromClipboardEvent(event.nativeEvent);
    if (files) {
      event.preventDefault();
      handleUploadFiles(files);
      return;
    }
  };

  const handlePasteFromClipboard = async () => {
    if (!isClipboardSupported()) return;
    try {
      const files = await readImageFromClipboard();
      if (files) {
        handleUploadFiles(files);
      }
    } catch (error) {
      console.error('[MediaUploader] Error leyendo portapapeles:', error);
    }
  };

  return (
    <div
      className={
        `rounded-xl border-2 border-dashed p-4 transition ` +
        (isDraggingOver
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-[#0a0a0a]')
      }
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDraggingOver(false);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        setIsDraggingOver(false);
        handleUploadFiles(event.dataTransfer.files);
      }}
      onPaste={handlePaste}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Subir media</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Arrastra archivos, selecciona o pega desde el portapapeles.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value as MediaCategory)}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-[#0a0a0a] dark:text-gray-200"
          >
            <option value="Estudio">Estudio</option>
            <option value="Examen fisico">Examen fisico</option>
            <option value="Procedimiento">Procedimiento</option>
            <option value="Otro">Otro</option>
          </select>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={(event) => {
              if (event.target.files) {
                handleUploadFiles(event.target.files);
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isUploading ? 'Subiendo...' : 'Seleccionar'}
          </button>
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            disabled={!isClipboardSupported() || isUploading}
            className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-200"
          >
            <Clipboard className="h-3.5 w-3.5" />
            Pegar
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Formatos permitidos: imagenes, mp4, webm, quicktime.</p>
    </div>
  );
};

export default MediaUploader;
