import { supabase } from '../utils/supabase';

const BUCKET_NAME = 'ward-images';

export type UploadedImage = {
  publicUrl: string;
  signedUrl?: string;
  path: string;
};

function buildPath(patientId: string, fileName: string) {
  const cleanName = fileName.replace(/\s+/g, '-').toLowerCase();
  return `patients/${patientId}/${Date.now()}-${cleanName}`;
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
