import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Home,
  Calculator,
  Calendar,
  Menu,
  Settings,
  CheckSquare,
  Users,
  FolderOpen,
  BookOpen,
  User,
  Syringe,
  MessageSquare,
  Award
} from 'lucide-react';
import DiagnosticAlgorithmContent from './DiagnosticAlgorithmContent';
import { Scale, ScaleResult, HospitalContext } from './types';
import AdminAuthModal from './AdminAuthModal';
import EventManagerSupabase from './EventManagerSupabase';
import PendientesManager from './PendientesManager';
import WardRounds from './WardRounds';
import SavedPatients from './SavedPatients';
import DashboardInicio from './DashboardInicio';
import AcademiaManager from './AcademiaManager';
import { ProtectedRoute } from './components/auth';
import { useAuthContext } from './components/auth/AuthProvider';
import UserDashboard from './components/user/UserDashboard';
import HospitalContextSelector from './HospitalContextSelector';
import LumbarPunctureDashboard from './components/LumbarPunctureDashboard';
import ResidentManagement from './components/ResidentManagement';
import Interconsultas from './Interconsultas';
import PacientesPostAlta from './PacientesPostAlta';
import Sidebar from './components/layout/Sidebar';
import { EvolucionadorApp } from './evolucionador';

// Import types from separate file
import ScaleModal from './ScaleModal';
import UpdrsModal from './components/UpdrsModal';
import RankingView from './components/ranking/RankingView';
import { CORE_MODULE_IDS, MODULES, ModuleId } from './config/modules';

const NeurologyResidencyHub = () => {
  const [activeTab, setActiveTab] = useState('inicio');
  const [notifications] = useState(3);
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { hasPrivilege } = useAuthContext();
  const useNewEvolucionador = hasPrivilege('use_new_evolucionador') || hasPrivilege('full_admin');

  // Function to handle tab changes and close sidebar on mobile
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  // Handler para ir al Evolucionador desde Interconsultas (workflow integration)
  const handleGoToEvolucionador = (interconsulta: any) => {
    console.log('[Hub] Ir al Evolucionador con interconsulta:', interconsulta.nombre);
    setActiveInterconsulta(interconsulta);
    setActiveTab('diagnostic'); // Cambiar al tab del Evolucionador
    setSidebarOpen(false);
  };

  // Initialize notes with localStorage persistence
  const [notes, setNotes] = useState(() => {
    const savedNotes = localStorage.getItem('hubjr-patient-notes');
    if (savedNotes) {
      console.log('[Hub] Restored notes from localStorage');
      return savedNotes;
    }
    return '';
  });

  // Auto-save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('hubjr-patient-notes', notes);
  }, [notes]);

  // Estados para el sistema de administración
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Estado para el contexto hospitalario global
  const [currentHospitalContext, setCurrentHospitalContext] = useState<HospitalContext>('Posadas');

  // Estado para interconsulta activa (workflow integration)
  const [activeInterconsulta, setActiveInterconsulta] = useState<any | null>(null);

  // Estados para Google Calendar (removido - ahora usando Supabase)
  
  // Estados para gestión de eventos mejorada
  // const [eventFilter] = useState('all'); // setEventFilter unused
  // const [eventSearch] = useState(''); // setEventSearch unused
  
  // Estados editables para eventos del calendario
  const [_classboardEvents, setClassboardEvents] = useState([]);

  // Estados editables para asignaciones
  const [_weeklyAssignments, setWeeklyAssignments] = useState({
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
  });

  const moduleIconMap: Record<ModuleId, React.ComponentType<{ className?: string }>> = {
    inicio: Home,
    schedule: Calendar,
    pendientes: CheckSquare,
    'ward-rounds': Users,
    'user-dashboard': User,
    'lumbar-punctures': Syringe,
    diagnostic: Calculator,
    interconsultas: MessageSquare,
    'pacientes-post-alta': Users,
    'saved-patients': FolderOpen,
    academia: BookOpen,
    ranking: Award,
    'resident-management': Settings
  };

  const menuItems = CORE_MODULE_IDS.map((id) => {
    const module = MODULES[id];
    return {
      id: module.id,
      icon: moduleIconMap[id] ?? Home,
      label: module.label
    };
  });


  // Medical scales definitions for evaluating neurological conditions
  const medicalScales = [
    {
      id: 'hints',
      name: 'HINTS / HINTS+ – síndrome vestibular agudo',
      category: 'Evaluación Neurológica',
      description: 'Head Impulse, Nystagmus, Test of Skew (+ audición). Usar solo en SVA; no reemplaza juicio clínico ni neuroimagen.',
      items: []
    },
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
          ]
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
          ]
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
          ]
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
          ]
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
          ]
        },
        {
          id: 'ataxia',
          label: '9. Ataxia de miembros',
          options: [
            '0 - Ausente',
            '1 - Presente en un miembro',
            '2 - Presente en dos miembros',
            'UN - Amputación o fusión articular (explicar)'
          ]
        },
        {
          id: 'sensory',
          label: '10. Sensibilidad',
          options: [
            '0 - Normal, sin pérdida sensorial',
            '1 - Pérdida sensorial leve a moderada',
            '2 - Pérdida sensorial severa o total'
          ]
        },
        {
          id: 'language',
          label: '11. Mejor lenguaje',
          options: [
            '0 - Sin afasia, normal',
            '1 - Afasia leve a moderada',
            '2 - Afasia severa',
            '3 - Mudo, afasia global'
          ]
        },
        {
          id: 'dysarthria',
          label: '12. Disartria',
          options: [
            '0 - Normal',
            '1 - Disartria leve a moderada',
            '2 - Disartria severa, habla ininteligible',
            'UN - Intubado u otra barrera física (explicar)'
          ]
        },
        {
          id: 'neglect',
          label: '13. Extinción e inatención (negligencia)',
          options: [
            '0 - Sin anormalidad',
            '1 - Inatención o extinción visual, táctil, auditiva, espacial o personal a la estimulación bilateral simultánea en una de las modalidades sensoriales',
            '2 - Hemi-inatención severa o extinción en más de una modalidad'
          ]
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
    },
    {
      id: 'updrs1',
      name: 'UPDRS I - Estado Mental',
      category: 'Parkinson',
      description: 'Evaluación de aspectos no motores y cognitivos en Parkinson',
      items: [
        {
          id: 'intellect',
          label: '1. Alteración del Intelecto',
          options: [
            '0 - Nula',
            '1 - Leve (pérdida de complejidad del pensamiento)',
            '2 - Moderada (requiere ayuda para tareas complejas)',
            '3 - Grave (solo tareas simples, dificultad para entender)',
            '4 - Muy grave (no puede entender)'
          ],
          score: 0
        },
        {
          id: 'thought_disorder',
          label: '2. Trastornos del Pensamiento',
          options: [
            '0 - No hay',
            '1 - Ensueños vívidos',
            '2 - Alucinaciones benignas, manteniendo juicio',
            '3 - Alucinaciones frecuentes o delirios ocasionales sin juicio',
            '4 - Alucinaciones/delirios persistentes o psicosis florida'
          ],
          score: 0
        },
        {
          id: 'depression',
          label: '3. Depresión',
          options: [
            '0 - No hay',
            '1 - Períodos de tristeza o culpa mayores a lo normal',
            '2 - Depresión sostenida (semanas o más)',
            '3 - Depresión sostenida con síntomas vegetativos',
            '4 - Depresión con síntomas vegetativos o ideación suicida'
          ],
          score: 0
        },
        {
          id: 'motivation',
          label: '4. Motivación - Iniciativa',
          options: [
            '0 - Normal',
            '1 - Menos activa de lo habitual, mayor pasividad',
            '2 - Pérdida de iniciativa o desinterés en actividades opcionales',
            '3 - Pérdida de iniciativa o desinterés en actividades rutinarias',
            '4 - Aislado, pérdida completa de motivación'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'updrs2',
      name: 'UPDRS II - Actividades de la Vida Diaria',
      category: 'Parkinson',
      description: 'Evaluación de funciones de la vida diaria en Parkinson',
      items: [
        {
          id: 'speech',
          label: '5. Lenguaje',
          options: [
            '0 - Normal',
            '1 - Ligeramente alterado. No hay dificultad para entender',
            '2 - Moderadamente alterado. A veces piden que repita',
            '3 - Muy alterado. Frecuentemente piden que repita',
            '4 - Ininteligible la mayor parte del tiempo'
          ],
          score: 0
        },
        {
          id: 'salivation',
          label: '6. Salivación',
          options: [
            '0 - Normal',
            '1 - Ligero pero definitivo exceso de saliva, puede babear por la noche',
            '2 - Moderado exceso de saliva, puede babear',
            '3 - Marcado exceso de saliva con algo de babeo',
            '4 - Marcado babeo, requiere pañuelo constantemente'
          ],
          score: 0
        },
        {
          id: 'swallowing',
          label: '7. Deglución',
          options: [
            '0 - Normal',
            '1 - Rara vez se atraganta',
            '2 - Ocasionalmente se atraganta',
            '3 - Requiere comida blanda',
            '4 - Requiere sonda nasogástrica o gastrostomía'
          ],
          score: 0
        },
        {
          id: 'handwriting',
          label: '8. Escritura',
          options: [
            '0 - Normal',
            '1 - Ligeramente lenta o pequeña',
            '2 - Moderadamente lenta o pequeña; todas las palabras son legibles',
            '3 - Severamente afectada; no todas las palabras son legibles',
            '4 - La mayoría no es legible'
          ],
          score: 0
        },
        {
          id: 'cutting_food',
          label: '9. Cortar alimentos y manejar utensilios',
          options: [
            '0 - Normal',
            '1 - Algo lento y torpe, pero no necesita ayuda',
            '2 - Puede cortar la mayoría de comidas, aunque torpe y lento; algo de ayuda',
            '3 - Los alimentos deben ser cortados por otros, pero aún puede alimentarse lentamente',
            '4 - Necesita ser alimentado'
          ],
          score: 0
        },
        {
          id: 'dressing',
          label: '10. Vestido',
          options: [
            '0 - Normal',
            '1 - Algo lento, pero no necesita ayuda',
            '2 - Ayuda ocasional con botones, brazos en mangas',
            '3 - Ayuda considerable requerida, pero puede hacer algunas cosas solo',
            '4 - Incapacitado'
          ],
          score: 0
        },
        {
          id: 'hygiene',
          label: '11. Higiene',
          options: [
            '0 - Normal',
            '1 - Algo lento, pero no necesita ayuda',
            '2 - Necesita ayuda para ducharse o bañarse; o muy lento en cuidado higiénico',
            '3 - Requiere asistencia para lavarse, cepillarse dientes, peinarse, ir al baño',
            '4 - Sonda Foley u otras ayudas mecánicas'
          ],
          score: 0
        },
        {
          id: 'turning_in_bed',
          label: '12. Darse vuelta en la cama y ajustar ropa de cama',
          options: [
            '0 - Normal',
            '1 - Algo lento y torpe, pero no necesita ayuda',
            '2 - Puede voltearse solo o ajustar sábanas, pero con gran dificultad',
            '3 - Puede iniciar, pero no voltearse o ajustar sábanas solo',
            '4 - Incapacitado'
          ],
          score: 0
        },
        {
          id: 'falling',
          label: '13. Caídas (no relacionadas con freezing)',
          options: [
            '0 - Ninguna',
            '1 - Rara vez se cae',
            '2 - Ocasionalmente se cae, menos de una vez al día',
            '3 - Se cae un promedio de una vez al día',
            '4 - Se cae más de una vez al día'
          ],
          score: 0
        },
        {
          id: 'freezing',
          label: '14. Freezing al caminar',
          options: [
            '0 - No hay',
            '1 - Rara vez freeze al caminar; puede tener titubeo al inicio',
            '2 - Ocasionalmente freeze al caminar',
            '3 - Frecuentemente freeze. Ocasionalmente se cae por freezing',
            '4 - Frecuentes caídas por freezing'
          ],
          score: 0
        },
        {
          id: 'walking',
          label: '15. Caminar',
          options: [
            '0 - Normal',
            '1 - Leve dificultad. Puede no balancear brazos o tender a arrastrar pierna',
            '2 - Dificultad moderada, pero requiere poca o ninguna asistencia',
            '3 - Trastorno severo de la marcha, requiere asistencia',
            '4 - No puede caminar, aún con asistencia'
          ],
          score: 0
        },
        {
          id: 'tremor',
          label: '16. Temblor',
          options: [
            '0 - Ausente',
            '1 - Leve e infrecuentemente presente',
            '2 - Moderado; molesto para el paciente',
            '3 - Severo; muchas actividades interferidas',
            '4 - Marcado; la mayoría de actividades abandonadas'
          ],
          score: 0
        },
        {
          id: 'sensory_complaints',
          label: '17. Quejas sensoriales relacionadas con parkinsonismo',
          options: [
            '0 - Ninguna',
            '1 - Ocasionalmente tiene entumecimiento, hormigueo o dolor leve',
            '2 - Frecuentemente tiene entumecimiento, hormigueo o dolor; no es angustiante',
            '3 - Sensaciones dolorosas frecuentes',
            '4 - Dolor extremo'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'updrs3',
      name: 'UPDRS III - Examen Motor',
      category: 'Parkinson',
      description: 'Evaluación de signos motores en Parkinson',
      items: [
        {
          id: 'speech_motor',
          label: '18. Lenguaje',
          options: [
            '0 - Normal',
            '1 - Leve pérdida de expresión, dicción y/o volumen',
            '2 - Monótono, farfullado pero comprensible; moderadamente afectado',
            '3 - Marcadamente afectado, difícil de entender',
            '4 - Ininteligible'
          ],
          score: 0
        },
        {
          id: 'facial_expression',
          label: '19. Expresión facial',
          options: [
            '0 - Normal',
            '1 - Hipomimia mínima, podría ser "cara de póker" normal',
            '2 - Leve pero definitiva reducción en expresión facial',
            '3 - Hipomimia moderada; labios separados algunas veces',
            '4 - Cara de máscara o expresión fija con pérdida severa o completa de expresión facial; labios separados 6mm o más'
          ],
          score: 0
        },
        {
          id: 'rest_tremor_hands',
          label: '20. Temblor de reposo - Manos',
          options: [
            '0 - Ausente',
            '1 - Leve y infrecuentemente presente',
            '2 - Leve en amplitud y persistente. O moderado en amplitud pero presente solo intermitentemente',
            '3 - Moderado en amplitud y presente la mayor parte del tiempo',
            '4 - Marcado en amplitud y presente la mayor parte del tiempo'
          ],
          score: 0
        },
        {
          id: 'rest_tremor_feet',
          label: '21. Temblor de reposo - Pies',
          options: [
            '0 - Ausente',
            '1 - Leve y infrecuentemente presente',
            '2 - Leve en amplitud y persistente. O moderado en amplitud pero presente solo intermitentemente',
            '3 - Moderado en amplitud y presente la mayor parte del tiempo',
            '4 - Marcado en amplitud y presente la mayor parte del tiempo'
          ],
          score: 0
        },
        {
          id: 'action_tremor',
          label: '22. Temblor de acción o postural de manos',
          options: [
            '0 - Ausente',
            '1 - Leve; presente con acción',
            '2 - Moderado en amplitud, presente con acción',
            '3 - Moderado en amplitud con postura mantenida así como con acción',
            '4 - Marcado en amplitud; interfiere con alimentación'
          ],
          score: 0
        },
        {
          id: 'axial_rigidity',
          label: '23. Rigidez - Cuello',
          options: [
            '0 - Ausente',
            '1 - Leve o detectable solo cuando se activa por movimientos espejo o de otra maniobra',
            '2 - Leve a moderada',
            '3 - Marcada, pero rango completo de movimiento fácilmente alcanzado',
            '4 - Severa, rango de movimiento alcanzado con dificultad'
          ],
          score: 0
        },
        {
          id: 'limb_rigidity',
          label: '24. Rigidez - Extremidades',
          options: [
            '0 - Ausente',
            '1 - Leve o detectable solo cuando se activa por movimientos espejo o de otra maniobra',
            '2 - Leve a moderada',
            '3 - Marcada, pero rango completo de movimiento fácilmente alcanzado',
            '4 - Severa, rango de movimiento alcanzado con dificultad'
          ],
          score: 0
        },
        {
          id: 'finger_taps',
          label: '25. Golpeteo de dedos',
          options: [
            '0 - Normal',
            '1 - Leve lentitud y/o reducción en amplitud',
            '2 - Moderadamente afectado. Definitiva y temprana fatiga. Puede tener detenciones ocasionales',
            '3 - Severamente afectado. Dudas frecuentes al iniciar o detenciones durante el movimiento',
            '4 - Apenas puede realizar la tarea'
          ],
          score: 0
        },
        {
          id: 'hand_movements',
          label: '26. Movimientos de manos',
          options: [
            '0 - Normal',
            '1 - Leve lentitud y/o reducción en amplitud',
            '2 - Moderadamente afectado. Definitiva y temprana fatiga. Puede tener detenciones ocasionales',
            '3 - Severamente afectado. Dudas frecuentes al iniciar o detenciones durante el movimiento',
            '4 - Apenas puede realizar la tarea'
          ],
          score: 0
        },
        {
          id: 'rapid_alternating',
          label: '27. Movimientos alternantes rápidos de manos',
          options: [
            '0 - Normal',
            '1 - Leve lentitud y/o reducción en amplitud',
            '2 - Moderadamente afectado. Definitiva y temprana fatiga. Puede tener detenciones ocasionales',
            '3 - Severamente afectado. Dudas frecuentes al iniciar o detenciones durante el movimiento',
            '4 - Apenas puede realizar la tarea'
          ],
          score: 0
        },
        {
          id: 'leg_agility',
          label: '28. Agilidad de piernas',
          options: [
            '0 - Normal',
            '1 - Leve lentitud y/o reducción en amplitud',
            '2 - Moderadamente afectado. Definitiva y temprana fatiga. Puede tener detenciones ocasionales',
            '3 - Severamente afectado. Dudas frecuentes al iniciar o detenciones durante el movimiento',
            '4 - Apenas puede realizar la tarea'
          ],
          score: 0
        },
        {
          id: 'arising_chair',
          label: '29. Levantarse de la silla',
          options: [
            '0 - Normal',
            '1 - Lento; o puede necesitar más de un intento',
            '2 - Se levanta apoyándose en los brazos de la silla',
            '3 - Tiende a caer hacia atrás y puede tener que intentarlo más de una vez, pero puede levantarse sin ayuda',
            '4 - Incapaz de levantarse sin ayuda'
          ],
          score: 0
        },
        {
          id: 'posture',
          label: '30. Postura',
          options: [
            '0 - Normal erecto',
            '1 - No muy erecto, ligeramente encorvado; podría ser normal para persona mayor',
            '2 - Moderadamente encorvado, definitivamente anormal; puede inclinarse ligeramente a un lado',
            '3 - Severamente encorvado con cifosis; puede inclinarse moderadamente a un lado',
            '4 - Flexión marcada con extrema anormalidad postural'
          ],
          score: 0
        },
        {
          id: 'gait',
          label: '31. Marcha',
          options: [
            '0 - Normal',
            '1 - Camina lentamente, puede arrastrar pies con poco o ningún balanceo de brazos',
            '2 - Camina con dificultad, pero requiere poca o ninguna ayuda; puede tener algo de festinación, pasos cortos o propulsión',
            '3 - Trastorno severo de la marcha, requiere asistencia',
            '4 - No puede caminar en absoluto, aún con asistencia'
          ],
          score: 0
        },
        {
          id: 'postural_stability',
          label: '32. Estabilidad postural',
          options: [
            '0 - Normal',
            '1 - Retropulsión, pero se recupera sin ayuda',
            '2 - Ausencia de respuesta postural; se caería si no lo agarrara el examinador',
            '3 - Muy inestable, tiende a perder el equilibrio espontáneamente',
            '4 - Incapaz de mantenerse en pie sin ayuda'
          ],
          score: 0
        },
        {
          id: 'bradykinesia',
          label: '33. Bradiquinesia y hipoquinesia global',
          options: [
            '0 - Ninguna',
            '1 - Lentitud mínima, dando al movimiento un carácter deliberado; podría ser normal para algunas personas',
            '2 - Lentitud leve de movimiento y bradiquinesia que es definitivamente anormal',
            '3 - Lentitud moderada de movimiento y bradiquinesia',
            '4 - Lentitud marcada de movimiento y bradiquinesia'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'updrs4',
      name: 'UPDRS IV - Complicaciones del Tratamiento',
      category: 'Parkinson',
      description: 'Evaluación de complicaciones motoras del tratamiento',
      items: [
        {
          id: 'dyskinesia_duration',
          label: '34. Duración de discinesias',
          options: [
            '0 - Ninguna',
            '1 - 1-25% del día despierte',
            '2 - 26-50% del día despierte',
            '3 - 51-75% del día despierte',
            '4 - 76-100% del día despierte'
          ],
          score: 0
        },
        {
          id: 'dyskinesia_disability',
          label: '35. Incapacidad por discinesias',
          options: [
            '0 - No incapacitantes',
            '1 - Ligeramente incapacitantes',
            '2 - Moderadamente incapacitantes',
            '3 - Severamente incapacitantes',
            '4 - Completamente incapacitantes'
          ],
          score: 0
        },
        {
          id: 'painful_dyskinesia',
          label: '36. Discinesias dolorosas',
          options: [
            '0 - No dolorosas',
            '1 - Ligeramente dolorosas',
            '2 - Moderadamente dolorosas',
            '3 - Severamente dolorosas',
            '4 - Extremadamente dolorosas'
          ],
          score: 0
        },
        {
          id: 'early_morning_dystonia',
          label: '37. Presencia de distonía matutina temprana',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'predictable_off',
          label: '38. ¿Hay períodos OFF predecibles en relación al tiempo de las dosis?',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'unpredictable_off',
          label: '39. ¿Hay períodos OFF impredecibles en relación al tiempo de las dosis?',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'sudden_off',
          label: '40. ¿Los períodos OFF aparecen súbitamente, ej., en pocos segundos?',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'off_proportion',
          label: '41. ¿Qué proporción del día despierte está el paciente OFF en promedio?',
          options: [
            '0 - Ninguna',
            '1 - 1-25% del día',
            '2 - 26-50% del día',
            '3 - 51-75% del día',
            '4 - 76-100% del día'
          ],
          score: 0
        },
        {
          id: 'anorexia_nausea',
          label: '42. ¿Experimenta el paciente anorexia, náuseas o vómitos?',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'sleep_disturbances',
          label: '43. ¿Tiene el paciente trastornos del sueño, como insomnio o hipersomnolencia?',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'symptomatic_orthostasis',
          label: '44. ¿Tiene el paciente ortostatismo sintomático?',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'ashworth',
      name: 'Escala de Ashworth Modificada',
      category: 'Evaluación Neurológica',
      description: 'Evaluación del tono muscular y espasticidad en miembros superiores e inferiores',
      items: [
        {
          id: 'flexores_codo',
          label: 'Flexores de codo',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        },
        {
          id: 'extensores_codo',
          label: 'Extensores de codo',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        },
        {
          id: 'pronadores',
          label: 'Pronadores de antebrazo',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        },
        {
          id: 'flexores_muneca',
          label: 'Flexores de muñeca',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        },
        {
          id: 'flexores_cadera',
          label: 'Flexores de cadera',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        },
        {
          id: 'aductores_cadera',
          label: 'Aductores de cadera',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        },
        {
          id: 'extensores_rodilla',
          label: 'Extensores de rodilla',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        },
        {
          id: 'flexores_rodilla',
          label: 'Flexores de rodilla',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        },
        {
          id: 'flexores_plantares',
          label: 'Flexores plantares',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'mcdonald_2024',
      name: 'Criterios de McDonald 2024 - Esclerosis Múltiple',
      category: 'Evaluación Neurológica',
      description: 'Criterios diagnósticos actualizados para Esclerosis Múltiple según McDonald 2024',
      items: [
        {
          id: 'clinical_attacks',
          label: 'Número de ataques clínicos documentados',
          options: [
            '1 - Un ataque clínico',
            '2 - Dos ataques clínicos',
            '3 - Tres o más ataques clínicos'
          ],
          score: 1
        },
        {
          id: 'objective_lesions',
          label: 'Lesiones clínicas objetivas',
          options: [
            '1 - Una lesión clínica objetiva',
            '2 - Dos o más lesiones clínicas objetivas'
          ],
          score: 1
        },
        {
          id: 'dis_periventricular',
          label: 'DIS - Lesiones periventriculares (≥1 lesión T2)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'dis_cortical',
          label: 'DIS - Lesiones corticales/yuxtacorticales (≥1 lesión T2)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'dis_infratentorial',
          label: 'DIS - Lesiones infratentoriales (≥1 lesión T2)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'dis_spinal',
          label: 'DIS - Lesiones de médula espinal (≥1 lesión T2)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'dit_gadolinium',
          label: 'DIT - Presencia simultánea de lesiones captantes y no captantes de gadolinio',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'dit_new_lesions',
          label: 'DIT - Nuevas lesiones T2 o captantes en RMN de seguimiento',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'csf_oligoclonal',
          label: 'Bandas oligoclonales específicas en LCR',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'alternative_diagnosis',
          label: '¿Se ha descartado diagnóstico alternativo que explique mejor el cuadro?',
          options: [
            '0 - No se ha descartado completamente',
            '1 - Sí, se ha descartado diagnóstico alternativo'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'parkinson_diagnosis',
      name: 'Diagnóstico de Parkinson (MDS 2015)',
      category: 'Parkinson',
      description: 'Criterios diagnósticos para enfermedad de Parkinson según MDS 2015',
      items: [
        {
          id: 'bradykinesia',
          label: 'Bradicinesia (movimientos lentos, reducción progresiva en amplitud/velocidad)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'rest_tremor_4_6hz',
          label: 'Temblor en reposo (4-6 Hz)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'muscular_rigidity',
          label: 'Rigidez muscular',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'cerebellar_signs',
          label: 'EXCLUSIÓN: Signos cerebelosos prominentes (ataxia, dismetría)',
          options: [
            '0 - No',
            '1 - Sí (excluye diagnóstico)'
          ],
          score: 0
        },
        {
          id: 'supranuclear_palsy',
          label: 'EXCLUSIÓN: Parálisis supranuclear de la mirada vertical',
          options: [
            '0 - No',
            '1 - Sí (excluye diagnóstico)'
          ],
          score: 0
        },
        {
          id: 'legs_only_parkinsonism',
          label: 'EXCLUSIÓN: Parkinsonismo confinado a piernas >3 años',
          options: [
            '0 - No',
            '1 - Sí (excluye diagnóstico)'
          ],
          score: 0
        },
        {
          id: 'severe_dysautonomia',
          label: 'EXCLUSIÓN: Disautonomía severa en primeros 5 años',
          options: [
            '0 - No',
            '1 - Sí (excluye diagnóstico)'
          ],
          score: 0
        },
        {
          id: 'no_levodopa_response',
          label: 'EXCLUSIÓN: Ausencia de respuesta a levodopa pese a dosis altas',
          options: [
            '0 - No',
            '1 - Sí (excluye diagnóstico)'
          ],
          score: 0
        },
        {
          id: 'prominent_dystonia',
          label: 'EXCLUSIÓN: Movimientos distónicos prominentes en primeros años',
          options: [
            '0 - No',
            '1 - Sí (excluye diagnóstico)'
          ],
          score: 0
        },
        {
          id: 'normal_spect_dat',
          label: 'EXCLUSIÓN: Neuroimagen funcional normal (SPECT-DAT normal)',
          options: [
            '0 - No',
            '1 - Sí (excluye diagnóstico)'
          ],
          score: 0
        },
        {
          id: 'asymmetric_onset',
          label: 'APOYO: Inicio asimétrico de los síntomas',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'rest_tremor_present',
          label: 'APOYO: Temblor en reposo presente',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'marked_levodopa_response',
          label: 'APOYO: Respuesta marcada a levodopa (>70% mejoría)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'levodopa_dyskinesias',
          label: 'APOYO: Discinesias inducidas por levodopa',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'progressive_course',
          label: 'APOYO: Curso progresivo de la enfermedad',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'documented_hyposmia',
          label: 'APOYO: Hiposmia documentada',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'mibg_alteration',
          label: 'APOYO: Alteración en gammagrafía MIBG',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'rapid_progression',
          label: 'BANDERA ROJA: Progresión muy rápida (silla de ruedas en <5 años)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'early_severe_dysautonomia',
          label: 'BANDERA ROJA: Disautonomía severa temprana',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'recurrent_falls',
          label: 'BANDERA ROJA: Caídas recurrentes en primeros 3 años',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'prominent_axial_rigidity',
          label: 'BANDERA ROJA: Rigidez axial prominente desde el inicio',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'cerebellar_ataxia',
          label: 'BANDERA ROJA: Ataxia cerebelosa',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'lack_progression',
          label: 'BANDERA ROJA: Falta de progresión después de 5 años',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'severe_cognitive_decline',
          label: 'BANDERA ROJA: Deterioro cognitivo severo en el primer año',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'mrs',
      name: 'Escala de Rankin Modificada (mRS)',
      category: 'Stroke & Cerebrovascular',
      description: 'Escala para evaluar el grado de discapacidad después de un ACV',
      items: [
        {
          id: 'mrs_score',
          label: 'Grado de discapacidad funcional',
          options: [
            '0 - Sin síntomas',
            '1 - Sin discapacidad significativa: capaz de llevar a cabo todas las actividades y deberes habituales',
            '2 - Discapacidad leve: incapaz de llevar a cabo todas las actividades previas, pero capaz de cuidar sus propios asuntos sin asistencia',
            '3 - Discapacidad moderada: requiere algo de ayuda, pero capaz de caminar sin asistencia',
            '4 - Discapacidad moderadamente severa: incapaz de caminar sin asistencia e incapaz de atender sus necesidades corporales sin asistencia',
            '5 - Discapacidad severa: confinado a la cama, incontinente y requiere cuidado constante y atención de enfermería',
            '6 - Muerte'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'aspects',
      name: 'ASPECTS (Alberta Stroke Program Early CT Score)',
      category: 'Stroke & Cerebrovascular',
      description: 'Sistema de puntuación para evaluar cambios isquémicos tempranos en TC de cerebro',
      items: [
        {
          id: 'aspects_c',
          label: 'Región C (núcleo caudado)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_l',
          label: 'Región L (núcleo lenticular)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_ic',
          label: 'Región IC (cápsula interna)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_i',
          label: 'Región I (ínsula)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_m1',
          label: 'Región M1 (corteza ACM anterior)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_m2',
          label: 'Región M2 (corteza ACM lateral)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_m3',
          label: 'Región M3 (corteza ACM posterior)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_m4',
          label: 'Región M4 (corteza ACM anterior superior)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_m5',
          label: 'Región M5 (corteza ACM lateral superior)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_m6',
          label: 'Región M6 (corteza ACM posterior superior)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        }
      ]
    },
    {
      id: 'cha2ds2vasc',
      name: 'CHA2DS2-VASc Score',
      category: 'Stroke & Cerebrovascular',
      description: 'Escala para evaluar riesgo de ACV en fibrilación auricular',
      items: [
        {
          id: 'chf_heart_failure',
          label: 'Insuficiencia cardíaca congestiva (C)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'hypertension',
          label: 'Hipertensión arterial (H)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'age_75_or_more',
          label: 'Edad ≥75 años (A2)',
          options: [
            '0 - No',
            '2 - Sí'
          ],
          score: 0
        },
        {
          id: 'diabetes',
          label: 'Diabetes mellitus (D)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'stroke_tia_thromboembolism',
          label: 'ACV/AIT/Tromboembolismo previo (S2)',
          options: [
            '0 - No',
            '2 - Sí'
          ],
          score: 0
        },
        {
          id: 'vascular_disease',
          label: 'Enfermedad vascular (V)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'age_65_74',
          label: 'Edad 65-74 años (A)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'sex_female',
          label: 'Sexo femenino (Sc)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'hasbled',
      name: 'HAS-BLED Score',
      category: 'Stroke & Cerebrovascular',
      description: 'Escala para evaluar riesgo de sangrado en anticoagulación',
      items: [
        {
          id: 'hypertension_uncontrolled',
          label: 'Hipertensión no controlada (H)',
          options: [
            '0 - No (PAS <160 mmHg)',
            '1 - Sí (PAS ≥160 mmHg)'
          ],
          score: 0
        },
        {
          id: 'abnormal_renal_liver',
          label: 'Función renal/hepática anormal (A)',
          options: [
            '0 - Normal',
            '1 - Alterada (1 punto cada una)'
          ],
          score: 0
        },
        {
          id: 'stroke_history',
          label: 'Historia de ACV (S)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'bleeding_history',
          label: 'Historia de sangrado (B)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'labile_inr',
          label: 'INR lábil (L)',
          options: [
            '0 - Estable',
            '1 - Inestable'
          ],
          score: 0
        },
        {
          id: 'elderly_age',
          label: 'Edad >65 años (E)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'drugs_alcohol',
          label: 'Fármacos/Alcohol (D)',
          options: [
            '0 - No',
            '1 - Sí (1 punto cada uno)'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'ich_score',
      name: 'ICH Score (Hemorragia Intracerebral)',
      category: 'Stroke & Cerebrovascular',
      description: 'Escala pronóstica para hemorragia intracerebral',
      items: [
        {
          id: 'glasgow_coma_scale',
          label: 'Escala de Glasgow',
          options: [
            '0 - 13-15',
            '1 - 5-12',
            '2 - 3-4'
          ],
          score: 0
        },
        {
          id: 'ich_volume',
          label: 'Volumen de HIC (cm³)',
          options: [
            '0 - <30',
            '1 - ≥30'
          ],
          score: 0
        },
        {
          id: 'intraventricular_hemorrhage',
          label: 'Hemorragia intraventricular',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'infratentorial_origin',
          label: 'Localización infratentorial',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'age_ich',
          label: 'Edad',
          options: [
            '0 - <80 años',
            '1 - ≥80 años'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'fisher_grade',
      name: 'Escala de Fisher (Hemorragia Subaracnoidea)',
      category: 'Stroke & Cerebrovascular',
      description: 'Clasificacion tomografica de hemorragia subaracnoidea',
      items: [
        {
          id: 'fisher_grade_ct',
          label: 'Grado tomografico',
          options: [
            '1 - Sin sangre subaracnoidea visible o traza minima',
            '2 - Capa fina de sangre difusa <1 mm',
            '3 - Coagulo localizado o capa gruesa >=1 mm',
            '4 - Hemorragia intracerebral o intraventricular con sangre difusa'
          ],
          score: 1
        }
      ]
    },
    {
      id: 'wfns',
      name: 'WFNS (World Federation of Neurosurgical Societies)',
      category: 'Stroke & Cerebrovascular',
      description: 'Grado clinico de hemorragia subaracnoidea basado en GCS',
      items: [
        {
          id: 'wfns_grade',
          label: 'Grado WFNS',
          options: [
            '1 - GCS 15 y sin deficit motor',
            '2 - GCS 13-14 y sin deficit motor',
            '3 - GCS 13-14 con deficit motor',
            '4 - GCS 7-12 con o sin deficit motor',
            '5 - GCS 3-6'
          ],
          score: 1
        }
      ]
    },
    {
      id: 'hunt_hess',
      name: 'Escala de Hunt y Hess',
      category: 'Stroke & Cerebrovascular',
      description: 'Clasificación clínica de hemorragia subaracnoidea',
      items: [
        {
          id: 'clinical_grade',
          label: 'Grado clínico',
          options: [
            '1 - Asintomático o cefalea leve y rigidez nucal leve',
            '2 - Cefalea moderada a severa, rigidez nucal, sin déficit neurológico excepto parálisis de nervios craneales',
            '3 - Somnolencia, confusión o déficit neurológico focal leve',
            '4 - Estupor, hemiparesia moderada a severa, posible rigidez de descerebración temprana y alteraciones vegetativas',
            '5 - Coma profundo, rigidez de descerebración, aspecto moribundo'
          ],
          score: 1
        }
      ]
    },
    {
      id: 'cdr',
      name: 'CDR (Clinical Dementia Rating)',
      category: 'Cognitive & Dementia',
      description: 'Escala para estadificar la severidad de la demencia',
      items: [
        {
          id: 'memory',
          label: 'Memoria',
          options: [
            '0 - Sin pérdida de memoria o pérdida inconstante y leve',
            '0.5 - Olvido leve y constante; recuerdo parcial de eventos; "olvido benigno"',
            '1 - Pérdida moderada de memoria; más marcada para eventos recientes; interfiere con actividades cotidianas',
            '2 - Pérdida severa de memoria; solo retiene material muy aprendido; material nuevo se pierde rápidamente',
            '3 - Pérdida severa de memoria; solo fragmentos permanecen'
          ],
          score: 0
        },
        {
          id: 'orientation',
          label: 'Orientación',
          options: [
            '0 - Completamente orientado',
            '0.5 - Completamente orientado excepto por leve dificultad con relaciones temporales',
            '1 - Dificultad moderada con relaciones temporales; orientado en lugar del examen; puede tener desorientación geográfica',
            '2 - Dificultad severa con relaciones temporales; usualmente desorientado en tiempo, frecuentemente en lugar',
            '3 - Orientado solo a persona'
          ],
          score: 0
        },
        {
          id: 'judgment_problem_solving',
          label: 'Juicio y Resolución de Problemas',
          options: [
            '0 - Resuelve problemas cotidianos y maneja asuntos de negocios y financieros bien; juicio bueno en relación a desempeño pasado',
            '0.5 - Leve alteración en resolución de problemas, similitudes y diferencias',
            '1 - Dificultad moderada para manejar problemas, similitudes y diferencias; juicio social usualmente mantenido',
            '2 - Severamente alterado en manejo de problemas, similitudes y diferencias; juicio social usualmente alterado',
            '3 - Incapaz de hacer juicios o resolver problemas'
          ],
          score: 0
        },
        {
          id: 'community_affairs',
          label: 'Asuntos Comunitarios',
          options: [
            '0 - Función independiente en el nivel usual en trabajo, compras, grupos voluntarios y sociales',
            '0.5 - Leve alteración en estas actividades',
            '1 - Incapaz de funcionar independientemente en estas actividades, aunque puede aún involucrarse en algunas; parece normal a la inspección casual',
            '2 - Sin pretensión de función independiente fuera del hogar; parece bien para ser llevado a funciones fuera del hogar',
            '3 - Sin pretensión de función independiente fuera del hogar; parece muy enfermo para ser llevado a funciones fuera del hogar'
          ],
          score: 0
        },
        {
          id: 'home_hobbies',
          label: 'Hogar y Pasatiempos',
          options: [
            '0 - Vida hogareña, pasatiempos e intereses intelectuales bien mantenidos',
            '0.5 - Vida hogareña, pasatiempos e intereses intelectuales levemente alterados',
            '1 - Vida hogareña, pasatiempos e intereses intelectuales moderadamente alterados; tareas más difíciles abandonadas',
            '2 - Solo tareas simples preservadas; intereses muy restringidos y pobremente sostenidos',
            '3 - Sin función significativa en el hogar'
          ],
          score: 0
        },
        {
          id: 'personal_care',
          label: 'Cuidado Personal',
          options: [
            '0 - Completamente capaz de cuidado propio',
            '1 - Necesita ocasionalmente ser alentado',
            '2 - Requiere asistencia para vestirse, higiene, cuidado de efectos personales',
            '3 - Requiere mucha ayuda para cuidado personal; incontinencia frecuente'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'midas',
      name: 'MIDAS (Migraine Disability Assessment)',
      category: 'Cefalea',
      description: 'Evaluación de discapacidad por migraña en los últimos 3 meses',
      items: [
        {
          id: 'work_missed',
          label: '1. ¿Cuántos días NO pudo trabajar o estudiar debido a sus dolores de cabeza?',
          options: [
            'Número de días: ___'
          ],
          score: 0
        },
        {
          id: 'work_half_productivity',
          label: '2. ¿Cuántos días su productividad en el trabajo o estudios se redujo a la mitad o más debido a sus dolores de cabeza?',
          options: [
            'Número de días: ___'
          ],
          score: 0
        },
        {
          id: 'household_missed',
          label: '3. ¿Cuántos días NO pudo hacer las tareas del hogar debido a sus dolores de cabeza?',
          options: [
            'Número de días: ___'
          ],
          score: 0
        },
        {
          id: 'household_half_productivity',
          label: '4. ¿Cuántos días su productividad en las tareas del hogar se redujo a la mitad o más debido a sus dolores de cabeza?',
          options: [
            'Número de días: ___'
          ],
          score: 0
        },
        {
          id: 'family_social_missed',
          label: '5. ¿Cuántos días perdió actividades familiares, sociales o de ocio debido a sus dolores de cabeza?',
          options: [
            'Número de días: ___'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'mmse',
      name: 'MMSE (Mini-Mental State Examination)',
      category: 'Evaluación Cognitiva',
      description: 'Evaluación cognitiva global para detección de deterioro',
      items: [
        {
          id: 'orientation_time',
          label: 'Orientación Temporal (5 puntos)',
          options: [
            '5 - Todas correctas (año, estación, mes, fecha, día)',
            '4 - 4 correctas',
            '3 - 3 correctas',
            '2 - 2 correctas',
            '1 - 1 correcta',
            '0 - Ninguna correcta'
          ],
          score: 0
        },
        {
          id: 'orientation_place',
          label: 'Orientación Espacial (5 puntos)',
          options: [
            '5 - Todas correctas (país, provincia, ciudad, hospital, piso)',
            '4 - 4 correctas',
            '3 - 3 correctas',
            '2 - 2 correctas',
            '1 - 1 correcta',
            '0 - Ninguna correcta'
          ],
          score: 0
        },
        {
          id: 'registration',
          label: 'Registro de 3 palabras (3 puntos)',
          options: [
            '3 - Las 3 palabras repetidas correctamente',
            '2 - 2 palabras correctas',
            '1 - 1 palabra correcta',
            '0 - Ninguna palabra correcta'
          ],
          score: 0
        },
        {
          id: 'attention_calculation',
          label: 'Atención y Cálculo (5 puntos)',
          options: [
            '5 - Todas las restas correctas (100-7, 93-7, 86-7, 79-7, 72-7)',
            '4 - 4 restas correctas',
            '3 - 3 restas correctas', 
            '2 - 2 restas correctas',
            '1 - 1 resta correcta',
            '0 - Ninguna resta correcta'
          ],
          score: 0
        },
        {
          id: 'recall',
          label: 'Recuerdo de 3 palabras (3 puntos)',
          options: [
            '3 - Las 3 palabras recordadas',
            '2 - 2 palabras recordadas',
            '1 - 1 palabra recordada',
            '0 - Ninguna palabra recordada'
          ],
          score: 0
        },
        {
          id: 'naming',
          label: 'Denominación (2 puntos)',
          options: [
            '2 - Nombra correctamente lápiz y reloj',
            '1 - Nombra 1 objeto correctamente',
            '0 - No nombra ningún objeto'
          ],
          score: 0
        },
        {
          id: 'repetition',
          label: 'Repetición (1 punto)',
          options: [
            '1 - Repite correctamente la frase',
            '0 - No repite correctamente'
          ],
          score: 0
        },
        {
          id: 'comprehension',
          label: 'Comprensión verbal (3 puntos)',
          options: [
            '3 - Ejecuta las 3 órdenes correctamente',
            '2 - Ejecuta 2 órdenes correctamente',
            '1 - Ejecuta 1 orden correctamente',
            '0 - No ejecuta ninguna orden'
          ],
          score: 0
        },
        {
          id: 'reading',
          label: 'Lectura (1 punto)',
          options: [
            '1 - Lee y ejecuta "Cierre los ojos"',
            '0 - No lee o no ejecuta correctamente'
          ],
          score: 0
        },
        {
          id: 'writing',
          label: 'Escritura (1 punto)',
          options: [
            '1 - Escribe una oración completa con sentido',
            '0 - No escribe o la oración no tiene sentido'
          ],
          score: 0
        },
        {
          id: 'copying',
          label: 'Copia de pentágonos (1 punto)',
          options: [
            '1 - Copia correctamente los pentágonos entrelazados',
            '0 - No copia correctamente'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'hoehn_yahr',
      name: 'Escala de Hoehn y Yahr',
      category: 'Parkinson',
      description: 'Estadificación de la progresión de la enfermedad de Parkinson',
      items: [
        {
          id: 'stage',
          label: 'Estadio de Hoehn y Yahr',
          options: [
            '0 - Sin signos de enfermedad',
            '1 - Enfermedad unilateral únicamente',
            '1.5 - Compromiso unilateral y axial',
            '2 - Enfermedad bilateral sin alteración del equilibrio',
            '2.5 - Enfermedad bilateral leve con recuperación en la prueba de retropulsión',
            '3 - Enfermedad bilateral leve a moderada; cierta inestabilidad postural; físicamente independiente',
            '4 - Incapacidad grave; aún capaz de caminar o mantenerse en pie sin ayuda',
            '5 - Confinado a silla de ruedas o cama a menos que reciba ayuda'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'edss',
      name: 'EDSS (Expanded Disability Status Scale)',
      category: 'Esclerosis Múltiple',
      description: 'Evaluación de discapacidad en esclerosis múltiple',
      items: [
        {
          id: 'pyramidal_functions',
          label: 'Funciones Piramidales',
          options: [
            '0 - Normal',
            '1 - Signos anormales sin discapacidad',
            '2 - Discapacidad mínima',
            '3 - Paraparesia o hemiparesia leve a moderada; monoparesia severa',
            '4 - Paraparesia o hemiparesia marcada; cuadriparesia moderada',
            '5 - Paraplejía, hemiplejía o cuadriparesia marcada',
            '6 - Cuadriplejía'
          ],
          score: 0
        },
        {
          id: 'cerebellar_functions',
          label: 'Funciones Cerebelares',
          options: [
            '0 - Normal',
            '1 - Signos anormales sin discapacidad',
            '2 - Ataxia leve en cualquier miembro',
            '3 - Ataxia moderada del tronco o extremidades',
            '4 - Ataxia severa en todos los miembros',
            '5 - Incapaz de realizar movimientos coordinados'
          ],
          score: 0
        },
        {
          id: 'brainstem_functions',
          label: 'Funciones del Tronco Encefálico',
          options: [
            '0 - Normal',
            '1 - Solo signos',
            '2 - Nistagmo moderado u otra discapacidad leve',
            '3 - Nistagmo severo, debilidad extraocular marcada o discapacidad moderada',
            '4 - Disartria severa u otra discapacidad marcada',
            '5 - Incapacidad para tragar o hablar'
          ],
          score: 0
        },
        {
          id: 'sensory_functions',
          label: 'Funciones Sensoriales',
          options: [
            '0 - Normal',
            '1 - Disminución de vibración o grafestesia en 1-2 extremidades',
            '2 - Disminución táctil leve o de dolor o posicional y/o disminución moderada de vibración en 1-2 extremidades',
            '3 - Disminución táctil moderada o de dolor, disminución posicional y/o pérdida de vibración en 1-2 extremidades',
            '4 - Disminución táctil marcada o pérdida de dolor o pérdida posicional y/o pérdida de vibración en 1-2 extremidades',
            '5 - Pérdida sensorial esencialmente en 1-2 extremidades',
            '6 - Pérdida sensorial esencialmente por debajo de la cabeza'
          ],
          score: 0
        },
        {
          id: 'bowel_bladder',
          label: 'Función Vesical e Intestinal',
          options: [
            '0 - Normal',
            '1 - Síntomas urinarios leves sin incontinencia',
            '2 - Urgencia urinaria moderada o incontinencia intestinal rara',
            '3 - Urgencia urinaria frecuente o incontinencia urinaria ocasional',
            '4 - Casi diaria incontinencia urinaria y/o uso regular de catéter',
            '5 - Pérdida de función vesical',
            '6 - Pérdida de función vesical e intestinal'
          ],
          score: 0
        },
        {
          id: 'visual_functions',
          label: 'Funciones Visuales',
          options: [
            '0 - Normal',
            '1 - Escotoma con agudeza visual (AV) mejor que 20/30',
            '2 - Peor ojo con escotoma con AV de 20/30 a 20/59',
            '3 - Peor ojo con escotoma grande o reducción moderada de campos, pero con AV de 20/60 a 20/99',
            '4 - Peor ojo con reducción marcada de campos y AV de 20/100 a 20/200',
            '5 - Peor ojo con AV menor que 20/200',
            '6 - Grado 5 más mejor ojo con AV menor que 20/60'
          ],
          score: 0
        },
        {
          id: 'cerebral_functions',
          label: 'Funciones Cerebrales (Mentales)',
          options: [
            '0 - Normal',
            '1 - Solo cambios del humor (no afecta puntaje de discapacidad)',
            '2 - Disminución leve de la mentalidad',
            '3 - Disminución moderada de la mentalidad',
            '4 - Disminución marcada de la mentalidad',
            '5 - Demencia o síndrome cerebral crónico'
          ],
          score: 0
        },
        {
          id: 'ambulation',
          label: 'Capacidad de Deambulación',
          options: [
            '0 - Camina normalmente, sin limitaciones (EDSS 0-3.5)',
            '1 - Camina sin ayuda 500+ metros (EDSS 4.0)',
            '2 - Camina sin ayuda 300-499 metros (EDSS 4.5)',
            '3 - Camina sin ayuda 200-299 metros (EDSS 5.0)',
            '4 - Camina sin ayuda 100-199 metros (EDSS 5.5)',
            '5 - Camina sin ayuda hasta 100 metros (EDSS 6.0)',
            '6 - Requiere ayuda unilateral constante para caminar 100 metros (EDSS 6.5)',
            '7 - Requiere ayuda bilateral constante para caminar 20 metros (EDSS 7.0)',
            '8 - No puede caminar más de 5 metros aún con ayuda (EDSS 7.5)',
            '9 - Esencialmente restringido a silla de ruedas (EDSS 8.0)',
            '10 - Confinado a cama (EDSS 8.5-9.5)'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'engel',
      name: 'Escala de Engel (Epilepsia)',
      category: 'Epilepsia',
      description: 'Evaluación de resultados post-quirúrgicos en epilepsia',
      items: [
        {
          id: 'seizure_outcome',
          label: 'Resultado post-quirúrgico',
          options: [
            'Clase I - Libre de crisis incapacitantes',
            'Clase II - Crisis incapacitantes raras',
            'Clase III - Mejoría significativa',
            'Clase IV - Sin mejoría significativa'
          ],
          score: 0
        },
        {
          id: 'subclass',
          label: 'Subclasificación (si aplica)',
          options: [
            'A - Completamente libre de crisis',
            'B - Solo auras no incapacitantes',
            'C - Crisis generalizadas solo con suspensión de medicación',
            'D - Crisis generalizadas con enfermedad febril'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'moca',
      name: 'MoCA (Montreal Cognitive Assessment)',
      category: 'Evaluación Cognitiva',
      description: 'Evaluación cognitiva breve para detección de deterioro cognitivo leve',
      items: [
        {
          id: 'visuospatial',
          label: 'Habilidades visuoespaciales/ejecutivas (5 puntos)',
          options: [
            '5 - Todas las tareas correctas (sendero, cubo, reloj)',
            '4 - 4 tareas correctas',
            '3 - 3 tareas correctas',
            '2 - 2 tareas correctas',
            '1 - 1 tarea correcta',
            '0 - Ninguna tarea correcta'
          ],
          score: 0
        },
        {
          id: 'naming',
          label: 'Denominación (3 puntos)',
          options: [
            '3 - León, rinoceronte, camello correctos',
            '2 - 2 animales correctos',
            '1 - 1 animal correcto',
            '0 - Ningún animal correcto'
          ],
          score: 0
        },
        {
          id: 'attention',
          label: 'Atención (6 puntos)',
          options: [
            '6 - Todas las tareas correctas (dígitos, vigilancia, resta)',
            '5 - 5 elementos correctos',
            '4 - 4 elementos correctos',
            '3 - 3 elementos correctos',
            '2 - 2 elementos correctos',
            '1 - 1 elemento correcto',
            '0 - Ningún elemento correcto'
          ],
          score: 0
        },
        {
          id: 'language',
          label: 'Lenguaje (3 puntos)',
          options: [
            '3 - Repetición y fluidez correctas',
            '2 - Una tarea correcta completamente',
            '1 - Parcialmente correcto',
            '0 - Ambas tareas incorrectas'
          ],
          score: 0
        },
        {
          id: 'abstraction',
          label: 'Abstracción (2 puntos)',
          options: [
            '2 - Ambas analogías correctas',
            '1 - Una analogía correcta',
            '0 - Ninguna analogía correcta'
          ],
          score: 0
        },
        {
          id: 'memory',
          label: 'Memoria diferida (5 puntos)',
          options: [
            '5 - Las 5 palabras recordadas',
            '4 - 4 palabras recordadas',
            '3 - 3 palabras recordadas',
            '2 - 2 palabras recordadas',
            '1 - 1 palabra recordada',
            '0 - Ninguna palabra recordada'
          ],
          score: 0
        },
        {
          id: 'orientation',
          label: 'Orientación (6 puntos)',
          options: [
            '6 - Todas correctas (fecha, mes, año, día, lugar, ciudad)',
            '5 - 5 correctas',
            '4 - 4 correctas',
            '3 - 3 correctas',
            '2 - 2 correctas',
            '1 - 1 correcta',
            '0 - Ninguna correcta'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'case_scale',
      name: 'CASE (Comprehensive Aphasia Test - Screening)',
      category: 'Evaluación Neurológica',
      description: 'Test de screening para evaluación comprensiva de afasia',
      items: [
        {
          id: 'auditory_comprehension',
          label: 'Comprensión auditiva de palabras',
          options: [
            '4 - 4/4 correctas',
            '3 - 3/4 correctas',
            '2 - 2/4 correctas',
            '1 - 1/4 correcta',
            '0 - 0/4 correctas'
          ],
          score: 0
        },
        {
          id: 'auditory_sentence_comprehension',
          label: 'Comprensión auditiva de oraciones',
          options: [
            '4 - 4/4 correctas',
            '3 - 3/4 correctas',
            '2 - 2/4 correctas',
            '1 - 1/4 correcta',
            '0 - 0/4 correctas'
          ],
          score: 0
        },
        {
          id: 'repetition_words',
          label: 'Repetición de palabras',
          options: [
            '4 - 4/4 correctas',
            '3 - 3/4 correctas',
            '2 - 2/4 correctas',
            '1 - 1/4 correcta',
            '0 - 0/4 correctas'
          ],
          score: 0
        },
        {
          id: 'repetition_complex_words',
          label: 'Repetición de palabras complejas',
          options: [
            '2 - 2/2 correctas',
            '1 - 1/2 correcta',
            '0 - 0/2 correctas'
          ],
          score: 0
        },
        {
          id: 'repetition_nonwords',
          label: 'Repetición de no-palabras',
          options: [
            '2 - 2/2 correctas',
            '1 - 1/2 correcta',
            '0 - 0/2 correctas'
          ],
          score: 0
        },
        {
          id: 'object_naming',
          label: 'Denominación de objetos',
          options: [
            '4 - 4/4 correctas',
            '3 - 3/4 correctas',
            '2 - 2/4 correctas',
            '1 - 1/4 correcta',
            '0 - 0/4 correctas'
          ],
          score: 0
        },
        {
          id: 'reading_words',
          label: 'Lectura de palabras',
          options: [
            '4 - 4/4 correctas',
            '3 - 3/4 correctas',
            '2 - 2/4 correctas',
            '1 - 1/4 correcta',
            '0 - 0/4 correctas'
          ],
          score: 0
        },
        {
          id: 'writing_words',
          label: 'Escritura de palabras',
          options: [
            '4 - 4/4 correctas',
            '3 - 3/4 correctas',
            '2 - 2/4 correctas',
            '1 - 1/4 correcta',
            '0 - 0/4 correctas'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'neos_score',
      name: 'NEOS Score (NEurological Outcome Scale)',
      category: 'Neurocríticos',
      description: 'Escala de pronóstico neurológico para pacientes críticos',
      items: [
        {
          id: 'consciousness_level',
          label: 'Nivel de conciencia',
          options: [
            '0 - Alerta',
            '1 - Somnoliento pero despierta con estímulos verbales',
            '2 - Despierta solo con estímulos físicos',
            '3 - No responde a estímulos verbales ni físicos'
          ],
          score: 0
        },
        {
          id: 'brainstem_reflexes',
          label: 'Reflejos de tronco cerebral',
          options: [
            '0 - Presentes bilateralmente',
            '1 - Ausentes unilateralmente',
            '2 - Ausentes bilateralmente'
          ],
          score: 0
        },
        {
          id: 'motor_response',
          label: 'Respuesta motora',
          options: [
            '0 - Obedece órdenes',
            '1 - Localiza el dolor',
            '2 - Flexión al dolor',
            '3 - Extensión al dolor',
            '4 - No respuesta motora'
          ],
          score: 0
        },
        {
          id: 'respiratory_pattern',
          label: 'Patrón respiratorio',
          options: [
            '0 - Normal o respiración espontánea',
            '1 - Respiración irregular',
            '2 - Apnea o ventilación mecánica obligatoria'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'rass_scale',
      name: 'RASS (Richmond Agitation-Sedation Scale)',
      category: 'Neurocríticos',
      description: 'Escala de agitación y sedación de Richmond para pacientes críticos',
      items: [
        {
          id: 'sedation_agitation_level',
          label: 'Nivel de sedación/agitación',
          options: [
            '+4 - Combativo: Violento, peligro inmediato para el personal',
            '+3 - Muy agitado: Agresivo, se quita tubos o catéteres',
            '+2 - Agitado: Movimientos frecuentes sin propósito, lucha con el ventilador',
            '+1 - Inquieto: Ansioso, aprehensivo, movimientos no agresivos',
            '0 - Alerta y tranquilo: Espontáneamente alerta y obedece órdenes',
            '-1 - Somnoliento: No completamente alerta, pero mantiene los ojos abiertos al llamado verbal (>10 seg)',
            '-2 - Sedación ligera: Se despierta brevemente al llamado verbal (<10 seg)',
            '-3 - Sedación moderada: Movimiento o apertura ocular al llamado verbal (sin contacto visual)',
            '-4 - Sedación profunda: Sin respuesta al llamado verbal, pero movimiento o apertura ocular al estímulo físico',
            '-5 - Sin respuesta: Sin respuesta al llamado verbal o estímulo físico'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'abcd2_score',
      name: 'ABCD2 Score (AIT - Ataque Isquémico Transitorio)',
      category: 'Stroke & Cerebrovascular',
      description: 'Escala de riesgo de ACV después de un AIT en las próximas 48 horas',
      items: [
        {
          id: 'age',
          label: 'A - Edad (Age)',
          options: [
            '0 - < 60 años',
            '1 - ≥ 60 años'
          ],
          score: 0
        },
        {
          id: 'blood_pressure',
          label: 'B - Presión Arterial (Blood Pressure)',
          options: [
            '0 - < 140/90 mmHg',
            '1 - ≥ 140/90 mmHg'
          ],
          score: 0
        },
        {
          id: 'clinical_features',
          label: 'C - Características Clínicas (Clinical Features)',
          options: [
            '0 - Otros síntomas',
            '1 - Alteración del habla sin debilidad',
            '2 - Debilidad unilateral'
          ],
          score: 0
        },
        {
          id: 'duration',
          label: 'D - Duración de síntomas (Duration)',
          options: [
            '0 - < 10 minutos',
            '1 - 10-59 minutos',
            '2 - ≥ 60 minutos'
          ],
          score: 0
        },
        {
          id: 'diabetes',
          label: 'D - Diabetes',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'fazekas_scale',
      name: 'Escala de Fazekas',
      category: 'Neuroimagen',
      description: 'Evaluación de lesiones de sustancia blanca periventricular y profunda en RM',
      items: [
        {
          id: 'periventricular_hyperintensities',
          label: 'Hiperintensidades Periventriculares',
          options: [
            '0 - Ausentes',
            '1 - Caps o líneas pencil-thin',
            '2 - Halos lisos',
            '3 - Hiperintensidades periventriculares irregulares que se extienden a la sustancia blanca profunda'
          ],
          score: 0
        },
        {
          id: 'deep_white_matter_hyperintensities',
          label: 'Hiperintensidades de Sustancia Blanca Profunda',
          options: [
            '0 - Ausentes',
            '1 - Focos puntiformes',
            '2 - Focos múltiples en "comienzo de confluencia"',
            '3 - Focos grandes confluentes'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'mich',
      name: 'Escala MICH (Modified ICH Score)',
      category: 'Evaluación Neurológica',
      description: 'Escala de pronóstico modificada para hemorragia intracerebral',
      items: [
        {
          id: 'ct_characteristics',
          label: 'Características de la TCSC',
          options: [
            '2 - Características de alto riesgo',
            '1 - ≤ 3 mm de las cisternas',
            '0 - Ninguna'
          ],
          score: 0
        },
        {
          id: 'age_group',
          label: 'Grupo etario',
          options: [
            '2 - 18-45 años',
            '1 - 46-70 años',
            '0 - ≥ 71 años'
          ],
          score: 0
        },
        {
          id: 'sex',
          label: 'Sexo',
          options: [
            '1 - Femenino',
            '0 - Masculino'
          ],
          score: 0
        },
        {
          id: 'systolic_pressure',
          label: 'Presión sistólica < 160 mmHg',
          options: [
            '1 - Sí',
            '0 - No'
          ],
          score: 0
        },
        {
          id: 'low_risk_location',
          label: 'Localización de bajo riesgo',
          options: [
            '0 - Sí',
            '1 - No'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'flep',
      name: 'Escala FLEP (Frontal Lobe Epilepsy and Parasomnias)',
      category: 'Epilepsia',
      description: 'Diferenciación entre epilepsia del lóbulo frontal nocturna y parasomnias',
      items: [
        {
          id: 'age_onset',
          label: '1. Edad de inicio de los episodios',
          options: [
            '1 - Infancia/adolescencia (<20 años)',
            '0 - Adultez (≥20 años)'
          ],
          score: 0
        },
        {
          id: 'episode_duration',
          label: '2. Duración del episodio',
          options: [
            '1 - Breve (<1 minuto)',
            '0 - Prolongado (≥1 minuto)'
          ],
          score: 0
        },
        {
          id: 'episode_frequency',
          label: '3. Frecuencia de episodios',
          options: [
            '1 - Múltiples por noche',
            '0 - Uno por noche o menos'
          ],
          score: 0
        },
        {
          id: 'timing_within_sleep',
          label: '4. Momento del episodio durante el sueño',
          options: [
            '1 - Cualquier momento (N1, N2, REM)',
            '0 - Principalmente sueño profundo (N3)'
          ],
          score: 0
        },
        {
          id: 'stereotypy',
          label: '5. Estereotipia de movimientos',
          options: [
            '1 - Movimientos estereotipados, repetitivos',
            '0 - Movimientos variables, complejos'
          ],
          score: 0
        },
        {
          id: 'dystonic_posturing',
          label: '6. Posturas distónicas',
          options: [
            '1 - Presentes',
            '0 - Ausentes'
          ],
          score: 0
        },
        {
          id: 'vocalization',
          label: '7. Vocalización',
          options: [
            '1 - Gritos, gemidos',
            '0 - Murmullo o sin vocalización'
          ],
          score: 0
        },
        {
          id: 'recall_episode',
          label: '8. Recuerdo del episodio',
          options: [
            '1 - Recuerda parcial o totalmente',
            '0 - No recuerda'
          ],
          score: 0
        },
        {
          id: 'awakening_pattern',
          label: '9. Patrón de despertar',
          options: [
            '1 - Despierta completamente, alerta',
            '0 - Confusión post-episodio'
          ],
          score: 0
        },
        {
          id: 'clustering',
          label: '10. Agrupación de episodios',
          options: [
            '1 - Episodios agrupados en la misma noche',
            '0 - Episodio único por noche'
          ],
          score: 0
        },
        {
          id: 'response_to_intervention',
          label: '11. Respuesta a intervención externa',
          options: [
            '1 - Continúa el episodio a pesar de estímulos',
            '0 - Se detiene con estímulos externos'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'epworth',
      name: 'Escala de Somnolencia de Epworth',
      category: 'Trastornos del Sueno',
      description: 'Cuantifica somnolencia diurna en actividades cotidianas',
      items: [
        {
          id: 'sitting_reading',
          label: '1. Sentado leyendo',
          options: [
            '0 - Nunca me dormiria',
            '1 - Baja probabilidad',
            '2 - Moderada probabilidad',
            '3 - Alta probabilidad'
          ],
          score: 0
        },
        {
          id: 'watching_tv',
          label: '2. Mirando television',
          options: [
            '0 - Nunca me dormiria',
            '1 - Baja probabilidad',
            '2 - Moderada probabilidad',
            '3 - Alta probabilidad'
          ],
          score: 0
        },
        {
          id: 'sitting_public',
          label: '3. Sentado inactivo en un lugar publico (cine, reunion)',
          options: [
            '0 - Nunca me dormiria',
            '1 - Baja probabilidad',
            '2 - Moderada probabilidad',
            '3 - Alta probabilidad'
          ],
          score: 0
        },
        {
          id: 'passenger_car',
          label: '4. Como pasajero en un auto durante una hora sin pausa',
          options: [
            '0 - Nunca me dormiria',
            '1 - Baja probabilidad',
            '2 - Moderada probabilidad',
            '3 - Alta probabilidad'
          ],
          score: 0
        },
        {
          id: 'lying_rest',
          label: '5. Descansando acostado por la tarde cuando las circunstancias lo permiten',
          options: [
            '0 - Nunca me dormiria',
            '1 - Baja probabilidad',
            '2 - Moderada probabilidad',
            '3 - Alta probabilidad'
          ],
          score: 0
        },
        {
          id: 'talking_to_someone',
          label: '6. Sentado conversando con alguien',
          options: [
            '0 - Nunca me dormiria',
            '1 - Baja probabilidad',
            '2 - Moderada probabilidad',
            '3 - Alta probabilidad'
          ],
          score: 0
        },
        {
          id: 'after_lunch',
          label: '7. Sentado calmado despues de almorzar (sin alcohol)',
          options: [
            '0 - Nunca me dormiria',
            '1 - Baja probabilidad',
            '2 - Moderada probabilidad',
            '3 - Alta probabilidad'
          ],
          score: 0
        },
        {
          id: 'driving_traffic',
          label: '8. En un auto detenido en el trafico por unos minutos',
          options: [
            '0 - Nunca me dormiria',
            '1 - Baja probabilidad',
            '2 - Moderada probabilidad',
            '3 - Alta probabilidad'
          ],
          score: 0
        }
      ]
    }
  ];

  // Biblioteca digital de recursos organizados por especialidades neurológicas (unused - will be removed)
  /* const neurologyResources = [
    // Accidente Cerebrovascular
    {
      id: 1,
      title: 'Guías AHA/ASA para ACV Isquémico Agudo 2023',
      specialty: 'Accidente Cerebrovascular',
      type: 'Guía Clínica',
      description: 'Guías actualizadas de la American Heart Association para el manejo del accidente cerebrovascular isquémico agudo.',
      url: '#',
      year: 2023,
      language: 'Inglés',
      keywords: ['ACV', 'isquemia', 'trombolisis', 'trombectomía']
    },
    {
      id: 2,
      title: 'Protocolo NIHSS - Evaluación Neurológica',
      specialty: 'Accidente Cerebrovascular',
      type: 'Protocolo',
      description: 'Protocolo completo para la aplicación de la escala NIHSS en la evaluación de pacientes con ACV.',
      url: '#',
      year: 2023,
      language: 'Español',
      keywords: ['NIHSS', 'evaluación', 'escala', 'neurológica']
    },
    {
      id: 3,
      title: 'Caso Clínico: Trombectomía Exitosa en Ventana Extendida',
      specialty: 'Accidente Cerebrovascular',
      type: 'Caso Clínico',
      description: 'Presentación de caso clínico de trombectomía mecánica exitosa realizada más allá de las 6 horas.',
      url: '#',
      year: 2024,
      language: 'Español',
      keywords: ['trombectomía', 'ventana extendida', 'caso clínico']
    },
    
    // Epilepsia
    {
      id: 4,
      title: 'Clasificación ILAE 2017 - Crisis y Epilepsias',
      specialty: 'Epilepsia',
      type: 'Guía Clínica',
      description: 'Nueva clasificación operacional de tipos de crisis y epilepsias de la Liga Internacional contra la Epilepsia.',
      url: '#',
      year: 2017,
      language: 'Español',
      keywords: ['ILAE', 'clasificación', 'crisis', 'epilepsia']
    },
    {
      id: 5,
      title: 'Manejo de Status Epilepticus Refractario',
      specialty: 'Epilepsia',
      type: 'Protocolo',
      description: 'Protocolo para el manejo del status epilepticus refractario y super-refractario en UCI.',
      url: '#',
      year: 2023,
      language: 'Español',
      keywords: ['status epilepticus', 'refractario', 'UCI', 'protocolo']
    },
    {
      id: 6,
      title: 'Paper: Cannabidiol en Epilepsia Refractaria Pediátrica',
      specialty: 'Epilepsia',
      type: 'Artículo Científico',
      description: 'Estudio sobre el uso de cannabidiol en el tratamiento de epilepsia refractaria en población pediátrica.',
      url: '#',
      year: 2024,
      language: 'Inglés',
      keywords: ['cannabidiol', 'epilepsia refractaria', 'pediátrica']
    },

    // Esclerosis Múltiple
    {
      id: 7,
      title: 'Criterios de McDonald 2017 para Diagnóstico de EM',
      specialty: 'Esclerosis Múltiple',
      type: 'Guía Clínica',
      description: 'Criterios actualizados de McDonald para el diagnóstico de esclerosis múltiple.',
      url: '#',
      year: 2017,
      language: 'Español',
      keywords: ['McDonald', 'criterios', 'diagnóstico', 'esclerosis múltiple']
    },
    {
      id: 8,
      title: 'Tratamientos Modificadores de la Enfermedad 2024',
      specialty: 'Esclerosis Múltiple',
      type: 'Revisión',
      description: 'Revisión actualizada de los tratamientos modificadores de la enfermedad en esclerosis múltiple.',
      url: '#',
      year: 2024,
      language: 'Español',
      keywords: ['DMT', 'tratamiento', 'modificadores', 'enfermedad']
    },

    // Parkinson y Movimientos Anormales
    {
      id: 9,
      title: 'Criterios MDS para Enfermedad de Parkinson',
      specialty: 'Parkinson y Movimientos Anormales',
      type: 'Guía Clínica',
      description: 'Criterios diagnósticos de la Movement Disorder Society para enfermedad de Parkinson.',
      url: '#',
      year: 2015,
      language: 'Español',
      keywords: ['MDS', 'Parkinson', 'criterios diagnósticos']
    },
    {
      id: 10,
      title: 'Manejo de Discinesias Inducidas por Levodopa',
      specialty: 'Parkinson y Movimientos Anormales',
      type: 'Protocolo',
      description: 'Protocolo para el manejo de discinesias inducidas por levodopa en pacientes parkinsonianos.',
      url: '#',
      year: 2023,
      language: 'Español',
      keywords: ['discinesias', 'levodopa', 'Parkinson', 'manejo']
    },

    // Demencias
    {
      id: 11,
      title: 'Criterios NIA-AA para Enfermedad de Alzheimer',
      specialty: 'Demencias',
      type: 'Guía Clínica',
      description: 'Criterios del National Institute on Aging y Alzheimer Association para el diagnóstico de Alzheimer.',
      url: '#',
      year: 2018,
      language: 'Español',
      keywords: ['NIA-AA', 'Alzheimer', 'criterios', 'demencia']
    },
    {
      id: 12,
      title: 'Biomarcadores en Demencia Frontotemporal',
      specialty: 'Demencias',
      type: 'Artículo Científico',
      description: 'Revisión sobre el uso de biomarcadores en el diagnóstico de demencia frontotemporal.',
      url: '#',
      year: 2024,
      language: 'Inglés',
      keywords: ['biomarcadores', 'frontotemporal', 'demencia', 'diagnóstico']
    },

    // Cefaleas
    {
      id: 13,
      title: 'Clasificación ICHD-3 de Cefaleas',
      specialty: 'Cefaleas',
      type: 'Guía Clínica',
      description: 'Tercera edición de la Clasificación Internacional de Trastornos de Cefalea.',
      url: '#',
      year: 2018,
      language: 'Español',
      keywords: ['ICHD-3', 'clasificación', 'cefalea', 'migraña']
    },
    {
      id: 14,
      title: 'Protocolo de Cefalea en Urgencias',
      specialty: 'Cefaleas',
      type: 'Protocolo',
      description: 'Protocolo para el abordaje diagnóstico de cefalea aguda en servicios de urgencias.',
      url: '#',
      year: 2023,
      language: 'Español',
      keywords: ['cefalea', 'urgencias', 'protocolo', 'diagnóstico']
    },

    // Neurointensivismo
    {
      id: 15,
      title: 'Monitoreo de Presión Intracraneal',
      specialty: 'Neurointensivismo',
      type: 'Protocolo',
      description: 'Protocolo para el monitoreo y manejo de la presión intracraneal en pacientes neurocríticos.',
      url: '#',
      year: 2023,
      language: 'Español',
      keywords: ['PIC', 'monitoreo', 'neurocrítico', 'protocolo']
    },
    {
      id: 16,
      title: 'Sedación en el Paciente Neurocrítico',
      specialty: 'Neurointensivismo',
      type: 'Revisión',
      description: 'Revisión sobre estrategias de sedación en pacientes neurocríticos.',
      url: '#',
      year: 2024,
      language: 'Español',
      keywords: ['sedación', 'neurocrítico', 'UCI', 'protocolo']
    }
  ];

    // Accidente Cerebrovascular
    {
      id: 1,
      title: 'Guías AHA/ASA para ACV Isquémico Agudo 2023',
      specialty: 'Accidente Cerebrovascular',
      type: 'Guía Clínica',
      description: 'Guías actualizadas de la American Heart Association para el manejo del accidente cerebrovascular isquémico agudo.',
      url: '#',
      year: 2023,
      language: 'Inglés',
      keywords: ['ACV', 'isquemia', 'trombolisis', 'trombectomía']
    },
    {
      id: 2,
      title: 'Protocolo NIHSS - Evaluación Neurológica',
      specialty: 'Accidente Cerebrovascular',
      type: 'Protocolo',
      description: 'Protocolo completo para la aplicación de la escala NIHSS en la evaluación de pacientes con ACV.',
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
          ]
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
          ]
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
          ]
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
          ]
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
          ]
        },
        {
          id: 'ataxia',
          label: '9. Ataxia de miembros',
          options: [
            '0 - Ausente',
            '1 - Presente en un miembro',
            '2 - Presente en dos miembros',
            'UN - Amputación o fusión articular (explicar)'
          ]
        },
        {
          id: 'sensory',
          label: '10. Sensibilidad',
          options: [
            '0 - Normal, sin pérdida sensorial',
            '1 - Pérdida sensorial leve a moderada',
            '2 - Pérdida sensorial severa o total'
          ]
        },
        {
          id: 'language',
          label: '11. Mejor lenguaje',
          options: [
            '0 - Sin afasia, normal',
            '1 - Afasia leve a moderada',
            '2 - Afasia severa',
            '3 - Mudo, afasia global'
          ]
        },
        {
          id: 'dysarthria',
          label: '12. Disartria',
          options: [
            '0 - Normal',
            '1 - Disartria leve a moderada',
            '2 - Disartria severa, habla ininteligible',
            'UN - Intubado u otra barrera física (explicar)'
          ]
        },
        {
          id: 'neglect',
          label: '13. Extinción e inatención (negligencia)',
          options: [
            '0 - Sin anormalidad',
            '1 - Inatención o extinción visual, táctil, auditiva, espacial o personal a la estimulación bilateral simultánea en una de las modalidades sensoriales',
            '2 - Hemi-inatención severa o extinción en más de una modalidad'
          ]
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
    },
    {
      id: 'updrs1',
      name: 'UPDRS I - Estado Mental',
      category: 'Parkinson',
      description: 'Evaluación de aspectos no motores y cognitivos en Parkinson',
      items: [
        {
          id: 'intellect',
          label: '1. Alteración del Intelecto',
          options: [
            '0 - Nula',
            '1 - Leve (pérdida de complejidad del pensamiento)',
            '2 - Moderada (requiere ayuda para tareas complejas)',
            '3 - Grave (solo tareas simples, dificultad para entender)',
            '4 - Muy grave (no puede entender)'
          ],
          score: 0
        },
        {
          id: 'thought_disorder',
          label: '2. Trastornos del Pensamiento',
          options: [
            '0 - No hay',
            '1 - Ensueños vívidos',
            '2 - Alucinaciones benignas, manteniendo juicio',
            '3 - Alucinaciones frecuentes o delirios ocasionales sin juicio',
            '4 - Alucinaciones/delirios persistentes o psicosis florida'
          ],
          score: 0
        },
        {
          id: 'depression',
          label: '3. Depresión',
          options: [
            '0 - No hay',
            '1 - Períodos de tristeza o culpa mayores a lo normal',
            '2 - Depresión sostenida (semanas o más)',
            '3 - Depresión sostenida con síntomas vegetativos',
            '4 - Depresión con síntomas vegetativos o ideación suicida'
          ],
          score: 0
        },
        {
          id: 'motivation',
          label: '4. Motivación - Iniciativa',
          options: [
            '0 - Normal',
            '1 - Menos activa de lo habitual, mayor pasividad',
            '2 - Pérdida de iniciativa o desinterés en actividades opcionales',
            '3 - Pérdida de iniciativa o desinterés en actividades rutinarias',
            '4 - Aislado, pérdida completa de motivación'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'updrs2',
      name: 'UPDRS II - Actividades de la Vida Diaria',
      category: 'Parkinson',
      description: 'Evaluación de funciones de la vida diaria en Parkinson',
      items: [
        {
          id: 'speech',
          label: '5. Lenguaje',
          options: [
            '0 - Normal',
            '1 - Ligeramente alterado. No hay dificultad para entender',
            '2 - Moderadamente alterado. A veces piden que repita',
            '3 - Muy alterado. Frecuentemente piden que repita',
            '4 - Ininteligible la mayor parte del tiempo'
          ],
          score: 0
        },
        {
          id: 'salivation',
          label: '6. Salivación',
          options: [
            '0 - Normal',
            '1 - Ligero pero definitivo exceso de saliva, puede babear por la noche',
            '2 - Moderado exceso de saliva, puede babear',
            '3 - Marcado exceso de saliva con algo de babeo',
            '4 - Marcado babeo, requiere pañuelo constantemente'
          ],
          score: 0
        },
        {
          id: 'swallowing',
          label: '7. Deglución',
          options: [
            '0 - Normal',
            '1 - Rara vez se atraganta',
            '2 - Ocasionalmente se atraganta',
            '3 - Requiere comida blanda',
            '4 - Requiere sonda nasogástrica o gastrostomía'
          ],
          score: 0
        },
        {
          id: 'handwriting',
          label: '8. Escritura',
          options: [
            '0 - Normal',
            '1 - Ligeramente lenta o pequeña',
            '2 - Moderadamente lenta o pequeña; todas las palabras son legibles',
            '3 - Severamente afectada; no todas las palabras son legibles',
            '4 - La mayoría no es legible'
          ],
          score: 0
        },
        {
          id: 'cutting_food',
          label: '9. Cortar alimentos y manejar utensilios',
          options: [
            '0 - Normal',
            '1 - Algo lento y torpe, pero no necesita ayuda',
            '2 - Puede cortar la mayoría de comidas, aunque torpe y lento; algo de ayuda',
            '3 - Los alimentos deben ser cortados por otros, pero aún puede alimentarse lentamente',
            '4 - Necesita ser alimentado'
          ],
          score: 0
        },
        {
          id: 'dressing',
          label: '10. Vestido',
          options: [
            '0 - Normal',
            '1 - Algo lento, pero no necesita ayuda',
            '2 - Ayuda ocasional con botones, brazos en mangas',
            '3 - Ayuda considerable requerida, pero puede hacer algunas cosas solo',
            '4 - Incapacitado'
          ],
          score: 0
        },
        {
          id: 'hygiene',
          label: '11. Higiene',
          options: [
            '0 - Normal',
            '1 - Algo lento, pero no necesita ayuda',
            '2 - Necesita ayuda para ducharse o bañarse; o muy lento en cuidado higiénico',
            '3 - Requiere asistencia para lavarse, cepillarse dientes, peinarse, ir al baño',
            '4 - Sonda Foley u otras ayudas mecánicas'
          ],
          score: 0
        },
        {
          id: 'turning_in_bed',
          label: '12. Darse vuelta en la cama y ajustar ropa de cama',
          options: [
            '0 - Normal',
            '1 - Algo lento y torpe, pero no necesita ayuda',
            '2 - Puede voltearse solo o ajustar sábanas, pero con gran dificultad',
            '3 - Puede iniciar, pero no voltearse o ajustar sábanas solo',
            '4 - Incapacitado'
          ],
          score: 0
        },
        {
          id: 'falling',
          label: '13. Caídas (no relacionadas con freezing)',
          options: [
            '0 - Ninguna',
            '1 - Rara vez se cae',
            '2 - Ocasionalmente se cae, menos de una vez al día',
            '3 - Se cae un promedio de una vez al día',
            '4 - Se cae más de una vez al día'
          ],
          score: 0
        },
        {
          id: 'freezing',
          label: '14. Freezing al caminar',
          options: [
            '0 - No hay',
            '1 - Rara vez freeze al caminar; puede tener titubeo al inicio',
            '2 - Ocasionalmente freeze al caminar',
            '3 - Frecuentemente freeze. Ocasionalmente se cae por freezing',
            '4 - Frecuentes caídas por freezing'
          ],
          score: 0
        },
        {
          id: 'walking',
          label: '15. Caminar',
          options: [
            '0 - Normal',
            '1 - Leve dificultad. Puede no balancear brazos o tender a arrastrar pierna',
            '2 - Dificultad moderada, pero requiere poca o ninguna asistencia',
            '3 - Trastorno severo de la marcha, requiere asistencia',
            '4 - No puede caminar, aún con asistencia'
          ],
          score: 0
        },
        {
          id: 'tremor',
          label: '16. Temblor',
          options: [
            '0 - Ausente',
            '1 - Leve e infrecuentemente presente',
            '2 - Moderado; molesto para el paciente',
            '3 - Severo; muchas actividades interferidas',
            '4 - Marcado; la mayoría de actividades abandonadas'
          ],
          score: 0
        },
        {
          id: 'sensory_complaints',
          label: '17. Quejas sensoriales relacionadas con parkinsonismo',
          options: [
            '0 - Ninguna',
            '1 - Ocasionalmente tiene entumecimiento, hormigueo o dolor leve',
            '2 - Frecuentemente tiene entumecimiento, hormigueo o dolor; no es angustiante',
            '3 - Sensaciones dolorosas frecuentes',
            '4 - Dolor extremo'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'updrs3',
      name: 'UPDRS III - Examen Motor',
      category: 'Parkinson',
      description: 'Evaluación de signos motores en Parkinson',
      items: [
        {
          id: 'speech_motor',
          label: '18. Lenguaje',
          options: [
            '0 - Normal',
            '1 - Leve pérdida de expresión, dicción y/o volumen',
            '2 - Monótono, farfullado pero comprensible; moderadamente afectado',
            '3 - Marcadamente afectado, difícil de entender',
            '4 - Ininteligible'
          ],
          score: 0
        },
        {
          id: 'facial_expression',
          label: '19. Expresión facial',
          options: [
            '0 - Normal',
            '1 - Hipomimia mínima, podría ser "cara de póker" normal',
            '2 - Leve pero definitiva reducción en expresión facial',
            '3 - Hipomimia moderada; labios separados algunas veces',
            '4 - Cara de máscara o expresión fija con pérdida severa o completa de expresión facial; labios separados 6mm o más'
          ],
          score: 0
        },
        {
          id: 'rest_tremor_hands',
          label: '20. Temblor de reposo - Manos',
          options: [
            '0 - Ausente',
            '1 - Leve y infrecuentemente presente',
            '2 - Leve en amplitud y persistente. O moderado en amplitud pero presente solo intermitentemente',
            '3 - Moderado en amplitud y presente la mayor parte del tiempo',
            '4 - Marcado en amplitud y presente la mayor parte del tiempo'
          ],
          score: 0
        },
        {
          id: 'rest_tremor_feet',
          label: '21. Temblor de reposo - Pies',
          options: [
            '0 - Ausente',
            '1 - Leve y infrecuentemente presente',
            '2 - Leve en amplitud y persistente. O moderado en amplitud pero presente solo intermitentemente',
            '3 - Moderado en amplitud y presente la mayor parte del tiempo',
            '4 - Marcado en amplitud y presente la mayor parte del tiempo'
          ],
          score: 0
        },
        {
          id: 'action_tremor',
          label: '22. Temblor de acción o postural de manos',
          options: [
            '0 - Ausente',
            '1 - Leve; presente con acción',
            '2 - Moderado en amplitud, presente con acción',
            '3 - Moderado en amplitud con postura mantenida así como con acción',
            '4 - Marcado en amplitud; interfiere con alimentación'
          ],
          score: 0
        },
        {
          id: 'axial_rigidity',
          label: '23. Rigidez - Cuello',
          options: [
            '0 - Ausente',
            '1 - Leve o detectable solo cuando se activa por movimientos espejo o de otra maniobra',
            '2 - Leve a moderada',
            '3 - Marcada, pero rango completo de movimiento fácilmente alcanzado',
            '4 - Severa, rango de movimiento alcanzado con dificultad'
          ],
          score: 0
        },
        {
          id: 'limb_rigidity',
          label: '24. Rigidez - Extremidades',
          options: [
            '0 - Ausente',
            '1 - Leve o detectable solo cuando se activa por movimientos espejo o de otra maniobra',
            '2 - Leve a moderada',
            '3 - Marcada, pero rango completo de movimiento fácilmente alcanzado',
            '4 - Severa, rango de movimiento alcanzado con dificultad'
          ],
          score: 0
        },
        {
          id: 'finger_taps',
          label: '25. Golpeteo de dedos',
          options: [
            '0 - Normal',
            '1 - Leve lentitud y/o reducción en amplitud',
            '2 - Moderadamente afectado. Definitiva y temprana fatiga. Puede tener detenciones ocasionales',
            '3 - Severamente afectado. Dudas frecuentes al iniciar o detenciones durante el movimiento',
            '4 - Apenas puede realizar la tarea'
          ],
          score: 0
        },
        {
          id: 'hand_movements',
          label: '26. Movimientos de manos',
          options: [
            '0 - Normal',
            '1 - Leve lentitud y/o reducción en amplitud',
            '2 - Moderadamente afectado. Definitiva y temprana fatiga. Puede tener detenciones ocasionales',
            '3 - Severamente afectado. Dudas frecuentes al iniciar o detenciones durante el movimiento',
            '4 - Apenas puede realizar la tarea'
          ],
          score: 0
        },
        {
          id: 'rapid_alternating',
          label: '27. Movimientos alternantes rápidos de manos',
          options: [
            '0 - Normal',
            '1 - Leve lentitud y/o reducción en amplitud',
            '2 - Moderadamente afectado. Definitiva y temprana fatiga. Puede tener detenciones ocasionales',
            '3 - Severamente afectado. Dudas frecuentes al iniciar o detenciones durante el movimiento',
            '4 - Apenas puede realizar la tarea'
          ],
          score: 0
        },
        {
          id: 'leg_agility',
          label: '28. Agilidad de piernas',
          options: [
            '0 - Normal',
            '1 - Leve lentitud y/o reducción en amplitud',
            '2 - Moderadamente afectado. Definitiva y temprana fatiga. Puede tener detenciones ocasionales',
            '3 - Severamente afectado. Dudas frecuentes al iniciar o detenciones durante el movimiento',
            '4 - Apenas puede realizar la tarea'
          ],
          score: 0
        },
        {
          id: 'arising_chair',
          label: '29. Levantarse de la silla',
          options: [
            '0 - Normal',
            '1 - Lento; o puede necesitar más de un intento',
            '2 - Se levanta apoyándose en los brazos de la silla',
            '3 - Tiende a caer hacia atrás y puede tener que intentarlo más de una vez, pero puede levantarse sin ayuda',
            '4 - Incapaz de levantarse sin ayuda'
          ],
          score: 0
        },
        {
          id: 'posture',
          label: '30. Postura',
          options: [
            '0 - Normal erecto',
            '1 - No muy erecto, ligeramente encorvado; podría ser normal para persona mayor',
            '2 - Moderadamente encorvado, definitivamente anormal; puede inclinarse ligeramente a un lado',
            '3 - Severamente encorvado con cifosis; puede inclinarse moderadamente a un lado',
            '4 - Flexión marcada con extrema anormalidad postural'
          ],
          score: 0
        },
        {
          id: 'gait',
          label: '31. Marcha',
          options: [
            '0 - Normal',
            '1 - Camina lentamente, puede arrastrar pies con poco o ningún balanceo de brazos',
            '2 - Camina con dificultad, pero requiere poca o ninguna ayuda; puede tener algo de festinación, pasos cortos o propulsión',
            '3 - Trastorno severo de la marcha, requiere asistencia',
            '4 - No puede caminar en absoluto, aún con asistencia'
          ],
          score: 0
        },
        {
          id: 'postural_stability',
          label: '32. Estabilidad postural',
          options: [
            '0 - Normal',
            '1 - Retropulsión, pero se recupera sin ayuda',
            '2 - Ausencia de respuesta postural; se caería si no lo agarrara el examinador',
            '3 - Muy inestable, tiende a perder el equilibrio espontáneamente',
            '4 - Incapaz de mantenerse en pie sin ayuda'
          ],
          score: 0
        },
        {
          id: 'bradykinesia',
          label: '33. Bradiquinesia y hipoquinesia global',
          options: [
            '0 - Ninguna',
            '1 - Lentitud mínima, dando al movimiento un carácter deliberado; podría ser normal para algunas personas',
            '2 - Lentitud leve de movimiento y bradiquinesia que es definitivamente anormal',
            '3 - Lentitud moderada de movimiento y bradiquinesia',
            '4 - Lentitud marcada de movimiento y bradiquinesia'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'updrs4',
      name: 'UPDRS IV - Complicaciones del Tratamiento',
      category: 'Parkinson',
      description: 'Evaluación de complicaciones motoras del tratamiento',
      items: [
        {
          id: 'dyskinesia_duration',
          label: '34. Duración de discinesias',
          options: [
            '0 - Ninguna',
            '1 - 1-25% del día despierte',
            '2 - 26-50% del día despierte',
            '3 - 51-75% del día despierte',
            '4 - 76-100% del día despierte'
          ],
          score: 0
        },
        {
          id: 'dyskinesia_disability',
          label: '35. Incapacidad por discinesias',
          options: [
            '0 - No incapacitantes',
            '1 - Ligeramente incapacitantes',
            '2 - Moderadamente incapacitantes',
            '3 - Severamente incapacitantes',
            '4 - Completamente incapacitantes'
          ],
          score: 0
        },
        {
          id: 'painful_dyskinesia',
          label: '36. Discinesias dolorosas',
          options: [
            '0 - No dolorosas',
            '1 - Ligeramente dolorosas',
            '2 - Moderadamente dolorosas',
            '3 - Severamente dolorosas',
            '4 - Extremadamente dolorosas'
          ],
          score: 0
        },
        {
          id: 'early_morning_dystonia',
          label: '37. Presencia de distonía matutina temprana',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'predictable_off',
          label: '38. ¿Hay períodos OFF predecibles en relación al tiempo de las dosis?',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'unpredictable_off',
          label: '39. ¿Hay períodos OFF impredecibles en relación al tiempo de las dosis?',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'sudden_off',
          label: '40. ¿Los períodos OFF aparecen súbitamente, ej., en pocos segundos?',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'off_proportion',
          label: '41. ¿Qué proporción del día despierte está el paciente OFF en promedio?',
          options: [
            '0 - Ninguna',
            '1 - 1-25% del día',
            '2 - 26-50% del día',
            '3 - 51-75% del día',
            '4 - 76-100% del día'
          ],
          score: 0
        },
        {
          id: 'anorexia_nausea',
          label: '42. ¿Experimenta el paciente anorexia, náuseas o vómitos?',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'sleep_disturbances',
          label: '43. ¿Tiene el paciente trastornos del sueño, como insomnio o hipersomnolencia?',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'symptomatic_orthostasis',
          label: '44. ¿Tiene el paciente ortostatismo sintomático?',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'ashworth',
      name: 'Escala de Ashworth Modificada',
      category: 'Evaluación Neurológica',
      description: 'Evaluación del tono muscular y espasticidad en miembros superiores e inferiores',
      items: [
        {
          id: 'flexores_codo',
          label: 'Flexores de codo',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        },
        {
          id: 'extensores_codo',
          label: 'Extensores de codo',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        },
        {
          id: 'pronadores',
          label: 'Pronadores de antebrazo',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        },
        {
          id: 'flexores_muneca',
          label: 'Flexores de muñeca',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        },
        {
          id: 'flexores_cadera',
          label: 'Flexores de cadera',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        },
        {
          id: 'aductores_cadera',
          label: 'Aductores de cadera',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        },
        {
          id: 'extensores_rodilla',
          label: 'Extensores de rodilla',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        },
        {
          id: 'flexores_rodilla',
          label: 'Flexores de rodilla',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        },
        {
          id: 'flexores_plantares',
          label: 'Flexores plantares',
          options: [
            '0 - Sin aumento del tono muscular',
            '1 - Ligero aumento del tono muscular, manifestado por una detención y liberación, o por una resistencia mínima al final del arco de movimiento',
            '1+ - Ligero aumento del tono muscular, manifestado por una detención seguida de una resistencia mínima en menos de la mitad del resto del arco de movimiento',
            '2 - Aumento más pronunciado del tono muscular en la mayor parte del arco de movimiento, pero las partes afectadas se mueven fácilmente',
            '3 - Considerable aumento del tono muscular, el movimiento pasivo es difícil',
            '4 - Las partes afectadas están rígidas en flexión o extensión'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'mcdonald_2024',
      name: 'Criterios de McDonald 2024 - Esclerosis Múltiple',
      category: 'Evaluación Neurológica',
      description: 'Criterios diagnósticos actualizados para Esclerosis Múltiple según McDonald 2024',
      items: [
        {
          id: 'clinical_attacks',
          label: 'Número de ataques clínicos documentados',
          options: [
            '1 - Un ataque clínico',
            '2 - Dos ataques clínicos',
            '3 - Tres o más ataques clínicos'
          ],
          score: 1
        },
        {
          id: 'objective_lesions',
          label: 'Lesiones clínicas objetivas',
          options: [
            '1 - Una lesión clínica objetiva',
            '2 - Dos o más lesiones clínicas objetivas'
          ],
          score: 1
        },
        {
          id: 'dis_periventricular',
          label: 'DIS - Lesiones periventriculares (≥1 lesión T2)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'dis_cortical',
          label: 'DIS - Lesiones corticales/yuxtacorticales (≥1 lesión T2)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'dis_infratentorial',
          label: 'DIS - Lesiones infratentoriales (≥1 lesión T2)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'dis_spinal',
          label: 'DIS - Lesiones de médula espinal (≥1 lesión T2)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'dit_gadolinium',
          label: 'DIT - Presencia simultánea de lesiones captantes y no captantes de gadolinio',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'dit_new_lesions',
          label: 'DIT - Nuevas lesiones T2 o captantes en RMN de seguimiento',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'csf_oligoclonal',
          label: 'Bandas oligoclonales específicas en LCR',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'alternative_diagnosis',
          label: '¿Se ha descartado diagnóstico alternativo que explique mejor el cuadro?',
          options: [
            '0 - No se ha descartado completamente',
            '1 - Sí, se ha descartado diagnóstico alternativo'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'parkinson_diagnosis',
      name: 'Diagnóstico de Parkinson (MDS 2015)',
      category: 'Parkinson',
      description: 'Criterios diagnósticos para enfermedad de Parkinson según MDS 2015',
      items: [
        {
          id: 'bradykinesia',
          label: 'Bradicinesia (movimientos lentos, reducción progresiva en amplitud/velocidad)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'rest_tremor_4_6hz',
          label: 'Temblor en reposo (4-6 Hz)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'muscular_rigidity',
          label: 'Rigidez muscular',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'cerebellar_signs',
          label: 'EXCLUSIÓN: Signos cerebelosos prominentes (ataxia, dismetría)',
          options: [
            '0 - No',
            '1 - Sí (excluye diagnóstico)'
          ],
          score: 0
        },
        {
          id: 'supranuclear_palsy',
          label: 'EXCLUSIÓN: Parálisis supranuclear de la mirada vertical',
          options: [
            '0 - No',
            '1 - Sí (excluye diagnóstico)'
          ],
          score: 0
        },
        {
          id: 'legs_only_parkinsonism',
          label: 'EXCLUSIÓN: Parkinsonismo confinado a piernas >3 años',
          options: [
            '0 - No',
            '1 - Sí (excluye diagnóstico)'
          ],
          score: 0
        },
        {
          id: 'severe_dysautonomia',
          label: 'EXCLUSIÓN: Disautonomía severa en primeros 5 años',
          options: [
            '0 - No',
            '1 - Sí (excluye diagnóstico)'
          ],
          score: 0
        },
        {
          id: 'no_levodopa_response',
          label: 'EXCLUSIÓN: Ausencia de respuesta a levodopa pese a dosis altas',
          options: [
            '0 - No',
            '1 - Sí (excluye diagnóstico)'
          ],
          score: 0
        },
        {
          id: 'prominent_dystonia',
          label: 'EXCLUSIÓN: Movimientos distónicos prominentes en primeros años',
          options: [
            '0 - No',
            '1 - Sí (excluye diagnóstico)'
          ],
          score: 0
        },
        {
          id: 'normal_spect_dat',
          label: 'EXCLUSIÓN: Neuroimagen funcional normal (SPECT-DAT normal)',
          options: [
            '0 - No',
            '1 - Sí (excluye diagnóstico)'
          ],
          score: 0
        },
        {
          id: 'asymmetric_onset',
          label: 'APOYO: Inicio asimétrico de los síntomas',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'rest_tremor_present',
          label: 'APOYO: Temblor en reposo presente',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'marked_levodopa_response',
          label: 'APOYO: Respuesta marcada a levodopa (>70% mejoría)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'levodopa_dyskinesias',
          label: 'APOYO: Discinesias inducidas por levodopa',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'progressive_course',
          label: 'APOYO: Curso progresivo de la enfermedad',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'documented_hyposmia',
          label: 'APOYO: Hiposmia documentada',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'mibg_alteration',
          label: 'APOYO: Alteración en gammagrafía MIBG',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'rapid_progression',
          label: 'BANDERA ROJA: Progresión muy rápida (silla de ruedas en <5 años)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'early_severe_dysautonomia',
          label: 'BANDERA ROJA: Disautonomía severa temprana',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'recurrent_falls',
          label: 'BANDERA ROJA: Caídas recurrentes en primeros 3 años',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'prominent_axial_rigidity',
          label: 'BANDERA ROJA: Rigidez axial prominente desde el inicio',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'cerebellar_ataxia',
          label: 'BANDERA ROJA: Ataxia cerebelosa',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'lack_progression',
          label: 'BANDERA ROJA: Falta de progresión después de 5 años',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'severe_cognitive_decline',
          label: 'BANDERA ROJA: Deterioro cognitivo severo en el primer año',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'mrs',
      name: 'Escala de Rankin Modificada (mRS)',
      category: 'Stroke & Cerebrovascular',
      description: 'Escala para evaluar el grado de discapacidad después de un ACV',
      items: [
        {
          id: 'mrs_score',
          label: 'Grado de discapacidad funcional',
          options: [
            '0 - Sin síntomas',
            '1 - Sin discapacidad significativa: capaz de llevar a cabo todas las actividades y deberes habituales',
            '2 - Discapacidad leve: incapaz de llevar a cabo todas las actividades previas, pero capaz de cuidar sus propios asuntos sin asistencia',
            '3 - Discapacidad moderada: requiere algo de ayuda, pero capaz de caminar sin asistencia',
            '4 - Discapacidad moderadamente severa: incapaz de caminar sin asistencia e incapaz de atender sus necesidades corporales sin asistencia',
            '5 - Discapacidad severa: confinado a la cama, incontinente y requiere cuidado constante y atención de enfermería',
            '6 - Muerte'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'aspects',
      name: 'ASPECTS (Alberta Stroke Program Early CT Score)',
      category: 'Stroke & Cerebrovascular',
      description: 'Sistema de puntuación para evaluar cambios isquémicos tempranos en TC de cerebro',
      items: [
        {
          id: 'aspects_c',
          label: 'Región C (núcleo caudado)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_l',
          label: 'Región L (núcleo lenticular)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_ic',
          label: 'Región IC (cápsula interna)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_i',
          label: 'Región I (ínsula)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_m1',
          label: 'Región M1 (corteza ACM anterior)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_m2',
          label: 'Región M2 (corteza ACM lateral)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_m3',
          label: 'Región M3 (corteza ACM posterior)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_m4',
          label: 'Región M4 (corteza ACM anterior superior)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_m5',
          label: 'Región M5 (corteza ACM lateral superior)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        },
        {
          id: 'aspects_m6',
          label: 'Región M6 (corteza ACM posterior superior)',
          options: [
            '1 - Normal',
            '0 - Alterado'
          ],
          score: 1
        }
      ]
    },
    {
      id: 'cha2ds2vasc',
      name: 'CHA2DS2-VASc Score',
      category: 'Stroke & Cerebrovascular',
      description: 'Escala para evaluar riesgo de ACV en fibrilación auricular',
      items: [
        {
          id: 'chf_heart_failure',
          label: 'Insuficiencia cardíaca congestiva (C)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'hypertension',
          label: 'Hipertensión arterial (H)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'age_75_or_more',
          label: 'Edad ≥75 años (A2)',
          options: [
            '0 - No',
            '2 - Sí'
          ],
          score: 0
        },
        {
          id: 'diabetes',
          label: 'Diabetes mellitus (D)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'stroke_tia_thromboembolism',
          label: 'ACV/AIT/Tromboembolismo previo (S2)',
          options: [
            '0 - No',
            '2 - Sí'
          ],
          score: 0
        },
        {
          id: 'vascular_disease',
          label: 'Enfermedad vascular (V)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'age_65_74',
          label: 'Edad 65-74 años (A)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'sex_female',
          label: 'Sexo femenino (Sc)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'hasbled',
      name: 'HAS-BLED Score',
      category: 'Stroke & Cerebrovascular',
      description: 'Escala para evaluar riesgo de sangrado en anticoagulación',
      items: [
        {
          id: 'hypertension_uncontrolled',
          label: 'Hipertensión no controlada (H)',
          options: [
            '0 - No (PAS <160 mmHg)',
            '1 - Sí (PAS ≥160 mmHg)'
          ],
          score: 0
        },
        {
          id: 'abnormal_renal_liver',
          label: 'Función renal/hepática anormal (A)',
          options: [
            '0 - Normal',
            '1 - Alterada (1 punto cada una)'
          ],
          score: 0
        },
        {
          id: 'stroke_history',
          label: 'Historia de ACV (S)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'bleeding_history',
          label: 'Historia de sangrado (B)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'labile_inr',
          label: 'INR lábil (L)',
          options: [
            '0 - Estable',
            '1 - Inestable'
          ],
          score: 0
        },
        {
          id: 'elderly_age',
          label: 'Edad >65 años (E)',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'drugs_alcohol',
          label: 'Fármacos/Alcohol (D)',
          options: [
            '0 - No',
            '1 - Sí (1 punto cada uno)'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'ich_score',
      name: 'ICH Score (Hemorragia Intracerebral)',
      category: 'Stroke & Cerebrovascular',
      description: 'Escala pronóstica para hemorragia intracerebral',
      items: [
        {
          id: 'glasgow_coma_scale',
          label: 'Escala de Glasgow',
          options: [
            '0 - 13-15',
            '1 - 5-12',
            '2 - 3-4'
          ],
          score: 0
        },
        {
          id: 'ich_volume',
          label: 'Volumen de HIC (cm³)',
          options: [
            '0 - <30',
            '1 - ≥30'
          ],
          score: 0
        },
        {
          id: 'intraventricular_hemorrhage',
          label: 'Hemorragia intraventricular',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'infratentorial_origin',
          label: 'Localización infratentorial',
          options: [
            '0 - No',
            '1 - Sí'
          ],
          score: 0
        },
        {
          id: 'age_ich',
          label: 'Edad',
          options: [
            '0 - <80 años',
            '1 - ≥80 años'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'fisher_grade',
      name: 'Escala de Fisher (Hemorragia Subaracnoidea)',
      category: 'Stroke & Cerebrovascular',
      description: 'Clasificacion tomografica de hemorragia subaracnoidea',
      items: [
        {
          id: 'fisher_grade_ct',
          label: 'Grado tomografico',
          options: [
            '1 - Sin sangre subaracnoidea visible o traza minima',
            '2 - Capa fina de sangre difusa <1 mm',
            '3 - Coagulo localizado o capa gruesa >=1 mm',
            '4 - Hemorragia intracerebral o intraventricular con sangre difusa'
          ],
          score: 1
        }
      ]
    },
    {
      id: 'wfns',
      name: 'WFNS (World Federation of Neurosurgical Societies)',
      category: 'Stroke & Cerebrovascular',
      description: 'Grado clinico de hemorragia subaracnoidea basado en GCS',
      items: [
        {
          id: 'wfns_grade',
          label: 'Grado WFNS',
          options: [
            '1 - GCS 15 y sin deficit motor',
            '2 - GCS 13-14 y sin deficit motor',
            '3 - GCS 13-14 con deficit motor',
            '4 - GCS 7-12 con o sin deficit motor',
            '5 - GCS 3-6'
          ],
          score: 1
        }
      ]
    },
    {
      id: 'hunt_hess',
      name: 'Escala de Hunt y Hess',
      category: 'Stroke & Cerebrovascular',
      description: 'Clasificación clínica de hemorragia subaracnoidea',
      items: [
        {
          id: 'clinical_grade',
          label: 'Grado clínico',
          options: [
            '1 - Asintomático o cefalea leve y rigidez nucal leve',
            '2 - Cefalea moderada a severa, rigidez nucal, sin déficit neurológico excepto parálisis de nervios craneales',
            '3 - Somnolencia, confusión o déficit neurológico focal leve',
            '4 - Estupor, hemiparesia moderada a severa, posible rigidez de descerebración temprana y alteraciones vegetativas',
            '5 - Coma profundo, rigidez de descerebración, aspecto moribundo'
          ],
          score: 1
        }
      ]
    },
    {
      id: 'cdr',
      name: 'CDR (Clinical Dementia Rating)',
      category: 'Cognitive & Dementia',
      description: 'Escala para estadificar la severidad de la demencia',
      items: [
        {
          id: 'memory',
          label: 'Memoria',
          options: [
            '0 - Sin pérdida de memoria o pérdida inconstante y leve',
            '0.5 - Olvido leve y constante; recuerdo parcial de eventos; "olvido benigno"',
            '1 - Pérdida moderada de memoria; más marcada para eventos recientes; interfiere con actividades cotidianas',
            '2 - Pérdida severa de memoria; solo retiene material muy aprendido; material nuevo se pierde rápidamente',
            '3 - Pérdida severa de memoria; solo fragmentos permanecen'
          ],
          score: 0
        },
        {
          id: 'orientation',
          label: 'Orientación',
          options: [
            '0 - Completamente orientado',
            '0.5 - Completamente orientado excepto por leve dificultad con relaciones temporales',
            '1 - Dificultad moderada con relaciones temporales; orientado en lugar del examen; puede tener desorientación geográfica',
            '2 - Dificultad severa con relaciones temporales; usualmente desorientado en tiempo, frecuentemente en lugar',
            '3 - Orientado solo a persona'
          ],
          score: 0
        },
        {
          id: 'judgment_problem_solving',
          label: 'Juicio y Resolución de Problemas',
          options: [
            '0 - Resuelve problemas cotidianos y maneja asuntos de negocios y financieros bien; juicio bueno en relación a desempeño pasado',
            '0.5 - Leve alteración en resolución de problemas, similitudes y diferencias',
            '1 - Dificultad moderada para manejar problemas, similitudes y diferencias; juicio social usualmente mantenido',
            '2 - Severamente alterado en manejo de problemas, similitudes y diferencias; juicio social usualmente alterado',
            '3 - Incapaz de hacer juicios o resolver problemas'
          ],
          score: 0
        },
        {
          id: 'community_affairs',
          label: 'Asuntos Comunitarios',
          options: [
            '0 - Función independiente en el nivel usual en trabajo, compras, grupos voluntarios y sociales',
            '0.5 - Leve alteración en estas actividades',
            '1 - Incapaz de funcionar independientemente en estas actividades, aunque puede aún involucrarse en algunas; parece normal a la inspección casual',
            '2 - Sin pretensión de función independiente fuera del hogar; parece bien para ser llevado a funciones fuera del hogar',
            '3 - Sin pretensión de función independiente fuera del hogar; parece muy enfermo para ser llevado a funciones fuera del hogar'
          ],
          score: 0
        },
        {
          id: 'home_hobbies',
          label: 'Hogar y Pasatiempos',
          options: [
            '0 - Vida hogareña, pasatiempos e intereses intelectuales bien mantenidos',
            '0.5 - Vida hogareña, pasatiempos e intereses intelectuales levemente alterados',
            '1 - Vida hogareña, pasatiempos e intereses intelectuales moderadamente alterados; tareas más difíciles abandonadas',
            '2 - Solo tareas simples preservadas; intereses muy restringidos y pobremente sostenidos',
            '3 - Sin función significativa en el hogar'
          ],
          score: 0
        },
        {
          id: 'personal_care',
          label: 'Cuidado Personal',
          options: [
            '0 - Completamente capaz de cuidado propio',
            '1 - Necesita ocasionalmente ser alentado',
            '2 - Requiere asistencia para vestirse, higiene, cuidado de efectos personales',
            '3 - Requiere mucha ayuda para cuidado personal; incontinencia frecuente'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'midas',
      name: 'MIDAS (Migraine Disability Assessment)',
      category: 'Cefalea',
      description: 'Evaluación de discapacidad por migraña en los últimos 3 meses',
      items: [
        {
          id: 'work_missed',
          label: '1. ¿Cuántos días NO pudo trabajar o estudiar debido a sus dolores de cabeza?',
          options: [
            'Número de días: ___'
          ],
          score: 0
        },
        {
          id: 'work_half_productivity',
          label: '2. ¿Cuántos días su productividad en el trabajo o estudios se redujo a la mitad o más debido a sus dolores de cabeza?',
          options: [
            'Número de días: ___'
          ],
          score: 0
        },
        {
          id: 'household_missed',
          label: '3. ¿Cuántos días NO pudo hacer las tareas del hogar debido a sus dolores de cabeza?',
          options: [
            'Número de días: ___'
          ],
          score: 0
        },
        {
          id: 'household_half_productivity',
          label: '4. ¿Cuántos días su productividad en las tareas del hogar se redujo a la mitad o más debido a sus dolores de cabeza?',
          options: [
            'Número de días: ___'
          ],
          score: 0
        },
        {
          id: 'family_social_missed',
          label: '5. ¿Cuántos días perdió actividades familiares, sociales o de ocio debido a sus dolores de cabeza?',
          options: [
            'Número de días: ___'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'mmse',
      name: 'MMSE (Mini-Mental State Examination)',
      category: 'Evaluación Cognitiva',
      description: 'Evaluación cognitiva global para detección de deterioro',
      items: [
        {
          id: 'orientation_time',
          label: 'Orientación Temporal (5 puntos)',
          options: [
            '5 - Todas correctas (año, estación, mes, fecha, día)',
            '4 - 4 correctas',
            '3 - 3 correctas',
            '2 - 2 correctas',
            '1 - 1 correcta',
            '0 - Ninguna correcta'
          ],
          score: 0
        },
        {
          id: 'orientation_place',
          label: 'Orientación Espacial (5 puntos)',
          options: [
            '5 - Todas correctas (país, provincia, ciudad, hospital, piso)',
            '4 - 4 correctas',
            '3 - 3 correctas',
            '2 - 2 correctas',
            '1 - 1 correcta',
            '0 - Ninguna correcta'
          ],
          score: 0
        },
        {
          id: 'registration',
          label: 'Registro de 3 palabras (3 puntos)',
          options: [
            '3 - Las 3 palabras repetidas correctamente',
            '2 - 2 palabras correctas',
            '1 - 1 palabra correcta',
            '0 - Ninguna palabra correcta'
          ],
          score: 0
        },
        {
          id: 'attention_calculation',
          label: 'Atención y Cálculo (5 puntos)',
          options: [
            '5 - Todas las restas correctas (100-7, 93-7, 86-7, 79-7, 72-7)',
            '4 - 4 restas correctas',
            '3 - 3 restas correctas', 
            '2 - 2 restas correctas',
            '1 - 1 resta correcta',
            '0 - Ninguna resta correcta'
          ],
          score: 0
        },
        {
          id: 'recall',
          label: 'Recuerdo de 3 palabras (3 puntos)',
          options: [
            '3 - Las 3 palabras recordadas',
            '2 - 2 palabras recordadas',
            '1 - 1 palabra recordada',
            '0 - Ninguna palabra recordada'
          ],
          score: 0
        },
        {
          id: 'naming',
          label: 'Denominación (2 puntos)',
          options: [
            '2 - Nombra correctamente lápiz y reloj',
            '1 - Nombra 1 objeto correctamente',
            '0 - No nombra ningún objeto'
          ],
          score: 0
        },
        {
          id: 'repetition',
          label: 'Repetición (1 punto)',
          options: [
            '1 - Repite correctamente la frase',
            '0 - No repite correctamente'
          ],
          score: 0
        },
        {
          id: 'comprehension',
          label: 'Comprensión verbal (3 puntos)',
          options: [
            '3 - Ejecuta las 3 órdenes correctamente',
            '2 - Ejecuta 2 órdenes correctamente',
            '1 - Ejecuta 1 orden correctamente',
            '0 - No ejecuta ninguna orden'
          ],
          score: 0
        },
        {
          id: 'reading',
          label: 'Lectura (1 punto)',
          options: [
            '1 - Lee y ejecuta "Cierre los ojos"',
            '0 - No lee o no ejecuta correctamente'
          ],
          score: 0
        },
        {
          id: 'writing',
          label: 'Escritura (1 punto)',
          options: [
            '1 - Escribe una oración completa con sentido',
            '0 - No escribe o la oración no tiene sentido'
          ],
          score: 0
        },
        {
          id: 'copying',
          label: 'Copia de pentágonos (1 punto)',
          options: [
            '1 - Copia correctamente los pentágonos entrelazados',
            '0 - No copia correctamente'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'hoehn_yahr',
      name: 'Escala de Hoehn y Yahr',
      category: 'Parkinson',
      description: 'Estadificación de la progresión de la enfermedad de Parkinson',
      items: [
        {
          id: 'stage',
          label: 'Estadio de Hoehn y Yahr',
          options: [
            '0 - Sin signos de enfermedad',
            '1 - Enfermedad unilateral únicamente',
            '1.5 - Compromiso unilateral y axial',
            '2 - Enfermedad bilateral sin alteración del equilibrio',
            '2.5 - Enfermedad bilateral leve con recuperación en la prueba de retropulsión',
            '3 - Enfermedad bilateral leve a moderada; cierta inestabilidad postural; físicamente independiente',
            '4 - Incapacidad grave; aún capaz de caminar o mantenerse en pie sin ayuda',
            '5 - Confinado a silla de ruedas o cama a menos que reciba ayuda'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'edss',
      name: 'EDSS (Expanded Disability Status Scale)',
      category: 'Esclerosis Múltiple',
      description: 'Evaluación de discapacidad en esclerosis múltiple',
      items: [
        {
          id: 'pyramidal_functions',
          label: 'Funciones Piramidales',
          options: [
            '0 - Normal',
            '1 - Signos anormales sin discapacidad',
            '2 - Discapacidad mínima',
            '3 - Paraparesia o hemiparesia leve a moderada; monoparesia severa',
            '4 - Paraparesia o hemiparesia marcada; cuadriparesia moderada',
            '5 - Paraplejía, hemiplejía o cuadriparesia marcada',
            '6 - Cuadriplejía'
          ],
          score: 0
        },
        {
          id: 'cerebellar_functions',
          label: 'Funciones Cerebelares',
          options: [
            '0 - Normal',
            '1 - Signos anormales sin discapacidad',
            '2 - Ataxia leve en cualquier miembro',
            '3 - Ataxia moderada del tronco o extremidades',
            '4 - Ataxia severa en todos los miembros',
            '5 - Incapaz de realizar movimientos coordinados'
          ],
          score: 0
        },
        {
          id: 'brainstem_functions',
          label: 'Funciones del Tronco Encefálico',
          options: [
            '0 - Normal',
            '1 - Solo signos',
            '2 - Nistagmo moderado u otra discapacidad leve',
            '3 - Nistagmo severo, debilidad extraocular marcada o discapacidad moderada',
            '4 - Disartria severa u otra discapacidad marcada',
            '5 - Incapacidad para tragar o hablar'
          ],
          score: 0
        },
        {
          id: 'sensory_functions',
          label: 'Funciones Sensoriales',
          options: [
            '0 - Normal',
            '1 - Disminución de vibración o grafestesia en 1-2 extremidades',
            '2 - Disminución táctil leve o de dolor o posicional y/o disminución moderada de vibración en 1-2 extremidades',
            '3 - Disminución táctil moderada o de dolor, disminución posicional y/o pérdida de vibración en 1-2 extremidades',
            '4 - Disminución táctil marcada o pérdida de dolor o pérdida posicional y/o pérdida de vibración en 1-2 extremidades',
            '5 - Pérdida sensorial esencialmente en 1-2 extremidades',
            '6 - Pérdida sensorial esencialmente por debajo de la cabeza'
          ],
          score: 0
        },
        {
          id: 'bowel_bladder',
          label: 'Función Vesical e Intestinal',
          options: [
            '0 - Normal',
            '1 - Síntomas urinarios leves sin incontinencia',
            '2 - Urgencia urinaria moderada o incontinencia intestinal rara',
            '3 - Urgencia urinaria frecuente o incontinencia urinaria ocasional',
            '4 - Casi diaria incontinencia urinaria y/o uso regular de catéter',
            '5 - Pérdida de función vesical',
            '6 - Pérdida de función vesical e intestinal'
          ],
          score: 0
        },
        {
          id: 'visual_functions',
          label: 'Funciones Visuales',
          options: [
            '0 - Normal',
            '1 - Escotoma con agudeza visual (AV) mejor que 20/30',
            '2 - Peor ojo con escotoma con AV de 20/30 a 20/59',
            '3 - Peor ojo con escotoma grande o reducción moderada de campos, pero con AV de 20/60 a 20/99',
            '4 - Peor ojo con reducción marcada de campos y AV de 20/100 a 20/200',
            '5 - Peor ojo con AV menor que 20/200',
            '6 - Grado 5 más mejor ojo con AV menor que 20/60'
          ],
          score: 0
        },
        {
          id: 'cerebral_functions',
          label: 'Funciones Cerebrales (Mentales)',
          options: [
            '0 - Normal',
            '1 - Solo cambios del humor (no afecta puntaje de discapacidad)',
            '2 - Disminución leve de la mentalidad',
            '3 - Disminución moderada de la mentalidad',
            '4 - Disminución marcada de la mentalidad',
            '5 - Demencia o síndrome cerebral crónico'
          ],
          score: 0
        },
        {
          id: 'ambulation',
          label: 'Capacidad de Deambulación',
          options: [
            '0 - Camina normalmente, sin limitaciones (EDSS 0-3.5)',
            '1 - Camina sin ayuda 500+ metros (EDSS 4.0)',
            '2 - Camina sin ayuda 300-499 metros (EDSS 4.5)',
            '3 - Camina sin ayuda 200-299 metros (EDSS 5.0)',
            '4 - Camina sin ayuda 100-199 metros (EDSS 5.5)',
            '5 - Camina sin ayuda hasta 100 metros (EDSS 6.0)',
            '6 - Requiere ayuda unilateral constante para caminar 100 metros (EDSS 6.5)',
            '7 - Requiere ayuda bilateral constante para caminar 20 metros (EDSS 7.0)',
            '8 - No puede caminar más de 5 metros aún con ayuda (EDSS 7.5)',
            '9 - Esencialmente restringido a silla de ruedas (EDSS 8.0)',
            '10 - Confinado a cama (EDSS 8.5-9.5)'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'engel',
      name: 'Escala de Engel (Epilepsia)',
      category: 'Epilepsia',
      description: 'Evaluación de resultados post-quirúrgicos en epilepsia',
      items: [
        {
          id: 'seizure_outcome',
          label: 'Resultado post-quirúrgico',
          options: [
            'Clase I - Libre de crisis incapacitantes',
            'Clase II - Crisis incapacitantes raras',
            'Clase III - Mejoría significativa',
            'Clase IV - Sin mejoría significativa'
          ],
          score: 0
        },
        {
          id: 'subclass',
          label: 'Subclasificación (si aplica)',
          options: [
            'A - Completamente libre de crisis',
            'B - Solo auras no incapacitantes',
            'C - Crisis generalizadas solo con suspensión de medicación',
            'D - Crisis generalizadas con enfermedad febril'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'moca',
      name: 'MoCA (Montreal Cognitive Assessment)',
      category: 'Evaluación Cognitiva',
      description: 'Evaluación cognitiva breve para detección de deterioro cognitivo leve',
      items: [
        {
          id: 'visuospatial',
          label: 'Habilidades visuoespaciales/ejecutivas (5 puntos)',
          options: [
            '5 - Todas las tareas correctas (sendero, cubo, reloj)',
            '4 - 4 tareas correctas',
            '3 - 3 tareas correctas',
            '2 - 2 tareas correctas',
            '1 - 1 tarea correcta',
            '0 - Ninguna tarea correcta'
          ],
          score: 0
        },
        {
          id: 'naming',
          label: 'Denominación (3 puntos)',
          options: [
            '3 - León, rinoceronte, camello correctos',
            '2 - 2 animales correctos',
            '1 - 1 animal correcto',
            '0 - Ningún animal correcto'
          ],
          score: 0
        },
        {
          id: 'attention',
          label: 'Atención (6 puntos)',
          options: [
            '6 - Todas las tareas correctas (dígitos, vigilancia, resta)',
            '5 - 5 elementos correctos',
            '4 - 4 elementos correctos',
            '3 - 3 elementos correctos',
            '2 - 2 elementos correctos',
            '1 - 1 elemento correcto',
            '0 - Ningún elemento correcto'
          ],
          score: 0
        },
        {
          id: 'language',
          label: 'Lenguaje (3 puntos)',
          options: [
            '3 - Repetición y fluidez correctas',
            '2 - Una tarea correcta completamente',
            '1 - Parcialmente correcto',
            '0 - Ambas tareas incorrectas'
          ],
          score: 0
        },
        {
          id: 'abstraction',
          label: 'Abstracción (2 puntos)',
          options: [
            '2 - Ambas analogías correctas',
            '1 - Una analogía correcta',
            '0 - Ninguna analogía correcta'
          ],
          score: 0
        },
        {
          id: 'memory',
          label: 'Memoria diferida (5 puntos)',
          options: [
            '5 - Las 5 palabras recordadas',
            '4 - 4 palabras recordadas',
            '3 - 3 palabras recordadas',
            '2 - 2 palabras recordadas',
            '1 - 1 palabra recordada',
            '0 - Ninguna palabra recordada'
          ],
          score: 0
        },
        {
          id: 'orientation',
          label: 'Orientación (6 puntos)',
          options: [
            '6 - Todas correctas (fecha, mes, año, día, lugar, ciudad)',
            '5 - 5 correctas',
            '4 - 4 correctas',
            '3 - 3 correctas',
            '2 - 2 correctas',
            '1 - 1 correcta',
            '0 - Ninguna correcta'
          ],
          score: 0
        }
      ]
    },
    {
      id: 'hit6',
      name: 'HIT-6 (Headache Impact Test)',
      category: 'Cefalea',
      description: 'Evaluación del impacto de la cefalea en la vida diaria',
      items: [
        {
          id: 'work_school_activities',
          label: '¿Con qué frecuencia el dolor de cabeza limitó su capacidad para realizar actividades de trabajo o escolares?',
          options: [
            '6 - Siempre',
            '8 - Muy frecuentemente',
            '10 - Algunas veces',
            '11 - Rara vez',
            '6 - Nunca'
          ],
          score: 0
        },
        {
          id: 'household_activities',
          label: '¿Con qué frecuencia el dolor de cabeza limitó su capacidad para realizar actividades domésticas?',
          options: [
            '6 - Siempre',
            '8 - Muy frecuentemente',
            '10 - Algunas veces',
            '11 - Rara vez',
            '6 - Nunca'
          ],
          score: 0
        },
        {
          id: 'social_activities',
          label: '¿Con qué frecuencia evitó actividades familiares, sociales debido al dolor de cabeza?',
          options: [
            '6 - Siempre',
            '8 - Muy frecuentemente',
            '10 - Algunas veces',
            '11 - Rara vez',
            '6 - Nunca'
          ],
          score: 0
        },
        {
          id: 'concentration',
          label: '¿Con qué frecuencia tuvo dificultad para concentrarse debido al dolor de cabeza?',
          options: [
            '6 - Siempre',
            '8 - Muy frecuentemente',
            '10 - Algunas veces',
            '11 - Rara vez',
            '6 - Nunca'
          ],
          score: 0
        },
        {
          id: 'energy_fatigue',
          label: '¿Con qué frecuencia se sintió muy cansado debido al dolor de cabeza?',
          options: [
            '6 - Siempre',
            '8 - Muy frecuentemente',
            '10 - Algunas veces',
            '11 - Rara vez',
            '6 - Nunca'
          ],
          score: 0
        },
        {
          id: 'mood',
          label: '¿Con qué frecuencia se sintió harto o irritado debido al dolor de cabeza?',
          options: [
            '6 - Siempre',
            '8 - Muy frecuentemente',
            '10 - Algunas veces',
            '11 - Rara vez',
            '6 - Nunca'
          ],
          score: 0
        }
      ]
    }
  ]; */


  // Persistencia local y funciones de administración
  useEffect(() => {
    // Cargar datos guardados del localStorage
    const savedAssignments = localStorage.getItem('weeklyAssignments');
    const savedEvents = localStorage.getItem('classboardEvents');
    
    if (savedAssignments) {
      setWeeklyAssignments(JSON.parse(savedAssignments));
    }
    
    if (savedEvents) {
      setClassboardEvents(JSON.parse(savedEvents));
    }
  }, []);


  const handleAuthentication = () => {
    setIsAdminMode(true);
    // Mantener sesión administrativa por 30 minutos
    setTimeout(() => {
      setIsAdminMode(false);
    }, 30 * 60 * 1000);
  };






  // Funciones para gestión de eventos mejorada



  // Filtros y búsqueda
  // const filteredEvents = classboardEvents.filter(event => { // unused variable
  //   const matchesFilter = eventFilter === 'all' || event.type === eventFilter;
  //   const matchesSearch = eventSearch === '' || 
  //     event.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
  //     event.presenter.toLowerCase().includes(eventSearch.toLowerCase()) ||
  //     event.description.toLowerCase().includes(eventSearch.toLowerCase());
  //   return matchesFilter && matchesSearch;
  // });

  // Filtros y búsqueda para recursos





  // Callbacks y lógica
  const copyNotes = useCallback(() => {
    if (notes) {
      navigator.clipboard.writeText(notes).then(() => {
        alert('Texto copiado');
      }).catch(() => {
        alert('Error al copiar');
      });
    }
  }, [notes]);

  const clearNotes = useCallback(() => {
    const confirmClear = window.confirm(
      '⚠️ ¿Estás seguro de que quieres limpiar todas las notas?\n\nEsta acción no se puede deshacer. Se eliminará toda la información del paciente.'
    );
    
    if (confirmClear) {
      setNotes('');
      localStorage.setItem('hubjr-patient-notes', '');
    }
  }, []);


  const openScaleModal = useCallback((scaleId: string) => {
    console.log('🔍 Opening scale modal for scaleId:', scaleId);
    console.log('🔍 Available medicalScales:', medicalScales.length, 'scales');
    console.log('🔍 Scale IDs available:', medicalScales.map(s => s.id));
    
    
    const scale = medicalScales.find(scale => scale.id === scaleId);
    console.log('🔍 Found scale:', scale ? scale.name : 'NOT FOUND');
    
    if (scale) {
      console.log('🔍 Setting selectedScale:', scale.name);
      setSelectedScale(scale);
    } else {
      console.error('❌ Scale not found with ID:', scaleId);
    }
  }, [medicalScales]);

  // const openNihssModal = useCallback(() => {
  //   openScaleModal('nihss');
  // }, [openScaleModal]); // unused function

  const handleModalClose = useCallback(() => {
    setSelectedScale(null);
  }, []);

  const handleModalSubmit = useCallback((result: ScaleResult) => {
    const resultText = `\n\nEscala ${result.scaleName}: ${result.totalScore} puntos\n${result.details}`;
    setNotes((prev) => prev + resultText);
    setSelectedScale(null);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'diagnostic':
        return useNewEvolucionador ? (
          <EvolucionadorApp
            interconsultaData={activeInterconsulta}
            hospitalContext={currentHospitalContext}
            onCancel={() => {
              setActiveInterconsulta(null);
              setActiveTab(activeInterconsulta ? 'interconsultas' : 'inicio');
            }}
            onComplete={() => {
              setActiveInterconsulta(null);
              setActiveTab('interconsultas');
            }}
          />
        ) : (
          <DiagnosticAlgorithmContent
            notes={notes}
            setNotes={setNotes}
            copyNotes={copyNotes}
            clearNotes={clearNotes}
            openScaleModal={openScaleModal}
            medicalScales={medicalScales}
            currentHospitalContext={currentHospitalContext}
            activeInterconsulta={activeInterconsulta}
            onClearInterconsulta={() => setActiveInterconsulta(null)}
          />
        );
      case 'inicio':
        return <DashboardInicio setActiveTab={handleTabChange} openScaleModal={openScaleModal} />;
      case 'user-dashboard':
        return <UserDashboard />;
      case 'lumbar-punctures':
        return (
          <ProtectedRoute>
            <LumbarPunctureDashboard />
          </ProtectedRoute>
        );
      case 'academia':
        return <AcademiaManager isAdminMode={isAdminMode} />;
      case 'ranking':
        return <RankingView isAdminMode={isAdminMode} />;
      /* case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-lg">
              <div className="flex items-center space-x-3">
                <Brain className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">¡Bienvenidos!</h1>
                  <p className="text-blue-100">Residencia de Neurología | Hospital Nacional Posadas</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Actividades Completadas</p>
                    <p className="text-2xl font-bold text-gray-900">24</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-700" />
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
                    <p className="text-2xl font-bold text-gray-900">8</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-700" />
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Evaluaciones</p>
                    <p className="text-2xl font-bold text-gray-900">90%</p>
                  </div>
                  <Award className="h-8 w-8 text-blue-700" />
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
                  <Bell className="h-5 w-5 mr-2 text-blue-700" />
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
        ); */
      /* case 'academics':
        return (
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
                    <span className="bg-red-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                      Ateneo Clínico
                    </span>
                    <span className="text-sm text-gray-500">Miércoles 15:00</span>
                  </div>
                  <h3 className="font-medium mb-2">Caso: Encefalopatía Metabólica</h3>
                  <p className="text-sm text-gray-600 mb-3">Residente - Todos los años</p>
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
                    <span className="bg-green-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                      Taller Práctico
                    </span>
                    <span className="text-sm text-gray-500">Viernes 16:00</span>
                  </div>
                  <h3 className="font-medium mb-2">Evaluación Cognitiva - MMSE</h3>
                  <p className="text-sm text-gray-600 mb-3">Dra. López - Residentes</p>
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
                    <p className="text-2xl font-bold text-gray-900">92%</p>
                    <p className="text-gray-600">Clases Teóricas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">88%</p>
                    <p className="text-gray-600">Ateneos Clínicos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">95%</p>
                    <p className="text-gray-600">Talleres</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ); */
      case 'schedule':
        return <EventManagerSupabase />;
      case 'resident-management':
        return (
          <ProtectedRoute>
            <ResidentManagement />
          </ProtectedRoute>
        );
      case 'ward-rounds':
        return (
          <ProtectedRoute>
            <WardRounds />
          </ProtectedRoute>
        );
      case 'saved-patients':
        return (
          <ProtectedRoute>
            <SavedPatients
              isAdminMode={isAdminMode}
              currentHospitalContext={currentHospitalContext}
            />
          </ProtectedRoute>
        );
      case 'interconsultas':
        return (
          <ProtectedRoute>
            <Interconsultas onGoToEvolucionador={handleGoToEvolucionador} />
          </ProtectedRoute>
        );
      case 'pacientes-post-alta':
        return (
          <ProtectedRoute>
            <PacientesPostAlta />
          </ProtectedRoute>
        );
      case 'pendientes':
        return (
          <ProtectedRoute>
            <PendientesManager />
          </ProtectedRoute>
        );
      /* case 'clinical':
        return (
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
                  <p className="text-sm text-gray-800 font-medium">Sala</p>
                  <p className="text-2xl font-bold text-gray-900">8h</p>
                  <p className="text-xs text-gray-700">Esta semana</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-800 font-medium">Interconsultas</p>
                  <p className="text-2xl font-bold text-gray-900">15</p>
                  <p className="text-xs text-gray-700">Esta semana</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-800 font-medium">Procedimientos</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                  <p className="text-xs text-gray-700">Esta semana</p>
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
        ); */
      default:
        return useNewEvolucionador ? (
          <EvolucionadorApp
            interconsultaData={activeInterconsulta}
            hospitalContext={currentHospitalContext}
            onCancel={() => {
              setActiveInterconsulta(null);
              setActiveTab(activeInterconsulta ? 'interconsultas' : 'inicio');
            }}
            onComplete={() => {
              setActiveInterconsulta(null);
              setActiveTab('interconsultas');
            }}
          />
        ) : (
          <DiagnosticAlgorithmContent
            notes={notes}
            setNotes={setNotes}
            copyNotes={copyNotes}
            openScaleModal={openScaleModal}
            medicalScales={medicalScales}
            currentHospitalContext={currentHospitalContext}
          />
        );
    }
  };

  // Renderizar el modal en un portal fuera del flujo principal
  const modalRoot = typeof window !== 'undefined' ? document.getElementById('modal-root') : null;
  
  
  // Create modal content (usar modal especializado para UPDRS)
  const modalContent = selectedScale ? (
    selectedScale.id.startsWith('updrs') ? (
      <UpdrsModal
        scale={selectedScale}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />
    ) : (
      <ScaleModal
        scale={selectedScale}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        notesContext={notes}
      />
    )
  ) : null;
  
  // Try portal first, fallback to regular rendering
  const modalPortal = selectedScale
    ? (modalRoot 
        ? ReactDOM.createPortal(modalContent!, modalRoot)
        : modalContent // Fallback: render directly in component tree
      )
    : null;
    

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 flex overflow-hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border dark:border-gray-700"
      >
        <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        notifications={notifications}
        isAdminMode={isAdminMode}
        setIsAdminMode={setIsAdminMode}
        setShowAuthModal={setShowAuthModal}
        menuItems={menuItems}
      />

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden lg:ml-0 bg-white dark:bg-[#1a1a1a] ${activeTab === 'diagnostic' || activeTab === 'inicio' ? '' : 'p-4'} ${activeTab !== 'diagnostic' && activeTab !== 'inicio' ? 'pt-20 lg:pt-4' : 'pt-16 lg:pt-0'}`}>
        {/* Selector Global de Contexto Hospitalario */}
        {isAdminMode && (
          <div className="px-4 pt-4 pb-0">
            <HospitalContextSelector
              currentContext={currentHospitalContext}
              onContextChange={setCurrentHospitalContext}
              isAdminMode={isAdminMode}
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
        {modalPortal}

        {/* Modal de autenticación administrativa */}
        <AdminAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthenticate={handleAuthentication}
        />
      </div>
    </div>
  );
};

export default NeurologyResidencyHub;

