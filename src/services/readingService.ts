import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { formatQueryError, robustQuery } from '../utils/queryHelpers';
import { ReadingItem } from '../types/reading';

type ReadingItemRecord = {
  id: string;
  slug?: string | null;
  title: string;
  summary: string;
  category: string;
  tags: string[] | null;
  level: 'core' | 'recommended' | 'optional';
  source: string;
  year: number;
  reading_time: string;
  link: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ReadingItemEntry = ReadingItem & { dbId: string; slug: string };
type ServiceResult = { data: ReadingItemEntry[] | null; error: Error | null };
type ItemResult = { data: ReadingItemEntry | null; error: Error | null };
type VoidResult = { error: Error | null };

type ReadingItemInput = {
  title: string;
  summary: string;
  category: string;
  tags: string[];
  level: 'core' | 'recommended' | 'optional';
  source: string;
  year: number;
  readingTime: string;
  link?: string | null;
};

const SLUG_MAX_LENGTH = 80;

function slugify(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const base = normalized || 'lectura';
  return base.slice(0, SLUG_MAX_LENGTH);
}

function toEntry(item: ReadingItemRecord): ReadingItemEntry {
  return {
    dbId: item.id,
    slug: item.slug || item.id,
    id: item.slug || item.id,
    title: item.title,
    summary: item.summary,
    category: item.category,
    tags: item.tags || [],
    level: item.level,
    source: item.source,
    year: item.year,
    readingTime: item.reading_time,
    link: item.link || undefined
  };
}

export async function fetchReadingItems(): Promise<ServiceResult> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: new Error('Supabase no configurado') };
  }

  try {
    const { data, error } = await robustQuery(
      () =>
        supabase
          .from('reading_items')
          .select('*')
          .order('year', { ascending: false })
          .order('title', { ascending: true }),
      { timeout: 8000, retries: 1, operationName: 'loadReadingItems' }
    );

    if (error) {
      console.error('Error fetching reading items:', error);
      return { data: null, error: new Error(formatQueryError(error)) };
    }

    const items = ((data as ReadingItemRecord[]) || []).map(toEntry);

    return { data: items, error: null };
  } catch (error) {
    console.error('Error in fetchReadingItems:', error);
    return { data: null, error: new Error(formatQueryError(error)) };
  }
}

export async function createReadingItem(input: ReadingItemInput): Promise<ItemResult> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase no configurado') };
  }

  const slug = `${slugify(input.title)}-${Date.now()}`;

  try {
    const { data, error } = await robustQuery(
      () =>
        supabase
          .from('reading_items')
          .insert([
            {
              slug,
              title: input.title,
              summary: input.summary,
              category: input.category,
              tags: input.tags,
              level: input.level,
              source: input.source,
              year: input.year,
              reading_time: input.readingTime,
              link: input.link || null
            }
          ])
          .select('*')
          .single(),
      { timeout: 8000, retries: 1, operationName: 'createReadingItem' }
    );

    if (error) {
      console.error('Error creating reading item:', error);
      return { data: null, error: new Error(formatQueryError(error)) };
    }

    return { data: toEntry(data as ReadingItemRecord), error: null };
  } catch (error) {
    console.error('Error in createReadingItem:', error);
    return { data: null, error: new Error(formatQueryError(error)) };
  }
}

export async function updateReadingItem(
  dbId: string,
  input: ReadingItemInput
): Promise<ItemResult> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase no configurado') };
  }

  try {
    const { data, error } = await robustQuery(
      () =>
        supabase
          .from('reading_items')
          .update({
            title: input.title,
            summary: input.summary,
            category: input.category,
            tags: input.tags,
            level: input.level,
            source: input.source,
            year: input.year,
            reading_time: input.readingTime,
            link: input.link || null
          })
          .eq('id', dbId)
          .select('*')
          .single(),
      { timeout: 8000, retries: 1, operationName: 'updateReadingItem' }
    );

    if (error) {
      console.error('Error updating reading item:', error);
      return { data: null, error: new Error(formatQueryError(error)) };
    }

    return { data: toEntry(data as ReadingItemRecord), error: null };
  } catch (error) {
    console.error('Error in updateReadingItem:', error);
    return { data: null, error: new Error(formatQueryError(error)) };
  }
}

export async function deleteReadingItem(dbId: string): Promise<VoidResult> {
  if (!isSupabaseConfigured()) {
    return { error: new Error('Supabase no configurado') };
  }

  try {
    const { error } = await robustQuery(
      () => supabase.from('reading_items').delete().eq('id', dbId),
      { timeout: 8000, retries: 1, operationName: 'deleteReadingItem' }
    );

    if (error) {
      console.error('Error deleting reading item:', error);
      return { error: new Error(formatQueryError(error)) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteReadingItem:', error);
    return { error: new Error(formatQueryError(error)) };
  }
}
