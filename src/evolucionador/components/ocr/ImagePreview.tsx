import React, { useCallback, useState } from 'react';
import { Check, RotateCw, X } from 'lucide-react';

interface ImagePreviewProps {
  imageDataUrl: string;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

const rotateDataUrl = async (dataUrl: string, degrees: number): Promise<string> => {
  const img = new Image();
  const loadPromise = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('No se pudo cargar la imagen.'));
  });
  img.src = dataUrl;
  await loadPromise;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar el canvas.');
  }

  const radians = (degrees * Math.PI) / 180;
  const isQuarterTurn = degrees % 180 !== 0;
  canvas.width = isQuarterTurn ? img.height : img.width;
  canvas.height = isQuarterTurn ? img.width : img.height;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  return canvas.toDataURL('image/jpeg', 0.92);
};

const ImagePreview: React.FC<ImagePreviewProps> = ({ imageDataUrl, onConfirm, onCancel }) => {
  const [currentDataUrl, setCurrentDataUrl] = useState(imageDataUrl);
  const [isRotating, setIsRotating] = useState(false);

  const handleRotate = useCallback(async () => {
    setIsRotating(true);
    const rotated = await rotateDataUrl(currentDataUrl, 90);
    setCurrentDataUrl(rotated);
    setIsRotating(false);
  }, [currentDataUrl]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 bg-[var(--bg-secondary)]">
        <img src={currentDataUrl} alt="Preview OCR" className="mx-auto h-auto max-w-full" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleRotate}
          disabled={isRotating}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-100 text-sm font-semibold"
        >
          <RotateCw className="h-4 w-4" />
          Rotar
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-100 text-sm font-semibold"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(currentDataUrl)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold"
          >
            <Check className="h-4 w-4" />
            Procesar
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ImagePreview);
