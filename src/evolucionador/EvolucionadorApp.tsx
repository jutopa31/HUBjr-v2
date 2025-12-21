import React, { useEffect, useMemo, useState } from 'react';
import WizardContainer from './components/wizard/WizardContainer';
import ProgressBar from './components/wizard/ProgressBar';
import StepNavigation from './components/wizard/StepNavigation';
import PatientDataStep, { type PatientDataDraft } from './components/wizard/steps/PatientDataStep';
import NotesEditorStep from './components/wizard/steps/NotesEditorStep';
import ScalesStep from './components/wizard/steps/ScalesStep';
import ConfirmStep from './components/wizard/steps/ConfirmStep';
import type { HospitalContext, SavePatientData } from '../types';
import type { InterconsultaRow } from '../services/interconsultasService';
import { generateEvolucionadorTemplate } from '../services/workflowIntegrationService';
import { savePatientAssessment } from '../utils/diagnosticAssessmentDB';
import { updateInterconsultaResponse } from '../services/interconsultasService';
import { createWardPatientFromEvolution } from '../services/workflowIntegrationService';

const steps = ['Paciente', 'Notas + OCR', 'Escalas', 'Confirmar'];

interface EvolucionadorAppProps {
  interconsultaData?: InterconsultaRow | null;
  hospitalContext?: HospitalContext;
  onCancel?: () => void;
  onComplete?: () => void;
}

const EvolucionadorApp: React.FC<EvolucionadorAppProps> = ({
  interconsultaData,
  hospitalContext = 'Posadas',
  onCancel,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [notes, setNotes] = useState('');
  const [patientData, setPatientData] = useState<PatientDataDraft>({
    name: '',
    dni: '',
    age: '',
    bed: ''
  });
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canGoNext = useMemo(() => {
    if (currentStep === 0) {
      return patientData.dni.trim().length > 0;
    }
    return true;
  }, [currentStep, patientData.dni]);

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  useEffect(() => {
    if (!interconsultaData || hasPrefilled) return;
    setPatientData((prev) => ({
      name: prev.name || interconsultaData.nombre || '',
      dni: prev.dni || interconsultaData.dni || '',
      age: prev.age || interconsultaData.edad || '',
      bed: prev.bed || interconsultaData.cama || ''
    }));
    if (!notes.trim()) {
      setNotes(generateEvolucionadorTemplate(interconsultaData));
    }
    setHasPrefilled(true);
  }, [hasPrefilled, interconsultaData, notes]);

  const buildSavePayload = (): SavePatientData => ({
    patient_name: patientData.name || interconsultaData?.nombre || 'Paciente sin nombre',
    patient_age: patientData.age || interconsultaData?.edad || '',
    patient_dni: patientData.dni || interconsultaData?.dni || '',
    clinical_notes: notes,
    scale_results: [],
    hospital_context: hospitalContext,
    source_interconsulta_id: interconsultaData?.id,
    response_sent: false
  });

  const handleSave = async (addToWardRound: boolean) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const payload = buildSavePayload();
      const { success, data, error } = await savePatientAssessment(payload);
      if (!success || !data?.id) {
        throw new Error(error || 'No se pudo guardar la evolucion.');
      }

      if (interconsultaData?.id) {
        const updated = await updateInterconsultaResponse(interconsultaData.id, notes, 'Resuelta');
        if (!updated) {
          throw new Error('No se pudo actualizar la interconsulta.');
        }
      }

      if (addToWardRound && interconsultaData?.id) {
        const wardResult = await createWardPatientFromEvolution(interconsultaData.id, data.id);
        if (!wardResult.success) {
          throw new Error(wardResult.error || 'No se pudo crear el paciente en Pase de Sala.');
        }
      }

      onComplete?.();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error inesperado al guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <WizardContainer
      title="Evolucionador"
      description="Flujo guiado para notas clinicas con OCR y escalas."
    >
      <div className="space-y-6">
        {onCancel && (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border px-3 py-1.5 border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-100"
            >
              Volver
            </button>
          </div>
        )}
        <ProgressBar currentStep={currentStep} totalSteps={steps.length} />

        {currentStep === 0 && <PatientDataStep data={patientData} onChange={setPatientData} />}

        {currentStep === 1 && (
          <NotesEditorStep
            notes={notes}
            onNotesChange={setNotes}
          />
        )}

        {currentStep === 2 && <ScalesStep />}

        {currentStep === 3 && (
          <ConfirmStep
            notes={notes}
            interconsulta={interconsultaData}
            isSaving={isSaving}
            saveError={saveError}
            onSave={() => handleSave(false)}
            onSaveToWardRound={interconsultaData ? () => handleSave(true) : undefined}
          />
        )}

        <StepNavigation
          canGoBack={currentStep > 0}
          canGoNext={canGoNext && currentStep < steps.length - 1}
          onBack={handleBack}
          onNext={handleNext}
          nextLabel={currentStep === steps.length - 2 ? 'Confirmar' : 'Siguiente'}
        />
      </div>
    </WizardContainer>
  );
};

export default EvolucionadorApp;
