import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import PatientsFilters from "../../../src/components/patients/PatientsFilters";
import PatientsList from "../../../src/components/patients/PatientsList";
import PatientDetailDrawer from "../../../src/components/patients/PatientDetailDrawer";
import { usePatients } from "../../../src/hooks/usePatients";

const FF = process.env.NEXT_PUBLIC_HUBJR_USE_V3 === "true";

export default function PatientsPage() {
  const router = useRouter();
  if (!FF) return <div className="p-6">v3 disabled. Set NEXT_PUBLIC_HUBJR_USE_V3=true</div>;
  const { data, query, setSearch, setService, setStatus, setPage, setPageSize, pageCount, loading, rangeText } = usePatients({ page: 1, pageSize: 20 });
  const [selected, setSelected] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!router.isReady) return;
    const id = Array.isArray(router.query.id) ? router.query.id[0] : router.query.id;
    setSelected(id || undefined);
  }, [router.isReady, router.query.id]);

  const openDetail = (id: string) => {
    const next = { pathname: router.pathname, query: { ...router.query, id } } as const;
    router.replace(next, undefined, { shallow: true });
  };

  const closeDetail = () => {
    const nextQuery = { ...router.query } as Record<string, any>;
    delete nextQuery.id;
    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {data.error && (
        <div className="bg-red-50 text-red-700 border-b border-red-200 px-4 py-2 text-sm">{data.error} showing fallback if available.</div>
      )}
      <PatientsFilters
        search={query.search}
        service={query.service}
        status={query.status}
        onSearch={setSearch}
        onService={setService}
        onStatus={setStatus}
      />
      <div className="p-4 space-y-3">
        {loading && <div className="text-sm text-gray-500">Loading</div>}
        {!loading && data.data.length === 0 && <div className="text-sm text-gray-500">No patients found. Try adjusting filters.</div>}
        <PatientsList rows={data.data} onSelect={openDetail} />
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span>{rangeText}</span>
            <label className="inline-flex items-center gap-1">
              <span>Page size</span>
              <select className="border rounded px-2 py-1" value={query.pageSize ?? 20} onChange={(e) => setPageSize(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={(query.page ?? 1) <= 1} onClick={() => setPage(Math.max(1, (query.page ?? 1) - 1))}>Prev</button>
            <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={(query.page ?? 1) >= (pageCount || 1)} onClick={() => setPage((query.page ?? 1) + 1)}>Next</button>
          </div>
        </div>
      </div>
      <PatientDetailDrawer id={selected} onClose={closeDetail} />
    </div>
  );
}
