import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Home, Bell, Users, ClipboardCheck, Upload, AlertCircle, Loader2 } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/faculty', icon: Home },
  { label: 'Mark Attendance', href: '/faculty/attendance', icon: ClipboardCheck },
  { label: 'Upload Results', href: '/faculty/results', icon: Upload },
  { label: 'My Classes', href: '/faculty/classes', icon: Users },
  { label: 'Circulars', href: '/faculty/circulars', icon: Bell },
];

interface AssignedClass {
  id: string;
  subject: string;
  class: { id: string; name: string; semester: number; section: string | null };
}

const FacultyDashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Get faculty record for current user
      const { data: facultyData } = await supabase
        .from('faculty')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!facultyData) {
        setLoading(false);
        return;
      }

      // Get assigned classes
      const { data: assignments } = await supabase
        .from('faculty_classes')
        .select('id, subject, class:classes(id, name, semester, section)')
        .eq('faculty_id', facultyData.id);

      setAssignedClasses(assignments || []);

      // Count students in assigned classes
      if (assignments && assignments.length > 0) {
        const classIds = assignments.map((a: any) => a.class?.id).filter(Boolean);
        const { count } = await supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .in('class_id', classIds);
        setTotalStudents(count || 0);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Faculty Dashboard">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Faculty Dashboard">
      <div className="space-y-6 animate-fade-in">
        <div className="gradient-primary rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {profile?.full_name}!</h2>
          <p className="text-white/80">Manage your classes, attendance, and student results.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Classes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignedClasses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Assigned Classes</CardTitle>
            <CardDescription>Classes assigned to you by admin</CardDescription>
          </CardHeader>
          <CardContent>
            {assignedClasses.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No classes assigned by admin</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedClasses.map((assignment) => (
                  <div key={assignment.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{assignment.class?.name} - {assignment.subject}</h4>
                      <p className="text-sm text-muted-foreground">
                        Semester {assignment.class?.semester} {assignment.class?.section ? `| Section ${assignment.class?.section}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
