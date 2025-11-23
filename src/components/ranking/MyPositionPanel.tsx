import React, { useMemo } from 'react';
import type { RankingEntry } from '../../services/rankingService';

type Props = {
  leaderboard: RankingEntry[];
  userId?: string;
  myEntry?: RankingEntry | null;
};

const MyPositionPanel: React.FC<Props> = ({ leaderboard, userId, myEntry }) => {
  const computed = useMemo(() => {
    if (!userId) return { rank: null as number | null, entry: null as RankingEntry | null };
    const idx = leaderboard.findIndex(e => e.userId === userId);
    if (idx >= 0) return { rank: idx + 1, entry: leaderboard[idx] };
    return { rank: null, entry: myEntry || null };
  }, [leaderboard, userId, myEntry]);

  return (
    <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-4 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Mi posición</h3>
      {!userId ? (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Inicia sesión para ver tu progreso.</p>
      ) : computed.entry ? (
        <div className="mt-2 text-sm text-gray-800 dark:text-gray-200">
          {computed.rank ? (
            <p>Puesto: <span className="font-semibold">#{computed.rank}</span> • Puntos: <span className="font-semibold">{computed.entry.points}</span></p>
          ) : (
            <p>Fuera del top actual • Puntos: <span className="font-semibold">{computed.entry.points}</span></p>
          )}
          {computed.entry.level && <p className="text-xs mt-1 text-gray-600 dark:text-gray-300">Nivel: {computed.entry.level}</p>}
        </div>
      ) : (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Aún no registras puntos en este período.</p>
      )}
    </section>
  );
};

export default MyPositionPanel;

