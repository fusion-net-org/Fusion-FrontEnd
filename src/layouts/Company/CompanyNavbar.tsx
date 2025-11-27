/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate, matchPath } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { getOwnerUser } from '@/services/userService.js';
import type { User } from '@/interfaces/User/User';
import { getCompanyById } from '@/services/companyService.js';
import logo_fusion from '@/assets/logo_fusion.png';

type PresetIcon = 'grid' | 'doc' | 'layers' | 'users' | 'shield' | 'settings' | 'partners' | 'workflow';

type SubItem = {
  name: string;
  to: string;
};

type Item = {
  key: string;
  label: string;
  to?: string;
  icon?: PresetIcon | React.ReactNode;
  children?: SubItem[];
};

type CompanyNavbarProps = {
  items?: Item[];
  ownerUserId?: string;
  isCollapsed?: boolean;
};

const Preset: Record<PresetIcon, React.ReactNode> = {
  grid: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
  workflow: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      {/* 3 step boxes */}
      <rect
        x="3.5"
        y="4"
        width="6.5"
        height="4.5"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="14"
        y="4"
        width="6.5"
        height="4.5"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="9"
        y="15.5"
        width="6.5"
        height="4.5"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      {/* flow lines */}
      <path
        d="M10 6.25h3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12.5 8.5v3.5c0 .8.6 1.5 1.4 1.5H14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* arrow heads */}
      <path
        d="M13.6 5.4 15 6.25l-1.4.85"
        fill="currentColor"
      />
      <path
        d="M13.2 12.4 14.6 13.5l-1.4.9"
        fill="currentColor"
      />
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
      <path
        d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M19.4 15a7.9 7.9 0 0 0 0-6M4.6 9a7.9 7.9 0 0 0 0 6"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
  partners: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4 18c0-2.2 2-4 4-4s4 1.8 4 4M12 18c0-2.2 2-4 4-4s4 1.8 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
};

const defaultItems: Item[] = [
  { key: 'company-detail', label: 'Company Detail', to: '/company/:companyId', icon: 'settings' },
  {
    key: 'access-role',
    label: 'Access Role',
    to: '/companies/:companyId/access-role',
    icon: 'grid',
  },
  {
    key: 'projects',
    label: 'Projects',
    to: '/companies/:companyId/project',
    icon: 'layers',
    children: [{ name: 'All project', to: '/companies/:companyId/project' }],
  },
  {
    key: 'project-request',
    label: 'Project Request',
    to: '/company/:companyId/project-request',
    icon: 'layers',
  },
  {
    key: 'ticket',
    label: 'Ticket',
    to: '/company/:companyId/ticket',
    icon: 'layers',
  },
  {
    key: 'project-request-detail',
    label: 'Request Detail',
    to: '/company/:companyId/project-request/:id',
    icon: 'layers',
  },
  { key: 'partners', label: 'Partners', to: '/company/:companyId/partners', icon: 'partners' },
  {
    key: 'partner-detail',
    label: 'Partner Details',
    to: '/company/partners/:id',
    icon: 'partners',
  },
  { key: 'members', label: 'Members', to: '/company/:companyId/members', icon: 'users' },
  {
    key: 'member-detail',
    label: 'Member Detail',
    to: '/company/members/:id',
    icon: 'users',
  },
  {
    key: 'subscription',
    label: 'Subscription',
    to: '/company/:companyId/subscription',
    icon: 'doc',
  },
   {
    key: 'workflow',
    label: 'Workflows',
    to: '/companies/:companyId/workflows',
    icon: 'workflow',
  },
];

const isPresetIcon = (value: unknown): value is PresetIcon => {
  return typeof value === 'string' && value in Preset;
};

const CompanyNavbar: React.FC<CompanyNavbarProps> = ({
  items = defaultItems,
  ownerUserId: ownerUserIdProp,
  isCollapsed = false,
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { companyId, id } = useParams();

  const [ownerUserId, setOwnerUserId] = useState<string | null>(ownerUserIdProp ?? null);
  const [company, setCompany] = useState<any>(null);
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userIdLogin = user?.id as string | undefined;

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  useEffect(() => {
    if (ownerUserIdProp) {
      setOwnerUserId(ownerUserIdProp);
    }
  }, [ownerUserIdProp]);

  useEffect(() => {
    const fetchOwnerUser = async () => {
      try {
        if (!userIdLogin || !companyId || ownerUserIdProp) return;
        const response = await getOwnerUser(companyId);
        const data: User = response?.data || null;
        setOwnerUserId(data?.id || null);
      } catch (err) {
        console.error('Error fetching owner user:', err);
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
        console.error('Error fetching company info:', err);
      }
    };
    fetchCompany();
  }, [companyId]);

  const isOwner = !!(userIdLogin && ownerUserId && userIdLogin === ownerUserId);

  const isPartnerDetailPage = /^\/company\/partners\/[^/]+$/.test(pathname);
  const isMemberDetailPage = /^\/company\/members\/[^/]+$/.test(pathname);
  const isProjectRequestDetailPage = /^\/company\/[^/]+\/project-request\/[^/]+$/.test(pathname);

  let visibleItems: Item[] = [];

  if (isPartnerDetailPage) {
    visibleItems = items.filter((i) => i.key === 'partner-detail');
  } else if (isMemberDetailPage) {
    visibleItems = items.filter((i) => i.key === 'member-detail');
  } else if (isProjectRequestDetailPage) {
    visibleItems = items.filter((i) => i.key === 'project-request-detail');
  } else if (isOwner) {
    visibleItems = items.filter(
      (i) =>
        i.key !== 'partner-detail' &&
        i.key !== 'member-detail' &&
        i.key !== 'project-request-detail',
    );
  } else {
    visibleItems = items.filter((i) => i.key === 'company-detail');
  }

  const resolvePath = (template?: string) => {
    if (!template) return '';
    let result = template;
    if (companyId) result = result.replace(':companyId', companyId);
    if (id) result = result.replace(':id', id).replace(':Id', id);
    return result;
  };

  const renderIcon = (icon: Item['icon'], active: boolean) => {
    if (!icon) return null;

    const baseCls = `w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
      active ? 'text-blue-600' : 'text-gray-500'
    }`;

    if (isPresetIcon(icon)) {
      return <span className={baseCls}>{Preset[icon]}</span>;
    }

    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement<any>, {
        className: `${baseCls} ${(icon.props as any)?.className ?? ''}`.trim(),
      });
    }

    return <span className={baseCls}>{icon}</span>;
  };

  return (
    <aside
      className={`flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 h-screen ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-4 flex flex-col h-full">
        {company && (
          <div className="flex items-center gap-3 p-3  rounded-md border-gray-300 bg-white dark:bg-gray-800">
            <img
              src={company.avatarCompany || logo_fusion}
              alt="Logo công ty"
              className="w-10 h-10 border rounded-md object-cover flex-shrink-0
             shadow-sm ring-1 ring-gray-200 dark:ring-gray-700
             hover:shadow-md transition-shadow duration-200"
            />

            <div className="text-base font-semibold break-words">{company.name}</div>
          </div>
        )}

        <hr />

        {/* Menu */}
        <nav className="flex-1 flex flex-col space-y-1">
          <div
            style={{
              padding: '10px 12px',
              fontSize: '12.5px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: '#6b7280',
              textTransform: 'uppercase',
            }}
          >
            Menu
          </div>

          {visibleItems.map((it) => {
            const hasChildren = !!it.children?.length;
            const isOpen = openMenus.has(it.key);

            const routePath = resolvePath(it.to);
            const active =
              routePath && matchPath({ path: routePath, end: true }, pathname) !== null;

            const handleClick = () => {
              if (hasChildren) {
                toggleMenu(it.key);
              } else if (routePath) {
                navigate(routePath);
              }
            };

            return (
              <div key={it.key}>
                {/* Parent row */}
                <button
                  onClick={handleClick}
                  className={`
                    relative flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium 
                    transition-all duration-200 select-none
                    ${
                      active
                        ? 'bg-blue-600/10 text-blue-700 ring-1 ring-blue-500'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  title={isCollapsed ? it.label : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-blue-500 rounded-r-full" />
                  )}

                  {renderIcon(it.icon, !!active)}

                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{it.label}</span>

                      {hasChildren &&
                        (isOpen ? (
                          <ChevronDown className="w-4 h-4 opacity-70 transition-transform duration-200 rotate-180" />
                        ) : (
                          <ChevronRight className="w-4 h-4 opacity-70 transition-transform duration-200" />
                        ))}
                    </>
                  )}
                </button>

                {/* Submenu */}
                {!isCollapsed && hasChildren && isOpen && (
                  <div className="ml-6 mt-1 pl-3 border-l border-gray-200 dark:border-gray-700 space-y-1">
                    {it.children?.map((sub) => {
                      const subPath = resolvePath(sub.to);
                      if (!subPath) return null;

                      const subActive = pathname.startsWith(subPath);

                      return (
                        <button
                          key={sub.to}
                          onClick={() => navigate(subPath)}
                          className={`
                             w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200
                            ${
                              subActive
                                ? 'text-blue-600 dark:text-blue-400 font-medium'
                                : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                            }
                          `}
                        >
                          {sub.name}
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
};

export default CompanyNavbar;
