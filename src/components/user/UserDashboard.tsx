import React, { useState } from 'react';
import { User, Stethoscope, GraduationCap, Target, TrendingUp, Users, Award, BookOpen, ClipboardList, Eye, Syringe, ArrowRight, UserCheck } from 'lucide-react';
import { useAuthContext } from '../auth/AuthProvider';
import { useUserData } from '../../hooks/useUserData';
import ProcedureLogger from './ProcedureLogger';
import UserStatistics from './UserStatistics';
import MyPatients from './MyPatients';
import EducationTracker from './EducationTracker';
import GoalsManager from './GoalsManager';
import ResidentProfile from './ResidentProfile';
import LumbarPunctureDashboard from '../LumbarPunctureDashboard';

type DashboardTab = 'overview' | 'procedures' | 'lumbar-punctures' | 'patients' | 'education' | 'goals' | 'statistics' | 'profile';

const UserDashboard: React.FC = () => {
  const { user } = useAuthContext();
  const { statistics, loading } = useUserData();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const userMetadata = user?.user_metadata || {};
  const userName = userMetadata.full_name || user?.email?.split('@')[0] || 'Usuario';
  const userRole = userMetadata.role || 'resident';

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'resident': return 'Residente';
      case 'attending': return 'Staff';
      case 'intern': return 'Interno';
      default: return 'Residente';
    }
  };

  const tabContent = {
    overview: <OverviewTab statistics={statistics} userName={userName} onNavigate={setActiveTab} />,
    procedures: <ProcedureLogger />,
    'lumbar-punctures': <LumbarPunctureDashboard />,
    patients: <MyPatients />,
    education: <EducationTracker />,
    goals: <GoalsManager />,
    statistics: <UserStatistics />,
    profile: <ResidentProfile />
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: User },
    { id: 'procedures', label: 'Procedimientos', icon: Stethoscope },
    { id: 'lumbar-punctures', label: 'Punciones Lumbares', icon: Syringe },
    { id: 'patients', label: 'Mis Pacientes', icon: Users },
    { id: 'education', label: 'Educación', icon: GraduationCap },
    { id: 'goals', label: 'Objetivos', icon: Target },
    { id: 'statistics', label: 'Estadísticas', icon: TrendingUp },
    { id: 'profile', label: 'Mi Perfil', icon: UserCheck }
  ] as const;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Panel Personal - {userName}</h1>
            <p className="text-blue-100 mt-1">
              {getRoleLabel(userRole)} • Servicio de Neurología
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-sm">
            {statistics && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold">{statistics.procedures.total}</div>
                  <div className="text-blue-100">Procedimientos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{statistics.patients.active}</div>
                  <div className="text-blue-100">Pacientes Activos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{statistics.education.totalHours}h</div>
                  <div className="text-blue-100">Horas de Estudio</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {tabContent[activeTab]}
      </div>
    </div>
  );
};

// Overview Tab Component
interface OverviewTabProps {
  statistics: any;
  userName: string;
  onNavigate: (tab: DashboardTab) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ statistics, userName, onNavigate }) => {
  if (!statistics) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando estadísticas...</h3>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Bienvenido de vuelta, {userName}
        </h2>
        <p className="text-gray-600">{currentDate}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Stethoscope className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Procedimientos</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.procedures.total}</p>
              <p className="text-xs text-green-600">
                {statistics.procedures.successRate.toFixed(1)}% éxito
              </p>
            </div>
          </div>
        </div>

        {/* Lumbar Puncture Statistics Card */}
        <div
          className="bg-white rounded-lg p-6 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('lumbar-punctures')}
        >
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Syringe className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Punciones Lumbares</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statistics.procedures.lumbarPuncturesCount || 0}
              </p>
              <p className="text-xs text-green-600">
                {statistics.procedures.lumbarPuncturesSuccessRate ?
                  `${statistics.procedures.lumbarPuncturesSuccessRate.toFixed(1)}% éxito` :
                  'Sin datos'
                }
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pacientes</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.patients.active}</p>
              <p className="text-xs text-gray-500">
                {statistics.patients.total} total
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Educación</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.education.totalHours}h</p>
              <p className="text-xs text-gray-500">
                {statistics.education.averageScore ? `${statistics.education.averageScore.toFixed(1)} promedio` : 'Sin evaluaciones'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Objetivos</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.goals.completed}</p>
              <p className="text-xs text-gray-500">
                de {statistics.goals.total} objetivos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Procedures */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Procedimientos Recientes</h3>
            <Eye className="h-5 w-5 text-gray-400" />
          </div>
          {statistics.procedures.recentProcedures.length > 0 ? (
            <div className="space-y-3">
              {statistics.procedures.recentProcedures.slice(0, 3).map((procedure: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{procedure.procedure_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(procedure.date_performed).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    procedure.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {procedure.success ? 'Exitoso' : 'Con complicaciones'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay procedimientos registrados</p>
          )}
        </div>

        {/* Recent Patients */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pacientes Recientes</h3>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          {statistics.patients.recentPatients.length > 0 ? (
            <div className="space-y-3">
              {statistics.patients.recentPatients.slice(0, 3).map((patient: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{patient.patient_name}</p>
                    <p className="text-xs text-gray-500">
                      {patient.diagnosis || 'Sin diagnóstico'}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    patient.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    patient.status === 'discharged' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {patient.status === 'active' ? 'Activo' :
                     patient.status === 'discharged' ? 'Alta' : 'Transferido'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay pacientes asignados</p>
          )}
        </div>
      </div>

      {/* Performance Overview */}
      {statistics.performance.latestReview && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Última Evaluación</h3>
            <Award className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.performance.latestReview.overall_rating || '-'}
              </div>
              <div className="text-sm text-gray-600">General</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {statistics.performance.latestReview.clinical_skills_rating || '-'}
              </div>
              <div className="text-sm text-gray-600">Habilidades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {statistics.performance.latestReview.knowledge_rating || '-'}
              </div>
              <div className="text-sm text-gray-600">Conocimiento</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.performance.latestReview.professionalism_rating || '-'}
              </div>
              <div className="text-sm text-gray-600">Profesionalismo</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Evaluador:</strong> {statistics.performance.latestReview.reviewer_name}</p>
            <p><strong>Fecha:</strong> {new Date(statistics.performance.latestReview.date_reviewed).toLocaleDateString('es-AR')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;