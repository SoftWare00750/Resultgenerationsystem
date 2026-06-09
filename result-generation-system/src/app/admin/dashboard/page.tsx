"use client";
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, FileText, BookOpen, TrendingUp, CheckCircle, Clock, Key } from 'lucide-react';
import { authService } from '@/lib/services/auth';
import { studentsService } from '@/lib/services/students';
import { resultsService } from '@/lib/services/results';
import { classesService } from '@/lib/services/classes';
import { sessionsService } from '@/lib/services/sessions';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useAuthStore } from '@/lib/store/auth-store';
import Link from 'next/link';
import { seedDefaults, ensureAdminPassword } from '@/lib/storage';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ users: 0, students: 0, results: 0, classes: 0, published: 0, drafts: 0 });
  const [activeSession, setActiveSession] = useState<string>('—');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedDefaults(); ensureAdminPassword();
    const load = async () => {
      try {
       const [users, students, results, classes, session] = await Promise.all([
  authService.getAllUsers(),
  studentsService.getAllStudents(),
  resultsService.getAllResults(),
  classesService.getAllClasses(),
  sessionsService.getActiveSession(),
]);

setStats({
  users: users.filter((u: any) => u.role !== 'admin').length,
  students: students.length,
  results: results.length,
  classes: classes.length,
  published: results.filter((r: any) => r.published).length,
  drafts: results.filter((r: any) => !r.published).length,
});
        if (session) setActiveSession(session.year);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <DashboardLayout role="admin"><LoadingSpinner /></DashboardLayout>;

  const statCards = [
    { label: 'Total Users', value: stats.users, sub: 'Teachers & Parents', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Students', value: stats.students, sub: 'Enrolled students', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Results', value: stats.results, sub: `${stats.published} published`, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Active Classes', value: stats.classes, sub: 'Configured classes', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-muted-foreground mt-1">Active Session: <span className="font-medium text-foreground">{activeSession}</span></p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(s => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Result status */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" />Published Results</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-green-600">{stats.published}</div><p className="text-sm text-muted-foreground">Visible to parents</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-amber-600" />Draft Results</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-amber-600">{stats.drafts}</div><p className="text-sm text-muted-foreground">Pending publication</p></CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: '/admin/auth-codes', icon: Key, title: 'Generate Auth Codes', desc: 'Create codes for new users', color: 'hover:border-blue-300 hover:bg-blue-50/50' },
              { href: '/admin/classes', icon: BookOpen, title: 'Manage Classes', desc: 'Add or assign teachers', color: 'hover:border-purple-300 hover:bg-purple-50/50' },
              { href: '/admin/results', icon: TrendingUp, title: 'View All Results', desc: 'Monitor system results', color: 'hover:border-green-300 hover:bg-green-50/50' },
              { href: '/admin/students', icon: GraduationCap, title: 'Manage Students', desc: 'Add and edit students', color: 'hover:border-amber-300 hover:bg-amber-50/50' },
              { href: '/admin/users', icon: Users, title: 'Manage Users', desc: 'View all users', color: 'hover:border-rose-300 hover:bg-rose-50/50' },
              { href: '/admin/sessions', icon: CheckCircle, title: 'Sessions', desc: 'Manage academic sessions', color: 'hover:border-teal-300 hover:bg-teal-50/50' },
            ].map(a => (
              <Link key={a.href} href={a.href}>
                <Card className={`cursor-pointer transition-all border ${a.color}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <a.icon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">{a.title}</CardTitle>
                    </div>
                    <CardDescription>{a.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
