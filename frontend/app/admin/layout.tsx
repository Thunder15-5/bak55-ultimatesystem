// frontend/app/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/admin-store';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Trophy, 
  DollarSign, 
  Shield, 
  Settings, 
  AlertTriangle,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3, current: true },
  { name: 'User Management', href: '/admin/users', icon: Users, current: false },
  { name: 'Content Moderation', href: '/admin/content', icon: FileText, current: false },
  { name: 'Competitions', href: '/admin/competitions', icon: Trophy, current: false },
  { name: 'Financial', href: '/admin/financial', icon: DollarSign, current: false },
  { name: 'Security', href: '/admin/security', icon: Shield, current: false },
  { name: 'System', href: '/admin/system', icon: Settings, current: false },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, current: false },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuthStore();
  const { fetchPlatformMetrics, activeModule } = useAdminStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check if user is admin
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      router.push('/');
      return;
    }

    // Fetch initial platform metrics
    fetchPlatformMetrics();
  }, [user, router, fetchPlatformMetrics]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 flex z-40 lg:hidden",
        sidebarOpen ? "pointer-events-auto" : "pointer-events-none"
      )}>
        {/* Overlay */}
        <div
          className={cn(
            "fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity",
            sidebarOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <div className={cn(
          "relative flex-1 flex flex-col max-w-xs w-full bg-dark-800 transform transition-transform",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B55</span>
              </div>
              <span className="ml-3 text-xl font-bold text-white">BAK55 Admin</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors",
                    activeModule === item.href.split('/').pop()
                      ? "bg-primary-500 text-white"
                      : "text-gray-300 hover:bg-dark-700 hover:text-white"
                  )}
                >
                  <item.icon className="mr-4 flex-shrink-0 h-6 w-6" />
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user.email}</p>
                <p className="text-xs font-medium text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-dark-800 border-r border-gray-700">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B55</span>
              </div>
              <span className="ml-3 text-xl font-bold text-white">BAK55 Admin</span>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    activeModule === item.href.split('/').pop()
                      ? "bg-primary-500 text-white"
                      : "text-gray-300 hover:bg-dark-700 hover:text-white"
                  )}
                >
                  <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">{user.email}</p>
                <p className="text-xs font-medium text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-3 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="flex-shrink-0 flex border-b border-gray-700 bg-dark-800 lg:border-none">
          <button
            type="button"
            className="px-4 border-r border-gray-700 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 flex justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex-1 flex">
              <h1 className="text-2xl font-bold text-white capitalize py-4">
                {activeModule === 'dashboard' ? 'Platform Overview' : activeModule.replace('-', ' ')}
              </h1>
            </div>
            <div className="ml-4 flex items-center lg:ml-6">
              {/* Admin notifications or quick actions can go here */}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
