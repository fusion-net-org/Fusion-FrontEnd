/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { type JSX } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

type PresetIcon = 'grid' | 'doc' | 'layers' | 'users' | 'shield' | 'settings' | 'partners';
type Item = { key: string; label: string; to: string; icon?: PresetIcon | React.ReactNode };

const Preset: Record<PresetIcon, JSX.Element> = {
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

function renderIcon(icon?: PresetIcon | React.ReactNode) {
  if (!icon) return <span className="cmp-nav__dot" />;
  if (React.isValidElement(icon)) return icon;
  return Preset[icon as PresetIcon] ?? <span className="cmp-nav__dot" />;
}

const defaultItems: Item[] = [
  { key: 'access-role', label: 'Access Role', to: '/company/access-role', icon: 'grid' },
  { key: 'projects', label: 'Projects', to: '/company/projects', icon: 'layers' },
  { key: 'partners', label: 'Partners', to: '/company/partners', icon: 'partners' },
  { key: 'partnerdetails', label: 'PartnerDetails', to: '/company/partners/:id', icon: 'partners' },
  { key: 'detail3', label: 'Detail', to: '/company/detail-3', icon: 'settings' },
];

export default function CompanyNavbar({ items = defaultItems }: { items?: Item[] }) {
  const { pathname } = useLocation();
  const activeIdx = Math.max(
    0,
    items.findIndex((i) => pathname.startsWith(i.to)),
  );

  return (
    <aside className="cmp-nav">
      <nav className="cmp-nav__menu">
        <div className="cmp-nav__groupTitle">Menu</div>
        <div className="cmp-nav__items" style={{ ['--active-index' as any]: activeIdx }}>
          <div className="cmp-nav__indicator" />
          {items.map((it) => (
            <NavLink
              key={it.key}
              to={it.to}
              className={({ isActive }) => `cmp-nav__item ${isActive ? 'is-active' : ''}`}
            >
              <span className="cmp-nav__glyph">{renderIcon(it.icon)}</span>
              <span>{it.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
}
