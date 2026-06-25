"use client";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  GraduationCap,
  FileText,
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import { classesService } from "@/lib/services/classes";
import { studentsService } from "@/lib/services/students";
import { resultsService } from "@/lib/services/results";
import { sessionsService } from "@/lib/services/sessions";
import { useAuthStore } from "@/lib/store/auth-store";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import Link from "next/link";
import { seedDefaults, ensureAdminPassword } from "@/lib/storage";

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    classes: 0,
    students: 0,
    totalResults: 0,
    published: 0,
    drafts: 0,
  });
  const [activeSession, setActiveSession] = useState<string>("—");
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedDefaults();
    ensureAdminPassword();
    const load = async () => {
      if (!user) return;
      try {
        const [classes, session, allResults] = await Promise.all([
          classesService.getClassesByTeacher(user.$id),
          sessionsService.getActiveSession(),
          resultsService.getAllResults(),
        ]);

        if (session) setActiveSession(session.year);

        const teacherResults = allResults.filter(
          (r: any) => r.createdBy === user.$id
        );

        let totalStudents = 0;
        for (const cls of classes) {
          const students = await studentsService.getStudentsByClass(cls.name);
          totalStudents += students.length;
        }

        setStats({
          classes: classes.length,
          students: totalStudents,
          totalResults: teacherResults.length,
          published: teacherResults.filter((r: any) => r.published).length,
          drafts: teacherResults.filter((r: any) => !r.published).length,
        });

        setRecentResults(teacherResults.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading)
    return (
      <DashboardLayout role="teacher">
        <LoadingSpinner />
      </DashboardLayout>
    );

  const statCards = [
    {
      label: "My Classes",
      value: stats.classes,
      sub: "Assigned classes",
      icon: BookOpen,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "My Students",
      value: stats.students,
      sub: "Enrolled students",
      icon: GraduationCap,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Results",
      value: stats.totalResults,
      sub: "Results created",
      icon: FileText,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Published",
      value: stats.published,
      sub: "Visible to parents",
      icon: CheckCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Active Session:{" "}
            <span className="font-medium text-foreground">{activeSession}</span>
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </CardTitle>
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
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
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Published Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.published}
              </div>
              <p className="text-sm text-muted-foreground">
                Parents can view these
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Draft Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {stats.drafts}
              </div>
              <p className="text-sm text-muted-foreground">
                Pending publication
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                href: "/teacher/results",
                icon: FileText,
                title: "Create Results",
                desc: "Generate new student results",
                color:
                  "hover:border-purple-300 hover:bg-purple-50/50",
              },
              {
                href: "/teacher/students",
                icon: GraduationCap,
                title: "My Students",
                desc: "View students in your classes",
                color:
                  "hover:border-emerald-300 hover:bg-emerald-50/50",
              },
              {
                href: "/teacher/classes",
                icon: BookOpen,
                title: "My Classes",
                desc: "View your assigned classes",
                color:
                  "hover:border-blue-300 hover:bg-blue-50/50",
              },
            ].map((a) => (
              <Link key={a.href} href={a.href}>
                <Card
                  className={`cursor-pointer transition-all border ${a.color}`}
                >
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

        {/* Recent results */}
        {recentResults.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Results</h2>
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {recentResults.map((r) => (
                    <div
                      key={r.$id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium text-sm">{r.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.class} • {r.term} Term • {r.resultType}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            r.published
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {r.published ? "Published" : "Draft"}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Avg: {r.averageScore?.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}