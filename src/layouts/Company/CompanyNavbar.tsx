/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useParams, useNavigate, matchPath } from "react-router-dom";
import { ChevronDown, ChevronRight, Lock } from "lucide-react";

import { getOwnerUser } from "@/services/userService.js";
import type { User } from "@/interfaces/User/User";
import { getCompanyById } from "@/services/companyService.js";
import logo_fusion from "@/assets/logo_fusion.png";
import { usePermissions } from "@/permission/PermissionProvider";

type PresetIcon =
  | "grid"
  | "doc"
  | "layers"
  | "users"
  | "shield"
  | "settings"
  | "partners"
  | "workflow";

type SubItem = {
  name: string;
  to: string;
  perm?: string | string[];
};

type Item = {
  key: string;
  label: string;
  to?: string;
  icon?: PresetIcon | React.ReactNode;
  children?: SubItem[];
  perm?: string | string[];
};

type CompanyNavbarProps = {
  items?: Item[];
  ownerUserId?: string;
  isCollapsed?: boolean;
};

const Preset: Record<PresetIcon, React.ReactNode> = {
  grid: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  workflow: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <rect x="3.5" y="4" width="6.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="4" width="6.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="9" y="15.5" width="6.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6.25h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12.5 8.5v3.5c0 .8.6 1.5 1.4 1.5H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13.6 5.4 15 6.25l-1.4.85" fill="currentColor" />
      <path d="M13.2 12.4 14.6 13.5l-1.4.9" fill="currentColor" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M7 4h7l4 4v12H7zM14 4v4h4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M12 4l8 4-8 4-8-4 8-4z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 12l8 4 8-4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M16 11a4 4 0 1 0-8 0" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M19.4 15a7.9 7.9 0 0 0 0-6M4.6 9a7.9 7.9 0 0 0 0 6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  partners: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 18c0-2.2 2-4 4-4s4 1.8 4 4M12 18c0-2.2 2-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
};

const defaultItems: Item[] = [
  { key: "company-detail", label: "Company Detail", to: "/company/:companyId", icon: "settings"},
  { key: "access-role", label: "Access Role", to: "/companies/:companyId/access-role", icon: "grid", perm: "ROLE_LIST_VIEW" },
  { key: "projects", label: "Projects", to: "/companies/:companyId/project", icon: "layers", children: [{ name: "All project", to: "/companies/:companyId/project" }] },
  { key: "project-request", label: "Project Request", to: "/company/:companyId/project-request", icon: "layers", perm: "PRQ_LIST_VIEW" },
  { key: "ticket", label: "Ticket", to: "/company/:companyId/ticket", icon: "layers", perm: "TICKET_LIST_VIEW" },
  { key: "partners", label: "Partners", to: "/company/:companyId/partners", icon: "partners", perm: "PARTNER_LIST_VIEW" },
  { key: "members", label: "Members", to: "/company/:companyId/members", icon: "users", perm: "MEMBER_LIST_VIEW" },
  { key: "roles", label: "Roles", to: "/company/:companyId/roles", icon: "users", perm: "ROLE_LIST_VIEW" },
  { key: "workflow", label: "Workflows", to: "/companies/:companyId/workflows", icon: "workflow", perm: "WORKFLOW_LIST_VIEW" },
  { key: 'subscription', label: 'Subscription', to: '/company/:companyId/subscription', icon: 'doc', },
];

const isPresetIcon = (value: unknown): value is PresetIcon =>
  typeof value === "string" && value in Preset;

const toastWarn = (msg: string) => {
  const t: any = (globalThis as any).toast || (window as any).toast;
  if (t?.error) t.error(msg);
  else if (t?.warning) t.warning(msg);
  else console.warn(msg);
};

export default function CompanyNavbar({
  items = defaultItems,
  ownerUserId: ownerUserIdProp,
  isCollapsed = false,
}: CompanyNavbarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { companyId, id } = useParams<{ companyId: string; id?: string }>();

  const [ownerUserId, setOwnerUserId] = useState<string | null>(ownerUserIdProp ?? null);
  const [company, setCompany] = useState<any>(null);
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userIdLogin = user?.id as string | undefined;

  const { can, canAny, loading } = usePermissions();

  const hasPerm = useCallback(
    (perm?: string | string[]) => {
      if (!perm) return true;
      return Array.isArray(perm) ? canAny(perm) : can(perm);
    },
    [can, canAny],
  );

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  useEffect(() => {
    if (ownerUserIdProp) setOwnerUserId(ownerUserIdProp);
  }, [ownerUserIdProp]);

  useEffect(() => {
    const fetchOwnerUser = async () => {
      try {
        if (!userIdLogin || !companyId || ownerUserIdProp) return;
        const response = await getOwnerUser(companyId);
        const data: User = response?.data || null;
        setOwnerUserId(data?.id || null);
      } catch (err) {
        console.error("Error fetching owner user:", err);
      }
    };
    fetchOwnerUser();
  }, [userIdLogin, companyId, ownerUserIdProp]);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        if (!companyId) return;
        const response = await getCompanyById(companyId);
        setCompany(response?.data || null);
      } catch (err) {
        console.error("Error fetching company info:", err);
      }
    };
    fetchCompany();
  }, [companyId]);

  const isPartnerDetailPage = /^\/company\/[^/]+\/partners\/[^/]+$/.test(pathname);
  const isMemberDetailPage = /^\/company\/[^/]+\/members\/[^/]+$/.test(pathname);
  const isProjectRequestDetailPage = /^\/company\/[^/]+\/project-request\/[^/]+$/.test(pathname);

  const visibleItems: Item[] = useMemo(() => {
    if (isPartnerDetailPage) return items.filter((i) => i.key === "partners");
    if (isMemberDetailPage) return items.filter((i) => i.key === "members");
    if (isProjectRequestDetailPage) return items;
    return items;
  }, [items, isPartnerDetailPage, isMemberDetailPage, isProjectRequestDetailPage]);

  const resolvePath = (template?: string) => {
    if (!template) return "";
    let result = template;
    if (companyId) result = result.replace(":companyId", companyId);
    if (id) result = result.replace(":id", id).replace(":Id", id);
    return result;
  };

  const renderIcon = (icon: Item["icon"], active: boolean) => {
    if (!icon) return null;

    const baseCls = `w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
      active ? "text-blue-600" : "text-gray-500"
    }`;

    if (isPresetIcon(icon)) return <span className={baseCls}>{Preset[icon]}</span>;
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement<any>, {
        className: `${baseCls} ${(icon.props as any)?.className ?? ""}`.trim(),
      });
    }
    return <span className={baseCls}>{icon}</span>;
  };

  return (
    <aside
      className={`flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 h-screen ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="p-4 flex flex-col h-full">
        {company && (
          <div className="flex items-center gap-3 p-3 rounded-md border-gray-300 bg-white dark:bg-gray-800">
            <img
              src={company.avatarCompany || logo_fusion}
              alt="Logo công ty"
              className="w-10 h-10 border rounded-md object-cover flex-shrink-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 hover:shadow-md transition-shadow duration-200"
            />
            <div className="text-base font-semibold break-words">{company.name}</div>
          </div>
        )}

        <hr />

        <nav className="flex-1 flex flex-col space-y-1">
          <div
            style={{
              padding: "10px 12px",
              fontSize: "12.5px",
              fontWeight: 700,
              letterSpacing: "0.02em",
              color: "#6b7280",
              textTransform: "uppercase",
            }}
          >
            Menu
          </div>

          {/* ✅ KHÔNG FILTER theo permission */}
          {visibleItems.map((it) => {
            const hasChildren = !!it.children?.length;
            const isOpen = openMenus.has(it.key);

            const routePath = resolvePath(it.to);
            const active = routePath && matchPath({ path: routePath, end: true }, pathname) !== null;

            const allowed = !loading && hasPerm(it.perm);
            const denied = !loading && !allowed;

            const handleClick = () => {
              if (loading) return;

              if (denied) {
                toastWarn(`Bạn không có quyền truy cập: ${it.label}`);
                return;
              }

              if (hasChildren) toggleMenu(it.key);
              else if (routePath) navigate(routePath);
            };

            return (
              <div key={it.key}>
                <button
                  type="button"
                  onClick={handleClick}
                  aria-disabled={!allowed}
                  className={`
                    group relative flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200 select-none
                    min-w-0 overflow-hidden whitespace-nowrap
                    ${active ? "bg-blue-600/10 text-blue-700 ring-1 ring-blue-500" : "text-gray-700 hover:bg-gray-100"}
                    ${denied ? "opacity-55 cursor-not-allowed hover:bg-transparent" : ""}
                  `}
                  title={denied ? "No permission" : isCollapsed ? it.label : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-blue-500 rounded-r-full" />
                  )}

                  {renderIcon(it.icon, !!active)}

                  {!isCollapsed && (
                    <>
                      {/* ✅ 1 hàng: label (truncate) + lock icon (KHÔNG pill tag) */}
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="min-w-0 flex-1 text-left truncate whitespace-nowrap">
                          {it.label}
                        </span>

                        {denied && (
                          <span className="shrink-0 inline-flex items-center gap-1 text-amber-700">
                            <Lock className="h-4 w-4" />
                            {/* nếu muốn có chữ nhưng không thành “tag” => chỉ hiện khi hover */}
                            <span className="hidden group-hover:inline text-[10px] font-semibold whitespace-nowrap">
                              No permission
                            </span>
                          </span>
                        )}
                      </span>

                      {hasChildren &&
                        (isOpen ? (
                          <ChevronDown className="shrink-0 w-4 h-4 opacity-70 transition-transform duration-200 rotate-180" />
                        ) : (
                          <ChevronRight className="shrink-0 w-4 h-4 opacity-70 transition-transform duration-200" />
                        ))}
                    </>
                  )}
                </button>

                {!isCollapsed && hasChildren && isOpen && (
                  <div className="ml-6 mt-1 pl-3 border-l border-gray-200 dark:border-gray-700 space-y-1">
                    {it.children?.map((sub) => {
                      const subPath = resolvePath(sub.to);
                      if (!subPath) return null;

                      const subActive = pathname.startsWith(subPath);
                      const subAllowed = !loading && hasPerm(sub.perm ?? it.perm);
                      const subDenied = !loading && !subAllowed;

                      return (
                        <button
                          key={sub.to}
                          type="button"
                          onClick={() => {
                            if (loading) return;
                            if (subDenied) return toastWarn(`Bạn không có quyền truy cập: ${sub.name}`);
                            navigate(subPath);
                          }}
                          aria-disabled={!subAllowed}
                          className={`
                            group w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200
                            min-w-0 overflow-hidden whitespace-nowrap
                            ${subActive ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"}
                            ${subDenied ? "opacity-55 cursor-not-allowed hover:text-gray-600 dark:hover:text-gray-300" : ""}
                          `}
                          title={subDenied ? "No permission" : undefined}
                        >
                          {/* ✅ 1 hàng: sub name (truncate) + lock */}
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="min-w-0 flex-1 truncate whitespace-nowrap">{sub.name}</span>
                            {subDenied && (
                              <span className="shrink-0 inline-flex items-center gap-1 text-amber-700">
                                <Lock className="h-3 w-3" />
                                <span className="hidden group-hover:inline text-[10px] font-semibold whitespace-nowrap">
                                  No permission
                                </span>
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
