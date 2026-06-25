'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Scan,
  Library,
  GitBranch,
  History,
  Code,
  Terminal,
  BarChart3,
  Settings,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

interface LayoutWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function LayoutWrapper({ children, title, subtitle }: LayoutWrapperProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Overview', path: '/overview', icon: LayoutDashboard },
    { name: 'Scanner', path: '/scanner', icon: Scan },
    { name: 'Policies', path: '/policies', icon: Library },
    { name: 'Pipeline', path: '/pipeline', icon: GitBranch },
    { name: 'History', path: '/history', icon: History },
    { name: 'Editor', path: '/editor', icon: Code },
    { name: 'Terminal', path: '/terminal', icon: Terminal },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <span className="logo-text">PolicySync</span>
        </div>

        <nav style={{ flexGrow: 1 }}>
          <p className="nav-label">Navigation</p>
          <ul className="nav-links">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (pathname === '/' && item.path === '/overview');
              return (
                <li key={item.name}>
                  <Link href={item.path} className={`nav-link ${isActive ? 'active' : ''}`}>
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Card */}
        <div className="user-profile">
          <div className="avatar">PA</div>
          <div className="user-info">
            <span className="user-name">PolicySync Admin</span>
            <span className="user-email">admin@policysync.local</span>
          </div>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Header */}
        <header className="header">
          <div className="header-title">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="badge badge-passed">API Online</span>
          </div>
        </header>

        {/* Content Area */}
        <main className="content-area">{children}</main>
      </div>
    </div>
  );
}
