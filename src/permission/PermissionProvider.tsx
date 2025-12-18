/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { getEffectivePermissions } from "@/services/permissionService.js";
import {
  getCurrentCompanyId,
  setCurrentCompanyId,
  clearCurrentCompanyId,
} from "@/apiConfig.js";

type RoleVm = { roleId: number; name: string };

export type PermState = {
  companyId: string | null;
  loading: boolean;
  error?: string | null;

  codes: Set<string>;
  ids: Set<number>;
  roles: RoleVm[];

  refresh: (opts?: { force?: boolean }) => Promise<void>;
  can: (code: string) => boolean;
  canAny: (codes: string[]) => boolean;
  canAll: (codes: string[]) => boolean;

  clear: () => void;
};

const Ctx = createContext<PermState | null>(null);

type Props = {
  companyId?: string | null;
  userId: string;
  children: React.ReactNode;
  cacheTtlMs?: number;
};

/** cache theo (userId + companyId) để không bị dính quyền user khác */
type CacheItem = { at: number; codes: Set<string>; ids: Set<number>; roles: RoleVm[] };
const cache = new Map<string, CacheItem>();
const cacheKey = (uid: string, cid: string) => `${uid}::${cid}`;

export function PermissionProvider({
  companyId,
  userId,
  children,
  cacheTtlMs = 60_000,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState<Set<string>>(new Set());
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [roles, setRoles] = useState<RoleVm[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const effectiveCompanyId = companyId ?? getCurrentCompanyId() ?? null;

  const hardClearState = useCallback(() => {
    setCodes(new Set());
    setIds(new Set());
    setRoles([]);
    setErr(null);
  }, []);

  const clear = useCallback(() => {
    if (effectiveCompanyId) cache.delete(cacheKey(userId, effectiveCompanyId));
    hardClearState();
    clearCurrentCompanyId(); // ✅ clear header / context
  }, [effectiveCompanyId, userId, hardClearState]);

  const load = useCallback(
    async (opts?: { force?: boolean }) => {
      const cid = companyId ?? getCurrentCompanyId();
      if (!cid) {
        hardClearState();
        clearCurrentCompanyId();
        return;
      }

      // ✅ set header cho axios
      setCurrentCompanyId(cid);

      const key = cacheKey(userId, cid);
      const hit = cache.get(key);

      if (!opts?.force && hit && Date.now() - hit.at < cacheTtlMs) {
        setCodes(new Set(hit.codes));
        setIds(new Set(hit.ids));
        setRoles(hit.roles);
        setErr(null);
        return;
      }

      setLoading(true);
      setErr(null);

      try {
        const res = await getEffectivePermissions(cid, userId);
        const c = (res?.codes ?? []) as string[];
        const i = (res?.ids ?? []) as number[];
        const r = (res?.roles ?? []) as RoleVm[];

        if (!mounted.current) return;

        const cSet = new Set(c);
        const iSet = new Set(i);

        setCodes(cSet);
        setIds(iSet);
        setRoles(r);
        setErr(null);

        cache.set(key, { at: Date.now(), codes: new Set(cSet), ids: new Set(iSet), roles: r });
      } catch (e: any) {
        if (!mounted.current) return;
        setErr(e?.message || "Load permissions failed");
        hardClearState();
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [companyId, userId, cacheTtlMs, hardClearState],
  );

  // load khi companyId/userId đổi
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, userId]);

  const api = useMemo<PermState>(() => {
    const can = (code: string) => !!code && codes.has(code);
    const canAny = (arr: string[]) => (arr ?? []).some((x) => codes.has(x));
    const canAll = (arr: string[]) => (arr ?? []).every((x) => codes.has(x));

    return {
      companyId: effectiveCompanyId,
      loading,
      error: err,
      codes,
      ids,
      roles,
      refresh: (opts) => load(opts),
      clear,
      can,
      canAny,
      canAll,
    };
  }, [effectiveCompanyId, loading, err, codes, ids, roles, load, clear]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePermissions() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePermissions must be used inside <PermissionProvider>");
  return ctx;
}

/** Helpers UI */
export function Can({
  code,
  children,
  fallback = null,
}: {
  code: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { can, loading } = usePermissions();
  if (loading) return null;
  return can(code) ? <>{children}</> : <>{fallback}</>;
}

export function CanAny({
  codes,
  children,
  fallback = null,
}: {
  codes: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { canAny, loading } = usePermissions();
  if (loading) return null;
  return canAny(codes) ? <>{children}</> : <>{fallback}</>;
}

export function CanAll({
  codes,
  children,
  fallback = null,
}: {
  codes: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { canAll, loading } = usePermissions();
  if (loading) return null;
  return canAll(codes) ? <>{children}</> : <>{fallback}</>;
}
