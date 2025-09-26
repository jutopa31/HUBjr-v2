import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  HeartPulse,
  Hospital,
  ListChecks,
  Users
} from 'lucide-react';
import { useAuthContext } from '../../auth/AuthProvider';
import { fetchDashboardStats, DashboardStats } from '../../../services/dashboardService';
import { DEFAULT_HOSPITAL_CONTEXT } from '../../../services/hospitalContextService';
import type { HospitalContext } from '../../../types';

type DashboardTarget = 'patients' | 'resources' | 'admin';

interface SimplifiedDashboardProps {
  onNavigate: (target: DashboardTarget) => void;
  hospitalContext?: HospitalContext;
}

const QUICK_ACTIONS: Array<{
  id: DashboardTarget;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    id: 'patients',
    label: 'Gestionar pacientes',
    description: 'Listado unificado, guardias y escalas clinicas.',
    icon: HeartPulse
  },
  {
    id: 'resources',
    label: 'Abrir recursos',
    description: 'Algoritmos diagnosticos y calculadoras rapidas.',
    icon: ClipboardList
  },
  {
    id: 'admin',
    label: 'Panel administrativo',
    description: 'Eventos, academia y privilegios.',
    icon: ListChecks
  }
];

const SimplifiedDashboard: React.FC<SimplifiedDashboardProps> = ({ onNavigate, hospitalContext }) => {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const context = hospitalContext ?? DEFAULT_HOSPITAL_CONTEXT;

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchDashboardStats({
          hospitalContext: context,
          userId: user?.id
        });
        if (isMounted) {
          setStats(data);
        }
      } catch (error) {
        console.error('Error loading dashboard stats', error);
        if (isMounted) {
          setStats(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [context, user?.id]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos dias';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 md:p-8">
        <div className="flex flex-col gap-1">
          <span className="text-sm uppercase tracking-wide text-slate-500">Tablero simplificado</span>
          <h1 className="text-3xl font-semibold text-white">
            {greeting}, Dr. {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Equipo HubJR'}
          </h1>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5">
            <Hospital className="h-4 w-4 text-sky-400" />
            {context} activo
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5">
            <CalendarDays className="h-4 w-4 text-sky-400" />
            {new Date().toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </span>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onNavigate(action.id)}
              className="group flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left transition hover:border-sky-500/60 hover:bg-slate-900"
            >
              <span className="flex items-center justify-between">
                <span className="text-base font-medium text-white">{action.label}</span>
                <ChevronRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-sky-400" />
              </span>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950">
                  <Icon className="h-4 w-4 text-sky-400" />
                </span>
                <p>{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <article className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <header className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-white">Indicadores clave</h2>
              <p className="text-sm text-slate-400">Seguimiento diario de pacientes y tareas.</p>
            </div>
          </header>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={Users}
              label="Pacientes hoy"
              value={stats?.todayPatients ?? 0}
              accent="bg-sky-500/20 text-sky-400"
            />
            <StatCard
              icon={CheckSquare}
              label="Tareas pendientes"
              value={stats?.pendingTasks ?? 0}
              accent="bg-amber-500/20 text-amber-400"
            />
            <StatCard
              icon={Activity}
              label="Procedimientos"
              value={stats?.completedProcedures ?? 0}
              accent="bg-emerald-500/20 text-emerald-400"
            />
          </div>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-slate-300">Actividad reciente</h3>
            <div className="flex flex-col gap-3">
              {(stats?.recentActivity ?? []).map((item) => (
                <RecentActivity key={item.id} activity={item} />
              ))}
              {!loading && (!stats || stats.recentActivity.length === 0) && (
                <p className="text-sm text-slate-500">Sin movimientos registrados en las ultimas horas.</p>
              )}
              {loading && <SkeletonLines count={3} />}
            </div>
          </section>
        </article>

        <aside className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Agenda proxima</h2>
              <p className="text-sm text-slate-400">Guardias, academia y eventos en cola.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="text-sm font-medium text-sky-400 transition hover:text-sky-300"
            >
              Ver calendario
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((slot) => (
              <div
                key={slot}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80">
                    <CalendarDays className="h-5 w-5 text-sky-400" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">Guardia Hospital Posadas</span>
                    <span className="text-xs text-slate-400">Unidad 3B - Equipo A</span>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-500">En {slot} h</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
};

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  accent: string;
}> = ({ icon: Icon, label, value, accent }) => (
  <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
      <Icon className="h-5 w-5" />
    </span>
    <div className="flex flex-col gap-1">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-2xl font-semibold text-white">{value}</span>
    </div>
  </div>
);

const RecentActivity: React.FC<{ activity: DashboardStats['recentActivity'][number] }> = ({ activity }) => {
  const iconMap: Record<typeof activity.type, React.ElementType> = {
    patient: Users,
    procedure: HeartPulse,
    task: CheckSquare
  };

  const priorityTone = () => {
    switch (activity.priority) {
      case 'high':
        return 'border-rose-500/40 bg-rose-500/10 text-rose-300';
      case 'medium':
        return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
      case 'low':
        return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
      default:
        return 'border-slate-700 bg-slate-900/60 text-slate-300';
    }
  };

  const Icon = iconMap[activity.type];

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg border ${priorityTone()}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">{activity.description}</span>
          <span className="text-xs text-slate-400">Registrado a las {activity.time}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-slate-500">{activity.priority?.toUpperCase() ?? 'NORMAL'}</span>
    </div>
  );
};

const SkeletonLines: React.FC<{ count: number }> = ({ count }) => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: count }, (_, index) => (
      <div
        key={index}
        className="h-16 animate-pulse rounded-xl border border-slate-900 bg-slate-900/60"
      />
    ))}
  </div>
);

export default SimplifiedDashboard;
