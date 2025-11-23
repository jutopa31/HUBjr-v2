import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Microscope,
  Save,
  X
} from 'lucide-react';
import { useLumbarPuncture } from '../hooks/useLumbarPuncture';
import {
  LumbarPunctureFormData,
  COMMON_LP_INDICATIONS,
  PCR_TEST_OPTIONS,
  ANTIGEN_TEST_OPTIONS
} from '../types/lumbarPuncture';

interface LumbarPunctureFormProps {
  onSubmit?: (data: LumbarPunctureFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<LumbarPunctureFormData>;
  mode?: 'create' | 'edit';
}

export default function LumbarPunctureForm({
  onSubmit,
  onCancel,
  initialData,
  mode = 'create'
}: LumbarPunctureFormProps) {
  const { createProcedure, loading } = useLumbarPuncture();

  const [formData, setFormData] = useState<LumbarPunctureFormData>({
    patient_initials: '',
    patient_age: undefined,
    patient_gender: undefined,
    procedure_date: new Date().toISOString().split('T')[0],
    procedure_time: '',
    indication: '',
    supervisor: '',
    trainee_role: 'performed_supervised',

    // Pre-procedure checklist
    contraindications_checked: false,
    informed_consent: false,
    platelet_count: undefined,
    inr_value: undefined,

    // Technique
    patient_position: 'lateral_decubitus',
    needle_level: 'L3-L4',
    needle_gauge: '22G',
    needle_type: 'quincke',
    local_anesthetic: 'lidocaine 1%',

    // Outcomes
    successful: false,
    attempts_count: 1,
    bloody_tap: false,
    traumatic_tap: false,
    dry_tap: false,

    // Opening pressure
    opening_pressure_measured: false,
    opening_pressure_value: undefined,
    opening_pressure_notes: '',

    // CSF
    csf_appearance: undefined,
    csf_volume_collected: undefined,

    // Basic lab results
    csf_white_cells: undefined,
    csf_red_cells: undefined,
    csf_protein: undefined,
    csf_glucose: undefined,
    serum_glucose: undefined,
    csf_lactate: undefined,

    // Microbiology
    gram_stain_result: '',
    culture_sent: false,
    pcr_tests_sent: [],
    antigen_tests_sent: [],

    // Special studies
    cytology_sent: false,
    flow_cytometry_sent: false,
    oligoclonal_bands_sent: false,

    // Complications
    headache_post_lp: false,
    headache_severity: undefined,
    nausea_vomiting: false,
    back_pain: false,
    bleeding: false,
    infection: false,
    other_complications: '',

    // Follow-up
    patient_discharge_same_day: true,
    follow_up_required: false,
    follow_up_notes: '',

    // Educational
    learning_objectives_met: '',
    supervisor_feedback: '',
    resident_reflection: '',
    technical_difficulty: undefined,

    // Clinical context
    primary_diagnosis: '',
    differential_diagnosis: [],
    clinical_question: '',

    // Administrative
    procedure_location: 'bedside',
    assistance_required: [],
    equipment_issues: '',

    ...initialData
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const steps = [
    'Info del Paciente y Procedimiento',
    'Lista de Verificación Pre-procedimiento',
    'Técnica del Procedimiento',
    'Resultados y Desenlaces',
    'Datos de Laboratorio',
    'Complicaciones y Seguimiento',
    'Contexto Educativo y Clínico'
  ];

  const handleInputChange = (field: keyof LumbarPunctureFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: keyof LumbarPunctureFormData, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = (prev[field] as string[]) || [];
      if (checked) {
        return {
          ...prev,
          [field]: [...currentArray, value]
        };
      } else {
        return {
          ...prev,
          [field]: currentArray.filter(item => item !== value)
        };
      }
    });
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    try {
      if (mode === 'create') {
        const result = await createProcedure(formData);
        if (result) {
          onSubmit?.(formData);
        } else {
          setSubmitError('Error al crear el registro de punción lumbar');
        }
      } else {
        // For edit mode, you'd need to pass the ID
        onSubmit?.(formData);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Ocurrió un error');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Patient & Procedure Info
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Iniciales del Paciente *
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={formData.patient_initials}
                  onChange={(e) => handleInputChange('patient_initials', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: ABC"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edad del Paciente
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.patient_age || ''}
                  onChange={(e) => handleInputChange('patient_age', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sexo del Paciente
                </label>
                <select
                  value={formData.patient_gender || ''}
                  onChange={(e) => handleInputChange('patient_gender', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar sexo</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="Other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha del Procedimiento *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.procedure_date}
                    onChange={(e) => handleInputChange('procedure_date', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora del Procedimiento
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="time"
                    value={formData.procedure_time}
                    onChange={(e) => handleInputChange('procedure_time', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supervisor *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.supervisor}
                    onChange={(e) => handleInputChange('supervisor', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Dr. García"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol del Residente *
              </label>
              <select
                value={formData.trainee_role}
                onChange={(e) => handleInputChange('trainee_role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="observer">Observador</option>
                <option value="assisted">Asistido</option>
                <option value="performed_supervised">Realizado bajo supervisión</option>
                <option value="performed_independent">Realizado independientemente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Indicación *
              </label>
              <select
                value={formData.indication}
                onChange={(e) => handleInputChange('indication', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar indicación</option>
                {COMMON_LP_INDICATIONS.map(indication => (
                  <option key={indication} value={indication}>
                    {indication}
                  </option>
                ))}
              </select>
              {formData.indication === 'Otro' && (
                <input
                  type="text"
                  placeholder="Especificar otra indicación"
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => handleInputChange('indication', e.target.value)}
                />
              )}
            </div>
          </div>
        );

      case 1: // Pre-procedure Checklist
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-blue-700 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-800">Lista de Verificación de Seguridad Pre-procedimiento</h4>
                  <p className="text-sm text-gray-700 mt-1">
                    Asegurar que todas las medidas de seguridad estén completas antes de proceder.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.contraindications_checked}
                  onChange={(e) => handleInputChange('contraindications_checked', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Contraindicaciones verificadas y descartadas
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.informed_consent}
                  onChange={(e) => handleInputChange('informed_consent', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Consentimiento informado obtenido
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platelet Count (if available)
                </label>
                <input
                  type="number"
                  value={formData.platelet_count || ''}
                  onChange={(e) => handleInputChange('platelet_count', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="×10³/μL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  INR Value (if available)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.inr_value || ''}
                  onChange={(e) => handleInputChange('inr_value', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1.0"
                />
              </div>
            </div>
          </div>
        );

      case 2: // Procedure Technique
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Position
                </label>
                <select
                  value={formData.patient_position}
                  onChange={(e) => handleInputChange('patient_position', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="lateral_decubitus">Lateral decubitus</option>
                  <option value="sitting">Sitting</option>
                  <option value="prone">Prone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Needle Level
                </label>
                <select
                  value={formData.needle_level}
                  onChange={(e) => handleInputChange('needle_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="L2-L3">L2-L3</option>
                  <option value="L3-L4">L3-L4</option>
                  <option value="L4-L5">L4-L5</option>
                  <option value="L5-S1">L5-S1</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Needle Gauge
                </label>
                <select
                  value={formData.needle_gauge}
                  onChange={(e) => handleInputChange('needle_gauge', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="20G">20G</option>
                  <option value="22G">22G</option>
                  <option value="25G">25G</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Needle Type
                </label>
                <select
                  value={formData.needle_type}
                  onChange={(e) => handleInputChange('needle_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="quincke">Quincke (cutting tip)</option>
                  <option value="sprotte">Sprotte (pencil point)</option>
                  <option value="whitacre">Whitacre (pencil point)</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local Anesthetic
              </label>
              <input
                type="text"
                value={formData.local_anesthetic}
                onChange={(e) => handleInputChange('local_anesthetic', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="lidocaine 1%"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Procedure Location
              </label>
              <input
                type="text"
                value={formData.procedure_location}
                onChange={(e) => handleInputChange('procedure_location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="bedside, procedure room, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technical Difficulty (1-5 scale)
              </label>
              <select
                value={formData.technical_difficulty || ''}
                onChange={(e) => handleInputChange('technical_difficulty', parseInt(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select difficulty</option>
                <option value="1">1 - Very easy</option>
                <option value="2">2 - Easy</option>
                <option value="3">3 - Moderate</option>
                <option value="4">4 - Difficult</option>
                <option value="5">5 - Very difficult</option>
              </select>
            </div>
          </div>
        );

      case 3: // Outcomes & Results
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Attempts
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.attempts_count}
                  onChange={(e) => handleInputChange('attempts_count', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSF Volume Collected (mL)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.csf_volume_collected || ''}
                  onChange={(e) => handleInputChange('csf_volume_collected', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Procedure Outcome</h4>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.successful}
                  onChange={(e) => handleInputChange('successful', e.target.checked)}
                  className="h-4 w-4 text-blue-700 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-700 mr-2" />
                  Procedure successful
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.bloody_tap}
                  onChange={(e) => handleInputChange('bloody_tap', e.target.checked)}
                  className="h-4 w-4 text-gray-700 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  <XCircle className="h-4 w-4 text-blue-700 mr-2" />
                  Bloody tap
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.traumatic_tap}
                  onChange={(e) => handleInputChange('traumatic_tap', e.target.checked)}
                  className="h-4 w-4 text-gray-700 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  <XCircle className="h-4 w-4 text-blue-700 mr-2" />
                  Traumatic tap
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.dry_tap}
                  onChange={(e) => handleInputChange('dry_tap', e.target.checked)}
                  className="h-4 w-4 text-blue-700 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  <AlertTriangle className="h-4 w-4 text-blue-700 mr-2" />
                  Dry tap
                </span>
              </label>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Opening Pressure</h4>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.opening_pressure_measured}
                  onChange={(e) => handleInputChange('opening_pressure_measured', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Opening pressure measured
                </span>
              </label>

              {formData.opening_pressure_measured && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opening Pressure (cmH₂O)
                    </label>
                    <input
                      type="number"
                      value={formData.opening_pressure_value || ''}
                      onChange={(e) => handleInputChange('opening_pressure_value', parseInt(e.target.value) || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Normal: 5-25 cmH₂O"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opening Pressure Notes
                    </label>
                    <input
                      type="text"
                      value={formData.opening_pressure_notes}
                      onChange={(e) => handleInputChange('opening_pressure_notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Additional observations"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSF Appearance
              </label>
              <select
                value={formData.csf_appearance || ''}
                onChange={(e) => handleInputChange('csf_appearance', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select appearance</option>
                <option value="clear">Clear</option>
                <option value="cloudy">Cloudy</option>
                <option value="turbid">Turbid</option>
                <option value="bloody">Bloody</option>
                <option value="xanthochromic">Xanthochromic</option>
              </select>
            </div>
          </div>
        );

      case 4: // Laboratory Data
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Microscope className="h-5 w-5 text-blue-600" />
              <h4 className="text-lg font-medium text-gray-900">Laboratory Results</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSF White Cells (cells/μL)
                </label>
                <input
                  type="number"
                  value={formData.csf_white_cells || ''}
                  onChange={(e) => handleInputChange('csf_white_cells', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Normal: 0-5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSF Red Cells (cells/μL)
                </label>
                <input
                  type="number"
                  value={formData.csf_red_cells || ''}
                  onChange={(e) => handleInputChange('csf_red_cells', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Normal: 0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSF Protein (mg/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.csf_protein || ''}
                  onChange={(e) => handleInputChange('csf_protein', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Normal: 15-45"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSF Glucose (mg/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.csf_glucose || ''}
                  onChange={(e) => handleInputChange('csf_glucose', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Normal: 40-70"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serum Glucose (mg/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.serum_glucose || ''}
                  onChange={(e) => handleInputChange('serum_glucose', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="For comparison"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSF Lactate (mmol/L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.csf_lactate || ''}
                  onChange={(e) => handleInputChange('csf_lactate', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Normal: 1.1-2.4"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gram Stain Result
              </label>
              <textarea
                value={formData.gram_stain_result}
                onChange={(e) => handleInputChange('gram_stain_result', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Describe gram stain findings"
              />
            </div>

            <div className="space-y-4">
              <h5 className="text-md font-medium text-gray-900">Microbiology Tests Ordered</h5>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.culture_sent}
                  onChange={(e) => handleInputChange('culture_sent', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Culture sent</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PCR Tests Ordered
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PCR_TEST_OPTIONS.map(test => (
                    <label key={test} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.pcr_tests_sent.includes(test)}
                        onChange={(e) => handleArrayChange('pcr_tests_sent', test, e.target.checked)}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-700">{test}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Antigen Tests Ordered
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ANTIGEN_TEST_OPTIONS.map(test => (
                    <label key={test} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.antigen_tests_sent.includes(test)}
                        onChange={(e) => handleArrayChange('antigen_tests_sent', test, e.target.checked)}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-700">{test}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h6 className="text-sm font-medium text-gray-900">Special Studies</h6>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.cytology_sent}
                    onChange={(e) => handleInputChange('cytology_sent', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Cytology</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.flow_cytometry_sent}
                    onChange={(e) => handleInputChange('flow_cytometry_sent', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Flow cytometry</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.oligoclonal_bands_sent}
                    onChange={(e) => handleInputChange('oligoclonal_bands_sent', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Oligoclonal bands</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 5: // Complications & Follow-up
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 text-blue-700 mr-2" />
                Complications
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.headache_post_lp}
                    onChange={(e) => handleInputChange('headache_post_lp', e.target.checked)}
                    className="h-4 w-4 text-gray-700 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Post-LP headache</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.nausea_vomiting}
                    onChange={(e) => handleInputChange('nausea_vomiting', e.target.checked)}
                    className="h-4 w-4 text-gray-700 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Nausea/vomiting</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.back_pain}
                    onChange={(e) => handleInputChange('back_pain', e.target.checked)}
                    className="h-4 w-4 text-gray-700 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Back pain</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.bleeding}
                    onChange={(e) => handleInputChange('bleeding', e.target.checked)}
                    className="h-4 w-4 text-gray-700 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Bleeding</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.infection}
                    onChange={(e) => handleInputChange('infection', e.target.checked)}
                    className="h-4 w-4 text-gray-700 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Infection</span>
                </label>
              </div>

              {formData.headache_post_lp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Headache Severity (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.headache_severity || ''}
                    onChange={(e) => handleInputChange('headache_severity', parseInt(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Complications
                </label>
                <textarea
                  value={formData.other_complications}
                  onChange={(e) => handleInputChange('other_complications', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Describe any other complications"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Follow-up</h4>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.patient_discharge_same_day}
                  onChange={(e) => handleInputChange('patient_discharge_same_day', e.target.checked)}
                  className="h-4 w-4 text-blue-700 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Patient discharged same day</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.follow_up_required}
                  onChange={(e) => handleInputChange('follow_up_required', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Follow-up required</span>
              </label>

              {formData.follow_up_required && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Notes
                  </label>
                  <textarea
                    value={formData.follow_up_notes}
                    onChange={(e) => handleInputChange('follow_up_notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe follow-up plan"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 6: // Educational & Clinical Context
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Diagnosis
              </label>
              <input
                type="text"
                value={formData.primary_diagnosis}
                onChange={(e) => handleInputChange('primary_diagnosis', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Primary working diagnosis"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clinical Question
              </label>
              <textarea
                value={formData.clinical_question}
                onChange={(e) => handleInputChange('clinical_question', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="What clinical question was this LP intended to answer?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Objectives Met
              </label>
              <textarea
                value={formData.learning_objectives_met}
                onChange={(e) => handleInputChange('learning_objectives_met', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="What learning objectives were achieved?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supervisor Feedback
              </label>
              <textarea
                value={formData.supervisor_feedback}
                onChange={(e) => handleInputChange('supervisor_feedback', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Feedback from supervising physician"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resident Reflection
              </label>
              <textarea
                value={formData.resident_reflection}
                onChange={(e) => handleInputChange('resident_reflection', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Your reflection on the procedure, what went well, what could be improved"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipment Issues
              </label>
              <textarea
                value={formData.equipment_issues}
                onChange={(e) => handleInputChange('equipment_issues', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Any equipment problems encountered"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0:
        return formData.patient_initials && formData.procedure_date && formData.indication && formData.supervisor;
      case 1:
        return formData.contraindications_checked && formData.informed_consent;
      case 2:
        return true; // All technique fields have defaults
      case 3:
        return true; // Outcomes can be minimal
      case 4:
        return true; // Lab data is optional
      case 5:
        return true; // Complications are optional
      case 6:
        return true; // Educational content is optional
      default:
        return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Stethoscope className="h-6 w-6 text-blue-600 mr-2" />
              {mode === 'create' ? 'Nueva Punción Lumbar' : 'Editar Punción Lumbar'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Paso {currentStep + 1} de {steps.length}: {steps[currentStep]}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            {steps.map((step, index) => (
              <span
                key={index}
                className={`${
                  index === currentStep ? 'text-blue-600 font-medium' : ''
                } ${index < currentStep ? 'text-blue-700' : ''}`}
              >
                {step}
              </span>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-6 py-6">
        {renderStep()}

        {submitError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-700 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-800">Error</h4>
                <p className="text-sm text-gray-700 mt-1">{submitError}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>

        <div className="flex space-x-2">
          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceedToNext()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !canProceedToNext()}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:cursor-not-allowed flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : mode === 'create' ? 'Crear Procedimiento' : 'Actualizar Procedimiento'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
