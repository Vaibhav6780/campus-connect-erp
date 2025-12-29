import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

interface StudentResult {
  id: string;
  student_id: string;
  profile?: { full_name: string };
  marks: string;
  grade: string;
}

const UploadResults: React.FC = () => {
  const { user } = useAuth();
  const [facultyId, setFacultyId] = useState<string | null>(null);
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [examType, setExamType] = useState('mid_term');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [maxMarks, setMaxMarks] = useState('100');
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchAssignedClasses();
  }, [user]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchSubjects();
    }
  }, [selectedClass]);

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

  const fetchSubjects = async () => {
    const assignment = assignedClasses.find(a => a.id === selectedClass);
    if (!assignment) return;

    const { data } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('class_id', assignment.class_id);

    setSubjects(data || []);
    if (data && data.length > 0) setSelectedSubject(data[0].id);
  };

  const fetchStudents = async () => {
    if (!selectedClass) return;
    setLoadingStudents(true);

    try {
      const assignment = assignedClasses.find(a => a.id === selectedClass);
      if (!assignment) return;

      const { data: studentsData } = await supabase
        .from('students')
        .select('id, student_id, user_id')
        .eq('class_id', assignment.class_id)
        .eq('status', 'active');

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
          return { ...student, profile, marks: '', grade: '' };
        })
      );

      setStudents(studentsWithProfiles);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const updateStudentMarks = (studentId: string, marks: string) => {
    const numMarks = parseFloat(marks) || 0;
    const max = parseFloat(maxMarks) || 100;
    const percentage = (numMarks / max) * 100;

    let grade = '';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';
    else grade = 'F';

    setStudents(students.map(s =>
      s.id === studentId ? { ...s, marks, grade } : s
    ));
  };

  const handleSaveResults = async () => {
    if (!selectedClass || !facultyId || !selectedSubject) {
      toast.error('Please select all required fields');
      return;
    }
    setSaving(true);

    try {
      const assignment = assignedClasses.find(a => a.id === selectedClass);
      if (!assignment) return;

      const resultsToInsert = students
        .filter(s => s.marks)
        .map(student => ({
          student_id: student.id,
          class_id: assignment.class_id,
          subject_id: selectedSubject,
          marks_obtained: parseFloat(student.marks),
          max_marks: parseFloat(maxMarks),
          grade: student.grade,
          exam_type: examType,
          academic_year: academicYear,
          semester: assignment.class?.semester || 1,
          uploaded_by: facultyId,
        }));

      if (resultsToInsert.length === 0) {
        toast.error('Please enter marks for at least one student');
        setSaving(false);
        return;
      }

      const { error } = await supabase.from('results').insert(resultsToInsert);
      if (error) throw error;

      toast.success('Results uploaded successfully');
      fetchStudents(); // Reset
    } catch (error: any) {
      console.error('Error saving results:', error);
      toast.error(error.message || 'Failed to save results');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Upload Results">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (assignedClasses.length === 0) {
    return (
      <DashboardLayout navItems={navItems} title="Upload Results">
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
    <DashboardLayout navItems={navItems} title="Upload Results">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Upload Results</h1>
          <p className="text-muted-foreground">Enter grades for students in your classes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <Label>Subject *</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exam Type *</Label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mid_term">Mid Term</SelectItem>
                    <SelectItem value="end_term">End Term</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="practical">Practical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Marks *</Label>
                <Input
                  type="number"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2024"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedClass && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Enter Marks</CardTitle>
                  <CardDescription>Enter marks for each student</CardDescription>
                </div>
                <Button onClick={handleSaveResults} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Results
                </Button>
              </div>
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
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-[150px]">Marks (/{maxMarks})</TableHead>
                      <TableHead className="w-[100px]">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.student_id}</TableCell>
                        <TableCell>{student.profile?.full_name || '-'}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={student.marks}
                            onChange={(e) => updateStudentMarks(student.id, e.target.value)}
                            placeholder="0"
                            max={parseFloat(maxMarks)}
                            min={0}
                          />
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.grade === 'F' ? 'bg-destructive/10 text-destructive' :
                            student.grade.startsWith('A') ? 'bg-success/10 text-success' :
                            'bg-warning/10 text-warning'
                          }`}>
                            {student.grade || '-'}
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

export default UploadResults;
