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
    return createClient(url, key);
  } catch {
    return null;
  }
}

export async function fetchPatients(query: PatientsQuery = {}): Promise<PatientsResponse> {
  const { page = 1, pageSize = 20, search, service, status } = query;
  const supabase = getSupabase();

  if (supabase) {
    try {
      let req = supabase.from("patients").select("id,name,mrn,age,service,status", { count: "exact" });
      if (search && search.trim()) {
        const s = `%${search.trim()}%`;
        req = req.or(`name.ilike.${s},mrn.ilike.${s}`);
      }
      if (service) req = req.eq("service", service);
      if (status) req = req.eq("status", status);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await req.range(from, to);
      if (error) return { data: [], total: 0, error: error.message };
      return { data: (data || []) as Patient[], total: count || 0 };
    } catch (e: any) {
      return { data: [], total: 0, error: e?.message || "Unknown error" };
    }
  }

  // Fallback mock
  const start = (page - 1) * pageSize;
  const mock: Patient[] = Array.from({ length: pageSize }, (_, i) => ({
    id: `${start + i + 1}`,
    name: `Patient ${start + i + 1}`,
    mrn: `MRN-${start + i + 1}`,
    age: 30 + ((start + i) % 20),
    service: service ?? "General",
    status: (status as any) ?? "active",
  }));
  return { data: mock, total: 200 };
}

export async function fetchPatientById(id: string): Promise<Patient | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("patients")
      .select("id,name,mrn,age,service,status")
      .eq("id", id)
      .single();
    if (error) return null;
    return data as Patient;
  }
  return {
    id,
    name: `Patient ${id}`,
    mrn: `MRN-${id}`,
    age: 40,
    service: "General",
    status: "active",
  };
}