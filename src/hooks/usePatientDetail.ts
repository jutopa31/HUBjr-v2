import { useEffect, useState } from "react";
import { fetchPatientById } from "../services/patients";
import type { Patient } from "../types/patients";

export function usePatientDetail(id?: string) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) { setPatient(null); return; }
    let cancelled = false;
    setLoading(true);
    fetchPatientById(id).then((p) => { if (!cancelled) setPatient(p); }).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  return { patient, loading };
}