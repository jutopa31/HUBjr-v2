import type { Patient } from "../types/patients";
import { createClient } from "@supabase/supabase-js";

export type PatientsQuery = {
  search?: string;
  service?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export type PatientsResponse = { data: Patient[]; total: number; error?: string };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA;

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export async function fetchPatients(query: PatientsQuery = {}): Promise<PatientsResponse> {
  const { page = 1, pageSize = 20, search, service, status } = query;
  if (!supabase) return { data: [], total: 0, error: "Supabase not configured" };

  try {
    const from = SUPABASE_SCHEMA
      ? supabase.schema(SUPABASE_SCHEMA).from("patients")
      : supabase.from("patients");

    let req = from.select("id,name,mrn,age,service,status", { count: "exact" });

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      req = req.or(`name.ilike.${s},mrn.ilike.${s}`);
    }
    if (service) req = req.eq("service", service);
    if (status) req = req.eq("status", status);

    const fromIdx = (page - 1) * pageSize;
    const toIdx = fromIdx + pageSize - 1;
    const { data, count, error } = await req.range(fromIdx, toIdx);
    if (error) return { data: [], total: 0, error: error.message };
    return { data: (data || []) as Patient[], total: count || 0 };
  } catch (e: any) {
    return { data: [], total: 0, error: e?.message || "Unknown error" };
  }
}

export async function fetchPatientById(id: string): Promise<Patient | null> {
  if (!supabase) return null;
  try {
    const from = SUPABASE_SCHEMA
      ? supabase.schema(SUPABASE_SCHEMA).from("patients")
      : supabase.from("patients");
    const { data, error } = await from
      .select("id,name,mrn,age,service,status")
      .eq("id", id)
      .single();
    if (error) return null;
    return data as Patient;
  } catch {
    return null;
  }
}
