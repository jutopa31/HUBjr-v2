import { supabase } from '../utils/supabase';

const BUCKET_NAME = 'ward-images';

export type UploadedImage = {
  publicUrl: string;
  signedUrl?: string;
  path: string;
};

function buildPath(patientId: string, fileName: string) {
  // Normalizar caracteres especiales (ñ, tildes, etc.)
  const normalized = fileName
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Eliminar marcas diacríticas (tildes)
    .replace(/ñ/gi, 'n') // Reemplazar ñ por n
    .replace(/\s+/g, '-') // Espacios a guiones
    .toLowerCase();

  // Mantener solo caracteres seguros (alfanuméricos, guiones, puntos)
  const safeName = normalized.replace(/[^a-z0-9.-]/g, '');

  return `patients/${patientId}/${Date.now()}-${safeName}`;
}

export async function uploadImageToStorage(file: File, patientId: string): Promise<UploadedImage> {
  if (!patientId) {
    throw new Error('El paciente no tiene ID; no se puede subir la imagen.');
  }

  const path = buildPath(patientId, file.name);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/jpeg'
    });

  if (uploadError) {
    throw uploadError;
  }

  // Intentar obtener URL pública; si el bucket es privado, getPublicUrl aún devuelve una ruta firmable
  const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  const publicUrl = publicData?.publicUrl;

  let signedUrl: string | undefined;
  try {
    const { data: signed } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(path, 60 * 60 * 24 * 7); // 7 días
    signedUrl = signed?.signedUrl;
  } catch (e) {
    // Si falla, seguimos con publicUrl
    console.warn('[storageService] No se pudo generar URL firmada', e);
  }

  return {
    publicUrl: publicUrl || '',
    signedUrl,
    path
  };
}

/**
 * Subir múltiples imágenes en paralelo
 * @param files - Array de archivos File para subir
 * @param patientId - ID del paciente para generar rutas
 * @returns Promise con array de UploadedImage
 */
export async function uploadMultipleImagesToStorage(
  files: File[],
  patientId: string
): Promise<UploadedImage[]> {
  if (!patientId) {
    throw new Error('El paciente no tiene ID; no se puede subir la imagen.');
  }
  if (files.length === 0) return [];

  // Upload paralelo para mejor performance
  const uploadPromises = files.map(file => uploadImageToStorage(file, patientId));

  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('[storageService] Error uploading multiple images:', error);
    throw new Error(`Error al subir imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Eliminar imagen del storage
 * @param path - Ruta de la imagen en el storage
 */
export async function deleteImageFromStorage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

  if (error) {
    console.error('[storageService] Error deleting image:', error);
    throw error;
  }
}
