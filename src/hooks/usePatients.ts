import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { fetchPatients, type PatientsQuery, type PatientsResponse } from "../services/patients";

const parseNumber = (v: string | string[] | undefined, d: number) => {
  const n = Array.isArray(v) ? v[0] : v;
  const x = n ? Number(n) : NaN;
  return Number.isFinite(x) && x > 0 ? x : d;
};

export function usePatients(initial: PatientsQuery = {}) {
  const router = useRouter();
  const [query, setQuery] = useState<PatientsQuery>(initial);
  const [data, setData] = useState<PatientsResponse>({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const { search, service, status, page, pageSize } = router.query;
    setQuery((q) => ({
      ...q,
      search: (Array.isArray(search) ? search[0] : search) ?? q.search,
      service: (Array.isArray(service) ? service[0] : service) ?? q.service,
      status: (Array.isArray(status) ? status[0] : status) ?? q.status,
      page: parseNumber(page, q.page ?? 1),
      pageSize: parseNumber(pageSize, q.pageSize ?? 20),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  useEffect(() => {
    if (!router.isReady) return;
    const { search, service, status, page = 1, pageSize = 20 } = query;
    const next = { pathname: router.pathname, query: { ...router.query } as Record<string, any> };
    next.query.search = search || undefined;
    next.query.service = service || undefined;
    next.query.status = status || undefined;
    next.query.page = page;
    next.query.pageSize = pageSize;
    router.replace(next, undefined, { shallow: true });
  }, [router.isReady, query.search, query.service, query.status, query.page, query.pageSize]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPatients(query)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e) => { if (!cancelled) setData({ data: [], total: 0, error: e?.message || "Unknown error" }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [JSON.stringify(query)]);

  const setPage = (page: number) => setQuery((q) => ({ ...q, page }));
  const setPageSize = (pageSize: number) => setQuery((q) => ({ ...q, pageSize, page: 1 }));
  const setSearch = (search: string) => setQuery((q) => ({ ...q, search, page: 1 }));
  const setService = (service?: string) => setQuery((q) => ({ ...q, service, page: 1 }));
  const setStatus = (status?: string) => setQuery((q) => ({ ...q, status, page: 1 }));

  const pageCount = useMemo(() => Math.ceil((data.total || 0) / (query.pageSize || 20)), [data.total, query.pageSize]);
  const rangeText = useMemo(() => {
    const p = query.page ?? 1;
    const ps = query.pageSize ?? 20;
    const total = data.total || 0;
    const start = total === 0 ? 0 : (p - 1) * ps + 1;
    const end = Math.min(total, p * ps);
    return `Showing ${start}-${end} of ${total}`;
  }, [query.page, query.pageSize, data.total]);

  return { query, data, loading, setPage, setPageSize, setSearch, setService, setStatus, pageCount, rangeText };
}