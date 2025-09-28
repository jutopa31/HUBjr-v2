import type { HospitalContext } from '../types';

type ActivityType = 'patient' | 'procedure' | 'task';

export interface DashboardActivity {
  id: string;
  type: ActivityType;
  description: string;
  time: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface DashboardStats {
  todayPatients: number;
  pendingTasks: number;
  completedProcedures: number;
  recentActivity: DashboardActivity[];
}

interface FetchDashboardParams {
  hospitalContext: HospitalContext;
  userId?: string;
}

/**
 * Temporary mock fetch until Supabase endpoints are wired. Keeps the UI logic isolated
 * so both v2 and v3 dashboards can share the same implementation.
 */
export async function fetchDashboardStats({ hospitalContext }: FetchDashboardParams): Promise<DashboardStats> {
  // TODO: Replace with Supabase queries filtered by hospitalContext once available
  const baseMock: DashboardStats = {
    todayPatients: 3,
    pendingTasks: 2,
    completedProcedures: 1,
    recentActivity: [
      {
        id: '1',
        type: 'patient',
        description: 'Nueva evaluacion: Juan P. - Cama 12',
        time: '10:30',
        priority: 'high'
      },
      {
        id: '2',
        type: 'procedure',
        description: 'Puncion lumbar completada - Maria G.',
        time: '09:15',
        priority: 'medium'
      },
      {
        id: '3',
        type: 'task',
        description: 'Evaluacion NIHSS pendiente - Carlos R.',
        time: '08:45',
        priority: 'medium'
      }
    ]
  };

  if (hospitalContext === 'Julian') {
    return {
      ...baseMock,
      todayPatients: 2,
      pendingTasks: 1,
      recentActivity: baseMock.recentActivity.slice(0, 2)
    };
  }

  return baseMock;
}
