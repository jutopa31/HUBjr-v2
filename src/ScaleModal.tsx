import React, { useState, useCallback, useMemo } from 'react';
import { X, Copy } from 'lucide-react';
import calculateScaleScore from './calculateScaleScore';
import { ScaleModalProps, ScaleItem } from './types';

const ScaleModal: React.FC<ScaleModalProps> = ({ scale, onClose, onSubmit }) => {
  const [scores, setScores] = useState<{ [key: string]: number | string }>({});
  
  // Debug modal rendering
  console.log('🔍 ScaleModal rendering for scale:', scale?.name || 'undefined');
  console.log('🔍 ScaleModal scale data:', scale ? { id: scale.id, itemsCount: scale.items?.length || 0 } : 'null');

  const handleScoreChange = useCallback((itemId: string, score: string) => {
    if (score === 'UN') {
      setScores(prev => ({ ...prev, [itemId]: 'UN' }));
    } else if (score.includes('+')) {
      // Manejar valores especiales como '1+' en la escala de Ashworth
      setScores(prev => ({ ...prev, [itemId]: score }));
    } else {
      setScores(prev => ({ ...prev, [itemId]: parseInt(score) }));
    }
  }, []);

  const handleSubmit = useCallback(() => {
    const result = calculateScaleScore(scale, scores);
    onSubmit(result);
  }, [scale, scores, onSubmit]);

  const currentTotal = useMemo(() => {
    // Para escalas cualitativas o de ítem único, no mostrar puntaje total
    if (scale.id === 'ashworth' || scale.id === 'mcdonald_2024' || scale.id === 'mrs' || scale.id === 'hunt_hess') {
      return null;
    }
    
    return scale.items.reduce((sum: number, item: ScaleItem) => {
      const score = scores[item.id] !== undefined ? scores[item.id] : item.score || 0;
      if (score === 'UN') return sum;
      if (typeof score === 'string' && score.includes('+')) return sum + 1; // '1+' cuenta como 1
      return sum + (typeof score === 'string' ? parseInt(score) || 0 : score);
    }, 0);
  }, [scale.items, scores, scale.id]);

  if (!scale) {
    console.error('❌ ScaleModal: No scale provided');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
          <h3 className="text-lg font-semibold text-red-600">Error</h3>
          <p className="text-gray-600 mt-2">No se pudo cargar la escala seleccionada.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }
  
  if (!scale.items || scale.items.length === 0) {
    console.error('❌ ScaleModal: Scale has no items:', scale.name);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
          <h3 className="text-lg font-semibold text-yellow-600">Advertencia</h3>
          <p className="text-gray-600 mt-2">La escala "{scale.name}" no tiene elementos configurados.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{scale.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{scale.description}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 bg-white">
          <div className="space-y-4">
            {scale.items && scale.items.length > 0 ? scale.items.map((item: ScaleItem) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3 text-gray-900">{item.label}</h4>
                <div className="space-y-2">
                  {item.options && item.options.length > 0 ? item.options.map((option: string, index: number) => {
                    const optionPrefix = option.split(' - ')[0];
                    let optionValue: string | number;
                    
                    if (optionPrefix === 'UN') {
                      optionValue = 'UN';
                    } else if (optionPrefix.includes('+')) {
                      optionValue = optionPrefix; // Mantener valores like '1+'
                    } else {
                      optionValue = parseInt(optionPrefix);
                    }
                    
                    const isSelected = scores[item.id] === optionValue || (scores[item.id] === undefined && optionValue === (item.score || 0));
                    return (
                      <label key={index} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-white">
                        <input
                          type="radio"
                          name={item.id}
                          value={optionValue}
                          checked={isSelected}
                          onChange={(e) => handleScoreChange(item.id, e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-800">{option}</span>
                      </label>
                    );
                  }) : <div className="text-red-600">No options available for this item</div>}
                </div>
              </div>
            )) : <div className="text-red-600">No items available for this scale</div>}
          </div>
          {currentTotal !== null && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-900">Puntuación Total:</span>
                <span className="text-xl font-bold text-blue-900">{currentTotal}</span>
              </div>
            </div>
          )}
          
          {scale.id === 'ashworth' && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-800">
                <p className="font-medium mb-2">Interpretación de la Escala de Ashworth:</p>
                <ul className="space-y-1 text-xs">
                  <li><strong>0:</strong> Sin aumento del tono muscular</li>
                  <li><strong>1:</strong> Ligero aumento al final del movimiento</li>
                  <li><strong>1+:</strong> Ligero aumento en menos de la mitad del arco</li>
                  <li><strong>2:</strong> Aumento pronunciado en la mayor parte del arco</li>
                  <li><strong>3:</strong> Considerable aumento, movimiento pasivo difícil</li>
                  <li><strong>4:</strong> Parte afectada rígida</li>
                </ul>
              </div>
            </div>
          )}
          
          {scale.id === 'mcdonald_2024' && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Criterios de McDonald 2024:</p>
                <div className="space-y-2 text-xs">
                  <div>
                    <strong>DIS (Diseminación en Espacio):</strong> Requiere ≥1 lesión T2 en ≥2 de 4 áreas del SNC
                  </div>
                  <div>
                    <strong>DIT (Diseminación en Tiempo):</strong> Evidencia de lesiones en diferentes momentos
                  </div>
                  <div className="mt-2 p-2 bg-white rounded">
                    <strong>Escenarios diagnósticos:</strong>
                    <ul className="mt-1 space-y-1 ml-2">
                      <li>• ≥2 ataques + ≥2 lesiones → Diagnóstico directo</li>
                      <li>• ≥2 ataques + 1 lesión → Requiere DIS</li>
                      <li>• 1 ataque + ≥2 lesiones → Requiere DIT</li>
                      <li>• 1 ataque + 1 lesión → Requiere DIS + DIT</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {scale.id === 'aspects' && (
            <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-2">Referencia Anatómica ASPECTS:</p>
                <div className="bg-white rounded-lg p-3 mb-3">
                  <div className="text-xs text-gray-700 mb-2">
                    <strong>Mapa de regiones cerebrales (territorio de ACM):</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <strong>Estructuras profundas:</strong>
                      <ul className="ml-2 space-y-1 text-gray-600">
                        <li>• C - Núcleo caudado</li>
                        <li>• L - Núcleo lenticular</li>
                        <li>• IC - Cápsula interna</li>
                        <li>• I - Ínsula</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Corteza cerebral:</strong>
                      <ul className="ml-2 space-y-1 text-gray-600">
                        <li>• M1 - ACM anterior</li>
                        <li>• M2 - ACM lateral</li>
                        <li>• M3 - ACM posterior</li>
                        <li>• M4 - ACM anterior superior</li>
                        <li>• M5 - ACM lateral superior</li>
                        <li>• M6 - ACM posterior superior</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs">
                    <strong>Interpretación:</strong>
                    <ul className="mt-1 space-y-1 ml-2 text-gray-700">
                      <li>• <strong>8-10 puntos:</strong> Cambios mínimos, candidato ideal para reperfusión</li>
                      <li>• <strong>6-7 puntos:</strong> Cambios moderados, evaluar individualmente</li>
                      <li>• <strong>4-5 puntos:</strong> Cambios extensos, riesgo aumentado</li>
                      <li>• <strong>0-3 puntos:</strong> Cambios muy extensos, alto riesgo</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-2 text-xs text-orange-700 bg-orange-100 p-2 rounded">
                  <strong>Nota:</strong> Cada región alterada resta 1 punto del total inicial de 10 puntos.
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 font-medium"
            >
              <Copy className="h-4 w-4" />
              <span>Insertar en Notas</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ScaleModal); 