import { supabase } from './supabase';

interface DashboardMetrics {
  patientsEvaluated: number;
  scalesCompleted: number;
  wardRounds: number;
  monthlyActivities: number;
}

/**
 * Obtiene las métricas principales del dashboard
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    // Obtener pacientes evaluados (este mes)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: patientsData, error: patientsError } = await supabase
      .from('diagnostic_assessments')
      .select('id')
      .gte('created_at', startOfMonth.toISOString());

    if (patientsError) {
      console.error('Error fetching patients:', patientsError);
    }

    // Obtener pases de sala activos (esta semana)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const { data: wardData, error: wardError } = await supabase
      .from('ward_round_patients')
      .select('id')
      .gte('created_at', startOfWeek.toISOString());

    if (wardError) {
      console.error('Error fetching ward rounds:', wardError);
    }

    // Obtener eventos del mes
    const { data: eventsData, error: eventsError } = await supabase
      .from('medical_events')
      .select('id')
      .gte('start_date', startOfMonth.toISOString());

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
    }

    // Calcular escalas completadas (suma de todas las escalas en diagnostic_assessments)
    let scalesCount = 0;
    if (patientsData) {
      const { data: scalesData, error: scalesError } = await supabase
        .from('diagnostic_assessments')
        .select('scale_results')
        .gte('created_at', startOfMonth.toISOString());

      if (!scalesError && scalesData) {
        scalesCount = scalesData.reduce((total, patient) => {
          return total + (patient.scale_results?.length || 0);
        }, 0);
      }
    }

    return {
      patientsEvaluated: patientsData?.length || 0,
      scalesCompleted: scalesCount,
      wardRounds: wardData?.length || 0,
      monthlyActivities: eventsData?.length || 0
    };

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    // Retornar valores por defecto en caso de error
    return {
      patientsEvaluated: 0,
      scalesCompleted: 0,
      wardRounds: 0,
      monthlyActivities: 0
    };
  }
}

/**
 * Obtiene los eventos de hoy desde Supabase
 */
export async function getTodayEvents() {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('medical_events')
      .select('*')
      .gte('start_date', startOfDay.toISOString())
      .lte('start_date', endOfDay.toISOString())
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching today events:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching today events:', error);
    return [];
  }
}

/**
 * Obtiene estadísticas de uso de escalas desde Supabase
 */
export async function getScaleUsageStats() {
  try {
    const { data, error } = await supabase
      .from('diagnostic_assessments')
      .select('scale_results');

    if (error) {
      console.error('Error fetching scale usage:', error);
      return [];
    }

    // Contar el uso de cada escala
    const scaleUsage: { [key: string]: number } = {};
    
    data?.forEach(patient => {
      patient.scale_results?.forEach((scale: any) => {
        const scaleName = scale.scale_name;
        scaleUsage[scaleName] = (scaleUsage[scaleName] || 0) + 1;
      });
    });

    // Convertir a array y ordenar por uso
    const sortedScales = Object.entries(scaleUsage)
      .map(([name, uses]) => ({ name, uses }))
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 5); // Top 5 escalas más usadas

    return sortedScales;
  } catch (error) {
    console.error('Error fetching scale usage stats:', error);
    return [];
  }
}

/**
 * Obtiene resumen de actividad semanal
 */
export async function getWeeklyActivitySummary() {
  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Obtener evaluaciones de la semana
    const { data: evaluationsData } = await supabase
      .from('diagnostic_assessments')
      .select('id, created_at')
      .gte('created_at', startOfWeek.toISOString());

    // Obtener pacientes únicos de la semana
    const { data: patientsData } = await supabase
      .from('diagnostic_assessments')
      .select('patient_name')
      .gte('created_at', startOfWeek.toISOString());

    // Obtener eventos de la semana
    const { data: eventsData } = await supabase
      .from('medical_events')
      .select('id')
      .gte('start_date', startOfWeek.toISOString());

    // Calcular pacientes únicos
    const uniquePatients = new Set(patientsData?.map(p => p.patient_name) || []).size;

    return {
      evaluations: evaluationsData?.length || 0,
      patients: uniquePatients,
      events: eventsData?.length || 0
    };
  } catch (error) {
    console.error('Error fetching weekly summary:', error);
    return {
      evaluations: 0,
      patients: 0,
      events: 0
    };
  }
}