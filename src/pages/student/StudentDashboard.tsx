import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Home, Calendar, FileText, Bell, AlertCircle, Loader2 } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/student', icon: Home },
  { label: 'Attendance', href: '/student/attendance', icon: Calendar },
  { label: 'Results', href: '/student/results', icon: FileText },
  { label: 'Circulars', href: '/student/circulars', icon: Bell },
];

interface Circular {
  id: string;
  title: string;
  content: string;
  priority: string;
  published_at: string;
}

const StudentDashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Get student record
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (studentData) {
        // Get attendance for this student
        const { data: attendance } = await supabase
          .from('attendance')
          .select('status')
          .eq('student_id', studentData.id);

        if (attendance) {
          const present = attendance.filter(a => a.status === 'present').length;
          const total = attendance.length;
          setAttendanceStats({
            present,
            total,
            percentage: total > 0 ? Math.round((present / total) * 100) : 0,
          });
        }
      }

      // Fetch circulars
      const { data: circularsData } = await supabase
        .from('circulars')
        .select('id, title, content, priority, published_at')
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(5);

      setCirculars(circularsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive/10 text-destructive';
      case 'high': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Student Dashboard">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Student Dashboard">
      <div className="space-y-6 animate-fade-in">
        <div className="gradient-primary rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {profile?.full_name}!</h2>
          <p className="text-white/80">Here's an overview of your academic progress.</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {attendanceStats.total === 0 ? (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Attendance not marked yet</p>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{attendanceStats.percentage}%</div>
                <Progress value={attendanceStats.percentage} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {attendanceStats.present} of {attendanceStats.total} classes attended
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Recent Circulars
            </CardTitle>
            <CardDescription>Latest announcements</CardDescription>
          </CardHeader>
          <CardContent>
            {circulars.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No circulars available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {circulars.map((circular) => (
                  <div key={circular.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{circular.title}</h4>
                      <Badge variant="outline" className={getPriorityColor(circular.priority)}>
                        {circular.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{circular.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(circular.published_at).toLocaleDateString('en-IN')}
                    </p>
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

export default StudentDashboard;
