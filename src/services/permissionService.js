// src/services/permissionService.js
import { axiosInstance, getCurrentCompanyId } from '@/apiConfig';

/* ========================== Core loaders ========================== */

/** Roles của 1 user trong company */
export async function getMemberRoles(companyId, userId) {
console.log("[PermSvc] getMemberRoles", { companyId, userId });
  const { data } = await axiosInstance.get(
    `/companies/${companyId}/members/${userId}/roles`
  );
  const arr = data?.data ?? data ?? [];
  return arr.map((r) => ({
    roleId: Number(r.roleId ?? r.id),
    name: r.name ?? r.roleName ?? '',
    description: r.description ?? '',
  }));
}

/** Chi tiết role (có mảng permissions) */
export async function getRoleDetail(companyId, roleId) {
console.log("[PermSvc] getRoleDetail", { companyId, roleId });
  const { data } = await axiosInstance.get(
    `/companies/${companyId}/roles/${Number(roleId)}`
  );
  return data?.data ?? data ?? null;
}

/** Lấy danh sách permission codes của 1 role (đã lọc isAccess=true) */
export async function getRolePermissionCodes(companyId, roleId) {
  const d = await getRoleDetail(companyId, roleId);
  const perms = Array.isArray(d?.permissions) ? d.permissions : [];
  return perms
    .filter((p) => p?.isAccess !== false)
    .map((p) => p.functionCode || p.code)
    .filter(Boolean);
}

/* ========================== In-memory cache ========================== */
/** key: `${companyId}:${userId}` -> { codes:Set<string>, roleIds:Set<number>, roles:any[], ts:number } */
const cache = new Map();
const inflight = new Map(); // chống request trùng key

const keyOf = (companyId, userId) => `${companyId}:${userId}`;

/** Xoá cache theo companyId + userId; nếu không truyền → xoá hết */
export function clearPermissionCache(companyId, userId) {
  if (companyId && userId) cache.delete(keyOf(companyId, userId));
  else cache.clear();
}

/** Lấy nhanh từ cache hiện tại (dựa trên current company header) */
export function getCachedPermissions(companyId, userId) {
  const cid = companyId || getCurrentCompanyId();
  if (!cid || !userId)
    return { codes: new Set(), roleIds: new Set(), roles: [] };
  return (
    cache.get(keyOf(cid, userId)) || {
      codes: new Set(),
      roleIds: new Set(),
      roles: [],
    }
  );
}

/**
 * Tính / cache “effective permissions” cho (companyId, userId)
 * @param {string} companyId
 * @param {string|number} userId
 * @param {{force?: boolean, parallel?: boolean}} opts
 *  - force: bỏ qua cache, load lại
 *  - parallel: load quyền các role song song (mặc định: tuần tự để giảm tải)
 */
export async function getEffectivePermissions(
  companyId,
  userId,
  opts = { force: false, parallel: false }
) {
  const cid = companyId || getCurrentCompanyId();
  if (!cid || !userId)
    return { codes: new Set(), roleIds: new Set(), roles: [] };

  const k = keyOf(cid, userId);

  if (!opts.force && cache.has(k)) return cache.get(k);
  if (inflight.has(k)) return inflight.get(k);

  const runner = (async () => {
    const roles = await getMemberRoles(cid, userId);

    const codesSet = new Set();
    const roleIds = new Set();

    if (opts.parallel) {
      // load các role song song
      const tasks = roles.map(async (r) => {
        const rid = Number(r.roleId ?? r.id);
        roleIds.add(rid);
        const codes = await getRolePermissionCodes(cid, rid);
        codes.forEach((c) => codesSet.add(c));
      });
      await Promise.all(tasks);
    } else {
      // load tuần tự (an toàn với BE)
      for (const r of roles) {
        const rid = Number(r.roleId ?? r.id);
        roleIds.add(rid);
        const codes = await getRolePermissionCodes(cid, rid);
        codes.forEach((c) => codesSet.add(c));
      }
    }

    const result = { codes: codesSet, roleIds, roles, ts: Date.now() };
    cache.set(k, result);
    inflight.delete(k);
    return result;
  })();

  inflight.set(k, runner);
  return runner;
}

// Alias tương thích tên cũ
export const loadEffectivePermissions = getEffectivePermissions;

/* ========================== UI helpers ========================== */

export const has = (codesSet, code) => codesSet?.has?.(code) === true;
export const hasAny = (codesSet, ...codes) =>
  codes.some((c) => codesSet.has(c));
export const hasAll = (codesSet, ...codes) =>
  codes.every((c) => codesSet.has(c));

/* ========================== (Optional) tiện ích ========================== */

/** Preload quyền theo current company + userId (nếu bạn muốn gọi sớm) */
export async function preloadCurrentCompanyPermissions(userId, opts) {
  const cid = getCurrentCompanyId();
  if (!cid || !userId) return { codes: new Set(), roleIds: new Set(), roles: [] };
  return getEffectivePermissions(cid, userId, opts);
}
