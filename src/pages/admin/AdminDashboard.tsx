import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  Home,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  Bell,
  BarChart3,
  Settings,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: Home },
  { label: 'Students', href: '/admin/students', icon: GraduationCap },
  { label: 'Faculty', href: '/admin/faculty', icon: Users },
  { label: 'Classes', href: '/admin/classes', icon: BookOpen },
  { label: 'Batches', href: '/admin/batches', icon: Layers },
  { label: 'Circulars', href: '/admin/circulars', icon: Bell },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
];

interface Stats {
  totalStudents: number;
  totalFaculty: number;
  totalClasses: number;
  totalBatches: number;
}

const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalFaculty: 0,
    totalClasses: 0,
    totalBatches: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [studentsRes, facultyRes, classesRes, batchesRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('faculty').select('id', { count: 'exact', head: true }),
        supabase.from('classes').select('id', { count: 'exact', head: true }),
        supabase.from('batches').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalStudents: studentsRes.count || 0,
        totalFaculty: facultyRes.count || 0,
        totalClasses: classesRes.count || 0,
        totalBatches: batchesRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Admin Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div className="gradient-primary rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {profile?.full_name}!</h2>
          <p className="text-white/80">Manage your institution from a single dashboard.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Students
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Enrolled students
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Faculty
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalFaculty}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Teaching staff
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Classes
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalClasses}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Active classes
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Batches
              </CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalBatches}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Academic batches
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="card-hover cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-4 gradient-primary rounded-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Manage Students</h3>
                <p className="text-sm text-muted-foreground">
                  Add, edit, or remove students
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-4 gradient-accent rounded-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Manage Faculty</h3>
                <p className="text-sm text-muted-foreground">
                  Add, edit, or remove faculty
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-4 gradient-success rounded-lg">
                <Bell className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Publish Circular</h3>
                <p className="text-sm text-muted-foreground">
                  Create announcements
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-4 gradient-warning rounded-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Manage Classes</h3>
                <p className="text-sm text-muted-foreground">
                  Create and organize classes
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-4 gradient-info rounded-lg">
                <Layers className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Manage Batches</h3>
                <p className="text-sm text-muted-foreground">
                  Create academic batches
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-4 gradient-destructive rounded-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium">View Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Generate and export reports
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
