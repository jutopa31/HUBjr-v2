import React, { useCallback, useMemo, useRef, useState } from 'react';
import { X, HelpCircle } from 'lucide-react';
import calculateScaleScore from '../calculateScaleScore';
import { Scale, ScaleItem, ScaleModalProps, ScaleResult } from '../types';

type Mode = 'full' | 'mini';

function stripLeadingNumber(label: string): string {
  const m = label.match(/^\s*\d+\.\s*(.*)$/);
  return m ? m[1] : label;
}

// Todos los ítems de fuerza muscular tienen lateralidad (izquierda/derecha)
const LATERAL_ITEMS = new Set<string>([
  'neck_flexor',
  'deltoid',
  'biceps',
  'wrist_extension',
  'wrist_flexion',
  'psoas',
  'gluteus',
  'quadriceps',
  'plantar_flexor',
  'plantar_extensor'
]);

// Instrucciones para evaluación de fuerza muscular MRC
const MRC_INSTRUCTIONS: Record<string, string> = {
  neck_flexor: 'Evaluación del flexor del cuello: solicite al paciente flexionar la cabeza contra resistencia. Observe la capacidad de vencer la gravedad y resistir presión manual.',
  deltoid: 'Evaluación del deltoides (abducción de hombro): solicite al paciente elevar el brazo lateralmente a 90°. Evalúe contra gravedad y resistencia.',
  biceps: 'Evaluación del bíceps (flexión de codo): solicite flexionar el codo contra resistencia. Observe fuerza y capacidad de mantener la posición.',
  wrist_extension: 'Evaluación de extensión de muñeca: solicite extender la muñeca contra resistencia. Evalúe fuerza del extensor carpi radialis/ulnaris.',
  wrist_flexion: 'Evaluación de flexión de muñeca: solicite flexionar la muñeca contra resistencia. Evalúe fuerza de los flexores carpales.',
  psoas: 'Evaluación del psoas (flexión de cadera): con paciente sentado o acostado, solicite elevar el muslo contra resistencia. Evalúe fuerza del iliopsoas.',
  gluteus: 'Evaluación de glúteos (extensión de cadera): con paciente en decúbito prono, solicite extensión de cadera contra resistencia.',
  quadriceps: 'Evaluación del cuádriceps (extensión de rodilla): solicite extender la rodilla contra resistencia. Observe capacidad de mantener extensión completa.',
  plantar_flexor: 'Evaluación del flexor plantar (flexión de tobillo): solicite ponerse de puntillas. Evalúe gastrocnemios y sóleo.',
  plantar_extensor: 'Evaluación del extensor plantar (dorsiflexión): solicite levantar el antepié manteniendo el talón apoyado. Evalúe tibial anterior.'
};

interface MuscleStrengthModalProps extends ScaleModalProps {
  scale: Scale;
}

const MuscleStrengthModal: React.FC<MuscleStrengthModalProps> = ({ scale, onClose, onSubmit }) => {
  const [mode, setMode] = useState<Mode>('full');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [showItemHelp, setShowItemHelp] = useState<Record<string, boolean>>({});

  // refs lineales de todos los inputs de puntaje (para Tab/Enter)
  const inputsRef = useRef<HTMLInputElement[]>([]);

  const handleQuickSet = useCallback((itemKey: string, value: number) => {
    setScores(prev => ({ ...prev, [itemKey]: value }));
  }, []);

  const handleInput = useCallback((itemKey: string, value: string) => {
    const n = Number(value);
    if (!Number.isNaN(n)) {
      const clamped = Math.max(0, Math.min(5, Math.floor(n)));
      setScores(prev => ({ ...prev, [itemKey]: clamped }));
    } else if (value === '') {
      setScores(prev => {
        const next = { ...prev } as Record<string, number | undefined>;
        delete next[itemKey];
        return next as Record<string, number>;
      });
    }
  }, []);

  const toggleItemHelp = useCallback((itemId: string) => {
    setShowItemHelp(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  }, []);

  // Construir mapa combinado para cálculo (sumar izquierda+derecha)
  const combinedScores = useMemo(() => {
    const out: Record<string, number | string> = {};
    scale.items.forEach((it) => {
      if (LATERAL_ITEMS.has(it.id)) {
        const L = typeof scores[`${it.id}_L`] === 'number' ? (scores[`${it.id}_L`] as number) : 0;
        const R = typeof scores[`${it.id}_R`] === 'number' ? (scores[`${it.id}_R`] as number) : 0;
        out[it.id] = L + R;
      } else {
        const val = scores[it.id];
        if (val !== undefined) out[it.id] = val as number;
        else if (typeof it.score === 'number') out[it.id] = it.score;
        else out[it.id] = 0;
      }
    });
    return out;
  }, [scale.items, scores]);

  const currentTotal = useMemo(() => {
    try {
      const result = calculateScaleScore(scale, combinedScores);
      return result?.totalScore ?? null;
    } catch {
      return null;
    }
  }, [scale, combinedScores]);

  const handleSubmit = useCallback(() => {
    let result: ScaleResult = calculateScaleScore(scale, combinedScores);

    // Detalle por lateralidad
    const idToLabel = Object.fromEntries(scale.items.map(it => [it.id, stripLeadingNumber(it.label)]));
    const lines: string[] = [];

    LATERAL_ITEMS.forEach((id) => {
      const L = scores[`${id}_L`] ?? 0;
      const R = scores[`${id}_R`] ?? 0;
      if (L || R) {
        lines.push(`• ${idToLabel[id] || id}: Izq ${L}/5, Der ${R}/5 (total ${(Number(L)||0)+(Number(R)||0)}/10)`);
      }
    });

    const lateralDetail = lines.length ? `\nDetalle por miembro:\n${lines.join('\n')}` : '';

    result = {
      ...result,
      details: `${result.details}${lateralDetail}\n\nEscala MRC (Medical Research Council) - Rango: 0-5 por grupo muscular, 0-10 bilateral`
    };

    onSubmit(result);
  }, [onSubmit, scale, combinedScores, scores]);

  // Limpiar refs antes de mapear
  inputsRef.current = [];

  const renderLateralInputs = (item: ScaleItem, _indexBase: number) => {
    const keyL = `${item.id}_L`;
    const keyR = `${item.id}_R`;

    return (
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Lado Izquierdo */}
        <div>
          <div className="text-xs text-[var(--text-secondary)] mb-1">Izquierda</div>
          <div className="flex items-center gap-3">
            <input
              inputMode="numeric"
              pattern="[0-5]"
              value={scores[keyL] ?? ''}
              onChange={(e) => handleInput(keyL, e.target.value)}
              onKeyDown={(e) => {
                const k = e.key;
                if (['0','1','2','3','4','5'].includes(k)) {
                  e.preventDefault();
                  handleQuickSet(keyL, parseInt(k, 10));
                  const active = e.currentTarget as HTMLInputElement;
                  const idx = inputsRef.current.indexOf(active);
                  const next = inputsRef.current[idx + 1];
                  if (next) next.focus(); else handleSubmit();
                }
                if (k === 'Enter') {
                  e.preventDefault();
                  const active = e.currentTarget as HTMLInputElement;
                  const idx = inputsRef.current.indexOf(active);
                  const next = inputsRef.current[idx + 1];
                  if (next) next.focus(); else handleSubmit();
                }
              }}
              placeholder="0–5"
              className="w-16 h-10 border border-[var(--border-primary)] rounded px-2 text-center text-[var(--text-primary)] bg-[var(--bg-primary)]"
              ref={(el) => { if (el) inputsRef.current.push(el); }}
            />
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleQuickSet(keyL, v)}
                  className={`h-10 w-10 rounded border ${scores[keyL] === v ? 'btn-accent' : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]'}`}
                  tabIndex={-1}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lado Derecho */}
        <div>
          <div className="text-xs text-[var(--text-secondary)] mb-1 text-right sm:text-left">Derecha</div>
          <div className="flex items-center gap-3 justify-start sm:justify-start">
            <input
              inputMode="numeric"
              pattern="[0-5]"
              value={scores[keyR] ?? ''}
              onChange={(e) => handleInput(keyR, e.target.value)}
              onKeyDown={(e) => {
                const k = e.key;
                if (['0','1','2','3','4','5'].includes(k)) {
                  e.preventDefault();
                  handleQuickSet(keyR, parseInt(k, 10));
                  const active = e.currentTarget as HTMLInputElement;
                  const idx = inputsRef.current.indexOf(active);
                  const next = inputsRef.current[idx + 1];
                  if (next) next.focus(); else handleSubmit();
                }
                if (k === 'Enter') {
                  e.preventDefault();
                  const active = e.currentTarget as HTMLInputElement;
                  const idx = inputsRef.current.indexOf(active);
                  const next = inputsRef.current[idx + 1];
                  if (next) next.focus(); else handleSubmit();
                }
              }}
              placeholder="0–5"
              className="w-16 h-10 border border-[var(--border-primary)] rounded px-2 text-center text-[var(--text-primary)] bg-[var(--bg-primary)]"
              ref={(el) => { if (el) inputsRef.current.push(el); }}
            />
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleQuickSet(keyR, v)}
                  className={`h-10 w-10 rounded border ${scores[keyR] === v ? 'btn-accent' : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]'}`}
                  tabIndex={-1}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderItem = (item: ScaleItem, index: number) => {
    const displayTitle = `${index + 1}. ${stripLeadingNumber(item.label)}`;
    const helpText = MRC_INSTRUCTIONS[item.id] || 'Evalúe la fuerza muscular según la escala MRC (0-5). 0: Sin contracción; 1: Contracción sin movimiento; 2: Movimiento sin vencer gravedad; 3: Movimiento venciendo gravedad; 4: Movimiento contra resistencia; 5: Fuerza normal.';

    return (
      <div key={item.id} className="border border-[var(--border-secondary)] rounded-lg p-4 bg-[var(--bg-secondary)]">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-[var(--text-primary)]">{displayTitle}</h4>
            {mode === 'full' && (
              <p className="text-sm text-[var(--text-secondary)] mt-1">{stripLeadingNumber(item.label)}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Mostrar instrucciones"
            title="Mostrar instrucciones"
            onClick={() => toggleItemHelp(item.id)}
            className="flex items-center"
            style={{ color: 'var(--state-info)' }}
            tabIndex={-1}
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>

        {(showItemHelp[item.id] || mode === 'full') && (
          <div className="mt-3 p-3 bg-[var(--bg-primary)] rounded border" style={{
            borderColor: 'color-mix(in srgb, var(--state-info) 30%, transparent)'
          }}>
            <p className="text-sm text-[var(--text-primary)] whitespace-pre-line">{helpText}</p>
          </div>
        )}

        {renderLateralInputs(item, index)}
      </div>
    );
  };

  return (
    <div className="modal-overlay z-50 p-4">
      <div className="modal-content max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[var(--border-secondary)] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{scale.name}</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{scale.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[var(--bg-tertiary)] rounded p-1">
              <button
                type="button"
                onClick={() => setMode('mini')}
                className={`px-3 py-1 rounded text-sm ${mode === 'mini' ? 'bg-[var(--bg-primary)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
              >
                Mini
              </button>
              <button
                type="button"
                onClick={() => setMode('full')}
                className={`px-3 py-1 rounded text-sm ${mode === 'full' ? 'bg-[var(--bg-primary)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
              >
                Full
              </button>
            </div>
            <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]" aria-label="Cerrar">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded">
            <p className="text-xs text-[var(--text-primary)]">
              <strong>Instrucciones:</strong> Evalúe la fuerza de cada grupo muscular en ambos lados (izquierda y derecha) usando la escala MRC de 0 a 5.
              Use los botones numéricos para rapidez o ingrese directamente. Presione Enter o Tab para avanzar al siguiente campo.
            </p>
          </div>

          {scale.items?.map((item, index) => renderItem(item, index))}

          {currentTotal !== null && (
            <div className="mt-2 p-4 rounded-lg border" style={{
              backgroundColor: 'color-mix(in srgb, var(--state-info) 10%, var(--bg-primary) 90%)',
              borderColor: 'color-mix(in srgb, var(--state-info) 30%, transparent)'
            }}>
              <div className="flex items-center justify-between">
                <span className="font-medium" style={{ color: 'var(--state-info)' }}>Puntuación Total</span>
                <span className="text-xl font-bold" style={{ color: 'var(--state-info)' }}>{currentTotal}/100</span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--state-info)' }}>
                (Máximo: 100 puntos = 10 grupos musculares × 10 puntos bilaterales)
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-accent px-4 py-2 rounded"
            >
              Guardar resultados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MuscleStrengthModal;
