import React from "react";
import { usePatientDetail } from "../../hooks/usePatientDetail";

type Props = { id?: string; onClose: () => void };

export default function PatientDetailDrawer({ id, onClose }: Props) {
  const { patient, loading } = usePatientDetail(id);
  const open = !!id;
  return (
    <div className={`fixed top-0 right-0 h-full w-[420px] bg-white shadow-xl transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}>
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Patient Detail</h3>
        <button className="px-2 py-1 border rounded" onClick={onClose}>Close</button>
      </div>
      <div className="p-4">
        {loading && <p>Loading...</p>}
        {!loading && !patient && <p>No patient selected.</p>}
        {patient && (
          <div className="space-y-2">
            <div><span className="font-medium">Name:</span> {patient.name}</div>
            <div><span className="font-medium">MRN:</span> {patient.mrn}</div>
            <div><span className="font-medium">Age:</span> {patient.age}</div>
            <div><span className="font-medium">Service:</span> {patient.service}</div>
            <div><span className="font-medium">Status:</span> {patient.status}</div>
          </div>
        )}
      </div>
    </div>
  );
}