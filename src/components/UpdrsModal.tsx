import React, { useCallback, useMemo, useRef, useState } from 'react';
import { X, HelpCircle } from 'lucide-react';
import calculateScaleScore from '../calculateScaleScore';
import { Scale, ScaleItem, ScaleModalProps, ScaleResult } from '../types';

type Mode = 'full' | 'mini';

function stripLeadingNumber(label: string): string {
  const m = label.match(/^\s*\d+\.\s*(.*)$/);
  return m ? m[1] : label;
}

const LENGUAJE_INSTRUCCIONES = `Instrucciones para el evaluador: Escuche el lenguaje espontáneo del paciente y mantenga una conversación con él, si es necesario. Temas sugeridos: pregúntele sobre su trabajo, aficiones, ejercicio o cómo ha llegado hasta la consulta. Evalúe el volumen, modulación (prosodia), y claridad, incluyendo mala articulación del lenguaje, palilalia (repetición de sílabas), y taquifemia (lenguaje rápido, juntando sílabas).`;

// Instrucciones por ítem (UPDRS III)
const UPDRS3_INSTRUCTIONS: Record<string, string> = {
  speech_motor: LENGUAJE_INSTRUCCIONES,
  facial_expression:
    'Observe la mímica facial durante reposo y conversación. Evalúe hipomimia (reducción de parpadeo, pobreza expresiva) y espontaneidad. Considere la congruencia con el contenido hablado.',
  rest_tremor_hands:
    'Con el paciente relajado y manos apoyadas, observe el temblor de reposo en cada mano. Cuantifique amplitud y persistencia. Verifique supresión parcial con acción y reaparición en reposo.',
  rest_tremor_feet:
    'Observe temblor de reposo en pies y piernas con el paciente sentado. Valore presencia, amplitud y persistencia temporal.',
  action_tremor:
    'Solicite mantener postura (brazos extendidos) y realizar dedo‑nariz. Evalúe temblor postural/cinético, amplitud e interferencia funcional.',
  axial_rigidity:
    'Rigidez de cuello: movilice pasivamente la cabeza en flexo‑extensión y rotación. Use maniobras activadoras (movimientos espejo) si es necesario. Califique la resistencia.',
  limb_rigidity:
    'Rigidez de extremidades: flexo‑extienda codo, muñeca, cadera, rodilla y tobillo. Considere “rueda dentada” y resistencia sostenida. Aplique maniobras activadoras si precisa.',
  finger_taps:
    'Índice‑pulgar lo más rápido y amplio posible por 10–15 s en cada mano. Observe lentitud, decremento de amplitud, interrupciones y fatigabilidad.',
  hand_movements:
    'Apertura‑cierre de mano rápida y amplia por 10–15 s. Valore bradicinesia, decremento, detenciones y dificultad para sostener amplitud.',
  rapid_alternating:
    'Pronación‑supinación rápida 10–15 s con regularidad. Evalúe velocidad, amplitud, regularidad y fatiga.',
  leg_agility:
    'Golpeteo del antepié (talón apoyado) 10–15 s por lado. Observe lentitud, reducción de amplitud, irregularidad y pausas.',
  arising_chair:
    'Levantarse de la silla sin usar brazos si es posible. Valore intentos, necesidad de apoyo, retropulsión y estabilidad al incorporarse.',
  posture:
    'En bipedestación, observe flexión de tronco/cabeza e inclinación lateral. Valore severidad y posibilidad de corrección voluntaria.',
  gait:
    'Marcha: inicio, longitud del paso, festinación, arrastre, balanceo de brazos y virajes. Note bloqueos y necesidad de asistencia.',
  postural_stability:
    'Prueba de retropulsión: empuje breve en hombros con preparación. Evalúe recuperación espontánea o necesidad de intervención.',
  bradykinesia:
    'Integre lentitud, reducción de amplitud, fatigabilidad y pobreza de movimiento a lo largo de múltiples tareas.'
};

// Ítems UPDRS III con lateralidad (Izquierda/Derecha)
const LATERAL_ITEMS = new Set<string>([
  'rest_tremor_hands',
  'rest_tremor_feet',
  'action_tremor',
  'finger_taps',
  'hand_movements',
  'rapid_alternating',
  'leg_agility'
]);

// Claves compactas para rigidez (UPDRS III): cuello + 4 miembros
const RIGIDITY_KEYS = [
  { key: 'rigidity_cuello', label: 'Cuello' },
  { key: 'rigidity_msd', label: 'MSD' },
  { key: 'rigidity_msi', label: 'MSI' },
  { key: 'rigidity_mid', label: 'MID' },
  { key: 'rigidity_mii', label: 'MII' },
] as const;

// Tooltip corto para rigidez (0–4)
const RIGIDITY_TOOLTIP = 'Puntuación rigidez (0–4): 0 Ausente; 1 Leve/solo con activación; 2 Leve–moderada; 3 Marcada (rango completo posible); 4 Severa (rango con dificultad).';

interface UpdrsModalProps extends ScaleModalProps {
  scale: Scale; // id esperado: 'updrs1' | 'updrs2' | 'updrs3' | 'updrs4'
}

const UpdrsModal: React.FC<UpdrsModalProps> = ({ scale, onClose, onSubmit }) => {
  const [mode, setMode] = useState<Mode>('full');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [showItemHelp, setShowItemHelp] = useState<Record<string, boolean>>({});
  const [showScoringHelp, setShowScoringHelp] = useState<Record<string, boolean>>({});
  const [medOnOff, setMedOnOff] = useState<'ON' | 'OFF'>('ON');
  const [hoursSinceLdopa, setHoursSinceLdopa] = useState<string>('');
  const parsedHoursSince = useMemo(() => {
    const n = parseFloat(hoursSinceLdopa);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : null;
  }, [hoursSinceLdopa]);

  // refs lineales de todos los inputs de puntaje (para Tab/Enter)
  const inputsRef = useRef<HTMLInputElement[]>([]);

  const updrsSectionPrefix = useMemo(() => {
    switch (scale.id) {
      case 'updrs1':
        return '1';
      case 'updrs2':
        return '2';
      case 'updrs3':
        return '3';
      case 'updrs4':
        return '4';
      default:
        return '';
    }
  }, [scale.id]);

  const handleQuickSet = useCallback((itemKey: string, value: number) => {
    setScores(prev => ({ ...prev, [itemKey]: value }));
  }, []);

  const handleInput = useCallback((itemKey: string, value: string) => {
    const n = Number(value);
    if (!Number.isNaN(n)) {
      const clamped = Math.max(0, Math.min(4, Math.floor(n)));
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

  const toggleScoringHelp = useCallback((itemId: string) => {
    setShowScoringHelp(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  }, []);

  // Construir mapa combinado para cálculo (sumar izquierda+derecha donde aplique)
  const combinedScores = useMemo(() => {
    const out: Record<string, number | string> = {};
    scale.items.forEach((it) => {
      if (scale.id === 'updrs3' && it.id === 'axial_rigidity') {
        const neck = typeof scores['rigidity_cuello'] === 'number' ? (scores['rigidity_cuello'] as number) : 0;
        out['axial_rigidity'] = neck;
        return;
      }
      if (scale.id === 'updrs3' && it.id === 'limb_rigidity') {
        const sumLimbs = ['rigidity_msd','rigidity_msi','rigidity_mid','rigidity_mii']
          .reduce((s, k) => s + (typeof scores[k] === 'number' ? (scores[k] as number) : 0), 0);
        out['limb_rigidity'] = sumLimbs;
        return;
      }

      if (LATERAL_ITEMS.has(it.id) && scale.id === 'updrs3') {
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
  }, [scale.items, scale.id, scores]);

  const currentTotal = useMemo(() => {
    try {
      const result = calculateScaleScore(scale, combinedScores);
      return result?.totalScore ?? null;
    } catch {
      return null;
    }
  }, [scale, combinedScores]);

  // Dominios y subtotales para UPDRS III
  const domainGroups = useMemo(() => ({
    'Habla/Expresión': ['speech_motor', 'facial_expression'],
    'Temblor': ['rest_tremor_hands', 'rest_tremor_feet', 'action_tremor'],
    'Rigidez': ['axial_rigidity', 'limb_rigidity'],
    'Bradicinesia/Destreza': ['finger_taps', 'hand_movements', 'rapid_alternating', 'leg_agility'],
    'Postura/Marcha/Equilibrio': ['arising_chair', 'posture', 'gait', 'postural_stability'],
    'Bradicinesia global': ['bradykinesia']
  }), []);

  const domainSubtotals = useMemo(() => {
    const subtotals: Record<string, number> = {};
    Object.entries(domainGroups).forEach(([name, ids]) => {
      subtotals[name] = ids.reduce((sum, id) => sum + (typeof combinedScores[id] === 'number' ? (combinedScores[id] as number) : 0), 0);
    });
    return subtotals;
  }, [domainGroups, combinedScores]);

  const handleSubmit = useCallback(() => {
    let result: ScaleResult = calculateScaleScore(scale, combinedScores);
    const medLine = `Estado de medicación: ${medOnOff}${parsedHoursSince !== null ? ` (− ${parsedHoursSince} horas)` : ''}`;
    const domainLines = Object.entries(domainSubtotals)
      .map(([k, v]) => `• ${k}: ${v}`)
      .join('\n');

    // Detalle por lateralidad para UPDRS III
    let lateralDetail = '';
    if (scale.id === 'updrs3') {
      const idToLabel = Object.fromEntries(scale.items.map(it => [it.id, stripLeadingNumber(it.label)]));
      const lines: string[] = [];
      // Ítems con lateralidad L/R
      LATERAL_ITEMS.forEach((id) => {
        const L = scores[`${id}_L`] ?? 0;
        const R = scores[`${id}_R`] ?? 0;
        if (L || R) lines.push(`• ${idToLabel[id] || id}: Izq ${L || 0}, Der ${R || 0} (total ${(Number(L)||0)+(Number(R)||0)})`);
      });
      // Rigidez compacta: cuello + 4 miembros
      const neck = scores['rigidity_cuello'] ?? 0;
      const msd = scores['rigidity_msd'] ?? 0;
      const msi = scores['rigidity_msi'] ?? 0;
      const mid = scores['rigidity_mid'] ?? 0;
      const mii = scores['rigidity_mii'] ?? 0;
      const limbsSum = (Number(msd)||0)+(Number(msi)||0)+(Number(mid)||0)+(Number(mii)||0);
      if (neck) lines.push(`• Rigidez - Cuello: ${neck}`);
      if (msd || msi || mid || mii) lines.push(`• Rigidez - Extremidades: MSD ${msd||0}, MSI ${msi||0}, MID ${mid||0}, MII ${mii||0} (total ${limbsSum})`);
      if (lines.length) lateralDetail = `\nDetalle por miembro:\n${lines.join('\n')}`;
    }

    result = {
      ...result,
      details: `${result.details}\n${medLine}${scale.id === 'updrs3' ? `\nSubtotales por dominios:\n${domainLines}${lateralDetail}` : ''}`
    };
    onSubmit(result);
  }, [onSubmit, scale, combinedScores, medOnOff, parsedHoursSince, domainSubtotals, scores]);

  // Para evitar refs desincronizados, limpiar antes de mapear
  inputsRef.current = [];

  const renderLateralInputs = (item: ScaleItem, _indexBase: number) => {
    const keyL = `${item.id}_L`;
    const keyR = `${item.id}_R`;
    return (
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-[var(--text-secondary)] mb-1">Izquierda</div>
          <div className="flex items-center gap-3">
            <input
              inputMode="numeric"
              pattern="[0-4]"
              value={scores[keyL] ?? ''}
              onChange={(e) => handleInput(keyL, e.target.value)}
              onKeyDown={(e) => {
                const k = e.key;
                if (['0','1','2','3','4'].includes(k)) {
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
              placeholder="0–4"
              className="w-16 h-10 border border-[var(--border-primary)] rounded px-2 text-center text-[var(--text-primary)] bg-[var(--bg-primary)]"
              ref={(el) => { if (el) inputsRef.current.push(el); }}
            />
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map(v => (
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

        <div>
          <div className="text-xs text-[var(--text-secondary)] mb-1 text-right sm:text-left">Derecha</div>
          <div className="flex items-center gap-3 justify-start sm:justify-start">
            <input
              inputMode="numeric"
              pattern="[0-4]"
              value={scores[keyR] ?? ''}
              onChange={(e) => handleInput(keyR, e.target.value)}
              onKeyDown={(e) => {
                const k = e.key;
                if (['0','1','2','3','4'].includes(k)) {
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
              placeholder="0–4"
              className="w-16 h-10 border border-[var(--border-primary)] rounded px-2 text-center text-[var(--text-primary)] bg-[var(--bg-primary)]"
              ref={(el) => { if (el) inputsRef.current.push(el); }}
            />
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map(v => (
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

  const renderRigidityCompact = (_axialItem: ScaleItem, index: number) => {
    const title = updrsSectionPrefix ? `${updrsSectionPrefix}.${index + 1} Rigidez` : 'Rigidez';
    const helpText = UPDRS3_INSTRUCTIONS['limb_rigidity'] || 'Rigidez: evaluar resistencia al movimiento pasivo en cuello y extremidades.';

    return (
      <div key="rigidity_compact" className="border border-[var(--border-secondary)] rounded-lg p-4 bg-[var(--bg-secondary)]">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-[var(--text-primary)]" title={RIGIDITY_TOOLTIP}>{title}</h4>
            {mode === 'full' && (
              <p className="text-sm text-[var(--text-secondary)] mt-1">Rigidez de cuello y extremidades (MSD, MSI, MID, MII)</p>
            )}
            {/* Ayuda corta visible y minimalista */}
            <p className="text-xs text-[var(--text-tertiary)] mt-1">0–4: 0 Ausente · 1 Leve/activación · 2 Leve–moderada · 3 Marcada · 4 Severa</p>
          </div>
          <button
            type="button"
            aria-label="Ayuda de rigidez"
            title={RIGIDITY_TOOLTIP}
            onClick={() => toggleItemHelp('rigidity_compact')}
            className="flex items-center"
            style={{ color: 'var(--state-info)' }}
            tabIndex={-1}
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>

        {(showItemHelp['rigidity_compact'] || mode === 'full') && (
          <div className="mt-3 p-3 bg-[var(--bg-primary)] rounded border" style={{
            borderColor: 'color-mix(in srgb, var(--state-info) 30%, transparent)'
          }}>
            <p className="text-sm text-[var(--text-primary)] whitespace-pre-line">{helpText}</p>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-4">
          {RIGIDITY_KEYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)] w-10">{label}</span>
              <input
                inputMode="numeric"
                pattern="[0-4]"
                value={scores[key] ?? ''}
                onChange={(e) => handleInput(key, e.target.value)}
                onKeyDown={(e) => {
                  const k = e.key;
                  if (['0','1','2','3','4'].includes(k)) {
                    e.preventDefault();
                    handleQuickSet(key, parseInt(k, 10));
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
                placeholder="0–4"
                className="w-12 h-9 border border-[var(--border-primary)] rounded px-2 text-center text-[var(--text-primary)] bg-[var(--bg-primary)]"
                ref={(el) => { if (el) inputsRef.current.push(el); }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderItem = (item: ScaleItem, index: number) => {
    const displayTitle = updrsSectionPrefix
      ? `${updrsSectionPrefix}.${index + 1} ${stripLeadingNumber(item.label)}`
      : item.label;

    const baseTitle = stripLeadingNumber(item.label).toLowerCase();
    const helpText = (scale.id === 'updrs3' && UPDRS3_INSTRUCTIONS[item.id])
      ? UPDRS3_INSTRUCTIONS[item.id]
      : (baseTitle.startsWith('lenguaje') ? LENGUAJE_INSTRUCCIONES : 'Use los criterios 0–4 según la descripción clínica. Para dudas, abra los criterios con el botón ? junto al casillero.');

    if (scale.id === 'updrs3') {
      if (item.id === 'axial_rigidity') {
        return renderRigidityCompact(item, index);
      }
      if (item.id === 'limb_rigidity') {
        return null;
      }
    }

    const isLateral = scale.id === 'updrs3' && LATERAL_ITEMS.has(item.id);

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

        {isLateral ? (
          renderLateralInputs(item, index)
        ) : (
          <div className="mt-3 flex items-center gap-3">
            <input
              inputMode="numeric"
              pattern="[0-4]"
              value={scores[item.id] ?? ''}
              onChange={(e) => handleInput(item.id, e.target.value)}
              onKeyDown={(e) => {
                const k = e.key;
                if (['0','1','2','3','4'].includes(k)) {
                  e.preventDefault();
                  handleQuickSet(item.id, parseInt(k, 10));
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
              placeholder="0–4"
              className="w-16 h-10 border border-[var(--border-primary)] rounded px-2 text-center text-[var(--text-primary)] bg-[var(--bg-primary)]"
              ref={(el) => { if (el) inputsRef.current.push(el); }}
            />
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleQuickSet(item.id, v)}
                  className={`h-10 w-10 rounded border ${scores[item.id] === v ? 'btn-accent' : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]'}`}
                  tabIndex={-1}
                >
                  {v}
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-label="Ver criterios 0–4"
              title="Ver criterios 0–4"
              onClick={() => toggleScoringHelp(item.id)}
              className="ml-auto text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              tabIndex={-1}
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
        )}

        {showScoringHelp[item.id] && (
          <div className="mt-3 p-3 bg-[var(--bg-primary)] rounded border border-[var(--border-secondary)]">
            <div className="text-xs text-[var(--text-primary)]">
              {item.options && item.options.length > 0 ? (
                <ul className="space-y-1">
                  {item.options.map((opt) => (
                    <li key={opt} className="leading-snug">
                      {opt}
                    </li>
                  ))}
                </ul>
              ) : (
                <div>No hay descripciones disponibles para este ítem.</div>
              )}
            </div>
          </div>
        )}
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
          {scale.id === 'updrs3' && (
            <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm text-[var(--text-primary)]">Estado de medicación</label>
                <div className="flex -space-x-px rounded overflow-hidden border border-[var(--border-primary)]">
                  <button
                    type="button"
                    onClick={() => setMedOnOff('ON')}
                    className={`px-3 py-1 text-sm ${medOnOff === 'ON' ? 'btn-accent' : 'bg-[var(--bg-primary)] text-[var(--text-primary)]'}`}
                  >
                    ON
                  </button>
                  <button
                    type="button"
                    onClick={() => setMedOnOff('OFF')}
                    className={`px-3 py-1 text-sm ${medOnOff === 'OFF' ? 'btn-accent' : 'bg-[var(--bg-primary)] text-[var(--text-primary)]'}`}
                  >
                    OFF
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-[var(--text-primary)]">Horas desde la última toma de L‑dopa</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={hoursSinceLdopa}
                    onChange={(e) => setHoursSinceLdopa(e.target.value)}
                    className="h-9 w-28 px-2 border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  />
                  {parsedHoursSince !== null && (
                    <span className="text-sm text-[var(--text-secondary)]">- {parsedHoursSince} horas</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {scale.items?.map((item, index) => renderItem(item, index))}

          {currentTotal !== null && (
            <div className="mt-2 p-4 rounded-lg border" style={{
              backgroundColor: 'color-mix(in srgb, var(--state-info) 10%, var(--bg-primary) 90%)',
              borderColor: 'color-mix(in srgb, var(--state-info) 30%, transparent)'
            }}>
              <div className="flex items-center justify-between">
                <span className="font-medium" style={{ color: 'var(--state-info)' }}>Puntuación Total</span>
                <span className="text-xl font-bold" style={{ color: 'var(--state-info)' }}>{currentTotal}</span>
              </div>
            </div>
          )}

          {scale.id === 'updrs3' && (
            <div className="mt-2 p-4 rounded-lg border" style={{
              backgroundColor: 'var(--accent)',
              borderColor: 'color-mix(in srgb, var(--accent) 65%, #000 35%)'
            }}>
              <div className="text-sm font-medium mb-2" style={{ color: 'var(--on-accent)' }}>Subtotales por dominios</div>
              <ul className="text-sm space-y-1" style={{ color: 'var(--on-accent)' }}>
                {Object.entries(domainSubtotals).map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between">
                    <span>{k}</span>
                    <span className="font-semibold">{v}</span>
                  </li>
                ))}
              </ul>
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

export default UpdrsModal;
