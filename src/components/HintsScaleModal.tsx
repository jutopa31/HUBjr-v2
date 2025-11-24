import React, { useState, useEffect, useMemo } from 'react';
import { X, Info, Save } from 'lucide-react';
import useEscapeKey from '../hooks/useEscapeKey';

interface HintsScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: HintsSavePayload) => Promise<void> | void;
}

export type HitResult = 'abnormal' | 'normal' | 'not_done' | '';
export type NystagmusResult = 'none_unidirectional' | 'bidirectional_gaze' | 'vertical_torsional' | 'not_evaluable' | '';
export type SkewResult = 'negative' | 'positive' | 'not_evaluable' | '';
export type HearingResult = 'no_deficit' | 'sudden_ssnhl_unilateral' | 'not_evaluable' | '';

export interface HintsFields {
  hit: HitResult;
  nystagmus: NystagmusResult;
  skew: SkewResult;
  hearing: HearingResult;
}

export type HintsInterpretationType = 'periferico' | 'central' | 'no_interpretable' | 'indeterminado';

export interface HintsInterpretationResult {
  tituloInterpretacion: string;
  textoInterpretacion: string;
  tipo: HintsInterpretationType;
}

export interface HintsSavePayload extends HintsFields {
  accepted: boolean;
  interpretation: HintsInterpretationResult | null;
  completedAt: string;
}

export function computeHintsInterpretation(fields: HintsFields): HintsInterpretationResult | null {
  const { hit, nystagmus, skew, hearing } = fields;

  const selected = [hit, nystagmus, skew, hearing].filter((v) => v !== '') as string[];
  const nonInterpCount = selected.filter((v) => v === 'not_done' || v === 'not_evaluable').length;
  if (selected.length > 0 && nonInterpCount > selected.length / 2) {
    return {
      tituloInterpretacion: 'HINTS no interpretable',
      textoInterpretacion:
        'Los datos ingresados no permiten una interpretación confiable. Considere repetir el examen o usar otros métodos diagnósticos.',
      tipo: 'no_interpretable'
    };
  }

  const isPeripheralPattern =
    hit === 'abnormal' &&
    nystagmus === 'none_unidirectional' &&
    skew === 'negative' &&
    hearing === 'no_deficit';

  if (isPeripheralPattern) {
    return {
      tituloInterpretacion: 'Perfil más compatible con lesión periférica',
      textoInterpretacion:
        'El patrón HINTS es más compatible con lesión vestibular periférica. Sin embargo, no excluye patología central. Mantenga la vigilancia clínica.',
      tipo: 'periferico'
    };
  }

  const hasCentralIndicator =
    hit === 'normal' ||
    nystagmus === 'bidirectional_gaze' ||
    nystagmus === 'vertical_torsional' ||
    skew === 'positive' ||
    hearing === 'sudden_ssnhl_unilateral';

  if (hasCentralIndicator) {
    return {
      tituloInterpretacion: 'Perfil sospechoso de lesión central (HINTS positivo)',
      textoInterpretacion:
        'El patrón HINTS es sospechoso de causa central. Considere evaluación urgente por neurología y neuroimagen adecuada.',
      tipo: 'central'
    };
  }

  return null;
}

const HintsScaleModal: React.FC<HintsScaleModalProps> = ({ isOpen, onClose, onSave }) => {
  const [accepted, setAccepted] = useState(false);
  const [hit, setHit] = useState<HitResult>('');
  const [nystagmus, setNystagmus] = useState<NystagmusResult>('');
  const [skew, setSkew] = useState<SkewResult>('');
  const [hearing, setHearing] = useState<HearingResult>('');
  const [isSaving, setIsSaving] = useState(false);

  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    if (isOpen) {
      setAccepted(false);
      setHit('');
      setNystagmus('');
      setSkew('');
      setHearing('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!accepted || isSaving) return;
    const fields: HintsFields = { hit, nystagmus, skew, hearing };
    const interp = computeHintsInterpretation(fields);
    const payload: HintsSavePayload = {
      ...fields,
      accepted,
      interpretation: interp,
      completedAt: new Date().toISOString()
    };

    try {
      setIsSaving(true);
      await onSave(payload);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const interpretation = useMemo(() => {
    if (!accepted) return null;
    return computeHintsInterpretation({ hit, nystagmus, skew, hearing });
  }, [accepted, hit, nystagmus, skew, hearing]);

  return (
    <div className="modal-overlay z-50 p-4">
      <div className="modal-content max-w-2xl w-full">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-secondary)] flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              HINTS / HINTS+ – Evaluación en síndrome vestibular agudo
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Se usa solo en síndrome vestibular agudo (SVA) y no reemplaza el juicio clínico ni la neuroimagen.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Condiciones de uso */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)]">
              <Info className="h-5 w-5 mt-0.5" style={{ color: 'var(--state-info)' }} />
              <div className="text-sm text-[var(--text-secondary)]">
                Utilice esta evaluación únicamente en pacientes con síntomas de inicio agudo y continuo compatibles con SVA.
              </div>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors"
              style={{
                borderColor: accepted ? 'color-mix(in srgb, var(--state-success) 30%, transparent)' : 'var(--border-secondary)',
                backgroundColor: accepted ? 'color-mix(in srgb, var(--state-success) 10%, var(--bg-primary) 90%)' : 'transparent'
              }}
            >
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5"
                style={{ accentColor: 'var(--state-success)' }}
                aria-required="true"
              />
              <span className="text-[var(--text-primary)] text-sm">
                El paciente presenta síndrome vestibular agudo (vértigo continuo, nistagmo espontáneo y marcha inestable).
              </span>
            </label>

            {!accepted && (
              <div className="text-sm" role="alert" style={{ color: 'var(--state-error)' }}>
                HINTS no es aplicable fuera del síndrome vestibular agudo.
              </div>
            )}
          </div>

          {/* Resultados HINTS */}
          <div className="space-y-6">
            {/* HIT horizontal */}
            <section>
              <h4 className="font-medium text-[var(--text-primary)] mb-2">Head Impulse Test (HIT) horizontal</h4>
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hit"
                    value="abnormal"
                    checked={hit === 'abnormal'}
                    onChange={() => setHit('abnormal')}
                    style={{ accentColor: 'var(--state-info)' }}
                  />
                  <span className="text-sm text-[var(--text-primary)]">
                    Anormal – Se observa sacada correctiva → sugiere lesión periférica.
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hit"
                    value="normal"
                    checked={hit === 'normal'}
                    onChange={() => setHit('normal')}
                    style={{ accentColor: 'var(--state-info)' }}
                  />
                  <span className="text-sm text-[var(--text-primary)]">
                    Normal – No se observa sacada correctiva → hallazgo sospechoso de causa central.
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hit"
                    value="not_done"
                    checked={hit === 'not_done'}
                    onChange={() => setHit('not_done')}
                    style={{ accentColor: 'var(--state-info)' }}
                  />
                  <span className="text-sm text-[var(--text-primary)]">No realizado / no interpretable.</span>
                </label>
              </div>
            </section>

            {/* Nistagmo */}
            <section>
              <h4 className="font-medium text-[var(--text-primary)] mb-2">Nistagmo</h4>
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="nystagmus"
                    value="none_unidirectional"
                    checked={nystagmus === 'none_unidirectional'}
                    onChange={() => setNystagmus('none_unidirectional')}
                    style={{ accentColor: 'var(--state-info)' }}
                  />
                  <span className="text-sm text-[var(--text-primary)]">Ausente o unidireccional horizontal.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="nystagmus"
                    value="bidirectional_gaze"
                    checked={nystagmus === 'bidirectional_gaze'}
                    onChange={() => setNystagmus('bidirectional_gaze')}
                    style={{ accentColor: 'var(--state-info)' }}
                  />
                  <span className="text-sm text-[var(--text-primary)]">Bidireccional según mirada.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="nystagmus"
                    value="vertical_torsional"
                    checked={nystagmus === 'vertical_torsional'}
                    onChange={() => setNystagmus('vertical_torsional')}
                    style={{ accentColor: 'var(--state-info)' }}
                  />
                  <span className="text-sm text-[var(--text-primary)]">Vertical puro o torsional puro.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="nystagmus"
                    value="not_evaluable"
                    checked={nystagmus === 'not_evaluable'}
                    onChange={() => setNystagmus('not_evaluable')}
                    style={{ accentColor: 'var(--state-info)' }}
                  />
                  <span className="text-sm text-[var(--text-primary)]">No evaluable / no interpretable.</span>
                </label>
              </div>
            </section>

            {/* Test of Skew */}
            <section>
              <h4 className="font-medium text-[var(--text-primary)] mb-2">Test of Skew</h4>
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="skew"
                    value="negative"
                    checked={skew === 'negative'}
                    onChange={() => setSkew('negative')}
                    style={{ accentColor: 'var(--state-info)' }}
                  />
                  <span className="text-sm text-[var(--text-primary)]">Negativo– sin desviación vertical/diagonal.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="skew"
                    value="positive"
                    checked={skew === 'positive'}
                    onChange={() => setSkew('positive')}
                    style={{ accentColor: 'var(--state-info)' }}
                  />
                  <span className="text-sm text-[var(--text-primary)]">Positivo – desviación vertical o diagonal.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="skew"
                    value="not_evaluable"
                    checked={skew === 'not_evaluable'}
                    onChange={() => setSkew('not_evaluable')}
                    style={{ accentColor: 'var(--state-info)' }}
                  />
                  <span className="text-sm text-[var(--text-primary)]">No evaluable / no realizado.</span>
                </label>
              </div>
            </section>

            {/* HINTS+ – Audición (opcional) */}
            <section>
              <h4 className="font-medium text-[var(--text-primary)] mb-2">HINTS+ – Audición (opcional)</h4>
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hearing"
                    value="no_deficit"
                    checked={hearing === 'no_deficit'}
                    onChange={() => setHearing('no_deficit')}
                    style={{ accentColor: 'var(--state-info)' }}
                  />
                  <span className="text-sm text-[var(--text-primary)]">Sin nuevo déficit auditivo.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hearing"
                    value="sudden_ssnhl_unilateral"
                    checked={hearing === 'sudden_ssnhl_unilateral'}
                    onChange={() => setHearing('sudden_ssnhl_unilateral')}
                    style={{ accentColor: 'var(--state-info)' }}
                  />
                  <span className="text-sm text-[var(--text-primary)]">Hipoacusia neurosensorial súbita unilateral.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hearing"
                    value="not_evaluable"
                    checked={hearing === 'not_evaluable'}
                    onChange={() => setHearing('not_evaluable')}
                    style={{ accentColor: 'var(--state-info)' }}
                  />
                  <span className="text-sm text-[var(--text-primary)]">No evaluable / no realizado.</span>
                </label>
              </div>
            </section>
          </div>

          {/* Interpretación automática */}
          {accepted && (
            <section className="p-4 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)]">
              <h4 className="font-semibold text-[var(--text-primary)] mb-1">Interpretación automática</h4>
              {interpretation ? (
                <div className="space-y-1">
                  <div className="text-[var(--text-primary)]">{interpretation.tituloInterpretacion}</div>
                  <p className="text-sm text-[var(--text-secondary)]">{interpretation.textoInterpretacion}</p>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-tertiary)]">
                  Complete los campos para ver una interpretación automática.
                </p>
              )}
            </section>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 pt-0 border-t border-[var(--border-secondary)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!accepted || isSaving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              accepted && !isSaving ? 'btn-primary' : 'opacity-60 cursor-not-allowed bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'
            }`}
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Guardando…' : 'Guardar resultado HINTS'}
          </button>
        </div>

        {/* Aviso legal / seguridad (fijo al pie) */}
        <div className="sticky bottom-0 p-4 pt-3 border-t border-[var(--border-secondary)] bg-[var(--bg-primary)]">
          <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
            Esta herramienta está destinada exclusivamente a profesionales de la salud entrenados en exploración oculomotora. No debe utilizarse para autodiagnóstico ni para tomar decisiones sin integrar la historia clínica completa, el examen neurológico y los estudios complementarios.
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HintsScaleModal);
