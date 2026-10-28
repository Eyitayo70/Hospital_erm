import React, { useState } from 'react';
import { User } from '../types';
import {
  LayoutDashboard,
  Users,
  FolderPlus,
  CalendarCheck,
  MessageSquare,
  ShieldCheck,
  LogOut,
  ArrowLeftRight,
  Menu,
  X,
  Stethoscope,
  LucideIcon,
} from 'lucide-react';

export type OfficerTab =
  | 'dashboard'
  | 'patients'
  | 'register'
  | 'appointments'
  | 'complaints'
  | 'audit';

interface NavbarShellProps {
  activeTab: OfficerTab;
  onNavigate: (tab: OfficerTab, extra?: any) => void;
  title: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  currentUser: User | null;
  onLogout: () => void;
  onSwitchPortal: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { key: OfficerTab; label: string; icon: LucideIcon }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'patients', label: 'Patient Registry', icon: Users },
  { key: 'register', label: 'New Folder', icon: FolderPlus },
  { key: 'appointments', label: 'Appointments', icon: CalendarCheck },
  { key: 'complaints', label: 'Complaints', icon: MessageSquare },
  { key: 'audit', label: 'Audit Log', icon: ShieldCheck },
];

export const NavbarShell: React.FC<NavbarShellProps> = ({
  activeTab,
  onNavigate,
  title,
  eyebrow,
  actions,
  currentUser,
  onLogout,
  onSwitchPortal,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (key: OfficerTab) => {
    onNavigate(key);
    setMobileMenuOpen(false);
  };

  return (
    <div className="shell">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Rail Sidebar */}
      <aside className={`railnav no-print ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div
          className="brand"
          onClick={() => handleNavClick('dashboard')}
          title="Wayfind General Hospital Registry"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/img/logo.svg"
                alt="Hospital Logo"
                width={36}
                height={36}
                style={{ display: 'block', borderRadius: 4 }}
              />
              <div>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#fff' }}>
                  Wayfind General
                </span>
                <small style={{ color: 'var(--manila)' }}>Hospital Registry</small>
              </div>
            </div>
            {mobileMenuOpen && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileMenuOpen(false);
                }}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <nav>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === activeTab;
            return (
              <button
                key={item.key}
                type="button"
                className={`tab-link ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.key)}
              >
                <Icon size={17} className="tab-icon" />
                <span className="tab-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile & bottom switches */}
        <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid rgba(233,228,216,0.12)' }}>
          {currentUser && (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontWeight: 600,
                  color: '#fff',
                  fontSize: '.82rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentUser.full_name}
              </div>
              <div style={{ fontSize: '.7rem', color: 'var(--manila)' }}>
                {currentUser.role_title || 'Health Officer'}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              type="button"
              className="tab-link portal-switcher"
              onClick={onSwitchPortal}
              style={{ paddingLeft: 0, fontSize: '.82rem' }}
              title="Return to hospital home page"
            >
              <ArrowLeftRight size={15} />
              <span className="tab-label">Patient Portal</span>
            </button>
            <button
              type="button"
              className="tab-link"
              onClick={onLogout}
              style={{ paddingLeft: 0, fontSize: '.82rem', color: '#E8A399' }}
            >
              <LogOut size={15} />
              <span className="tab-label">Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main" id="main-content">
        {/* Mobile Header Bar */}
        <div className="mobile-header no-print">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/img/logo.svg" alt="" width={24} height={24} />
            <strong style={{ fontSize: '.92rem', color: 'var(--navy-deep)' }}>Wayfind General</strong>
          </div>
        </div>

        <div className="topline">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h1 style={{ margin: 0 }}>{title}</h1>
          </div>
          {actions && <div className="topline-actions-container">{actions}</div>}
        </div>
        <div id="page-content">{children}</div>
      </main>
    </div>
  );
};
