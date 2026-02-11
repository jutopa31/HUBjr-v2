import React, { useState } from 'react';
import { Presentation } from 'lucide-react';
import type { StructuredSections } from '../../../types/evolucionadorStructured';
import { downloadPresentation } from '../../../services/slideGenerationService';

interface SlideGeneratorProps {
  sections: StructuredSections;
  patientName: string;
  scaleResults: Array<{ name: string; score: string; details?: string }>;
  hospitalName?: string;
  onStatus?: (status: { success: boolean; message: string }) => void;
}

const SlideGenerator: React.FC<SlideGeneratorProps> = ({ sections, patientName, scaleResults, hospitalName, onStatus }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await downloadPresentation(sections, scaleResults, patientName, hospitalName);
      onStatus?.({ success: true, message: 'Presentacion descargada correctamente' });
    } catch (error) {
      console.error('[SlideGenerator] Error generando presentacion:', error);
      onStatus?.({ success: false, message: 'Error al generar la presentacion' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={isGenerating}
      className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
      title="Generar presentacion"
      type="button"
    >
      <Presentation className="h-3.5 w-3.5" />
      <span className="hidden xl:inline">Presentacion</span>
      {isGenerating && <span className="text-[10px]">...</span>}
    </button>
  );
};

export default SlideGenerator;
