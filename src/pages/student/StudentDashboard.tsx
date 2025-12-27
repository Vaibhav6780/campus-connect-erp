import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import {
  Home,
  Calendar,
  FileText,
  Bell,
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

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
  category: string;
  priority: string;
  published_at: string;
}

const StudentDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCirculars();
  }, []);

  const fetchCirculars = async () => {
    try {
      const { data, error } = await supabase
        .from('circulars')
        .select('*')
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setCirculars(data || []);
    } catch (error) {
      console.error('Error fetching circulars:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'high':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Mock data for demo
  const attendancePercentage = 85;
  const totalClasses = 120;
  const attendedClasses = 102;

  return (
    <DashboardLayout navItems={navItems} title="Student Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div className="gradient-primary rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {profile?.full_name}!</h2>
          <p className="text-white/80">Here's an overview of your academic progress.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Attendance Rate
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendancePercentage}%</div>
              <Progress value={attendancePercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {attendedClasses} of {totalClasses} classes attended
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Classes Today
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground mt-2">
                2 completed, 2 remaining
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Exams
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground mt-2">
                Next: Mathematics (Jan 5)
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                New Circulars
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{circulars.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Check announcements below
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Circulars */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Recent Circulars
            </CardTitle>
            <CardDescription>Latest announcements and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : circulars.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No circulars available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {circulars.map((circular) => (
                  <div
                    key={circular.id}
                    className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{circular.title}</h4>
                        <Badge variant="outline" className={getPriorityColor(circular.priority)}>
                          {circular.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {circular.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(circular.published_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-hover cursor-pointer" onClick={() => {}}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 gradient-primary rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-medium">View Attendance</h3>
                <p className="text-sm text-muted-foreground">Check your attendance records</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer" onClick={() => {}}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 gradient-success rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-medium">View Results</h3>
                <p className="text-sm text-muted-foreground">Check your exam results</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer" onClick={() => {}}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 gradient-info rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-medium">Performance</h3>
                <p className="text-sm text-muted-foreground">View academic progress</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
