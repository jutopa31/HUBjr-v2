import React from "react";
import type { Patient } from "../../types/patients";

type Props = { rows: Patient[]; onSelect: (id: string) => void };

export default function PatientsList({ rows, onSelect }: Props) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left border-b">
          <th className="py-2">Name</th>
          <th>MRN</th>
          <th>Age</th>
          <th>Service</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => onSelect(p.id)}>
            <td className="py-2">{p.name}</td>
            <td>{p.mrn}</td>
            <td>{p.age}</td>
            <td>{p.service}</td>
            <td>{p.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}