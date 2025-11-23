import React from 'react';
import type { ActiveTopics } from '../../services/rankingService';

type TopicBannerProps = {
  topics: ActiveTopics;
};

const TopicBox: React.FC<{ title: string; objectives?: string; materials?: { label: string; url: string }[] }>
  = ({ title, objectives, materials }) => (
  <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-[#1f1f1f]">
    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
    {objectives && (
      <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">{objectives}</p>
    )}
    {materials && materials.length > 0 && (
      <ul className="mt-2 text-sm list-disc pl-5 text-blue-700 dark:text-blue-300">
        {materials.map((m, i) => (
          <li key={i}><a href={m.url} className="hover:underline">{m.label}</a></li>
        ))}
      </ul>
    )}
  </div>
);

const TopicBanner: React.FC<TopicBannerProps> = ({ topics }) => {
  return (
    <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Temas activos</h2>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        {topics.weekly ? (
          <TopicBox title={`Semanal: ${topics.weekly.title}`} objectives={topics.weekly.objectives} materials={topics.weekly.materials} />
        ) : (
          <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-600 dark:text-gray-300">Sin tema semanal publicado</div>
        )}
        {topics.monthly ? (
          <TopicBox title={`Mensual: ${topics.monthly.title}`} objectives={topics.monthly.objectives} materials={topics.monthly.materials} />
        ) : (
          <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-600 dark:text-gray-300">Sin tema mensual publicado</div>
        )}
      </div>
    </section>
  );
};

export default TopicBanner;

