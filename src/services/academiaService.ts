/**
 * academiaService.ts
 * Servicio para gestionar temas y clases académicas con timeout protection.
 */

import { supabase } from '../utils/supabase';

type ServiceResult<T> = { data: T | null; error: Error | null };
type ServiceVoidResult = { error: Error | null };

// =====================================================
// Constantes
// =====================================================

const TIMEOUT_MS = 12000; // 12 segundos timeout

// =====================================================
// Funciones Helper
// =====================================================

/**
 * Envuelve una promesa de Supabase con timeout protection.
 */
async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeoutMs))
  ]);
}

/**
 * Crea un error legible para el usuario.
 */
function toFriendlyError(error: any, fallbackMessage: string): Error {
  const rawMessage = typeof error?.message === 'string' ? error.message : '';
  if (rawMessage.toLowerCase().includes('timeout')) {
    return new Error('La solicitud tardó demasiado. Intenta nuevamente.');
  }
  return new Error(rawMessage || fallbackMessage);
}

/**
 * Normaliza una hora a HH:MM:SS para guardar en la base.
 */
export function normalizeTimeValue(time: string): string {
  if (!time) return '08:00:00';
  return time.length === 5 ? `${time}:00` : time;
}

// =====================================================
// Interfaces TypeScript
// =====================================================

export interface ClassTopic {
  id: string;
  topic_name: string;
  created_by: string;
  created_at: string;
}

export interface AcademicClass {
  id: string;
  topic_id: string | null;
  topic_name: string;
  class_date: string; // YYYY-MM-DD
  class_time: string; // HH:MM:SS
  instructor_email: string;
  instructor_name: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

// =====================================================
// Operaciones de Temas (ClassTopics)
// =====================================================

/**
 * Obtener todos los temas disponibles.
 */
export async function fetchTopics(): Promise<ServiceResult<ClassTopic[]>> {
  try {
    const { data, error } = await withTimeout(
      supabase.from('class_topics').select('*').order('topic_name', { ascending: true })
    );

    if (error) {
      console.error('Error fetching topics:', error);
      return { data: null, error: toFriendlyError(error, 'No pudimos cargar los temas') };
    }

    return { data: (data as ClassTopic[]) || [], error: null };
  } catch (error) {
    console.error('Error in fetchTopics:', error);
    return { data: null, error: toFriendlyError(error, 'No pudimos cargar los temas') };
  }
}

/**
 * Agregar un nuevo tema.
 */
export async function addTopic(topicName: string, userEmail: string): Promise<ServiceResult<ClassTopic>> {
  try {
    const normalizedName = topicName.trim();
    if (!normalizedName) {
      return { data: null, error: new Error('El nombre del tema no puede estar vacío') };
    }

    const { data, error } = await withTimeout(
      supabase
        .from('class_topics')
        .insert([{ topic_name: normalizedName, created_by: userEmail }])
        .select()
        .single()
    );

    if (error) {
      if (error.code === '23505') {
        console.warn('Topic already exists:', normalizedName);
        return { data: null, error: new Error('Este tema ya existe en la lista') };
      }
      console.error('Error adding topic:', error);
      return { data: null, error: toFriendlyError(error, 'No pudimos agregar el tema') };
    }

    console.log('Topic added successfully:', normalizedName);
    return { data: data as ClassTopic, error: null };
  } catch (error) {
    console.error('Error in addTopic:', error);
    return { data: null, error: toFriendlyError(error, 'No pudimos agregar el tema') };
  }
}

// =====================================================
// Operaciones de Clases (AcademicClasses)
// =====================================================

/**
 * Obtener todas las clases académicas.
 */
export async function fetchClasses(): Promise<ServiceResult<AcademicClass[]>> {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('academic_classes')
        .select('*')
        .order('class_date', { ascending: true })
        .order('class_time', { ascending: true })
    );

    if (error) {
      console.error('Error fetching classes:', error);
      return { data: null, error: toFriendlyError(error, 'No pudimos cargar las clases') };
    }

    return { data: (data as AcademicClass[]) || [], error: null };
  } catch (error) {
    console.error('Error in fetchClasses:', error);
    return { data: null, error: toFriendlyError(error, 'No pudimos cargar las clases') };
  }
}

/**
 * Agregar una nueva clase.
 * created_by debe ser el user.id (auth.uid()) para cumplir RLS.
 */
export async function addClass(
  classData: Omit<AcademicClass, 'id' | 'created_at' | 'updated_at'>
): Promise<ServiceResult<AcademicClass>> {
  try {
    if (!classData.topic_name) {
      return { data: null, error: new Error('Debe seleccionar un tema') };
    }
    if (!classData.class_date) {
      return { data: null, error: new Error('Debe ingresar una fecha') };
    }
    if (!classData.instructor_email || !classData.created_by) {
      return { data: null, error: new Error('No se pudo identificar al usuario autenticado') };
    }

    const { data, error } = await withTimeout(
      supabase
        .from('academic_classes')
        .insert([{ ...classData, class_time: normalizeTimeValue(classData.class_time) }])
        .select()
        .single()
    );

    if (error) {
      console.error('Error adding class:', error);
      return { data: null, error: toFriendlyError(error, 'No pudimos registrar la clase') };
    }

    console.log('Class added successfully:', classData.topic_name);
    return { data: data as AcademicClass, error: null };
  } catch (error) {
    console.error('Error in addClass:', error);
    return { data: null, error: toFriendlyError(error, 'No pudimos registrar la clase') };
  }
}

/**
 * Actualizar una clase existente.
 * No alteramos created_by; RLS valida contra el owner actual.
 */
export async function updateClass(id: string, classData: Partial<AcademicClass>): Promise<ServiceResult<AcademicClass>> {
  try {
    if (!id) {
      return { data: null, error: new Error('ID de clase inválido') };
    }

    // No enviar created_by en updates para evitar pisar ownership
    const { created_by, ...rest } = classData;

    const { data, error } = await withTimeout(
      supabase
        .from('academic_classes')
        .update({
          ...rest,
          class_time: rest.class_time ? normalizeTimeValue(rest.class_time) : undefined
        })
        .eq('id', id)
        .select()
        .single()
    );

    if (error) {
      console.error('Error updating class:', error);
      return { data: null, error: toFriendlyError(error, 'No pudimos actualizar la clase') };
    }

    console.log('Class updated successfully:', id);
    return { data: data as AcademicClass, error: null };
  } catch (error) {
    console.error('Error in updateClass:', error);
    return { data: null, error: toFriendlyError(error, 'No pudimos actualizar la clase') };
  }
}

/**
 * Eliminar una clase.
 */
export async function deleteClass(id: string): Promise<ServiceVoidResult> {
  try {
    if (!id) {
      return { error: new Error('ID de clase inválido') };
    }

    const { error } = await withTimeout(supabase.from('academic_classes').delete().eq('id', id));

    if (error) {
      console.error('Error deleting class:', error);
      return { error: toFriendlyError(error, 'No pudimos eliminar la clase') };
    }

    console.log('Class deleted successfully:', id);
    return { error: null };
  } catch (error) {
    console.error('Error in deleteClass:', error);
    return { error: toFriendlyError(error, 'No pudimos eliminar la clase') };
  }
}

// =====================================================
// Funciones Helper de Formato
// =====================================================

/**
 * Formatea una fecha y hora para display en español.
 */
export function formatClassDateTime(date: string, time: string): string {
  try {
    const normalizedTime = normalizeTimeValue(time);
    const dateObj = new Date(`${date}T${normalizedTime}`);
    return dateObj.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return `${date} ${time}`;
  }
}

/**
 * Formatea solo la fecha para display.
 */
export function formatClassDate(date: string): string {
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return date;
  }
}

/**
 * Verifica si una clase es futura.
 */
export function isFutureClass(classDate: string, classTime: string): boolean {
  try {
    const classDateTime = new Date(`${classDate}T${normalizeTimeValue(classTime)}`);
    return classDateTime > new Date();
  } catch (error) {
    console.error('Error checking if class is future:', error);
    return false;
  }
}

/**
 * Verifica si el usuario es el creador de la clase.
 * userId debe ser auth.uid().
 */
export function isClassOwner(academicClass: AcademicClass, userId: string): boolean {
  return academicClass.created_by === userId;
}
