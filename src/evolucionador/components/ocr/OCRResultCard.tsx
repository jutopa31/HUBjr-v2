import React, { useCallback, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { OCRResult } from '../../types/ocr.types';

interface OCRResultCardProps {
  result: OCRResult;
  onInsert?: (text: string) => void;
}

const OCRResultCard: React.FC<OCRResultCardProps> = ({ result, onInsert }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('[OCRResultCard] Clipboard error', error);
    }
  }, [result.text]);

  const handleInsert = useCallback(() => {
    if (!onInsert) return;
    onInsert(result.text);
  }, [onInsert, result.text]);

  return (
    <div className="space-y-3 rounded-xl border p-4 border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-gray-800 text-sm font-semibold">Resultado OCR</p>
          <p className="text-gray-500 text-xs">
            {result.fromCache ? 'Cache' : 'Claude'} · Confianza {Math.round(result.confidence * 100)}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 border-gray-200 bg-white text-gray-700 hover:bg-gray-100 text-sm font-medium"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar
              </>
            )}
          </button>
          {onInsert && (
            <button
              type="button"
              onClick={handleInsert}
              className="inline-flex items-center rounded-lg px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
            >
              Insertar en notas
            </button>
          )}
        </div>
      </div>

      <textarea
        value={result.text}
        readOnly
        className="h-52 w-full resize-none rounded-lg border p-3 border-gray-200 bg-gray-50 text-gray-800 text-sm"
      />

      <div className="flex flex-wrap items-center gap-3 text-gray-500 text-xs">
        <span>Tokens: {result.tokensUsed}</span>
        <span>Costo: ${result.cost.toFixed(4)}</span>
        <span>Tipo: {result.documentType}</span>
      </div>
    </div>
  );
};

export default React.memo(OCRResultCard);
