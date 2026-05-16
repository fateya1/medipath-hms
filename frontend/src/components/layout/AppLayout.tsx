// frontend/src/components/layout/AppLayout.tsx
// Sidebar layout — role-aware navigation for all HMS modules

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Users, UserCheck, Calendar, Building2,
  Receipt, Pill, FlaskConical, BarChart3, LogOut, Bell,
  Stethoscope, Menu, X, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { Role } from '../../types';
import clsx from 'clsx';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: Role[];
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    href: '/dashboard',    icon: <LayoutDashboard size={18} /> },
  { label: 'Patients',     href: '/patients',     icon: <Users size={18} />,         roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
  { label: 'Doctors',      href: '/doctors',      icon: <Stethoscope size={18} />,   roles: ['ADMIN', 'RECEPTIONIST'] },
  { label: 'Appointments', href: '/appointments', icon: <Calendar size={18} /> },
  { label: 'Departments',  href: '/departments',  icon: <Building2 size={18} />,     roles: ['ADMIN'] },
  { label: 'Billing',      href: '/billing',      icon: <Receipt size={18} />,       roles: ['ADMIN', 'RECEPTIONIST'] },
  { label: 'Pharmacy',     href: '/pharmacy',     icon: <Pill size={18} />,          roles: ['ADMIN', 'PHARMACIST', 'DOCTOR'] },
  { label: 'Laboratory',   href: '/lab',          icon: <FlaskConical size={18} />,  roles: ['ADMIN', 'LAB_TECHNICIAN', 'DOCTOR'] },
  { label: 'Reports',      href: '/reports',      icon: <BarChart3 size={18} />,     roles: ['ADMIN', 'DOCTOR'] },
  { label: 'My Records',   href: '/patients',     icon: <UserCheck size={18} />,     roles: ['PATIENT'] },
];

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrator',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  RECEPTIONIST: 'Receptionist',
  PHARMACIST: 'Pharmacist',
  LAB_TECHNICIAN: 'Lab Technician',
  PATIENT: 'Patient',
};

export function AppLayout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || (user && item.roles.includes(user.role))
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const profile = user?.staffProfile || user?.patient;
  const displayName = profile
    ? `${(profile as any).title ? (profile as any).title + ' ' : ''}${(profile as any).firstName} ${(profile as any).lastName}`
    : user?.email;

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-teal-700">
        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
          <span className="text-teal-700 font-bold text-lg">M</span>
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-none">Medipath</h1>
          <p className="text-teal-300 text-xs">Hospital Management</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-teal-700">
        <p className="text-white font-medium text-sm truncate">{displayName}</p>
        <p className="text-teal-300 text-xs">{user ? ROLE_LABELS[user.role] : ''}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {visibleItems.map(item => (
          <NavLink
            key={item.href + item.label}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-teal-100 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-60 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-teal-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-teal-100 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-teal-800 flex-col flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-teal-800 flex flex-col">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-teal-700 font-semibold text-sm">
                {(profile as any)?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
