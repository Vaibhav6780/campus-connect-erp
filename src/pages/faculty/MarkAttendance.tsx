import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Home, Bell, Users, ClipboardCheck, Upload, AlertCircle, Loader2, Save } from 'lucide-react';

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
  class_id: string;
  class: { id: string; name: string; semester: number };
}

interface Student {
  id: string;
  student_id: string;
  profile?: { full_name: string };
  isPresent: boolean;
}

const MarkAttendance: React.FC = () => {
  const { user } = useAuth();
  const [facultyId, setFacultyId] = useState<string | null>(null);
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchAssignedClasses();
  }, [user]);

  useEffect(() => {
    if (selectedClass && selectedDate) fetchStudentsWithAttendance();
  }, [selectedClass, selectedDate]);

  const fetchAssignedClasses = async () => {
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

      setFacultyId(faculty.id);

      const { data: assignments } = await supabase
        .from('faculty_classes')
        .select('id, subject, class_id, class:classes(id, name, semester)')
        .eq('faculty_id', faculty.id);

      setAssignedClasses(assignments || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsWithAttendance = async () => {
    if (!selectedClass) return;
    setLoadingStudents(true);

    try {
      const assignment = assignedClasses.find(a => a.id === selectedClass);
      if (!assignment) return;

      // Get students in this class
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, student_id, user_id')
        .eq('class_id', assignment.class_id)
        .eq('status', 'active');

      // Get existing attendance for this date and class
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('class_id', assignment.class_id)
        .eq('date', selectedDate);

      const attendanceMap = new Map((existingAttendance || []).map(a => [a.student_id, a.status]));

      // Fetch profiles
      const studentsWithProfiles = await Promise.all(
        (studentsData || []).map(async (student) => {
          let profile = null;
          if (student.user_id) {
            const { data: p } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', student.user_id)
              .maybeSingle();
            profile = p;
          }
          return {
            ...student,
            profile,
            isPresent: attendanceMap.get(student.id) === 'present',
          };
        })
      );

      setStudents(studentsWithProfiles);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const toggleAttendance = (studentId: string) => {
    setStudents(students.map(s =>
      s.id === studentId ? { ...s, isPresent: !s.isPresent } : s
    ));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || !facultyId) return;
    setSaving(true);

    try {
      const assignment = assignedClasses.find(a => a.id === selectedClass);
      if (!assignment) return;

      // Delete existing attendance for this date and class
      await supabase
        .from('attendance')
        .delete()
        .eq('class_id', assignment.class_id)
        .eq('date', selectedDate);

      // Insert new attendance records
      const attendanceRecords = students.map(student => ({
        student_id: student.id,
        class_id: assignment.class_id,
        faculty_id: facultyId,
        date: selectedDate,
        status: student.isPresent ? 'present' : 'absent',
      }));

      const { error } = await supabase.from('attendance').insert(attendanceRecords);
      if (error) throw error;

      toast.success('Attendance saved successfully');
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast.error(error.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Mark Attendance">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (assignedClasses.length === 0) {
    return (
      <DashboardLayout navItems={navItems} title="Mark Attendance">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Classes Assigned</h3>
            <p className="text-muted-foreground">No classes have been assigned by admin yet.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Mark Attendance">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Mark Attendance</h1>
          <p className="text-muted-foreground">Select a class and date to mark attendance</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Class & Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.class?.name} - {cls.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSaveAttendance} disabled={!selectedClass || students.length === 0 || saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Attendance
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedClass && (
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                {students.filter(s => s.isPresent).length} of {students.length} marked present
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingStudents ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No students enrolled in this class</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Present</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Checkbox
                            checked={student.isPresent}
                            onCheckedChange={() => toggleAttendance(student.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{student.student_id}</TableCell>
                        <TableCell>{student.profile?.full_name || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${student.isPresent ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                            {student.isPresent ? 'Present' : 'Absent'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MarkAttendance;
