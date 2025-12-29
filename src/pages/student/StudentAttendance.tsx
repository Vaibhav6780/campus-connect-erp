import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Home, Calendar, FileText, Bell, DollarSign, AlertCircle, Loader2 } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/student', icon: Home },
  { label: 'Attendance', href: '/student/attendance', icon: Calendar },
  { label: 'Results', href: '/student/results', icon: FileText },
  { label: 'Fees', href: '/student/fees', icon: DollarSign },
  { label: 'Circulars', href: '/student/circulars', icon: Bell },
];

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  class: { name: string } | null;
}

const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAttendance();
  }, [user]);

  const fetchAttendance = async () => {
    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!student) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('attendance')
        .select('id, date, status, class:classes(name)')
        .eq('student_id', student.id)
        .order('date', { ascending: false });

      const records = data || [];
      setAttendance(records);

      const present = records.filter(a => a.status === 'present').length;
      const absent = records.filter(a => a.status === 'absent').length;
      const total = records.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      setStats({ present, absent, total, percentage });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Attendance">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Attendance">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">My Attendance</h1>
          <p className="text-muted-foreground">View your attendance records</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
              <div className="mt-2">
                <p className="text-2xl font-bold">{stats.percentage}%</p>
                <Progress value={stats.percentage} className="mt-2" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Present</p>
              <p className="text-2xl font-bold text-success">{stats.present}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Absent</p>
              <p className="text-2xl font-bold text-destructive">{stats.absent}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total Classes</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>Your attendance records</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {attendance.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Attendance not marked yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                      <TableCell>{record.class?.name || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${record.status === 'present' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {record.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentAttendance;
