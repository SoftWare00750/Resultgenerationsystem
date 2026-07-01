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
  UserCircle,
  FileText,
  CheckCircle,
  Clock,
  GraduationCap,
} from "lucide-react";
import { studentsService } from "@/lib/services/students";
import { resultsService } from "@/lib/services/results";
import { sessionsService } from "@/lib/services/sessions";
import { useAuthStore } from "@/lib/store/auth-store";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import Link from "next/link";
import { seedDefaults } from "@/lib/storage";
import { Student, Result } from "@/lib/types";

export default function ParentDashboard() {
  const { user } = useAuthStore();
  const [wards, setWards] = useState<Student[]>([]);
  const [allResults, setAllResults] = useState<Result[]>([]);
  const [activeSession, setActiveSession] = useState<string>("—");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedDefaults();
    const load = async () => {
      if (!user) return;
      try {
        const [myWards, session] = await Promise.all([
          studentsService.getStudentsByParent(user.$id),
          sessionsService.getActiveSession(),
        ]);

        setWards(myWards);
        if (session) setActiveSession(session.year);

        // Gather published results for all wards
        const resultArrays = await Promise.all(
          myWards.map((w) => resultsService.getResultsByStudent(w.$id))
        );
        const flat = resultArrays
          .flat()
          .filter((r: Result) => r.published);
        setAllResults(flat);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading)
    return (
      <DashboardLayout role="parent">
        <LoadingSpinner />
      </DashboardLayout>
    );

  // Latest result per ward
  const latestByWard: Record<string, Result> = {};
  allResults.forEach((r) => {
    if (
      !latestByWard[r.studentId] ||
      r.createdAt > latestByWard[r.studentId].createdAt
    ) {
      latestByWard[r.studentId] = r;
    }
  });

  return (
    <DashboardLayout role="parent">
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
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                My Wards
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-50">
                <UserCircle className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wards.length}</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Registered children
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Published Results
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allResults.length}</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Available to view
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Wards with Results
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-50">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(latestByWard).length}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Have at least one result
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                href: "/parent/wards",
                icon: UserCircle,
                title: "My Wards",
                desc: "View and manage your children's profiles",
                color: "hover:border-blue-300 hover:bg-blue-50/50",
              },
              {
                href: "/parent/results",
                icon: FileText,
                title: "View Results",
                desc: "Check published academic results",
                color: "hover:border-green-300 hover:bg-green-50/50",
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

        {/* Wards overview */}
        {wards.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Wards Overview</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wards.map((ward) => {
                const latest = latestByWard[ward.$id];
                return (
                  <Card key={ward.$id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {ward.name}
                          </CardTitle>
                          <CardDescription>{ward.class}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Admission No:
                        </span>
                        <span className="font-medium">
                          {ward.admissionNumber}
                        </span>
                      </div>
                      {latest ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Latest Result:
                            </span>
                            <span className="font-medium">
                              {latest.term} Term
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Average:
                            </span>
                            <span className="font-medium">
                              {latest.averageScore?.toFixed(1)}%{" "}
                              <span className="text-primary">
                                ({latest.overallGrade})
                              </span>
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-1 text-muted-foreground text-xs">
                          No results published yet
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {wards.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center">
              <UserCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No wards registered</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your child's details to view their results
              </p>
              <Link href="/parent/wards">
                <span className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">
                  Add Ward
                </span>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}