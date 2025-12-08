import { supabase } from '../utils/supabase';
import { robustQuery } from '../utils/queryHelpers';
import { type HospitalContext } from '../types';
import { type CSVRow } from '../utils/csvParser';

export interface ValidationIssue {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface ImportSummary {
  totalRows: number;
  newPatients: number;
  updates: number;
  errors: number;
  warnings: number;
}

export interface ImportValidationResult {
  valid: boolean;
  summary: ImportSummary;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  parsedData: ParsedPatient[];
}

export interface ParsedPatient {
  row: number;
  isUpdate: boolean;
  patientId?: string;
  mapped: WardRoundPatientPayload;
  existingPatient?: WardRoundPatientRecord;
}

export interface WardRoundPatientPayload {
  cama: string;
  dni: string;
  nombre: string;
  edad: string;
  antecedentes: string;
  motivo_consulta: string;
  examen_fisico: string;
  estudios: string;
  severidad: string;
  diagnostico: string;
  plan: string;
  fecha: string;
  hospital_context: HospitalContext;
}

export interface WardRoundPatientRecord extends WardRoundPatientPayload {
  id?: string;
  pendientes?: string;
  image_thumbnail_url?: string[];
  image_full_url?: string[];
  exa_url?: (string | null)[];
  assigned_resident_id?: string | null;
  display_order?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ImportProcessError {
  row: number;
  dni: string;
  message: string;
}

export interface ImportProcessResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ImportProcessError[];
}

const SEVERITY_VALUES = new Set(['I', 'II', 'III', 'IV', 'V']);

const getValue = (row: CSVRow, keys: string[]): string => {
  for (const key of keys) {
    if (row[key]) return String(row[key]).trim();
  }
  return '';
};

export const mapCSVRowToPatient = (
  row: CSVRow,
  fecha: string,
  hospitalContext: HospitalContext
): WardRoundPatientPayload => {
  return {
    cama: getValue(row, ['CAMA']),
    dni: getValue(row, ['DNI']),
    nombre: getValue(row, ['NOMBRE']),
    edad: getValue(row, ['EDAD']),
    antecedentes: getValue(row, ['ANT']),
    motivo_consulta: getValue(row, ['MC']),
    examen_fisico: getValue(row, ['EF/NIHSS/ABCD2']),
    estudios: getValue(row, ['EC']),
    severidad: getValue(row, ['SEV']).toUpperCase(),
    diagnostico: getValue(row, ['DX']),
    plan: getValue(row, ['PLAN']),
    fecha,
    hospital_context: hospitalContext
  };
};

export const validateCSVData = async (
  rows: CSVRow[],
  fecha: string,
  hospitalContext: HospitalContext
): Promise<ImportValidationResult> => {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const parsedData: ParsedPatient[] = [];
  let newPatients = 0;
  let updates = 0;

  for (let index = 0; index < rows.length; index++) {
    const rowNumber = index + 4; // Account for skipped header rows
    const mapped = mapCSVRowToPatient(rows[index], fecha, hospitalContext);

    if (!mapped.cama) {
      errors.push({ row: rowNumber, field: 'CAMA', message: 'Cama es requerida' });
    }
    if (!mapped.dni) {
      errors.push({ row: rowNumber, field: 'DNI', message: 'DNI es requerido' });
    }
    if (!mapped.nombre) {
      errors.push({ row: rowNumber, field: 'NOMBRE', message: 'Nombre es requerido' });
    }
    if (mapped.edad === '') {
      warnings.push({ row: rowNumber, field: 'EDAD', message: 'Edad faltante' });
    }

    if (mapped.severidad && !SEVERITY_VALUES.has(mapped.severidad.toUpperCase())) {
      errors.push({
        row: rowNumber,
        field: 'SEV',
        message: 'Severidad debe ser I, II, III, IV o V',
        value: mapped.severidad
      });
    }

    let duplicateCheck: DuplicateCheckResult = { exists: false };
    if (mapped.dni) {
      duplicateCheck = await checkDuplicateDNI(mapped.dni, hospitalContext);
    }

    if (duplicateCheck.exists) {
      updates += 1;
    } else {
      newPatients += 1;
    }

    parsedData.push({
      row: rowNumber,
      isUpdate: duplicateCheck.exists,
      patientId: duplicateCheck.patientId,
      existingPatient: duplicateCheck.patientData,
      mapped
    });
  }

  return {
    valid: errors.length === 0,
    summary: {
      totalRows: rows.length,
      newPatients,
      updates,
      errors: errors.length,
      warnings: warnings.length
    },
    errors,
    warnings,
    parsedData
  };
};

interface DuplicateCheckResult {
  exists: boolean;
  patientId?: string;
  patientData?: WardRoundPatientRecord;
}

export const checkDuplicateDNI = async (
  dni: string,
  hospitalContext: HospitalContext
): Promise<DuplicateCheckResult> => {
  try {
    const result: any = await robustQuery(
      () => supabase
        .from('ward_round_patients')
        .select('*')
        .eq('dni', dni)
        .eq('hospital_context', hospitalContext)
        .limit(1),
      { timeout: 5000, retries: 1, operationName: 'checkDuplicateDNI' }
    );

    const { data, error } = result;
    if (error) throw error;

    if (data && data.length > 0) {
      return { exists: true, patientId: data[0].id, patientData: data[0] as WardRoundPatientRecord };
    }

    return { exists: false };
  } catch (error: any) {
    console.error('[wardRoundsImportService] Error checking DNI duplicate:', error);
    throw error;
  }
};

const fetchExistingPatient = async (id: string): Promise<WardRoundPatientRecord | null> => {
  const result: any = await robustQuery(
    () => supabase
      .from('ward_round_patients')
      .select('*')
      .eq('id', id)
      .single(),
    { timeout: 8000, retries: 1, operationName: 'fetchExistingWardPatient' }
  );

  const { data, error } = result;
  if (error) {
    console.error('[wardRoundsImportService] Error fetching existing patient:', error);
    return null;
  }
  return data as WardRoundPatientRecord;
};

const applyPreservedFields = (
  mapped: WardRoundPatientPayload,
  existing?: WardRoundPatientRecord
) => {
  return {
    cama: mapped.cama,
    dni: mapped.dni,
    nombre: mapped.nombre,
    edad: mapped.edad,
    antecedentes: mapped.antecedentes,
    motivo_consulta: mapped.motivo_consulta,
    examen_fisico: mapped.examen_fisico,
    estudios: mapped.estudios,
    severidad: mapped.severidad,
    diagnostico: mapped.diagnostico,
    plan: mapped.plan,
    fecha: mapped.fecha,
    hospital_context: mapped.hospital_context,
    pendientes: existing?.pendientes ?? '',
    image_thumbnail_url: existing?.image_thumbnail_url ?? [],
    image_full_url: existing?.image_full_url ?? [],
    exa_url: existing?.exa_url ?? [],
    assigned_resident_id: existing?.assigned_resident_id ?? null,
    display_order: existing?.display_order ?? null
  };
};

export const processImport = async (rows: ParsedPatient[]): Promise<ImportProcessResult> => {
  let imported = 0;
  let failed = 0;
  const errors: ImportProcessError[] = [];

  for (const row of rows) {
    try {
      if (row.isUpdate && row.patientId) {
        const existing = row.existingPatient || (await fetchExistingPatient(row.patientId));
        if (!existing) {
          throw new Error('Paciente no encontrado para actualizar');
        }

        const updatePayload = applyPreservedFields(row.mapped, existing);
        const result: any = await robustQuery(
          () => supabase
            .from('ward_round_patients')
            .update(updatePayload)
            .eq('id', row.patientId)
            .select()
            .single(),
          { timeout: 10000, retries: 2, operationName: 'updateWardRoundPatient' }
        );

        if (result.error) throw result.error;
      } else {
        if (row.isUpdate && !row.patientId) {
          throw new Error('No se encontro el ID del paciente para actualizar');
        }

        const insertPayload = applyPreservedFields(row.mapped, {
          pendientes: '',
          image_thumbnail_url: [],
          image_full_url: [],
          exa_url: [],
          assigned_resident_id: null,
          display_order: null,
          ...row.mapped
        });

        const result: any = await robustQuery(
          () => supabase
            .from('ward_round_patients')
            .insert([insertPayload])
            .select()
            .single(),
          { timeout: 10000, retries: 2, operationName: 'insertWardRoundPatient' }
        );

        if (result.error) throw result.error;
      }

      imported += 1;
    } catch (error: any) {
      failed += 1;
      errors.push({
        row: row.row,
        dni: row.mapped.dni,
        message: error?.message || 'Error desconocido durante la importacion'
      });
    }

    await delay(100);
  }

  return {
    success: failed === 0,
    imported,
    failed,
    errors
  };
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
