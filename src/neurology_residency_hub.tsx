import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Users, BookOpen, FileText, MessageSquare, Activity, Settings, Bell, Home, Search, Plus, Download, Clock, User, Award, Brain, ChevronRight, CheckCircle, AlertCircle, ChevronDown, ChevronUp, CalendarDays, UserCheck, Stethoscope, Calculator, X, Copy } from 'lucide-react';

// Definir tipos para las props y escalas
interface ScaleItem {
  id: string;
  label: string;
  options: string[];
  score: number;
}

interface Scale {
  id: string;
  name: string;
  category: string;
  description: string;
  items: ScaleItem[];
}

interface ScaleResult {
  scaleName: string;
  totalScore: number;
  details: string;
  interpretation: string;
}

interface ScaleModalProps {
  scale: Scale;
  onClose: () => void;
  onSubmit: (result: ScaleResult) => void;
}

const NeurologyResidencyHub = () => {
  const [activeTab, setActiveTab] = useState('diagnostic');
  const [notifications, setNotifications] = useState(3);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null);
  const [notes, setNotes] = useState(`Datos paciente:

Antecedentes:

Motivo de consulta:
`);

  const menuItems = [
    { id: 'diagnostic', icon: Calculator, label: 'Algoritmos Diagnósticos' },
    { id: 'classboard', icon: CalendarDays, label: 'Tablón de Clase' },
    { id: 'dashboard', icon: Home, label: 'Panel Principal' },
    { id: 'academics', icon: BookOpen, label: 'Actividades Académicas' },
    { id: 'clinical', icon: Activity, label: 'Registro Asistencial' },
    { id: 'evaluations', icon: Award, label: 'Evaluaciones' },
    { id: 'resources', icon: FileText, label: 'Recursos' },
    { id: 'communication', icon: MessageSquare, label: 'Comunicación' },
    { id: 'schedule', icon: Calendar, label: 'Cronograma' },
    { id: 'profile', icon: User, label: 'Mi Perfil' }
  ];

  const upcomingActivities = [
    { title: 'Ateneo Clínico - Esclerosis Múltiple', date: '2025-07-23', time: '14:00', type: 'clinical' },
    { title: 'Clase Teórica - Epilepsias', date: '2025-07-24', time: '10:00', type: 'theory' },
    { title: 'Rotación Externa - Neuroimágenes', date: '2025-07-25', time: '08:00', type: 'rotation' },
    { title: 'Taller NIHSS', date: '2025-07-26', time: '15:00', type: 'workshop' }
  ];

  const recentAnnouncements = [
    { title: 'Nuevo protocolo de ACV agudo', date: '2025-07-20', priority: 'high' },
    { title: 'Jornadas SNA - Inscripción abierta', date: '2025-07-19', priority: 'medium' },
    { title: 'Actualización biblioteca digital', date: '2025-07-18', priority: 'low' }
  ];

  const classboardEvents = [
    { 
      id: 1,
      title: 'Ateneo Clínico - Esclerosis Múltiple', 
      date: '2025-07-24', 
      time: '14:00',
      type: 'clinical',
      description: 'Presentación de caso clínico de paciente con esclerosis múltiple remitente-recurrente. Análisis de criterios diagnósticos McDonald 2017.',
      presenter: 'Dr. García - R3',
      location: 'Aula Magna, 2do piso',
      duration: '60 minutos'
    },
    { 
      id: 2,
      title: 'Clase Teórica - Epilepsias Focales', 
      date: '2025-07-25', 
      time: '10:00',
      type: 'theory',
      description: 'Abordaje diagnóstico y terapéutico de epilepsias focales. Clasificación ILAE 2017 y algoritmos de tratamiento.',
      presenter: 'Dra. López - Staff',
      location: 'Sala de Conferencias',
      duration: '90 minutos'
    },
    { 
      id: 3,
      title: 'Taller NIHSS - Evaluación Neurológica', 
      date: '2025-07-26', 
      time: '15:00',
      type: 'workshop',
      description: 'Taller práctico de aplicación de la escala NIHSS en pacientes con accidente cerebrovascular agudo.',
      presenter: 'Dr. Martínez - Staff',
      location: 'Laboratorio de Simulación',
      duration: '120 minutos'
    },
    { 
      id: 4,
      title: 'Ateneo Bibliográfico - Migrañas', 
      date: '2025-07-28', 
      time: '16:00',
      type: 'research',
      description: 'Revisión de literatura reciente sobre nuevos tratamientos para migraña crónica. Análisis de ensayos clínicos 2024.',
      presenter: 'Dra. Fernández - R4',
      location: 'Biblioteca Médica',
      duration: '75 minutos'
    },
    { 
      id: 5,
      title: 'Reunión de Servicio', 
      date: '2025-07-29', 
      time: '08:00',
      type: 'administrative',
      description: 'Reunión semanal del servicio. Revisión de casos complejos y planificación de actividades académicas.',
      presenter: 'Jefe de Servicio',
      location: 'Oficina de Jefatura',
      duration: '45 minutos'
    }
  ];

  const weeklyAssignments = {
    monday: {
      residency: { name: 'Dr. García (R3)', task: 'Consultorio Neurología General', color: 'bg-blue-500' },
      intern: { name: 'Dr. Alonso (R2)', task: 'Interconsultas Piso 4-5', color: 'bg-green-500' }
    },
    tuesday: {
      residency: { name: 'Dra. López (R4)', task: 'Consultorio Epilepsias', color: 'bg-purple-500' },
      intern: { name: 'Dra. Martín (R1)', task: 'Sala de Internación', color: 'bg-yellow-500' }
    },
    wednesday: {
      residency: { name: 'Dr. Pérez (R2)', task: 'Electroencefalografía', color: 'bg-red-500' },
      intern: { name: 'Dr. González (R3)', task: 'Consultorio Cefaleas', color: 'bg-indigo-500' }
    },
    thursday: {
      residency: { name: 'Dra. Fernández (R4)', task: 'Consultorio Demencias', color: 'bg-pink-500' },
      intern: { name: 'Dr. Alonso (R2)', task: 'Procedimientos EEG', color: 'bg-teal-500' }
    },
    friday: {
      residency: { name: 'Dr. Silva (R1)', task: 'Rotación Externa - Neuroimágenes', color: 'bg-orange-500' },
      intern: { name: 'Dra. Torres (R4)', task: 'Supervisión Consultorios', color: 'bg-cyan-500' }
    }
  };

  const medicalScales = [
    {
      id: 'nihss',
      name: 'Escala NIHSS (National Institutes of Health Stroke Scale)',
      category: 'Evaluación Neurológica',
      description: 'Escala de evaluación de accidente cerebrovascular agudo',
      items: [
        { 
          id: 'loc', 
          label: '1. Nivel de consciencia', 
          options: [
            '0 - Alerta, respuestas normales',
            '1 - No alerta, pero responde a mínimos estímulos verbales',
            '2 - No alerta, requiere estímulos repetidos o dolorosos para responder',
            '3 - Responde solo con reflejo motor o respuestas autonómicas, o totalmente irresponsivo'
          ], 
          score: 0 
        },
        { 
          id: 'loc-questions', 
          label: '2. Preguntas del nivel de consciencia', 
          options: [
            '0 - Responde ambas preguntas correctamente (mes y edad)',
            '1 - Responde una pregunta correctamente',
            '2 - No responde ninguna pregunta correctamente'
          ], 
          score: 0 
        },
        { 
          id: 'loc-commands', 
          label: '3. Órdenes del nivel de consciencia', 
          options: [
            '0 - Realiza ambas tareas correctamente (abrir/cerrar ojos, apretar/soltar mano)',
            '1 - Realiza una tarea correctamente',
            '2 - No realiza ninguna tarea correctamente'
          ], 
          score: 0 
        },
        { 
          id: 'gaze', 
          label: '4. Mejor mirada', 
          options: [
            '0 - Normal',
            '1 - Parálisis parcial de la mirada',
            '2 - Desviación forzada o parálisis total de la mirada'
          ], 
          score: 0 
        },
        { 
          id: 'visual', 
          label: '5. Campos visuales', 
          options: [
            '0 - Sin déficits campimétricos',
            '1 - Hemianopsia parcial',
            '2 - Hemianopsia completa',
            '3 - Hemianopsia bilateral (ceguera cortical)'
          ], 
          score: 0 
        },
        { 
          id: 'facial', 
          label: '6. Parálisis facial', 
          options: [
            '0 - Movimientos normales simétricos',
            '1 - Paresia leve (asimetría al sonreír)',
            '2 - Parálisis parcial (parálisis total de la parte inferior de la cara)',
            '3 - Parálisis completa (ausencia de movimientos faciales en la parte superior e inferior)'
          ], 
          score: 0 
        },
        { 
          id: 'motor-left-arm', 
          label: '7a. Motor - Brazo izquierdo', 
          options: [
            '0 - No hay caída, mantiene la posición 10 segundos',
            '1 - Caída parcial antes de 10 segundos, no llega a tocar la cama',
            '2 - Esfuerzo contra gravedad, no puede alcanzar o mantener 10 segundos',
            '3 - No esfuerzo contra gravedad, el miembro cae',
            '4 - No movimiento',
            'UN - Amputación o fusión articular (explicar)'
          ], 
          score: 0 
        },
        { 
          id: 'motor-right-arm', 
          label: '7b. Motor - Brazo derecho', 
          options: [
            '0 - No hay caída, mantiene la posición 10 segundos',
            '1 - Caída parcial antes de 10 segundos, no llega a tocar la cama',
            '2 - Esfuerzo contra gravedad, no puede alcanzar o mantener 10 segundos',
            '3 - No esfuerzo contra gravedad, el miembro cae',
            '4 - No movimiento',
            'UN - Amputación o fusión articular (explicar)'
          ], 
          score: 0 
        },
        { 
          id: 'motor-left-leg', 
          label: '8a. Motor - Pierna izquierda', 
          options: [
            '0 - No hay caída, mantiene la posición 5 segundos',
            '1 - Caída parcial antes de 5 segundos, no llega a tocar la cama',
            '2 - Esfuerzo contra gravedad, cae a la cama en menos de 5 segundos',
            '3 - No esfuerzo contra gravedad, el miembro cae inmediatamente',
            '4 - No movimiento',
            'UN - Amputación o fusión articular (explicar)'
          ], 
          score: 0 
        },
        { 
          id: 'motor-right-leg', 
          label: '8b. Motor - Pierna derecha', 
          options: [
            '0 - No hay caída, mantiene la posición 5 segundos',
            '1 - Caída parcial antes de 5 segundos, no llega a tocar la cama',
            '2 - Esfuerzo contra gravedad, cae a la cama en menos de 5 segundos',
            '3 - No esfuerzo contra gravedad, el miembro cae inmediatamente',
            '4 - No movimiento',
            'UN - Amputación o fusión articular (explicar)'
          ], 
          score: 0 
        },
        { 
          id: 'ataxia', 
          label: '9. Ataxia de miembros', 
          options: [
            '0 - Ausente',
            '1 - Presente en un miembro',
            '2 - Presente en dos miembros',
            'UN - Amputación o fusión articular (explicar)'
          ], 
          score: 0 
        },
        { 
          id: 'sensory', 
          label: '10. Sensibilidad', 
          options: [
            '0 - Normal, sin pérdida sensorial',
            '1 - Pérdida sensorial leve a moderada',
            '2 - Pérdida sensorial severa o total'
          ], 
          score: 0 
        },
        { 
          id: 'language', 
          label: '11. Mejor lenguaje', 
          options: [
            '0 - Sin afasia, normal',
            '1 - Afasia leve a moderada',
            '2 - Afasia severa',
            '3 - Mudo, afasia global'
          ], 
          score: 0 
        },
        { 
          id: 'dysarthria', 
          label: '12. Disartria', 
          options: [
            '0 - Normal',
            '1 - Disartria leve a moderada',
            '2 - Disartria severa, habla ininteligible',
            'UN - Intubado u otra barrera física (explicar)'
          ], 
          score: 0 
        },
        { 
          id: 'neglect', 
          label: '13. Extinción e inatención (negligencia)', 
          options: [
            '0 - Sin anormalidad',
            '1 - Inatención o extinción visual, táctil, auditiva, espacial o personal a la estimulación bilateral simultánea en una de las modalidades sensoriales',
            '2 - Hemi-inatención severa o extinción en más de una modalidad'
          ], 
          score: 0 
        }
      ]
    },
    {
      id: 'glasgow',
      name: 'Escala de Coma de Glasgow',
      category: 'Evaluación Neurológica',
      description: 'Escala para evaluar el nivel de conciencia',
      items: [
        { 
          id: 'eye_opening', 
          label: 'Apertura ocular', 
          options: ['4 - Espontánea', '3 - Al habla', '2 - Al dolor', '1 - Ninguna'], 
          score: 4 
        },
        { 
          id: 'verbal_response', 
          label: 'Respuesta verbal', 
          options: ['5 - Orientada', '4 - Confusa', '3 - Palabras inapropiadas', '2 - Sonidos incomprensibles', '1 - Ninguna'], 
          score: 5 
        },
        { 
          id: 'motor_response', 
          label: 'Respuesta motora', 
          options: ['6 - Obedece órdenes', '5 - Localiza dolor', '4 - Retirada normal', '3 - Flexión anormal', '2 - Extensión', '1 - Ninguna'], 
          score: 6 
        }
      ]
    }
  ];

  const academicProgress = {
    theoretical: 85,
    clinical: 78,
    research: 60,
    evaluations: 90
  };

  const getCurrentDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return today.toLocaleDateString('es-ES', options);
  };

  const getEventTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      clinical: 'bg-red-100 text-red-800 border-red-200',
      theory: 'bg-blue-100 text-blue-800 border-blue-200',
      workshop: 'bg-green-100 text-green-800 border-green-200',
      research: 'bg-purple-100 text-purple-800 border-purple-200',
      administrative: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[type] || colors.administrative;
  };

  const getEventTypeIcon = (type: string) => {
    const icons: { [key: string]: React.FC<any> } = {
      clinical: Stethoscope,
      theory: BookOpen,
      workshop: Users,
      research: FileText,
      administrative: Settings,
    };
    return icons[type] || Settings;
  };


  const calculateScaleScore = useCallback((scale: Scale, scores: { [key: string]: number | string }) => {
    console.log('calculateScaleScore ejecutado');
    console.log('Scale:', scale);
    console.log('Scores recibidos:', scores);
    
    let totalScore = 0;
    let details = '';
    
    scale.items.forEach((item: ScaleItem, index: number) => {
      const score = scores[item.id] !== undefined ? scores[item.id] : item.score || 0;
      console.log(`Item ${index + 1} (${item.id}): score = ${score}`);
      
      let scoreValue = score;
      
      // Handle UN (not evaluable) values
      if (score === 'UN') {
        scoreValue = 0; // UN values don't contribute to total score
      } else if (typeof score === 'string' && score !== 'UN') {
        scoreValue = parseInt(score) || 0;
      }
      // Asegurar que scoreValue es número
      totalScore += typeof scoreValue === 'number' ? scoreValue : 0;
      console.log(`Score procesado: ${scoreValue}, Total acumulado: ${totalScore}`);
      
      // Crear formato resumido con título del ítem
      const itemNumber = index + 1;
      const displayScore = score === 'UN' ? 'UN' : scoreValue;
      const itemTitle = item.label.replace(/^[0-9]+[ab]?\.\s*/, ''); // Remover numeración del título
      details += `${itemNumber}) ${itemTitle}: ${displayScore}\n`;
    });
    
    console.log('Total score final:', totalScore);
    console.log('Details generados:', details);

    let interpretation = '';
    if (scale.id === 'nihss') {
      if (totalScore === 0) {
        interpretation = 'Sin síntomas de ictus.';
      } else if (totalScore >= 1 && totalScore <= 4) {
        interpretation = 'Ictus leve.';
      } else if (totalScore >= 5 && totalScore <= 15) {
        interpretation = 'Ictus moderado.';
      } else if (totalScore >= 16 && totalScore <= 20) {
        interpretation = 'Ictus moderado a grave.';
      } else {
        interpretation = 'Ictus grave.';
      }
    } else if (scale.id === 'glasgow') {
      if (totalScore >= 14) interpretation = 'Traumatismo craneal leve';
      else if (totalScore >= 9) interpretation = 'Traumatismo craneal moderado';
      else interpretation = 'Traumatismo craneal severo';
    }

    return {
      scaleName: scale.name,
      totalScore,
      details,
      interpretation
    };
  }, []);

  const ScaleModal: React.FC<ScaleModalProps> = React.memo(({ scale, onClose, onSubmit }) => {
    const [scores, setScores] = useState<{ [key: string]: number | string }>({});

    console.log('ScaleModal renderizando con scale:', scale);

    const handleScoreChange = useCallback((itemId: string, score: string) => {
      console.log('Score cambiado:', itemId, score);
      if (score === 'UN') {
        setScores(prev => ({ ...prev, [itemId]: 'UN' }));
      } else {
        setScores(prev => ({ ...prev, [itemId]: parseInt(score) }));
      }
    }, []);

    const handleSubmit = useCallback(() => {
      console.log('handleSubmit ejecutado en modal');
      console.log('Scores actuales:', scores);
      const result = calculateScaleScore(scale, scores);
      console.log('Resultado calculado:', result);
      console.log('Llamando onSubmit con resultado...');
      onSubmit(result);
    }, [scale, scores, calculateScaleScore, onSubmit]);

    const currentTotal = useMemo(() => {
      return scale.items.reduce((sum: number, item: ScaleItem) => {
        const score = scores[item.id] !== undefined ? scores[item.id] : item.score || 0;
        if (score === 'UN') return sum; // UN values don't contribute to total
        return sum + (typeof score === 'string' ? parseInt(score) || 0 : score);
      }, 0);
    }, [scale.items, scores]);

    if (!scale || !scale.items) {
      console.error('Scale or scale.items is missing:', scale);
      return <div>Error: Scale data is missing</div>;
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
                      const optionValue = optionPrefix === 'UN' ? 'UN' : parseInt(optionPrefix);
                      const isSelected = scores[item.id] === optionValue || 
                        (scores[item.id] === undefined && optionValue === (item.score || 0));
                      
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

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-900">Puntuación Total:</span>
                <span className="text-xl font-bold text-blue-900">{currentTotal}</span>
              </div>
            </div>

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
  });


  // Move insertScaleIntoNotes to component level with proper state management
  const insertScaleIntoNotes = useCallback((result: ScaleResult) => {
    console.log('insertScaleIntoNotes ejecutado con resultado:', result);
    
    const resultText = `\n\nEscala ${result.scaleName}: ${result.totalScore} puntos\n${result.details}`;
    
    console.log('Valor actual:', notes);
    console.log('Texto a insertar:', resultText);
    
    const newValue = notes + resultText;
    setNotes(newValue);
    
    console.log('Nuevo valor:', newValue);
    console.log('Inserción completada - USANDO ESTADO CONTROLADO');
  }, [notes, setNotes]);

  // Define all callbacks at component level
  const copyNotes = useCallback(() => {
    console.log('copyNotes ejecutado');
    if (notes) {
      navigator.clipboard.writeText(notes).then(() => {
        console.log('Texto copiado al portapapeles');
        alert('Texto copiado');
      }).catch((err) => {
        console.log('Error al copiar:', err);
        alert('Error al copiar');
      });
    } else {
      console.log('ERROR: No hay notas para copiar');
    }
  }, [notes]);

  const openNihssModal = useCallback(() => {
    console.log('openNihssModal ejecutado');
    const nihssScale = medicalScales.find(scale => scale.id === 'nihss');
    if (nihssScale) {
      console.log('Abriendo modal NIHSS');
      setSelectedScale(nihssScale);
    } else {
      console.log('ERROR: No se encontró la escala NIHSS');
    }
  }, [medicalScales, setSelectedScale]);

  const handleModalClose = useCallback(() => {
    console.log('Modal cerrado');
    setSelectedScale(null);
  }, [setSelectedScale]);

  const handleModalSubmit = useCallback((result: ScaleResult) => {
    console.log('Modal onSubmit ejecutado con resultado:', result);
    insertScaleIntoNotes(result);
    setSelectedScale(null);
  }, [insertScaleIntoNotes, setSelectedScale]);

  const DiagnosticAlgorithmContent = () => {

    return (
      <div className="flex h-full">
        {/* Left Sidebar */}
        <div className="w-80 bg-white shadow-lg border-r">
          <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <h2 className="text-lg font-semibold flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Escalas y Algoritmos
            </h2>
            <p className="text-blue-100 text-sm mt-1">Herramientas de evaluación neurológica</p>
          </div>
          
          <div className="p-4">
            <div className="space-y-3">
              {medicalScales.map((scale) => (
                <button
                  key={scale.id}
                  onClick={() => {
                    console.log('Botón de escala clickeado:', scale.name);
                    setSelectedScale(scale);
                  }}
                  className="w-full p-4 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all"
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{scale.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{scale.description}</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {scale.category}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              ))}
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
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Notas del Paciente</h2>
                  <p className="text-sm text-gray-600 mt-1">Registre la información del paciente y resultados de escalas</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={copyNotes}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copiar</span>
                  </button>
                  <button
                    onClick={openNihssModal}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Escala NIHSS</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4 h-full">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-full resize-none border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="Escriba aquí las notas del paciente..."
              />
            </div>
          </div>
        </div>

        {/* Scale Modal */}
        {selectedScale && (
          <ScaleModal
            key={selectedScale.id}
            scale={selectedScale}
            onClose={handleModalClose}
            onSubmit={handleModalSubmit}
          />
        )}
      </div>
    );
  };

  const ClassboardContent = () => (
    <div className="space-y-6">
      {/* Date Display Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CalendarDays className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Tablón de Clase</h1>
              <p className="text-indigo-100 text-lg">{getCurrentDate()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-indigo-100 text-sm">Servicio de Neurología</p>
            <p className="text-white font-semibold">Hospital Nacional Posadas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events Section */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-indigo-600" />
            Próximos Eventos
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {classboardEvents.map((event) => {
              const Icon = getEventTypeIcon(event.type);
              const isExpanded = expandedEvent === event.id;
              return (
                <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                  <div 
                    className="cursor-pointer"
                    onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3 flex-1">
                        <Icon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{event.title}</h3>
                          <p className="text-sm text-gray-600">{event.date} - {event.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getEventTypeColor(event.type)}`}>
                          {event.type === 'clinical' ? 'Clínico' :
                           event.type === 'theory' ? 'Teórico' :
                           event.type === 'workshop' ? 'Taller' :
                           event.type === 'research' ? 'Bibliográfico' : 'Administrativo'}
                        </span>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Descripción:</p>
                          <p className="text-gray-600 mb-3">{event.description}</p>
                          <p className="font-medium text-gray-700 mb-1">Presentador:</p>
                          <p className="text-gray-600">{event.presenter}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Ubicación:</p>
                          <p className="text-gray-600 mb-3">{event.location}</p>
                          <p className="font-medium text-gray-700 mb-1">Duración:</p>
                          <p className="text-gray-600">{event.duration}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Info Panel */}
        <div className="space-y-6">
          {/* Today's Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Resumen de Hoy
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Eventos programados</span>
                <span className="font-semibold text-blue-600">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ateneos clínicos</span>
                <span className="font-semibold text-red-600">1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Clases teóricas</span>
                <span className="font-semibold text-blue-600">1</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Accesos Rápidos</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('academics')}
                className="w-full text-left p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Actividades Académicas</span>
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('schedule')}
                className="w-full text-left p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Ver Cronograma</span>
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('clinical')}
                className="w-full text-left p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Activity className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Registro Asistencial</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Assignments Dashboard */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <UserCheck className="h-6 w-6 mr-2 text-green-600" />
          Asignaciones Semanales - Residencias e Internos
        </h2>
        
        <div className="overflow-x-auto">
          <div className="grid grid-cols-5 gap-4 min-w-full">
            {Object.entries(weeklyAssignments).map(([day, assignments]) => (
              <div key={day} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-center mb-4 text-gray-800 capitalize">
                  {day === 'monday' ? 'Lunes' :
                   day === 'tuesday' ? 'Martes' :
                   day === 'wednesday' ? 'Miércoles' :
                   day === 'thursday' ? 'Jueves' : 'Viernes'}
                </h3>
                
                <div className="space-y-3">
                  {/* Residency Assignment */}
                  <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${assignments.residency.color}`}></div>
                      <span className="text-xs font-medium text-gray-600">RESIDENCIA</span>
                    </div>
                    <p className="font-medium text-sm text-gray-900 mb-1">{assignments.residency.name}</p>
                    <p className="text-xs text-gray-600">{assignments.residency.task}</p>
                  </div>
                  
                  {/* Intern Assignment */}
                  <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${assignments.intern.color}`}></div>
                      <span className="text-xs font-medium text-gray-600">INTERNO</span>
                    </div>
                    <p className="font-medium text-sm text-gray-900 mb-1">{assignments.intern.name}</p>
                    <p className="text-xs text-gray-600">{assignments.intern.task}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Bell className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Nota Importante</span>
          </div>
          <p className="text-sm text-blue-700">
            Las asignaciones pueden cambiar según las necesidades del servicio. 
            Consulte con el jefe de residentes ante cualquier duda o cambio de último momento.
          </p>
        </div>
      </div>
    </div>
  );

  const DashboardContent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-lg">
        <div className="flex items-center space-x-3">
          <Brain className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Bienvenido, Dr. Julián Alonso</h1>
            <p className="text-blue-100">Residencia de Neurología - R2 | Hospital Nacional Posadas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Actividades Completadas</p>
              <p className="text-2xl font-bold text-green-600">24</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Horas Clínicas</p>
              <p className="text-2xl font-bold text-blue-600">156</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Casos Presentados</p>
              <p className="text-2xl font-bold text-purple-600">8</p>
            </div>
            <FileText className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Evaluaciones</p>
              <p className="text-2xl font-bold text-orange-600">90%</p>
            </div>
            <Award className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Próximas Actividades
          </h2>
          <div className="space-y-3">
            {upcomingActivities.map((activity, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  activity.type === 'clinical' ? 'bg-red-500' :
                  activity.type === 'theory' ? 'bg-blue-500' :
                  activity.type === 'rotation' ? 'bg-green-500' : 'bg-purple-500'
                }`}></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.date} - {activity.time}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-orange-600" />
            Anuncios
          </h2>
          <div className="space-y-3">
            {recentAnnouncements.map((announcement, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{announcement.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{announcement.date}</p>
                  </div>
                  <span className={`inline-block w-2 h-2 rounded-full mt-2 ${
                    announcement.priority === 'high' ? 'bg-red-500' :
                    announcement.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Progreso Académico</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(academicProgress).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-2">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="30" stroke="#e5e7eb" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    stroke="#3b82f6"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 30}`}
                    strokeDashoffset={`${2 * Math.PI * 30 * (1 - value / 100)}`}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{value}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 capitalize">
                {key === 'theoretical' ? 'Teórico' :
                 key === 'clinical' ? 'Clínico' :
                 key === 'research' ? 'Investigación' : 'Evaluaciones'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AcademicsContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Actividades Académicas</h2>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
            Todas
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
            Clases Teóricas
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
            Ateneos Clínicos
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
            Ateneos Bibliográficos
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
            Talleres
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                Clase Teórica
              </span>
              <span className="text-sm text-gray-500">Lunes 14:00</span>
            </div>
            <h3 className="font-medium mb-2">Trastornos del Movimiento</h3>
            <p className="text-sm text-gray-600 mb-3">Dr. García - R3 y R4</p>
            <div className="flex space-x-2">
              <button className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">
                Material
              </button>
              <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">
                Unirse
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                Ateneo Clínico
              </span>
              <span className="text-sm text-gray-500">Miércoles 15:00</span>
            </div>
            <h3 className="font-medium mb-2">Caso: Encefalopatía Metabólica</h3>
            <p className="text-sm text-gray-600 mb-3">Residente R2 - Todos los años</p>
            <div className="flex space-x-2">
              <button className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">
                Historia
              </button>
              <button className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">
                Preparar
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                Taller Práctico
              </span>
              <span className="text-sm text-gray-500">Viernes 16:00</span>
            </div>
            <h3 className="font-medium mb-2">Evaluación Cognitiva - MMSE</h3>
            <p className="text-sm text-gray-600 mb-3">Dra. López - R1 y R2</p>
            <div className="flex space-x-2">
              <button className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">
                Protocolo
              </button>
              <button className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded">
                Inscribirse
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">Mi Registro de Asistencia</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">92%</p>
              <p className="text-gray-600">Clases Teóricas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">88%</p>
              <p className="text-gray-600">Ateneos Clínicos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">95%</p>
              <p className="text-gray-600">Talleres</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ClinicalContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Registro Asistencial</h2>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            <span>Nueva Actividad</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Consultorio</p>
            <p className="text-2xl font-bold text-blue-800">12h</p>
            <p className="text-xs text-blue-600">Esta semana</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Sala</p>
            <p className="text-2xl font-bold text-green-800">8h</p>
            <p className="text-xs text-green-600">Esta semana</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-600 font-medium">Interconsultas</p>
            <p className="text-2xl font-bold text-orange-800">15</p>
            <p className="text-xs text-orange-600">Esta semana</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Procedimientos</p>
            <p className="text-2xl font-bold text-purple-800">3</p>
            <p className="text-xs text-purple-600">Esta semana</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-lg">Actividades Recientes</h3>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium">Consultorio Neurología</span>
              </div>
              <span className="text-sm text-gray-500">22/07/2025 - 14:00-18:00</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">4 pacientes atendidos - Seguimiento de epilepsias</p>
            <div className="flex space-x-2">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Consultorio</span>
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">4 horas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'diagnostic':
        return <DiagnosticAlgorithmContent />;
      case 'classboard':
        return <ClassboardContent />;
      case 'dashboard':
        return <DashboardContent />;
      case 'academics':
        return <AcademicsContent />;
      case 'clinical':
        return <ClinicalContent />;
      default:
        return <DiagnosticAlgorithmContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <Brain className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="font-bold text-lg">Neurología</h1>
              <p className="text-sm text-gray-600">Hospital Posadas</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    {item.id === 'communication' && notifications > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notifications}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className={`flex-1 ${activeTab === 'diagnostic' ? '' : 'p-6'}`}>
        {renderContent()}
      </div>
    </div>
  );
};

export default NeurologyResidencyHub;