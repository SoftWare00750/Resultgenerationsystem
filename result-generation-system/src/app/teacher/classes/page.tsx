"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { classesService } from "@/lib/services/classes";
import { studentsService } from "@/lib/services/students";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";
import { RefreshCw, Users, BookOpen, GraduationCap } from "lucide-react";
import { Class, Student } from "@/lib/types";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TeacherClassesPage() {
  const { user } = useAuthStore();
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [classStudents, setClassStudents] = useState<{
    [key: string]: Student[];
  }>({});
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const classes = await classesService.getClassesByTeacher(user.$id);
      setMyClasses(classes);

      const studentsMap: { [key: string]: Student[] } = {};
      for (const classItem of classes) {
        const students = await studentsService.getStudentsByClass(
          classItem.name
        );
        studentsMap[classItem.$id] = students;
      }
      setClassStudents(studentsMap);
    } catch {
      toast.error("Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const toggleExpand = (classId: string) => {
    setExpandedClass(expandedClass === classId ? null : classId);
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Classes</h1>
            <p className="text-muted-foreground">Classes assigned to you</p>
          </div>
          <Button onClick={fetchData} variant="outline" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : myClasses.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={BookOpen}
                title="No classes assigned"
                description="Contact the administrator to get classes assigned to you"
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Classes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{myClasses.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.values(classStudents).reduce(
                      (sum, arr) => sum + arr.length,
                      0
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {[...new Set(myClasses.map((c) => c.category))].length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Class cards */}
            <div className="grid gap-4 md:grid-cols-2">
              {myClasses.map((classItem) => {
                const students = classStudents[classItem.$id] || [];
                const isExpanded = expandedClass === classItem.$id;

                return (
                  <Card key={classItem.$id} className="transition-all">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{classItem.name}</CardTitle>
                          <CardDescription>{classItem.category}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground bg-muted rounded-full px-3 py-1">
                          <Users className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {students.length}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {students.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No students enrolled yet
                        </p>
                      ) : (
                        <>
                          {!isExpanded ? (
                            <div className="space-y-1">
                              {students.slice(0, 3).map((s) => (
                                <div
                                  key={s.$id}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{s.name}</span>
                                  <span className="text-muted-foreground text-xs ml-auto">
                                    {s.admissionNumber}
                                  </span>
                                </div>
                              ))}
                              {students.length > 3 && (
                                <p className="text-xs text-muted-foreground">
                                  +{students.length - 3} more students
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="max-h-64 overflow-y-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Admission No.</TableHead>
                                    <TableHead>Gender</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {students.map((s) => (
                                    <TableRow key={s.$id}>
                                      <TableCell className="font-medium text-sm">
                                        {s.name}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {s.admissionNumber}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {s.gender || "—"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-3 w-full text-xs"
                            onClick={() => toggleExpand(classItem.$id)}
                          >
                            {isExpanded
                              ? "Show less"
                              : `View all ${students.length} students`}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}