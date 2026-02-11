import { supabase } from '../utils/supabase';
import type { MediaCategory, MediaItem } from '../types/evolucionadorStructured';

const BUCKET_NAME = 'evolucionador-media';

const normalizeFileName = (fileName: string) => {
  const normalized = fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();

  return normalized.replace(/[^a-z0-9.-]/g, '');
};

const buildPath = (userId: string, fileName: string) => {
  const safeName = normalizeFileName(fileName || 'archivo');
  return `evolucionador/${userId}/${Date.now()}-${safeName}`;
};

const createSignedUrl = async (path: string) => {
  try {
    const { data } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(path, 60 * 60 * 24 * 7);
    return data?.signedUrl || '';
  } catch (error) {
    console.warn('[evolucionadorMediaService] No se pudo generar URL firmada', error);
    return '';
  }
};

const buildMediaItem = async (file: File, category: MediaCategory, path: string): Promise<MediaItem> => {
  const type = file.type.startsWith('video/') ? 'video' : 'image';
  const publicData = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `media-${Date.now()}-${Math.random()}`,
    storagePath: path,
    fileName: file.name,
    mimeType: file.type || (type === 'video' ? 'video/mp4' : 'image/jpeg'),
    size: file.size,
    category,
    type,
    createdAt: new Date().toISOString(),
    publicUrl: publicData.data?.publicUrl || '',
    signedUrl: await createSignedUrl(path)
  };
};

export async function uploadEvolucionadorMedia(
  file: File,
  userId: string,
  category: MediaCategory
): Promise<MediaItem> {
  if (!userId) {
    throw new Error('Usuario no autenticado para subir archivos.');
  }

  const path = buildPath(userId, file.name);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'application/octet-stream'
    });

  if (uploadError) {
    throw uploadError;
  }

  return buildMediaItem(file, category, path);
}

export async function uploadMultipleMedia(
  files: File[],
  userId: string,
  category: MediaCategory
): Promise<MediaItem[]> {
  if (!userId) {
    throw new Error('Usuario no autenticado para subir archivos.');
  }
  if (files.length === 0) return [];

  const uploadPromises = files.map(file => uploadEvolucionadorMedia(file, userId, category));
  return Promise.all(uploadPromises);
}

export async function deleteEvolucionadorMedia(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
  if (error) {
    console.error('[evolucionadorMediaService] Error eliminando media:', error);
    throw error;
  }
}

export async function refreshSignedUrls(items: MediaItem[]): Promise<MediaItem[]> {
  const updated = await Promise.all(
    items.map(async item => {
      if (!item.storagePath) return item;
      const signedUrl = await createSignedUrl(item.storagePath);
      return { ...item, signedUrl: signedUrl || item.signedUrl };
    })
  );

  return updated;
}
