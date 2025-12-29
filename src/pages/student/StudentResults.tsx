import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Home, Calendar, FileText, Bell, DollarSign, AlertCircle, Loader2 } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/student', icon: Home },
  { label: 'Attendance', href: '/student/attendance', icon: Calendar },
  { label: 'Results', href: '/student/results', icon: FileText },
  { label: 'Fees', href: '/student/fees', icon: DollarSign },
  { label: 'Circulars', href: '/student/circulars', icon: Bell },
];

interface Result {
  id: string;
  marks_obtained: number;
  max_marks: number;
  grade: string | null;
  exam_type: string;
  academic_year: string;
  semester: number;
  subject: { name: string; code: string } | null;
}

const StudentResults: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchResults();
  }, [user]);

  const fetchResults = async () => {
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
        .from('results')
        .select('id, marks_obtained, max_marks, grade, exam_type, academic_year, semester, subject:subjects(name, code)')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      setResults(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string | null) => {
    if (!grade) return 'bg-muted text-muted-foreground';
    if (grade === 'F') return 'bg-destructive/10 text-destructive';
    if (grade.startsWith('A')) return 'bg-success/10 text-success';
    return 'bg-warning/10 text-warning';
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Results">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Results">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">My Results</h1>
          <p className="text-muted-foreground">View your exam results and grades</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Exam Results</CardTitle>
            <CardDescription>Your academic performance</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {results.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No results published yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Exam Type</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Year</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{result.subject?.name || '-'}</p>
                          <p className="text-xs text-muted-foreground">{result.subject?.code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{result.exam_type.replace('_', ' ')}</TableCell>
                      <TableCell>Sem {result.semester}</TableCell>
                      <TableCell>{result.marks_obtained}/{result.max_marks}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                          {result.grade || '-'}
                        </span>
                      </TableCell>
                      <TableCell>{result.academic_year}</TableCell>
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

export default StudentResults;
