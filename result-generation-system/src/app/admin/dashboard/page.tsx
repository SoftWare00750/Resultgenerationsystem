"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, FileText, Key } from 'lucide-react';
import { authService } from '@/lib/services/auth';
import { studentsService } from '@/lib/services/students';
import { resultsService } from '@/lib/services/results';
import { classesService } from '@/lib/services/classes';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalResults: 0,
    totalClasses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, students, results, classes] = await Promise.all([
          authService.getAllUsers(),
          studentsService.getAllStudents(),
          resultsService.getAllResults(),
          classesService.getAllClasses(),
        ]);

        setStats({
          totalUsers: users.length,
          totalStudents: students.length,
          totalResults: results.length,
          totalClasses: classes.length,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your school management system</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Teachers & Parents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Enrolled students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Results</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalResults}</div>
              <p className="text-xs text-muted-foreground">Generated results</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClasses}</div>
              <p className="text-xs text-muted-foreground">Active classes</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer transition-colors hover:bg-muted">
              <CardHeader>
                <CardTitle className="text-base">Generate Auth Codes</CardTitle>
                <CardDescription>Create codes for new users</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer transition-colors hover:bg-muted">
              <CardHeader>
                <CardTitle className="text-base">Manage Classes</CardTitle>
                <CardDescription>Add or edit classes</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer transition-colors hover:bg-muted">
              <CardHeader>
                <CardTitle className="text-base">View All Results</CardTitle>
                <CardDescription>Monitor system results</CardDescription>
              </CardHeader>
            </Card>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}