"use client";

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { authService } from '@/lib/services/auth';
import { 
  Home, 
  Users, 
  GraduationCap, 
  FileText, 
  Settings, 
  LogOut, 
  Key,
  BookOpen,
  Calendar,
  UserCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { UserRole } from '@/types';

interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole;
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      toast.success('Logged out successfully');
      router.push('/auth/login');
    } catch (error: any) {
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

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">RGS</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold">Result System</h1>
              <p className="text-xs text-muted-foreground capitalize">{role} Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button variant="ghost" className="w-full justify-start">
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <div className="mb-2 rounded-lg bg-muted p-3">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <div className="border-b bg-background">
          <div className="flex h-16 items-center px-8">
            <h2 className="text-xl font-semibold capitalize">{role} Dashboard</h2>
          </div>
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}