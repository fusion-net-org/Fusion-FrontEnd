import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getEffectivePermissions, clearCurrentCompanyId } from "@/services/permissionService.js";
import { setCurrentCompanyId } from "@/utils/companyContext";

type PermState = {
  companyId: string | null;
  loading: boolean;
  error?: string | null;
  codes: Set<string>;
  ids: Set<number>;
  roles: Array<{ roleId: number; name: string }>;
  refresh: () => Promise<void>;
  can: (code: string) => boolean;
  canAny: (codes: string[]) => boolean;
  canAll: (codes: string[]) => boolean;
  clear: () => void;
};

const Ctx = createContext<PermState | null>(null);

type Props = {
  companyId?: string | null;
  userId: string;               // Truyền vào (lấy từ token "sub" hoặc từ state app)
  children: React.ReactNode;
  /** Optional: cache theo companyId để back/forward nhanh hơn */
  cacheTtlMs?: number;
};

type CacheItem = { at: number; codes: Set<string>; ids: Set<number>; roles: any[] };
const cache = new Map<string, CacheItem>();

export function PermissionProvider({ companyId, userId, children, cacheTtlMs = 60_000 }: Props) {
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState<Set<string>>(new Set());
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [roles, setRoles] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const clear = () => {
    setCodes(new Set()); setIds(new Set()); setRoles([]); setErr(null);
  };

  const load = async () => {
    if (!companyId) { clear(); clearCurrentCompanyId();   return; }

    // set header cho axios
    setCurrentCompanyId(companyId);

    // cache theo company
    const hit = cache.get(companyId);
    if (hit && Date.now() - hit.at < cacheTtlMs) {
      setCodes(new Set(hit.codes)); setIds(new Set(hit.ids)); setRoles(hit.roles); setErr(null);
      return;
    }

    setLoading(true); setErr(null);
    try {
      const { codes: c, ids: i, roles: r } = await getEffectivePermissions(companyId, userId);
      if (!mounted.current) return;
      setCodes(new Set(c)); setIds(new Set(i)); setRoles(r);
      cache.set(companyId, { at: Date.now(), codes: new Set(c), ids: new Set(i), roles: r });
    } catch (e: any) {
      if (!mounted.current) return;
      setErr(e?.message || "Load permissions failed");
      clear();
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  // load khi companyId/userId đổi
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [companyId, userId]);

  const api = useMemo<PermState>(() => ({
    companyId: companyId ?? null,
    loading,
    error: err,
    codes, ids, roles,
    refresh: load,
    clear: () => { cache.delete(companyId ?? ""); clear(); setCurrentCompanyId(); },
    can: (code: string) => codes.has(code),
    canAny: (arr: string[]) => arr.some(c => codes.has(c)),
    canAll: (arr: string[]) => arr.every(c => codes.has(c)),
  }), [companyId, loading, err, codes, ids, roles]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePermissions() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePermissions must be used inside <PermissionProvider>");
  return ctx;
}

// Component tiện dụng
export function Can({ code, children, fallback = null }: { code: string; children: React.ReactNode; fallback?: React.ReactNode }) {
  const { can, loading } = usePermissions();
  if (loading) return null;           // tránh flicker, tuỳ bạn muốn skeleton
  return can(code) ? <>{children}</> : <>{fallback}</>;
}

export function CanAny({ codes, children, fallback = null }: { codes: string[]; children: React.ReactNode; fallback?: React.ReactNode }) {
  const { canAny, loading } = usePermissions();
  if (loading) return null;
  return canAny(codes) ? <>{children}</> : <>{fallback}</>;
}
