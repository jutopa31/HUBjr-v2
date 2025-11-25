import React from 'react';
import { BookOpen, Clock, Trophy, Users } from 'lucide-react';
import type { TopicStatistics } from '../../services/rankingService';

type Props = {
  statistics: TopicStatistics | null;
  loading?: boolean;
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div className={`rounded-full p-2 ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-xs text-gray-600 dark:text-gray-400">{label}</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
      </div>
    </div>
  </div>
);

const TopicStatistics: React.FC<Props> = ({ statistics, loading }) => {
  if (loading || !statistics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-4 shadow-sm">
            <div className="animate-pulse flex items-center gap-3">
              <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10" />
              <div className="flex-1">
                <div className="bg-gray-200 dark:bg-gray-700 h-3 w-20 rounded mb-2" />
                <div className="bg-gray-200 dark:bg-gray-700 h-6 w-10 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        label="Temas activos"
        value={statistics.activeTopics}
        color="bg-blue-100 dark:bg-blue-900/30"
      />
      <StatCard
        icon={<Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
        label="Participaciones pendientes"
        value={statistics.pendingParticipations}
        color="bg-yellow-100 dark:bg-yellow-900/30"
      />
      <StatCard
        icon={<Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />}
        label="Puntos semanales"
        value={statistics.weeklyPointsAwarded}
        color="bg-green-100 dark:bg-green-900/30"
      />
      <StatCard
        icon={<Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
        label="Residentes activos"
        value={statistics.activeResidents}
        color="bg-indigo-100 dark:bg-indigo-900/30"
      />
    </div>
  );
};

export default TopicStatistics;
