import React, { useEffect, useState } from 'react';
import TopicBanner from './TopicBanner';
import ParticipationForm from './ParticipationForm';
import AdminPanel from './AdminPanel';
import AdminQueue from './AdminQueue';
import MyPositionPanel from './MyPositionPanel';
import { ActiveTopics, RankingEntry, getActiveTopics, getLeaderboard, submitParticipation, getMyEntry, RankingPeriod } from '../../services/rankingService';
import AdminCreateTopic from './AdminCreateTopic';
import { useAuth } from '../../hooks/useAuth';

type RankingViewProps = {
  isAdminMode?: boolean;
};

const RankingView: React.FC<RankingViewProps> = ({ isAdminMode = false }) => {
  const [topics, setTopics] = useState<ActiveTopics>({});
  const [leaderboard, setLeaderboard] = useState<RankingEntry[]>([]);
  const [period, setPeriod] = useState<RankingPeriod>('weekly');
  const [myEntry, setMyEntry] = useState<RankingEntry | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>(undefined);
  const [selectedHospital, setSelectedHospital] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [t, lb, mine] = await Promise.all([
          getActiveTopics(),
          getLeaderboard(period, { level: selectedLevel, hospitalContext: selectedHospital }),
          user?.id ? getMyEntry(period, user.id) : Promise.resolve(null)
        ]);
        if (!mounted) return;
        setTopics(t);
        setLeaderboard(lb);
        setMyEntry(mine);
      } catch (e) {
        setError('No se pudieron cargar los datos del ranking');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [period, user?.id, selectedLevel, selectedHospital]);

  // Refresca banners y tabla al crear un tema nuevo desde el panel admin
  const handleTopicCreated = async () => {
    setLoading(true);
    try {
      const [t, lb, mine] = await Promise.all([
        getActiveTopics(),
        getLeaderboard(period, { level: selectedLevel, hospitalContext: selectedHospital }),
        user?.id ? getMyEntry(period, user.id) : Promise.resolve(null)
      ]);
      setTopics(t);
      setLeaderboard(lb);
      setMyEntry(mine);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (p: Parameters<typeof submitParticipation>[0]) => {
    await submitParticipation(p);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-[#1f1f1f]">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Ranking</p>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Puntaje y participación</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Monitorea posiciones, filtra por nivel u hospital y envía tus casos.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="self-start rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:bg-[#111] dark:text-gray-200 dark:hover:border-gray-600"
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? 'Mostrar panel' : 'Ocultar panel'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col gap-6">
          <TopicBanner topics={topics} />

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-[#1f1f1f]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Leaderboard</h3>
              <div className="flex gap-2 text-xs">
                <button onClick={() => setPeriod('weekly')} className={`rounded border px-2 py-1 ${period==='weekly' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>Semanal</button>
                <button onClick={() => setPeriod('monthly')} className={`rounded border px-2 py-1 ${period==='monthly' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>Mensual</button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <label className="flex items-center gap-1">
                <span>Nivel:</span>
                <select value={selectedLevel || ''} onChange={e=>setSelectedLevel(e.target.value || undefined)} className="rounded border border-gray-300 bg-white p-1 dark:border-gray-600 dark:bg-[#141414]">
                  <option value="">Todos</option>
                  <option value="R1">R1</option>
                  <option value="R2">R2</option>
                  <option value="R3">R3</option>
                  <option value="R4">R4</option>
                  <option value="R5">R5</option>
                  <option value="fellow">Fellow</option>
                </select>
              </label>
              <label className="flex items-center gap-1">
                <span>Hospital:</span>
                <select value={selectedHospital || ''} onChange={e=>setSelectedHospital(e.target.value || undefined)} className="rounded border border-gray-300 bg-white p-1 dark:border-gray-600 dark:bg-[#141414]">
                  <option value="">Todos</option>
                  <option value="Posadas">Posadas</option>
                  <option value="Julian">Julian</option>
                </select>
              </label>
            </div>
            {loading && <span className="text-xs text-gray-500">Cargando…</span>}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {!error && (
              <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
                {leaderboard.map((row, idx) => (
                  <div key={row.userId} className="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-[#141414]">
                    <span>{idx + 1}. {row.displayName}{row.level ? ` (${row.level})` : ''}</span>
                    <span className="font-medium">{row.points} pts</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <MyPositionPanel leaderboard={leaderboard} userId={user?.id} myEntry={myEntry || undefined} />

          <ParticipationForm topics={topics} onSubmit={handleSubmit} currentUserId={user?.id} />

          {/* Panel del Jefe (solo admin) */}
          {isAdminMode && (
            <>
              <AdminPanel onTopicsChanged={handleTopicCreated} />
              <AdminCreateTopic onCreated={handleTopicCreated} />
              <AdminQueue />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RankingView;
