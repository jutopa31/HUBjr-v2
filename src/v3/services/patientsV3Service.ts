import { supabase } from '../../utils/supabase';
import {
  PatientV3,
  PatientEntryForm,
  PatientDestination,
  ServiceResponse,
  DestinationCounts,
  PatientFilters,
  TransitionAction,
  DestinationHistoryEntry,
} from '../types/v3.types';

const TABLE_NAME = 'patients_v3';

// ============================================================
// CREATE Operations
// ============================================================

export async function createPatient(
  form: PatientEntryForm,
  destination: PatientDestination,
  hospitalContext: string = 'Posadas'
): Promise<ServiceResponse<PatientV3>> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const initialHistory: DestinationHistoryEntry[] = [
      {
        destination,
        entered_at: new Date().toISOString(),
      },
    ];

    const patientData = {
      dni: form.dni.trim(),
      nombre: form.nombre.trim(),
      cama: form.cama?.trim() || null,
      current_destination: destination,
      destinations_history: initialHistory,
      hospital_context: hospitalContext,
      user_id: userId,
      evoluciones: [],
      images: [],
    };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(patientData)
      .select()
      .single();

    if (error) throw error;
    return { data: data as PatientV3, error: null };
  } catch (error) {
    console.error('🔴 Error creating patient:', error);
    return { data: null, error: error as Error };
  }
}

// ============================================================
// READ Operations
// ============================================================

export async function getPatientsByDestination(
  destination: PatientDestination,
  hospitalContext: string = 'Posadas'
): Promise<ServiceResponse<PatientV3[]>> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('current_destination', destination)
      .eq('hospital_context', hospitalContext)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return { data: data as PatientV3[], error: null };
  } catch (error) {
    console.error('🔴 Error fetching patients by destination:', error);
    return { data: null, error: error as Error };
  }
}

export async function getPatientById(id: string): Promise<ServiceResponse<PatientV3>> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data: data as PatientV3, error: null };
  } catch (error) {
    console.error('🔴 Error fetching patient by ID:', error);
    return { data: null, error: error as Error };
  }
}

export async function searchPatients(
  filters: PatientFilters
): Promise<ServiceResponse<PatientV3[]>> {
  try {
    let query = supabase.from(TABLE_NAME).select('*');

    if (filters.destination) {
      query = query.eq('current_destination', filters.destination);
    }

    if (filters.hospital_context) {
      query = query.eq('hospital_context', filters.hospital_context);
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`nombre.ilike.${searchTerm},dni.ilike.${searchTerm}`);
    }

    if (filters.date_from) {
      query = query.gte('fecha_ingreso', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('fecha_ingreso', filters.date_to);
    }

    query = query.order('updated_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return { data: data as PatientV3[], error: null };
  } catch (error) {
    console.error('🔴 Error searching patients:', error);
    return { data: null, error: error as Error };
  }
}

export async function getDestinationCounts(
  hospitalContext: string = 'Posadas'
): Promise<ServiceResponse<DestinationCounts>> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('current_destination')
      .eq('hospital_context', hospitalContext);

    if (error) throw error;

    const counts: DestinationCounts = {
      interconsulta: 0,
      pase_sala: 0,
      post_alta: 0,
      ambulatorio: 0,
    };

    if (data) {
      data.forEach((patient: { current_destination: string }) => {
        const dest = patient.current_destination as PatientDestination;
        if (dest && counts[dest] !== undefined) {
          counts[dest]++;
        }
      });
    }

    return { data: counts, error: null };
  } catch (error) {
    console.error('🔴 Error fetching destination counts:', error);
    return { data: null, error: error as Error };
  }
}

// ============================================================
// UPDATE Operations
// ============================================================

export async function updatePatient(
  id: string,
  updates: Partial<PatientV3>
): Promise<ServiceResponse<PatientV3>> {
  try {
    // Remove fields that shouldn't be updated directly
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, created_at: _created_at, user_id: _user_id, ...updateData } = updates as Record<string, unknown>;

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as PatientV3, error: null };
  } catch (error) {
    console.error('🔴 Error updating patient:', error);
    return { data: null, error: error as Error };
  }
}

export async function transitionPatient(
  action: TransitionAction
): Promise<ServiceResponse<PatientV3>> {
  try {
    // First, get the current patient
    const { data: patient, error: fetchError } = await getPatientById(action.patient_id);
    if (fetchError || !patient) {
      throw fetchError || new Error('Patient not found');
    }

    // Update history - mark current as exited
    const history = [...(patient.destinations_history || [])];
    if (history.length > 0) {
      history[history.length - 1].exited_at = new Date().toISOString();
    }

    // Add new destination entry
    history.push({
      destination: action.to,
      entered_at: new Date().toISOString(),
    });

    // Build update object
    const updateData: Partial<PatientV3> = {
      current_destination: action.to,
      destinations_history: history,
    };

    // Set alta date if transitioning to post_alta
    if (action.to === 'post_alta' && !patient.fecha_alta) {
      updateData.fecha_alta = new Date().toISOString().split('T')[0];
    }

    const { data, error } = await updatePatient(action.patient_id, updateData);
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('🔴 Error transitioning patient:', error);
    return { data: null, error: error as Error };
  }
}

export async function addEvolutionNote(
  patientId: string,
  nota: string,
  aiAssisted: boolean = false
): Promise<ServiceResponse<PatientV3>> {
  try {
    const { data: patient, error: fetchError } = await getPatientById(patientId);
    if (fetchError || !patient) {
      throw fetchError || new Error('Patient not found');
    }

    const { data: userData } = await supabase.auth.getUser();

    const evoluciones = [...(patient.evoluciones || [])];
    evoluciones.push({
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
      nota,
      ai_assisted: aiAssisted,
      created_by: userData?.user?.email || undefined,
    });

    const { data, error } = await updatePatient(patientId, { evoluciones });
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('🔴 Error adding evolution note:', error);
    return { data: null, error: error as Error };
  }
}

// ============================================================
// DELETE Operations
// ============================================================

export async function deletePatient(id: string): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    console.error('🔴 Error deleting patient:', error);
    return { data: null, error: error as Error };
  }
}
