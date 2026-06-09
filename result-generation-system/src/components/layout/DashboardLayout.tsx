"use client";

import { ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { authService } from '@/lib/services/auth';
import {
  Home, Users, GraduationCap, FileText, LogOut, Key,
  BookOpen, Calendar, UserCircle, Menu, X, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole;
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      toast.success('Logged out successfully');
      router.push('/auth/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { icon: Home, label: 'Dashboard', href: '/admin/dashboard' },
          { icon: Users, label: 'Manage Users', href: '/admin/users' },
          { icon: Key, label: 'Auth Codes', href: '/admin/auth-codes' },
          { icon: BookOpen, label: 'Classes', href: '/admin/classes' },
          { icon: GraduationCap, label: 'Students', href: '/admin/students' },
          { icon: FileText, label: 'Results', href: '/admin/results' },
          { icon: Calendar, label: 'Sessions', href: '/admin/sessions' },
        ];
      case 'teacher':
        return [
          { icon: Home, label: 'Dashboard', href: '/teacher/dashboard' },
          { icon: GraduationCap, label: 'My Students', href: '/teacher/students' },
          { icon: FileText, label: 'Create Results', href: '/teacher/results' },
          { icon: BookOpen, label: 'My Classes', href: '/teacher/classes' },
        ];
      case 'parent':
        return [
          { icon: Home, label: 'Dashboard', href: '/parent/dashboard' },
          { icon: UserCircle, label: 'My Wards', href: '/parent/wards' },
          { icon: FileText, label: 'View Results', href: '/parent/results' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const roleColors: Record<UserRole, string> = {
    admin: 'from-slate-900 to-slate-800',
    teacher: 'from-blue-900 to-blue-800',
    parent: 'from-emerald-900 to-emerald-800',
  };

  const Sidebar = () => (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background flex flex-col transition-transform duration-300",
      sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      {/* Logo */}
      <div className={cn("flex h-16 items-center border-b px-5 bg-gradient-to-r", roleColors[role])}>
        <div className="flex items-center gap-3 w-full">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 border border-white/20">
            <span className="text-sm font-bold text-white">RGS</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Result System</p>
            <p className="text-xs text-white/60 capitalize">{role} Portal</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
              <div className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="h-3 w-3 opacity-60" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t p-3 space-y-2">
        <div className="rounded-lg bg-muted/50 px-3 py-2.5">
          <p className="text-sm font-semibold truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 md:px-6">
          <button
            className="md:hidden -ml-1 p-1.5 rounded-md hover:bg-muted"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-muted-foreground capitalize hidden md:block">
              {role} Portal
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:block">{user?.name}</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}