import React, { useState } from 'react';
import { Copy, Plus, Calculator, Stethoscope, ChevronRight, ChevronDown, ChevronUp, Database, Search, X } from 'lucide-react';
import { Scale, SavePatientData } from './types';
import AIBadgeSystem from './AIBadgeSystem';
import { useAITextAnalysis } from './aiTextAnalyzer';
import SavePatientModal from './SavePatientModal';
import { extractPatientData, validatePatientData } from './utils/patientDataExtractor';
import { savePatientAssessment } from './utils/diagnosticAssessmentDB';

interface DiagnosticAlgorithmContentProps {
  notes: string;
  setNotes: (v: string) => void;
  copyNotes: () => void;
  clearNotes?: () => void;
  openScaleModal: (scaleId: string) => void;
  medicalScales: Scale[];
  clickedScale?: string | null;
}

const DiagnosticAlgorithmContent: React.FC<DiagnosticAlgorithmContentProps> = ({
  notes,
  setNotes,
  copyNotes,
  clearNotes,
  openScaleModal,
  medicalScales,
  clickedScale,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    'Evaluación Neurológica': true,
    'Parkinson': false,
    '🤖 Sugerencias IA': true // Siempre expandido
  });

  // Estado para el modal de guardar paciente
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Estado para el buscador de escalas
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Análisis de IA del texto de notas
  const aiAnalysis = useAITextAnalysis(notes, 2000);
  
  // Debug: log del análisis
  console.log('🔍 DiagnosticAlgorithm - Current notes:', notes);
  console.log('🤖 DiagnosticAlgorithm - AI Analysis:', aiAnalysis);
  console.log('🔍 DiagnosticAlgorithm - medicalScales received:', medicalScales?.length || 0);
  console.log('🔍 DiagnosticAlgorithm - medicalScales data:', medicalScales?.map(s => ({ id: s.id, name: s.name, hasItems: !!s.items?.length })));

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Función para manejar el guardado de paciente
  const handleSavePatient = () => {
    const extractedData = extractPatientData(notes);
    
    if (!validatePatientData(extractedData) && notes.trim().length === 0) {
      setSaveStatus({
        success: false,
        message: 'No hay datos suficientes para guardar. Agregue información del paciente o complete alguna escala.'
      });
      return;
    }
    
    setShowSaveModal(true);
    setSaveStatus(null);
  };

  // Función para confirmar el guardado
  const handleConfirmSave = async (patientData: SavePatientData) => {
    try {
      const result = await savePatientAssessment(patientData);
      
      if (result.success) {
        setSaveStatus({
          success: true,
          message: 'Paciente guardado exitosamente en la base de datos.'
        });
        setShowSaveModal(false);
        
        // Limpiar mensaje después de 5 segundos
        setTimeout(() => setSaveStatus(null), 5000);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      setSaveStatus({
        success: false,
        message: `Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
      // No cerrar el modal para que el usuario pueda intentar de nuevo
    }
  };

  // Función para filtrar escalas por búsqueda
  const filterScalesBySearch = (scales: Scale[]) => {
    if (!searchQuery.trim()) return scales;
    
    const query = searchQuery.toLowerCase().trim();
    return scales.filter(scale => 
      scale.name.toLowerCase().includes(query) ||
      scale.description.toLowerCase().includes(query) ||
      scale.category.toLowerCase().includes(query)
    );
  };

  // Función para obtener escalas sugeridas por IA
  const getSuggestedScales = () => {
    const suggested = aiAnalysis.suggestions.map(suggestion => 
      medicalScales.find(scale => scale.id === suggestion.scaleId)
    ).filter(scale => scale !== undefined) as Scale[];
    
    return filterScalesBySearch(suggested);
  };

  // Función para obtener escalas no sugeridas
  const getNonSuggestedScales = () => {
    const suggestedIds = aiAnalysis.suggestions.map(s => s.scaleId);
    const nonSuggested = medicalScales.filter(scale => !suggestedIds.includes(scale.id));
    return filterScalesBySearch(nonSuggested);
  };

  // Crear agrupación dinámica: primero sugerencias, luego por categoría
  const createDynamicGroups = () => {
    const suggestedScales = getSuggestedScales();
    const nonSuggestedScales = getNonSuggestedScales();
    
    const groups: { [key: string]: Scale[] } = {};
    
    // Si estamos en modo de búsqueda, crear un grupo especial con todos los resultados
    if (searchQuery.trim()) {
      const allFilteredScales = [...suggestedScales, ...nonSuggestedScales];
      if (allFilteredScales.length > 0) {
        groups['🔍 Resultados de Búsqueda'] = allFilteredScales;
      }
      return groups;
    }
    
    // Si hay sugerencias, crear grupo especial
    if (suggestedScales.length > 0) {
      groups['🤖 Sugerencias IA'] = suggestedScales;
    }
    
    // Agrupar escalas restantes por categoría
    nonSuggestedScales.forEach(scale => {
      const category = scale.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(scale);
    });
    
    return groups;
  };

  const groupedScales = createDynamicGroups();

  return (
  <div className="flex h-full">
    {/* Left Sidebar */}
    <div className="w-80 bg-white shadow-lg border-r">
      <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <h2 className="text-lg font-semibold flex items-center">
          <Calculator className="h-5 w-5 mr-2" />
          Escalas y Algoritmos
        </h2>
        <div className="flex items-center justify-between mt-1 mb-3">
          <p className="text-blue-100 text-sm">Herramientas de evaluación neurológica</p>
          {/* Indicador de IA */}
          <div className="flex items-center space-x-2">
            {aiAnalysis.suggestions.length > 0 && (
              <div className="flex items-center space-x-1 bg-white bg-opacity-20 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-100">IA: {aiAnalysis.suggestions.length}</span>
              </div>
            )}
            <div className="text-xs text-blue-200">
              {notes.length > 0 ? `${notes.length} chars` : 'Sin texto'}
            </div>
          </div>
        </div>
        
        {/* Buscador de escalas */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-200" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              placeholder="Buscar escalas..."
              className="w-full pl-10 pr-10 py-2 text-sm rounded-lg bg-white bg-opacity-20 text-white placeholder-blue-200 border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-2 text-xs text-blue-200">
              Buscando: "{searchQuery}"
            </div>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {Object.entries(groupedScales).map(([category, scales]) => {
            const isAISuggestions = category === '🤖 Sugerencias IA';
            const isSearchResults = category === '🔍 Resultados de Búsqueda';
            const isParkinson = category === 'Parkinson';
            
            return (
              <div 
                key={category} 
                className={`border rounded-lg overflow-hidden ${
                  isAISuggestions 
                    ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-blue-50 shadow-lg' 
                    : isSearchResults
                      ? 'border-green-300 bg-gradient-to-r from-green-50 to-teal-50 shadow-lg'
                      : 'border-gray-200'
                }`}
              >
                {/* Category Header */}
                <button
                  onClick={() => !isAISuggestions && !isSearchResults && toggleCategory(category)}
                  className={`w-full p-3 flex items-center justify-between transition-colors ${
                    isAISuggestions 
                      ? 'bg-gradient-to-r from-purple-100 to-blue-100 cursor-default' 
                      : isSearchResults
                        ? 'bg-gradient-to-r from-green-100 to-teal-100 cursor-default'
                        : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded ${
                      isAISuggestions 
                        ? 'bg-purple-200' 
                        : isSearchResults
                          ? 'bg-green-200'
                          : isParkinson 
                            ? 'bg-orange-100' 
                            : 'bg-blue-100'
                    }`}>
                      <Stethoscope className={`h-4 w-4 ${
                        isAISuggestions 
                          ? 'text-purple-700' 
                          : isSearchResults
                            ? 'text-green-700'
                            : isParkinson 
                              ? 'text-orange-600' 
                              : 'text-blue-600'
                      }`} />
                    </div>
                    <span className={`font-medium ${
                      isAISuggestions || isSearchResults ? 'text-purple-900' : 'text-gray-900'
                    }`}>
                      {category}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isAISuggestions 
                        ? 'text-purple-700 bg-purple-200' 
                        : isSearchResults
                          ? 'text-green-700 bg-green-200'
                          : 'text-gray-500 bg-gray-200'
                    }`}>
                      {scales.length}
                    </span>
                    {isAISuggestions && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-purple-700 font-medium">Activo</span>
                      </div>
                    )}
                    {isSearchResults && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-700 font-medium">Búsqueda</span>
                      </div>
                    )}
                  </div>
                  {!isAISuggestions && !isSearchResults && (
                    expandedCategories[category] ? 
                      <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              
              {/* Category Content */}
              {(expandedCategories[category] || isAISuggestions || isSearchResults) && (
                <div className="divide-y divide-gray-100">
                  {scales.map((scale) => (
                    <div key={scale.id} className="relative">
                      <button
                        onClick={() => {
                          console.log('🔍 Scale button clicked:', scale.id, scale.name);
                          openScaleModal(scale.id);
                        }}
                        className={`w-full p-3 text-left transition-colors ${
                          clickedScale === scale.id 
                            ? 'bg-green-100 border-l-4 border-green-500' 
                            : 'hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 text-sm">{scale.name}</h3>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{scale.description}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        </div>
                      </button>
                      <AIBadgeSystem
                        scaleId={scale.id}
                        suggestions={aiAnalysis.suggestions}
                        onScaleClick={openScaleModal}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">Instrucciones</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Seleccione una escala del listado</li>
            <li>• Complete la evaluación en el modal</li>
            <li>• Los resultados se insertarán automáticamente</li>
            <li>• Puede modificar las notas manualmente</li>
          </ul>
        </div>
      </div>
    </div>
    {/* Main Content Area */}
    <div className="flex-1 p-6">
      <div className="h-full bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Notas del Paciente</h2>
          </div>
          <div className="flex justify-center space-x-2">
              <button
                onClick={handleSavePatient}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                title="Guardar paciente en base de datos"
              >
                <Database className="h-4 w-4" />
                <span>Guardar Paciente</span>
              </button>
              <button
                onClick={copyNotes}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Copy className="h-4 w-4" />
                <span>Copiar</span>
              </button>
              {clearNotes && (
                <button
                  onClick={clearNotes}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  <span>🗑️</span>
                  <span>Limpiar</span>
                </button>
              )}
              <button
                onClick={() => {
                  const normalExamText = `Examen neurológico:
Vigil, orientado en tiempo persona y espacio, lenguaje conservado. Repite, nomina, obedece comandos simples y complejos. Pupilas isocóricas reactivas a la luz. MOE conservados. Sin déficit motor ni sensitivo. Taxia y sensibilidad conservadas.

`;
                  setNotes(notes + normalExamText);
                }}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                <span>EF normal</span>
              </button>
              <button
                onClick={() => {
                  const testText = `Paciente con temblor en reposo y rigidez muscular. Presenta hemiparesia derecha y disartria severa.`;
                  setNotes(notes + (notes ? '\n\n' : '') + testText);
                }}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" />
                <span>Test IA</span>
              </button>
          </div>
        </div>
        <div className="p-4 h-full">
          {/* Mensaje de estado del guardado */}
          {saveStatus && (
            <div className={`mb-4 p-3 rounded-lg border flex items-center space-x-2 ${
              saveStatus.success 
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                saveStatus.success ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm">{saveStatus.message}</span>
            </div>
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-full resize-none border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="Escriba aquí las notas del paciente..."
          />
        </div>
      </div>
    </div>

    {/* Modal de guardar paciente */}
    {showSaveModal && (
      <SavePatientModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleConfirmSave}
        extractedData={extractPatientData(notes)}
        fullNotes={notes}
      />
    )}
  </div>
  );
};

export default React.memo(DiagnosticAlgorithmContent); 