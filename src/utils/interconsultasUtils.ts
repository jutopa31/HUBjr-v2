import { supabase } from './supabase';

export interface SimpleInterconsulta {
  nombre: string;
  dni: string;
  cama: string;
  fecha_interconsulta: string; // YYYY-MM-DD
  respuesta?: string;
}

// Guarda una interconsulta como paciente del Pase de Sala (ward_round_patients)
export async function saveToWardRounds(ic: SimpleInterconsulta): Promise<{ success: boolean; error?: string }>{
  try {
    console.log('[InterconsultasUtils] saveToWardRounds -> payload:', ic);
    const { error } = await supabase
      .from('ward_round_patients')
      .insert([
        {
          cama: ic.cama,
          dni: ic.dni,
          nombre: ic.nombre,
          edad: '',
          antecedentes: '',
          motivo_consulta: 'Interconsulta registrada',
          examen_fisico: '',
          estudios: '',
          severidad: '',
          diagnostico: '',
          plan: ic.respuesta || '',
          pendientes: '',
          fecha: ic.fecha_interconsulta,
          assigned_resident_id: null
        }
      ]);
    if (error) {
      console.error('[InterconsultasUtils] saveToWardRounds error:', error);
      return { success: false, error: error.message };
    }
    console.log('[InterconsultasUtils] saveToWardRounds -> success');
    return { success: true };
  } catch (e: any) {
    console.error('[InterconsultasUtils] saveToWardRounds unexpected error:', e);
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

// Guarda una interconsulta en pacientes guardados (diagnostic_assessments)
export async function saveToSavedPatients(ic: SimpleInterconsulta): Promise<{ success: boolean; error?: string }>{
  try {
    console.log('[InterconsultasUtils] saveToSavedPatients -> payload:', ic);
    const clinicalNotes = `INTERCONSULTA\n\nPaciente: ${ic.nombre} (DNI ${ic.dni})\nCama: ${ic.cama}\nFecha: ${ic.fecha_interconsulta}\n\nRespuesta: ${ic.respuesta || ''}`;

    const { error } = await supabase
      .from('diagnostic_assessments')
      .insert([
        {
          patient_name: ic.nombre,
          patient_age: '',
          patient_dni: ic.dni,
          clinical_notes: clinicalNotes,
          scale_results: [],
          hospital_context: 'Posadas',
          created_by: 'interconsulta',
          status: 'active'
        }
      ]);
    if (error) {
      console.error('[InterconsultasUtils] saveToSavedPatients error:', error);
      return { success: false, error: error.message };
    }
    console.log('[InterconsultasUtils] saveToSavedPatients -> success');
    return { success: true };
  } catch (e: any) {
    console.error('[InterconsultasUtils] saveToSavedPatients unexpected error:', e);
    return { success: false, error: e?.message || 'Unknown error' };
  }
}
