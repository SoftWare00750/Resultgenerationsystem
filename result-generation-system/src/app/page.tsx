"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { authService } from '@/lib/services/auth';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { seedDefaults, ensureAdminPassword } from '@/lib/storage';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  useEffect(() => {
    seedDefaults();
    ensureAdminPassword();
    const check = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setUser(user);
          router.replace(`/${user.role}/dashboard`);
        } else {
          router.replace('/auth/login');
        }
      } catch {
        router.replace('/auth/login');
      }
    };
    check();
  }, [router, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}