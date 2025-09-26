import type { Patient } from "../types/patients";

export type PatientsQuery = {
  search?: string;
  service?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export type PatientsResponse = { data: Patient[]; total: number; error?: string };

function getSupabase() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require("@supabase/supabase-js");
    const client = createClient(url, key);
    const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA;
    return { client, schema } as const;
  } catch {
    return null;
  }
} = require("@supabase/supabase-js");
    return createClient(url, key);
  } catch {
    return null;
  }
}

export async function fetchPatients(query: PatientsQuery = {}): Promise<PatientsResponse> {
  const { page = 1, pageSize = 20, search, service, status } = query;
  const supabaseCtx = getSupabase();

  if (supabaseCtx) {
    try {
      const { client, schema } = supabaseCtx;
      const from = schema ? client.schema(schema).from("patients") : client.from("patients");
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
  const supabaseCtx = getSupabase();
  if (supabaseCtx) {
    try {
      const { client, schema } = supabaseCtx;
      const from = schema ? client.schema(schema).from("patients") : client.from("patients");
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