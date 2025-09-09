import { supabase } from './supabase';

export interface Patient {
  id?: string;
  nombre: string;
  dni: string;
  cama: string;
  severidad: string;
  pendientes: string;
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  due_date?: string;
  patient_id?: string;
  source?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Convierte la severidad del paciente a prioridad de tarea
 */
export const severityToPriority = (severidad: string): 'low' | 'medium' | 'high' => {
  switch (severidad) {
    case 'IV': return 'high';
    case 'III': return 'medium';
    case 'II': 
    case 'I': 
    default: return 'low';
  }
};

/**
 * Crea o actualiza una tarea basada en los pendientes de un paciente
 */
export const createOrUpdateTaskFromPatient = async (patient: Patient): Promise<boolean> => {
  if (!patient.pendientes || !patient.pendientes.trim()) {
    // Si no hay pendientes, marcar tarea existente como completada si existe
    await markPatientTaskAsCompleted(patient.id || '');
    return true;
  }

  try {
    // Buscar si ya existe una tarea para este paciente
    const { data: existingTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('source', 'ward_rounds');

    if (fetchError) {
      console.error('Error fetching existing tasks:', fetchError);
      return false;
    }

    const taskData = {
      title: `${patient.nombre} (${patient.cama}) - Pendientes`,
      description: patient.pendientes,
      priority: severityToPriority(patient.severidad),
      status: 'pending' as const,
      patient_id: patient.id,
      source: 'ward_rounds',
      updated_at: new Date().toISOString()
    };

    if (existingTasks && existingTasks.length > 0) {
      // Actualizar tarea existente
      const { error: updateError } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', existingTasks[0].id);

      if (updateError) {
        console.error('Error updating task:', updateError);
        return false;
      }
    } else {
      // Crear nueva tarea
      const { error: insertError } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          created_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('Error creating task:', insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in createOrUpdateTaskFromPatient:', error);
    return false;
  }
};

/**
 * Marca como completada la tarea de un paciente (cuando se borran sus pendientes)
 */
export const markPatientTaskAsCompleted = async (patientId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('patient_id', patientId)
      .eq('source', 'ward_rounds')
      .eq('status', 'pending'); // Solo marcar las pendientes

    if (error) {
      console.error('Error marking task as completed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markPatientTaskAsCompleted:', error);
    return false;
  }
};

/**
 * Sincroniza todos los pendientes del pase de sala con las tareas
 */
export const syncAllPendientes = async (): Promise<boolean> => {
  try {
    // Obtener todos los pacientes del pase de sala
    const { data: patients, error: patientsError } = await supabase
      .from('ward_round_patients')
      .select('id, nombre, dni, cama, severidad, pendientes');

    if (patientsError) {
      console.error('Error fetching patients:', patientsError);
      return false;
    }

    if (!patients || patients.length === 0) {
      return true; // No hay pacientes, pero no es un error
    }

    // Procesar cada paciente
    const results = await Promise.all(
      patients.map(patient => createOrUpdateTaskFromPatient(patient))
    );

    // Verificar si todas las operaciones fueron exitosas
    return results.every(result => result === true);
  } catch (error) {
    console.error('Error in syncAllPendientes:', error);
    return false;
  }
};

/**
 * Elimina una tarea cuando se completa desde la sección de pendientes
 * y opcionalmente limpia el campo pendientes del paciente
 */
export const completeTaskAndClearPatientPendientes = async (taskId: string, clearPatientPendientes: boolean = true): Promise<boolean> => {
  try {
    // Obtener información de la tarea
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('patient_id, source')
      .eq('id', taskId)
      .single();

    if (fetchError) {
      console.error('Error fetching task:', fetchError);
      return false;
    }

    if (!task || task.source !== 'ward_rounds') {
      // Si no es una tarea del pase de sala, solo marcar como completada
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      return !updateError;
    }

    // Marcar tarea como completada
    const { error: taskUpdateError } = await supabase
      .from('tasks')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (taskUpdateError) {
      console.error('Error updating task status:', taskUpdateError);
      return false;
    }

    // Si se debe limpiar los pendientes del paciente
    if (clearPatientPendientes && task.patient_id) {
      const { error: patientUpdateError } = await supabase
        .from('ward_round_patients')
        .update({ pendientes: '' })
        .eq('id', task.patient_id);

      if (patientUpdateError) {
        console.error('Error clearing patient pendientes:', patientUpdateError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in completeTaskAndClearPatientPendientes:', error);
    return false;
  }
};