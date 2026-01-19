export type ReadingLevel = 'core' | 'recommended' | 'optional';

export interface ReadingItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  level: ReadingLevel;
  source: string;
  year: number;
  readingTime: string;
  link?: string;
}

export const READING_LEVEL_LABELS: Record<ReadingLevel, string> = {
  core: 'Core',
  recommended: 'Recommended',
  optional: 'Optional'
};

export const READING_LEVEL_STYLES: Record<ReadingLevel, { badge: string; accent: string }> = {
  core: {
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200',
    accent: 'border-l-rose-500'
  },
  recommended: {
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    accent: 'border-l-blue-500'
  },
  optional: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
    accent: 'border-l-emerald-500'
  }
};
