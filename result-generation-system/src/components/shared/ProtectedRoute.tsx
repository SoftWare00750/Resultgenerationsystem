"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { authService } from '@/lib/services/auth';
import { LoadingSpinner } from './LoadingSpinner';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, setUser, loading, setLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }

        if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
          router.push(`/${currentUser.role}/dashboard`);
          return;
        }

        setUser(currentUser);
      } catch (error) {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, setUser, setLoading, allowedRoles]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}