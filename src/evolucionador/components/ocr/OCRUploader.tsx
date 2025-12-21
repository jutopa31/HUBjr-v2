import React, { useCallback } from 'react';
import { Camera, Upload } from 'lucide-react';

interface OCRUploaderProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  helperText?: string;
}

const ACCEPTED_TYPES = '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp';

const isSupportedImage = (file: File): boolean =>
  file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);

const OCRUploader: React.FC<OCRUploaderProps> = ({ onFileSelected, disabled, helperText }) => {
  const handleFile = useCallback(
    (file?: File | null) => {
      if (!file) return;
      if (!isSupportedImage(file)) {
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      if (disabled) return;
      const file = event.dataTransfer.files?.[0];
      handleFile(file);
    },
    [disabled, handleFile]
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const file = event.target.files?.[0];
      handleFile(file);
    },
    [disabled, handleFile]
  );

  const handleCameraChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const file = event.target.files?.[0];
      handleFile(file);
      event.currentTarget.value = '';
    },
    [disabled, handleFile]
  );

  return (
    <div className="space-y-3">
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition ${
          disabled
            ? 'border-gray-200 bg-gray-50 text-gray-400'
            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50'
        } text-center`}
      >
        <Upload className="h-10 w-10 text-blue-500" />
        <p className="mt-3 text-gray-700 text-sm font-medium">Arrastra una imagen o selecciona un archivo</p>
        <p className="text-gray-500 text-xs">Formatos: PNG, JPG, WEBP</p>
        {helperText && <p className="mt-2 text-gray-500 text-xs">{helperText}</p>}
        <input type="file" accept={ACCEPTED_TYPES} className="hidden" onChange={handleFileChange} />
      </label>

      <div className="flex flex-wrap items-center gap-2 text-gray-600 text-xs">
        <label
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${
            disabled ? 'border-gray-200 bg-gray-100 text-gray-400' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
          } text-xs font-semibold`}
        >
          <Camera className="h-3.5 w-3.5" /> Tomar foto
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={disabled}
            onChange={handleCameraChange}
          />
        </label>
        <span className="text-gray-500 text-xs">Se procesa localmente antes de enviar.</span>
      </div>
    </div>
  );
};

export default React.memo(OCRUploader);
