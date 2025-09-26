import React from "react";

type Props = {
  search: string | undefined;
  service?: string;
  status?: string;
  onSearch: (v: string) => void;
  onService: (v?: string) => void;
  onStatus: (v?: string) => void;
};

export default function PatientsFilters({ search, service, status, onSearch, onService, onStatus }: Props) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 border-b">
      <input
        className="flex-1 px-3 py-2 border rounded"
        placeholder="Search patients..."
        value={search ?? ""}
        onChange={(e) => onSearch(e.target.value)}
      />
      <select className="px-3 py-2 border rounded" value={service ?? ""} onChange={(e) => onService(e.target.value || undefined)}>
        <option value="">All Services</option>
        <option value="General">General</option>
        <option value="ICU">ICU</option>
      </select>
      <select className="px-3 py-2 border rounded" value={status ?? ""} onChange={(e) => onStatus(e.target.value || undefined)}>
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="discharged">Discharged</option>
        <option value="archived">Archived</option>
      </select>
    </div>
  );
}