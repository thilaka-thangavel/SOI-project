import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Map, CloudRain, Droplets, MessageSquare,
  AlertTriangle, ClipboardCheck, BarChart3, Database,
  FlaskConical, Shield, Activity, ChevronRight, Waves
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/risk-map', label: 'Risk Map', icon: Map },
  { path: '/rainfall', label: 'Rainfall Monitoring', icon: CloudRain },
  { path: '/drainage', label: 'Drainage Monitoring', icon: Droplets },
  { path: '/reports', label: 'Citizen Reports', icon: MessageSquare },
  { path: '/risk-analysis', label: 'Risk Analysis', icon: AlertTriangle },
  { path: '/inspections', label: 'Inspection Center', icon: ClipboardCheck },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/data-sources', label: 'Data Sources', icon: Database },
  { path: '/poc-experiment', label: 'PoC Experiment', icon: FlaskConical },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className={clsx(
      'fixed left-0 top-0 h-screen z-40 flex flex-col',
      'bg-sidebar border-r border-sidebar-border',
      'transition-all duration-300',
      collapsed ? 'w-16' : 'w-[260px]'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex-shrink-0 w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <Waves className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-white font-bold text-base leading-tight">DrainWatch AI</h1>
            <p className="text-slate-400 text-xs">Waterlogging Early Warning</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-4 px-3 space-y-0.5">
        {!collapsed && (
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3">
            Monitoring
          </p>
        )}
        {navItems.slice(0, 5).map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group',
              isActive
                ? 'bg-sidebar-active text-white'
                : 'text-slate-400 hover:bg-sidebar-hover hover:text-slate-200'
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="text-sm font-medium flex-1">{label}</span>
                {location.pathname === path && (
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                )}
              </>
            )}
          </NavLink>
        ))}

        {!collapsed && (
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3 mt-5">
            Analysis & Action
          </p>
        )}
        {navItems.slice(5, 8).map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
              isActive
                ? 'bg-sidebar-active text-white'
                : 'text-slate-400 hover:bg-sidebar-hover hover:text-slate-200'
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium flex-1">{label}</span>}
          </NavLink>
        ))}

        {!collapsed && (
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3 mt-5">
            System
          </p>
        )}
        {navItems.slice(8).map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
              isActive
                ? 'bg-sidebar-active text-white'
                : 'text-slate-400 hover:bg-sidebar-hover hover:text-slate-200'
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium flex-1">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-300">Municipal Officer</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Activity className="w-3 h-3 text-green-400" />
                <p className="text-xs text-green-400">System Online</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-7 h-7 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
