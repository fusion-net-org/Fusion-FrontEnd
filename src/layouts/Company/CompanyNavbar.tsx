/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useParams, matchPath } from 'react-router-dom';
import { getOwnerUser } from '@/services/userService.js';
import type { User } from '@/interfaces/User/User';

type PresetIcon = 'grid' | 'doc' | 'layers' | 'users' | 'shield' | 'settings' | 'partners';
type Item = { key: string; label: string; to: string; icon?: PresetIcon | React.ReactNode };

const Preset: Record<PresetIcon, React.ReactNode> = {
  grid: (
    <svg viewBox="0 0 24 24" className="cmp-nav__svg" fill="none">
      <path
        d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" className="cmp-nav__svg" fill="none">
      <path d="M7 4h7l4 4v12H7zM14 4v4h4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" className="cmp-nav__svg" fill="none">
      <path d="M12 4l8 4-8 4-8-4 8-4z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 12l8 4 8-4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" className="cmp-nav__svg" fill="none">
      <path d="M16 11a4 4 0 1 0-8 0" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" className="cmp-nav__svg" fill="none">
      <path
        d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" className="cmp-nav__svg" fill="none">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M19.4 15a7.9 7.9 0 0 0 0-6M4.6 9a7.9 7.9 0 0 0 0 6"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
  partners: (
    <svg viewBox="0 0 24 24" className="cmp-nav__svg" fill="none">
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
  { key: 'projects', label: 'Projects', to: '/company/:companyId/project', icon: 'layers' },
  {
    key: 'project-request',
    label: 'Project Request',
    to: '/company/:companyId/project-request',
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
  { key: 'member-detail', label: 'Member Detail', to: '/company/members/:Id', icon: 'users' },
];

export default function CompanyNavbar({
  items = defaultItems,
}: {
  items?: Item[];
  ownerUserId?: string;
}) {
  const { pathname } = useLocation();
  const { companyId, id } = useParams();
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userIdLogin = user?.id;

  useEffect(() => {
    const fetchOwnerUser = async () => {
      try {
        if (!userIdLogin) return;
        const response = await getOwnerUser(companyId);
        const data: User = response?.data || null;
        setOwnerUserId(data.id || null);
      } catch (err) {
        console.error('Error fetching owner user:', err);
      }
    };
    fetchOwnerUser();
  }, [userIdLogin, companyId]);

  const isOwner = userIdLogin && ownerUserId && userIdLogin === ownerUserId;

  const isPartnerDetailPage = /^\/company\/partners\/[^/]+$/.test(pathname);
  const isMemberDetailPage = /^\/company\/members\/[^/]+$/.test(pathname);
  const isProjectRequestDetailPage = /^\/company\/[^/]+\/project-request\/[^/]+$/.test(pathname);

  let visibleItems;

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

  const activeIdx = Math.max(
    0,
    visibleItems.findIndex((i) => {
      let routePath = i.to;

      if (
        i.key === 'partner-detail' ||
        i.key === 'member-detail' ||
        i.key === 'project-request-detail'
      ) {
        routePath = routePath.replace(':id', id || '');
      } else {
        routePath = routePath.replace(':companyId', companyId || '');
      }

      return matchPath({ path: routePath, end: true }, pathname) !== null;
    }),
  );

  return (
    <aside className="cmp-nav">
      <nav className="cmp-nav__menu">
        <div className="cmp-nav__groupTitle">Menu</div>
        <div className="cmp-nav__items" style={{ ['--active-index' as any]: activeIdx }}>
          <div className="cmp-nav__indicator" />
          {visibleItems.map((it) => {
            let routePath = it.to;

            if (
              it.key === 'partner-detail' ||
              it.key === 'member-detail' ||
              it.key === 'project-request-detail'
            ) {
              routePath = routePath.replace(':id', id || '');
            } else if (companyId) {
              routePath = routePath.replace(':companyId', companyId);
            }

            return (
              <NavLink
                key={it.key}
                to={routePath}
                end
                className={({ isActive }) => `cmp-nav__item ${isActive ? 'is-active' : ''}`}
              >
                <span className="cmp-nav__glyph">{Preset[it.icon as PresetIcon]}</span>
                <span>{it.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
