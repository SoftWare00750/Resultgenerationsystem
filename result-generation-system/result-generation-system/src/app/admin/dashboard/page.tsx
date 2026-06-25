"use client";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Users, GraduationCap, FileText, BookOpen,
  CheckCircle, Clock, Key, TrendingUp, Award, BarChart2, Settings, AlertTriangle,
} from "lucide-react";
import { authService } from "@/lib/services/auth";
import { studentsService } from "@/lib/services/students";
import { resultsService } from "@/lib/services/results";
import { classesService } from "@/lib/services/classes";
import { sessionsService } from "@/lib/services/sessions";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAuthStore } from "@/lib/store/auth-store";
import Link from "next/link";
import { seedDefaults, ensureAdminPassword, getSchoolInfo } from "@/lib/storage";
import { Button } from "@/components/ui/button";

interface Stats {
  teachers: number; parents: number; students: number; results: number;
  classes: number; published: number; drafts: number; authCodes: number; unusedCodes: number;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ teachers:0, parents:0, students:0, results:0, classes:0, published:0, drafts:0, authCodes:0, unusedCodes:0 });
  const [activeSession, setActiveSession] = useState<string>("—");
  const [loading, setLoading] = useState(true);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [schoolSetup, setSchoolSetup] = useState(true); // assume true until checked

  useEffect(() => {
    seedDefaults();
    ensureAdminPassword();

    // Check if school info is configured
    const info = getSchoolInfo();
    setSchoolSetup(!!(info?.name && info?.logo && info?.address));

    const load = async () => {
      try {
        const [users, students, results, classes, session, codes] = await Promise.all([
          authService.getAllUsers(),
          studentsService.getAllStudents(),
          resultsService.getAllResults(),
          classesService.getAllClasses(),
          sessionsService.getActiveSession(),
          authService.getAuthCodes(),
        ]);

        const teachers    = users.filter((u: any) => u.role === "teacher").length;
        const parents     = users.filter((u: any) => u.role === "parent").length;
        const published   = results.filter((r: any) => r.published).length;
        const unusedCodes = (codes as any[]).filter(c => !c.isUsed && new Date(c.expiresAt) > new Date()).length;

        setStats({ teachers, parents, students: students.length, results: results.length, classes: classes.length, published, drafts: results.length - published, authCodes: (codes as any[]).length, unusedCodes });
        if (session) setActiveSession(session.year);
        setRecentResults([...results].sort((a:any,b:any)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,5));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <DashboardLayout role="admin"><LoadingSpinner /></DashboardLayout>;

  const primaryCards = [
    { label:"Teachers",  value:stats.teachers,  sub:"Registered educators",  icon:Users,         color:"text-blue-600",    bg:"bg-blue-50",    href:"/admin/users" },
    { label:"Parents",   value:stats.parents,   sub:"Registered guardians",  icon:Users,         color:"text-violet-600",  bg:"bg-violet-50",  href:"/admin/users" },
    { label:"Students",  value:stats.students,  sub:"Enrolled learners",     icon:GraduationCap, color:"text-emerald-600", bg:"bg-emerald-50", href:"/admin/students" },
    { label:"Classes",   value:stats.classes,   sub:"Active class groups",   icon:BookOpen,      color:"text-amber-600",   bg:"bg-amber-50",   href:"/admin/classes" },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* School setup warning */}
        {!schoolSetup && (
          <div className="flex items-start gap-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800 text-sm">School setup incomplete</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Add your school name, logo, address, and principal signature so they appear on result PDFs.
              </p>
            </div>
            <Link href="/admin/settings">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                <Settings className="h-3.5 w-3.5 mr-1" />Setup Now
              </Button>
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Active session: <span className="font-semibold text-foreground">{activeSession}</span>
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Admin Portal</span>
          </div>
        </div>

        {/* Primary Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {primaryCards.map((s) => (
            <Link key={s.label} href={s.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                  <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{s.value}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Results Overview */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />Total Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.results}</div>
              <div className="flex gap-3 mt-2">
                <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle className="h-3 w-3" />{stats.published} published
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <Clock className="h-3 w-3" />{stats.drafts} draft
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Key className="h-4 w-4" />Auth Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.authCodes}</div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="text-emerald-600 font-medium">{stats.unusedCodes}</span> unused &amp; valid
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />Publication Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.results > 0 ? Math.round((stats.published/stats.results)*100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">of all results visible to parents</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Results + Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Results</CardTitle>
              <CardDescription>Last 5 results created</CardDescription>
            </CardHeader>
            <CardContent>
              {recentResults.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">No results yet</div>
              ) : (
                <div className="space-y-3">
                  {recentResults.map((r: any) => (
                    <div key={r.$id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{r.studentName}</p>
                        <p className="text-xs text-muted-foreground">{r.class} · {r.term} Term · {r.session}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{r.averageScore?.toFixed(0)}%</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${r.published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {r.published ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { href:"/admin/auth-codes",  icon:Key,          title:"Auth Codes",      desc:"Generate registration codes",  color:"hover:bg-blue-50 hover:border-blue-200" },
                  { href:"/admin/classes",      icon:BookOpen,     title:"Classes",         desc:"Add or assign teachers",       color:"hover:bg-purple-50 hover:border-purple-200" },
                  { href:"/admin/results",      icon:FileText,     title:"All Results",     desc:"Monitor student results",      color:"hover:bg-green-50 hover:border-green-200" },
                  { href:"/admin/students",     icon:GraduationCap,title:"Students",        desc:"Add and edit records",         color:"hover:bg-amber-50 hover:border-amber-200" },
                  { href:"/admin/users",        icon:Users,        title:"Users",           desc:"View all accounts",            color:"hover:bg-rose-50 hover:border-rose-200" },
                  { href:"/admin/settings",     icon:Settings,     title:"School Settings", desc:"Logo, address & signatures",   color:"hover:bg-slate-50 hover:border-slate-200" },
                ].map((a) => (
                  <Link key={a.href} href={a.href}>
                    <div className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${a.color}`}>
                      <a.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}