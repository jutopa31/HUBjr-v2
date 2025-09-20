// Modal Principal para el Sistema de Examen Físico Neurológico Interactivo
// Interfaz unificada con navegación entre secciones y seguimiento de progreso

import React, { useState, useEffect } from 'react';
import useEscapeKey from '../hooks/useEscapeKey';
import { X, Brain, CheckCircle, Clock, FileText, Save, RotateCw, AlertTriangle } from 'lucide-react';
import { NeurologicalExamService } from '../services/neurologicalExamService';
import { 
  NeurologicalExamData, 
  ExamTemplate, 
  ExamProgress,
  ValidationResult 
} from '../types/neurologicalExamTypes';

interface NeurologicalExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  examiner?: string;
  onExamCompleted?: (examData: NeurologicalExamData) => void;
}

const NeurologicalExamModal: React.FC<NeurologicalExamModalProps> = ({
  isOpen,
  onClose,
  patientId,
  examiner = 'Dr. Usuario',
  onExamCompleted
}) => {
  // ==================== ESTADO DEL COMPONENTE ====================
  const [examService] = useState(() => new NeurologicalExamService());
  const [currentExam, setCurrentExam] = useState<NeurologicalExamData | null>(null);
  const [examTemplates, setExamTemplates] = useState<ExamTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('complete');
  const [currentSection, setCurrentSection] = useState<string>('template_selection');
  const [examProgress, setExamProgress] = useState<ExamProgress | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  useEscapeKey(onClose, isOpen);

  // ==================== EFECTOS ====================
  useEffect(() => {
    if (isOpen) {
      // Cargar plantillas disponibles
      const templates = examService.getExamTemplates();
      setExamTemplates(templates);
      
      // Resetear estado cuando se abre el modal
      resetExamState();
    }
  }, [isOpen, examService]);

  useEffect(() => {
    if (currentExam) {
      // Actualizar progreso cuando cambia el examen
      const progress = examService.getExamProgress(currentExam);
      setExamProgress(progress);
      
      // Validar examen automáticamente
      const validation = examService.validateExam(currentExam);
      setValidationResult(validation);
    }
  }, [currentExam, examService]);

  // ==================== FUNCIONES AUXILIARES ====================
  const resetExamState = () => {
    setCurrentExam(null);
    setCurrentSection('template_selection');
    setExamProgress(null);
    setValidationResult(null);
    setShowValidation(false);
    setSelectedTemplate('complete');
  };

  const handleTemplateSelection = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const startNewExam = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      const newExam = examService.createNewExam(
        selectedTemplate as any,
        patientId,
        examiner
      );
      
      setCurrentExam(newExam);
      setCurrentSection('mental_state'); // Comenzar con estado mental
      setIsLoading(false);
    }, 500);
  };

  const handleSectionComplete = (sectionName: string, sectionData: any) => {
    if (!currentExam) return;

    const updatedExam = {
      ...currentExam,
      [sectionName]: sectionData,
      exam_metadata: {
        ...currentExam.exam_metadata,
        sections_completed: [
          ...currentExam.exam_metadata.sections_completed.filter(s => s !== sectionName),
          sectionName
        ]
      }
    };

    setCurrentExam(updatedExam);
    
    // Avanzar a la siguiente sección automáticamente
    const nextSection = getNextSection(sectionName);
    if (nextSection) {
      setCurrentSection(nextSection);
    } else {
      setCurrentSection('review');
    }
  };

  const getNextSection = (currentSectionName: string): string | null => {
    const sections = ['mental_state', 'cranial_nerves', 'motor_system', 'sensory_system', 'reflexes', 'coordination', 'gait'];
    const currentIndex = sections.indexOf(currentSectionName);
    
    if (currentIndex >= 0 && currentIndex < sections.length - 1) {
      return sections[currentIndex + 1];
    }
    
    return null;
  };

  const navigateToSection = (sectionName: string) => {
    setCurrentSection(sectionName);
  };

  const handleSaveExam = async () => {
    if (!currentExam) return;

    setIsSaving(true);
    
    try {
      const success = await examService.saveExam(currentExam);
      
      if (success) {
        console.log('✅ Examen guardado exitosamente');
        // Mostrar notificación de éxito
      } else {
        console.error('❌ Error guardando examen');
        // Mostrar notificación de error
      }
    } catch (error) {
      console.error('❌ Error guardando examen:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteExam = () => {
    if (!currentExam) return;

    // Validar examen final
    const validation = examService.validateExam(currentExam);
    
    if (validation.valid || validation.errors.length === 0) {
      // Guardar examen final
      handleSaveExam();
      
      // Notificar completación
      if (onExamCompleted) {
        onExamCompleted(currentExam);
      }
      
      onClose();
    } else {
      setShowValidation(true);
    }
  };

  const handleClose = () => {
    if (currentExam && examProgress && examProgress.completion_percentage > 0) {
      // Preguntar si quiere guardar antes de cerrar
      const shouldSave = window.confirm('¿Desea guardar el progreso del examen antes de cerrar?');
      if (shouldSave) {
        handleSaveExam();
      }
    }
    
    resetExamState();
    onClose();
  };

  // ==================== SECCIONES DE LA INTERFAZ ====================
  const renderTemplateSelection = () => (
    <div className="p-6">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Brain className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Nuevo Examen Neurológico</h2>
        <p className="text-gray-600">Seleccione el tipo de examen que desea realizar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {examTemplates.map((template) => (
          <div
            key={template.id}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedTemplate === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleTemplateSelection(template.id)}
          >
            <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{template.description}</p>
            <div className="text-xs text-gray-500">
              Secciones requeridas: {template.required_sections.length}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={startNewExam}
          disabled={isLoading}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? (
            <RotateCw className="h-5 w-5 animate-spin" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
          <span>{isLoading ? 'Iniciando...' : 'Comenzar Examen'}</span>
        </button>
      </div>
    </div>
  );

  const renderSectionNavigation = () => {
    if (!currentExam || !examProgress) return null;

    const sections = [
      { id: 'mental_state', name: 'Estado Mental', icon: '🧠' },
      { id: 'cranial_nerves', name: 'Nervios Craneales', icon: '👁️' },
      { id: 'motor_system', name: 'Sistema Motor', icon: '💪' },
      { id: 'sensory_system', name: 'Sistema Sensitivo', icon: '🤚' },
      { id: 'reflexes', name: 'Reflejos', icon: '⚡' },
      { id: 'coordination', name: 'Coordinación', icon: '🎯' },
      { id: 'gait', name: 'Marcha', icon: '🚶' },
      { id: 'review', name: 'Revisión', icon: '📋' }
    ];

    return (
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Progreso del Examen</h3>
          <div className="text-sm text-gray-600">
            {examProgress.completion_percentage}% completado
          </div>
        </div>
        
        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${examProgress.completion_percentage}%` }}
          />
        </div>

        {/* Navegación de secciones */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {sections.map((section) => {
            const isCompleted = examProgress.sections_completed.includes(section.id);
            const isCurrent = currentSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => navigateToSection(section.id)}
                className={`p-2 rounded-lg text-xs text-center transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="text-lg mb-1">{section.icon}</div>
                <div className="font-medium">{section.name}</div>
                {isCompleted && (
                  <CheckCircle className="h-3 w-3 mx-auto mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderValidationPanel = () => {
    if (!validationResult || !showValidation) return null;

    return (
      <div className="border-l-4 border-orange-400 bg-orange-50 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-orange-800">
              Validación del Examen
            </h3>
            <div className="mt-2 text-sm text-orange-700">
              {validationResult.warnings.length > 0 && (
                <div className="mb-2">
                  <strong>Advertencias:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validationResult.suggestions.length > 0 && (
                <div>
                  <strong>Sugerencias:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {validationResult.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentSection = () => {
    if (!currentExam) return null;

    // Por ahora, mostrar placeholder para cada sección
    // Estas se reemplazarán con los componentes específicos de cada sección
    
    switch (currentSection) {
      case 'mental_state':
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-6">🧠 Estado Mental y Cognitivo</h3>
            
            {/* Conciencia */}
            <div className="mb-6 bg-white border rounded-lg p-4">
              <h4 className="font-semibold text-lg mb-4 text-blue-900">🔹 Conciencia</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel de Conciencia
                  </label>
                  <select
                    value={currentExam.mental_state.consciousness.level}
                    onChange={(e) => setCurrentExam({
                      ...currentExam,
                      mental_state: {
                        ...currentExam.mental_state,
                        consciousness: {
                          ...currentExam.mental_state.consciousness,
                          level: e.target.value as any
                        }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="alert">Alerta</option>
                    <option value="somnolent">Somnoliento</option>
                    <option value="stuporous">Estupor</option>
                    <option value="coma">Coma</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escala de Glasgow (opcional)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="15"
                    value={currentExam.mental_state.consciousness.glasgow_coma_scale || ''}
                    onChange={(e) => setCurrentExam({
                      ...currentExam,
                      mental_state: {
                        ...currentExam.mental_state,
                        consciousness: {
                          ...currentExam.mental_state.consciousness,
                          glasgow_coma_scale: e.target.value ? parseInt(e.target.value) : undefined
                        }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="3-15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orientación
                </label>
                <div className="flex space-x-6">
                  {[
                    { key: 'person', label: 'Persona' },
                    { key: 'place', label: 'Lugar' },
                    { key: 'time', label: 'Tiempo' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={currentExam.mental_state.consciousness.orientation[key as keyof typeof currentExam.mental_state.consciousness.orientation]}
                        onChange={(e) => setCurrentExam({
                          ...currentExam,
                          mental_state: {
                            ...currentExam.mental_state,
                            consciousness: {
                              ...currentExam.mental_state.consciousness,
                              orientation: {
                                ...currentExam.mental_state.consciousness.orientation,
                                [key]: e.target.checked
                              }
                            }
                          }
                        })}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Atención */}
            <div className="mb-6 bg-white border rounded-lg p-4">
              <h4 className="font-semibold text-lg mb-4 text-blue-900">🔹 Atención y Concentración</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel de Atención
                  </label>
                  <select
                    value={currentExam.mental_state.cognition.attention.level}
                    onChange={(e) => setCurrentExam({
                      ...currentExam,
                      mental_state: {
                        ...currentExam.mental_state,
                        cognition: {
                          ...currentExam.mental_state.cognition,
                          attention: {
                            ...currentExam.mental_state.cognition.attention,
                            level: e.target.value as any
                          }
                        }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="decreased">Disminuida</option>
                    <option value="distractible">Distraíble</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Span de Dígitos
                  </label>
                  <input
                    type="text"
                    value={currentExam.mental_state.cognition.attention.digit_span}
                    onChange={(e) => setCurrentExam({
                      ...currentExam,
                      mental_state: {
                        ...currentExam.mental_state,
                        cognition: {
                          ...currentExam.mental_state.cognition,
                          attention: {
                            ...currentExam.mental_state.cognition.attention,
                            digit_span: e.target.value
                          }
                        }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="ej. 5 directos, 3 inversos"
                  />
                </div>
              </div>
            </div>

            {/* Memoria */}
            <div className="mb-6 bg-white border rounded-lg p-4">
              <h4 className="font-semibold text-lg mb-4 text-blue-900">🔹 Memoria</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'immediate_recall', label: 'Memoria Inmediata' },
                  { key: 'recent_memory', label: 'Memoria Reciente' },
                  { key: 'remote_memory', label: 'Memoria Remota' },
                  { key: 'working_memory', label: 'Memoria de Trabajo' }
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={currentExam.mental_state.cognition.memory[key as keyof typeof currentExam.mental_state.cognition.memory]}
                      onChange={(e) => setCurrentExam({
                        ...currentExam,
                        mental_state: {
                          ...currentExam.mental_state,
                          cognition: {
                            ...currentExam.mental_state.cognition,
                            memory: {
                              ...currentExam.mental_state.cognition.memory,
                              [key]: e.target.value
                            }
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder={`Evaluación de ${label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de Navegación */}
            <div className="flex justify-between pt-6 border-t">
              <button
                onClick={() => setCurrentSection('template_selection')}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← Volver a Plantilla
              </button>
              
              <button
                onClick={() => {
                  handleSectionComplete('mental_state', currentExam.mental_state);
                  const nextSection = getNextSection('mental_state');
                  if (nextSection) {
                    setCurrentSection(nextSection);
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Completar Sección →
              </button>
            </div>
          </div>
        );
        
      case 'cranial_nerves':
        return (
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-6">👁️ Nervios Craneales (I-XII)</h3>
            
            {/* I - Olfatorio */}
            <div className="mb-4 bg-white border rounded-lg p-4">
              <h4 className="font-semibold text-lg mb-3 text-green-900">I - Nervio Olfatorio</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentExam.cranial_nerves.I_olfactory.tested}
                      onChange={(e) => setCurrentExam({
                        ...currentExam,
                        cranial_nerves: {
                          ...currentExam.cranial_nerves,
                          I_olfactory: {
                            ...currentExam.cranial_nerves.I_olfactory,
                            tested: e.target.checked
                          }
                        }
                      })}
                      className="mr-2 text-green-600"
                    />
                    <span className="text-sm">Evaluado</span>
                  </label>
                </div>
                
                {currentExam.cranial_nerves.I_olfactory.tested && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Izquierdo</label>
                      <select
                        value={currentExam.cranial_nerves.I_olfactory.left}
                        onChange={(e) => setCurrentExam({
                          ...currentExam,
                          cranial_nerves: {
                            ...currentExam.cranial_nerves,
                            I_olfactory: {
                              ...currentExam.cranial_nerves.I_olfactory,
                              left: e.target.value as any
                            }
                          }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      >
                        <option value="normal">Normal</option>
                        <option value="decreased">Disminuido</option>
                        <option value="absent">Ausente</option>
                        <option value="increased">Aumentado</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Derecho</label>
                      <select
                        value={currentExam.cranial_nerves.I_olfactory.right}
                        onChange={(e) => setCurrentExam({
                          ...currentExam,
                          cranial_nerves: {
                            ...currentExam.cranial_nerves,
                            I_olfactory: {
                              ...currentExam.cranial_nerves.I_olfactory,
                              right: e.target.value as any
                            }
                          }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      >
                        <option value="normal">Normal</option>
                        <option value="decreased">Disminuido</option>
                        <option value="absent">Ausente</option>
                        <option value="increased">Aumentado</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* II - Óptico */}
            <div className="mb-4 bg-white border rounded-lg p-4">
              <h4 className="font-semibold text-lg mb-3 text-green-900">II - Nervio Óptico</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agudeza Visual - Izquierdo</label>
                  <input
                    type="text"
                    value={currentExam.cranial_nerves.II_optic.visual_acuity.left}
                    onChange={(e) => setCurrentExam({
                      ...currentExam,
                      cranial_nerves: {
                        ...currentExam.cranial_nerves,
                        II_optic: {
                          ...currentExam.cranial_nerves.II_optic,
                          visual_acuity: {
                            ...currentExam.cranial_nerves.II_optic.visual_acuity,
                            left: e.target.value
                          }
                        }
                      }
                    })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    placeholder="ej. 20/20"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agudeza Visual - Derecho</label>
                  <input
                    type="text"
                    value={currentExam.cranial_nerves.II_optic.visual_acuity.right}
                    onChange={(e) => setCurrentExam({
                      ...currentExam,
                      cranial_nerves: {
                        ...currentExam.cranial_nerves,
                        II_optic: {
                          ...currentExam.cranial_nerves.II_optic,
                          visual_acuity: {
                            ...currentExam.cranial_nerves.II_optic.visual_acuity,
                            right: e.target.value
                          }
                        }
                      }
                    })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    placeholder="ej. 20/20"
                  />
                </div>
              </div>
              
              <div>
                <label className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={currentExam.cranial_nerves.II_optic.visual_acuity.corrected}
                    onChange={(e) => setCurrentExam({
                      ...currentExam,
                      cranial_nerves: {
                        ...currentExam.cranial_nerves,
                        II_optic: {
                          ...currentExam.cranial_nerves.II_optic,
                          visual_acuity: {
                            ...currentExam.cranial_nerves.II_optic.visual_acuity,
                            corrected: e.target.checked
                          }
                        }
                      }
                    })}
                    className="mr-2 text-green-600"
                  />
                  <span className="text-sm">Visión corregida (con lentes)</span>
                </label>
              </div>
            </div>

            {/* III, IV, VI - Oculomotores */}
            <div className="mb-4 bg-white border rounded-lg p-4">
              <h4 className="font-semibold text-lg mb-3 text-green-900">III, IV, VI - Nervios Oculomotores</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Movimientos Extraoculares</label>
                  <select
                    value={currentExam.cranial_nerves.III_IV_VI_extraocular.movements.limitations}
                    onChange={(e) => setCurrentExam({
                      ...currentExam,
                      cranial_nerves: {
                        ...currentExam.cranial_nerves,
                        III_IV_VI_extraocular: {
                          ...currentExam.cranial_nerves.III_IV_VI_extraocular,
                          movements: {
                            ...currentExam.cranial_nerves.III_IV_VI_extraocular.movements,
                            limitations: e.target.value
                          }
                        }
                      }
                    })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="normal">Normales en todas las direcciones</option>
                    <option value="limited">Limitados</option>
                    <option value="absent">Ausentes</option>
                    <option value="nystagmus">Nistagmo presente</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reflejo Pupilar</label>
                  <select
                    value={currentExam.cranial_nerves.II_optic.pupils.accommodation}
                    onChange={(e) => setCurrentExam({
                      ...currentExam,
                      cranial_nerves: {
                        ...currentExam.cranial_nerves,
                        II_optic: {
                          ...currentExam.cranial_nerves.II_optic,
                          pupils: {
                            ...currentExam.cranial_nerves.II_optic.pupils,
                            accommodation: e.target.value
                          }
                        }
                      }
                    })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="normal">Normal bilateral</option>
                    <option value="sluggish">Lento</option>
                    <option value="absent">Ausente</option>
                    <option value="unequal">Desigual</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Resumen rápido para otros nervios craneales */}
            <div className="mb-6 bg-gray-50 border rounded-lg p-4">
              <h4 className="font-semibold text-lg mb-3 text-green-900">Evaluación Rápida - Otros Nervios</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {[
                  { nerve: 'V', name: 'Trigémino', test: 'Sensibilidad facial' },
                  { nerve: 'VII', name: 'Facial', test: 'Músculos faciales' },
                  { nerve: 'VIII', name: 'Auditivo', test: 'Audición/equilibrio' },
                  { nerve: 'IX', name: 'Glosofaríngeo', test: 'Deglución/gusto' },
                  { nerve: 'X', name: 'Vago', test: 'Fonación/deglución' },
                  { nerve: 'XI', name: 'Espinal', test: 'Trapecio/ECM' },
                  { nerve: 'XII', name: 'Hipogloso', test: 'Lengua' }
                ].map(({ nerve, name, test }) => (
                  <div key={nerve} className="bg-white p-2 rounded border">
                    <div className="font-medium text-green-800">{nerve} - {name}</div>
                    <div className="text-gray-600 text-xs">{test}</div>
                    <select 
                      className="w-full mt-1 px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-green-500"
                      defaultValue="normal"
                    >
                      <option value="normal">Normal</option>
                      <option value="abnormal">Anormal</option>
                      <option value="not_tested">No evaluado</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de Navegación */}
            <div className="flex justify-between pt-6 border-t">
              <button
                onClick={() => setCurrentSection('mental_state')}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← Estado Mental
              </button>
              
              <button
                onClick={() => {
                  handleSectionComplete('cranial_nerves', currentExam.cranial_nerves);
                  const nextSection = getNextSection('cranial_nerves');
                  if (nextSection) {
                    setCurrentSection(nextSection);
                  }
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Completar Sección →
              </button>
            </div>
          </div>
        );
        
      case 'review':
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">📋 Revisión del Examen</h3>
            {renderValidationPanel()}
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold mb-3">Resumen del Examen</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Tipo de Examen:</strong> {currentExam.exam_type}
                </div>
                <div>
                  <strong>Fecha:</strong> {new Date(currentExam.exam_date).toLocaleDateString()}
                </div>
                <div>
                  <strong>Examinador:</strong> {currentExam.examiner}
                </div>
                <div>
                  <strong>Completitud:</strong> {validationResult?.completeness_score}%
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleSaveExam}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Borrador'}</span>
              </button>
              
              <button
                onClick={handleCompleteExam}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Completar Examen</span>
              </button>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Sección en Desarrollo</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                Esta sección ({currentSection}) está en desarrollo.
              </p>
              <button
                onClick={() => {
                  const nextSection = getNextSection(currentSection);
                  if (nextSection) {
                    setCurrentSection(nextSection);
                  } else {
                    setCurrentSection('review');
                  }
                }}
                className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Continuar a Siguiente Sección
              </button>
            </div>
          </div>
        );
    }
  };

  // ==================== RENDER PRINCIPAL ====================
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Examen Neurológico Interactivo
                </h2>
                <p className="text-sm text-gray-600">
                  Sistema completo de evaluación neurológica paso a paso
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {examProgress && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>~{examProgress.estimated_time_remaining} min restantes</span>
                </div>
              )}
              
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Navegación de secciones */}
        {currentExam && renderSectionNavigation()}

        {/* Contenido principal */}
        <div className="flex-1 overflow-y-auto">
          {currentSection === 'template_selection' ? renderTemplateSelection() : renderCurrentSection()}
        </div>
      </div>
    </div>
  );
};

export default NeurologicalExamModal;
