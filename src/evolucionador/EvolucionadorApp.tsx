import React, { useEffect, useMemo, useRef, useState } from 'react';
import WizardContainer from './components/wizard/WizardContainer';
import ProgressBar from './components/wizard/ProgressBar';
import StepNavigation from './components/wizard/StepNavigation';
import PatientDataStep, { type PatientDataDraft } from './components/wizard/steps/PatientDataStep';
import NotesEditorStep from './components/wizard/steps/NotesEditorStep';
import ScalesStep from './components/wizard/steps/ScalesStep';
import ConfirmStep from './components/wizard/steps/ConfirmStep';
import type { EvolucionadorDraft, EvolucionadorDraftPayload, HospitalContext, SavePatientData } from '../types';
import type { InterconsultaRow } from '../services/interconsultasService';
import { generateEvolucionadorTemplate } from '../services/workflowIntegrationService';
import { savePatientAssessment } from '../utils/diagnosticAssessmentDB';
import { appendOCRTextToInterconsulta, updateInterconsultaResponse } from '../services/interconsultasService';
import { createWardPatientFromEvolution } from '../services/workflowIntegrationService';
import { useAuth } from '../hooks/useAuth';
import {
  deleteEvolucionadorDraft,
  getEvolucionadorDraft,
  listEvolucionadorDrafts,
  saveEvolucionadorDraft
} from '../services/evolucionadorDraftsService';

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
  const [drafts, setDrafts] = useState<EvolucionadorDraft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [draftSyncLabel, setDraftSyncLabel] = useState<string | null>(null);
  const [draftListStatus, setDraftListStatus] = useState<string | null>(null);
  const isHydratingDraft = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const { user } = useAuth();
  const userId = user?.id || null;

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

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    const loadDrafts = async () => {
      setDraftListStatus('Cargando borradores...');
      const result = await listEvolucionadorDrafts(userId);
      if (!isMounted) return;
      if (result.success) {
        setDrafts(result.data || []);
        setDraftListStatus(null);
        return;
      }
      setDraftListStatus(result.error || 'No se pudieron cargar los borradores');
    };
    void loadDrafts();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    if (isHydratingDraft.current) return;

    const hasContent = Boolean(
      notes.trim() ||
      patientData.name.trim() ||
      patientData.dni.trim() ||
      patientData.age.trim() ||
      patientData.bed.trim()
    );
    if (!hasContent) return;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    setDraftSyncLabel('Guardando borrador...');
    saveTimerRef.current = window.setTimeout(async () => {
      const payload: EvolucionadorDraftPayload = {
        notes,
        patient_name: patientData.name || undefined,
        patient_dni: patientData.dni || undefined,
        patient_age: patientData.age || undefined,
        patient_bed: patientData.bed || undefined,
        source_interconsulta_id: interconsultaData?.id || null
      };

      const result = await saveEvolucionadorDraft(userId, activeDraftId, payload);
      if (result.success && result.data) {
        const timestamp = new Date(result.data.updated_at || Date.now()).toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        setActiveDraftId(result.data.id);
        setDraftSyncLabel(`Borrador guardado ${timestamp}`);
        setDrafts((prev) => {
          if (!result.data) return prev;
          const savedDraft = result.data;
          const existingIndex = prev.findIndex((draft) => draft.id === savedDraft.id);
          if (existingIndex === -1) {
            return [savedDraft, ...prev];
          }
          const next = [...prev];
          next[existingIndex] = savedDraft;
          return next.sort((a, b) => {
            const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
            const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
            return bTime - aTime;
          });
        });
        return;
      }
      setDraftSyncLabel(result.error || 'No se pudo guardar borrador');
    }, 900);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [activeDraftId, interconsultaData?.id, notes, patientData, userId]);

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

      if (userId && activeDraftId) {
        const draftDelete = await deleteEvolucionadorDraft(userId, activeDraftId);
        if (draftDelete.success) {
          setDrafts((prev) => prev.filter((draft) => draft.id !== activeDraftId));
          setActiveDraftId(null);
        }
      }

      onComplete?.();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error inesperado al guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInsertOcrText = async (text: string) => {
    if (!interconsultaData?.id) return;
    await appendOCRTextToInterconsulta(interconsultaData.id, text);
  };

  const handleLoadDraft = async (draftId: string) => {
    if (!userId) return;
    setDraftListStatus('Cargando borrador...');
    isHydratingDraft.current = true;
    const result = await getEvolucionadorDraft(userId, draftId);
    if (result.success && result.data) {
      setActiveDraftId(result.data.id);
      setNotes(result.data.notes || '');
      setPatientData({
        name: result.data.patient_name || '',
        dni: result.data.patient_dni || '',
        age: result.data.patient_age || '',
        bed: result.data.patient_bed || ''
      });
      setHasPrefilled(true);
      setDraftListStatus(null);
    } else {
      setDraftListStatus(result.error || 'No se pudo cargar el borrador');
    }
    setTimeout(() => {
      isHydratingDraft.current = false;
    }, 0);
  };

  const handleNewDraft = () => {
    setActiveDraftId(null);
    setNotes('');
    setPatientData({
      name: '',
      dni: '',
      age: '',
      bed: ''
    });
    setHasPrefilled(true);
    setDraftSyncLabel('Nuevo borrador');
  };

  const formatDraftMeta = (draft: EvolucionadorDraft) => {
    const parts: string[] = [];
    if (draft.patient_dni) {
      parts.push(`DNI ${draft.patient_dni}`);
    }
    if (draft.updated_at) {
      const when = new Date(draft.updated_at).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      parts.push(when);
    }
    return parts.join(' • ') || 'Sin detalles';
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

        {userId && (
          <div className="space-y-3 rounded-xl border p-4 border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-gray-900 text-sm font-semibold">Borradores</p>
                <p className="text-gray-500 text-xs">Guardado automatico en todos tus dispositivos.</p>
              </div>
              <button
                type="button"
                onClick={handleNewDraft}
                className="rounded-full border px-3 py-1 border-gray-200 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-100"
              >
                Nuevo borrador
              </button>
            </div>

            {draftListStatus && <p className="text-gray-500 text-xs">{draftListStatus}</p>}

            {!draftListStatus && drafts.length === 0 && (
              <p className="text-gray-500 text-xs">Sin borradores guardados.</p>
            )}

            {drafts.length > 0 && (
              <div className="space-y-2">
                {drafts.map((draft) => (
                  <button
                    key={draft.id}
                    type="button"
                    onClick={() => handleLoadDraft(draft.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                      activeDraftId === draft.id
                        ? 'border-blue-200 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{draft.patient_name || 'Borrador sin nombre'}</p>
                      <p className="text-xs text-gray-500">{formatDraftMeta(draft)}</p>
                    </div>
                    {activeDraftId === draft.id && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                        Activo
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <ProgressBar currentStep={currentStep} totalSteps={steps.length} />

        {currentStep === 0 && <PatientDataStep data={patientData} onChange={setPatientData} />}

        {currentStep === 1 && (
          <NotesEditorStep
            notes={notes}
            onNotesChange={setNotes}
            onInsertOcrText={handleInsertOcrText}
            autoSaveLabel={draftSyncLabel || undefined}
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
