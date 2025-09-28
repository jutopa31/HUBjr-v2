import React, { useState } from 'react';
import { TrendingUp, BarChart3, Download } from 'lucide-react';
import { useUserData } from '../../hooks/useUserData';

const UserStatistics: React.FC = () => {
  const { statistics, procedures, patients, classes, loading } = useUserData();
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', '30days', '90days', '1year'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos suficientes</h3>
        <p className="text-gray-600">Registre algunas actividades para ver sus estadísticas.</p>
      </div>
    );
  }

  const getMonthlyData = () => {
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const monthProcedures = procedures.filter(p =>
        p.date_performed.startsWith(monthStr)
      ).length;

      const monthPatients = patients.filter(p =>
        p.date_assigned.startsWith(monthStr)
      ).length;

      const monthEducation = classes.filter(c =>
        c.date_attended.startsWith(monthStr)
      ).reduce((sum, c) => sum + (c.duration_hours || 0), 0);

      months.push({
        month: date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }),
        procedures: monthProcedures,
        patients: monthPatients,
        education: monthEducation
      });
    }

    return months;
  };

  const monthlyData = getMonthlyData();
  const maxValue = Math.max(
    ...monthlyData.map(m => Math.max(m.procedures, m.patients, m.education))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Estadísticas Personales</h2>
            <p className="text-sm text-gray-600">Análisis de su progreso y actividades</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Todo el tiempo</option>
            <option value="30days">Últimos 30 días</option>
            <option value="90days">Últimos 90 días</option>
            <option value="1year">Último año</option>
          </select>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Procedimientos</p>
              <p className="text-3xl font-bold text-blue-900">{statistics.procedures.total}</p>
            </div>
            <div className="text-blue-600">
              <BarChart3 className="h-8 w-8" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-blue-700">
              Tasa de éxito: {(statistics.procedures.successRate ?? 0).toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Pacientes Atendidos</p>
              <p className="text-3xl font-bold text-green-900">{statistics.patients.total}</p>
            </div>
            <div className="text-green-600">
              <BarChart3 className="h-8 w-8" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-green-700">
              Activos: {statistics.patients.active}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Horas de Educación</p>
              <p className="text-3xl font-bold text-purple-900">{statistics.education.totalHours}</p>
            </div>
            <div className="text-purple-600">
              <BarChart3 className="h-8 w-8" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-purple-700">
              {statistics.education.averageScore ?
                `Promedio: ${(statistics.education.averageScore ?? 0).toFixed(1)}` :
                'Sin evaluaciones'
              }
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Objetivos Cumplidos</p>
              <p className="text-3xl font-bold text-orange-900">{statistics.goals.completed}</p>
            </div>
            <div className="text-orange-600">
              <BarChart3 className="h-8 w-8" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-orange-700">
              {(statistics.goals.completionRate ?? 0).toFixed(1)}% completado
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Activity Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Actividad Mensual</h3>
        <div className="space-y-4">
          {monthlyData.map((month, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">{month.month}</span>
                <span className="text-gray-500">
                  {month.procedures + month.patients + month.education} actividades
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-blue-600 w-16">Proced.</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${maxValue > 0 ? (month.procedures / maxValue) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-8">{month.procedures}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-600 w-16">Pacient.</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${maxValue > 0 ? (month.patients / maxValue) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-8">{month.patients}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-purple-600 w-16">Educ.</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${maxValue > 0 ? (month.education / maxValue) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-8">{month.education}h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Procedure Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Procedimientos</h3>
          {Object.keys(statistics.procedures.byType).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(statistics.procedures.byType).map(([type, count]) => {
                const percentage = (count / statistics.procedures.total) * 100;
                const typeLabels: Record<string, string> = {
                  'lumbar_puncture': 'Punción Lumbar',
                  'eeg': 'EEG',
                  'emg': 'EMG',
                  'ultrasound': 'Ecografía',
                  'biopsy': 'Biopsia',
                  'other': 'Otros'
                };

                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">{typeLabels[type] || type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay procedimientos registrados</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividades Educativas</h3>
          {Object.keys(statistics.education.activitiesByType).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(statistics.education.activitiesByType).map(([type, count]) => {
                const total = Object.values(statistics.education.activitiesByType).reduce((a, b) => a + b, 0);
                const percentage = (count / total) * 100;
                const typeLabels: Record<string, string> = {
                  'class': 'Clases',
                  'journal_review': 'Revisiones',
                  'presentation': 'Presentaciones',
                  'conference': 'Conferencias',
                  'workshop': 'Talleres'
                };

                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">{typeLabels[type] || type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay actividades educativas registradas</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserStatistics;