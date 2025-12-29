import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  studentCount: number;
}

const MyClasses: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<AssignedClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchClasses();
  }, [user]);

  const fetchClasses = async () => {
    try {
      const { data: faculty } = await supabase
        .from('faculty')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!faculty) {
        setLoading(false);
        return;
      }

      const { data: assignments } = await supabase
        .from('faculty_classes')
        .select('id, subject, class:classes(id, name, semester, section)')
        .eq('faculty_id', faculty.id);

      // Get student count for each class
      const classesWithCounts = await Promise.all(
        (assignments || []).map(async (assignment: any) => {
          const { count } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('class_id', assignment.class?.id);
          return { ...assignment, studentCount: count || 0 };
        })
      );

      setClasses(classesWithCounts);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="My Classes">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="My Classes">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">My Classes</h1>
          <p className="text-muted-foreground">View all classes assigned to you</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Classes</CardTitle>
            <CardDescription>Classes assigned by admin</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {classes.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Classes Assigned</h3>
                <p className="text-muted-foreground">No classes have been assigned by admin yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.class?.name}</TableCell>
                      <TableCell>{cls.subject}</TableCell>
                      <TableCell>Semester {cls.class?.semester}</TableCell>
                      <TableCell>{cls.class?.section || '-'}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                          {cls.studentCount} students
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

export default MyClasses;
