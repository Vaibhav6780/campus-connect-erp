import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Home, Users, GraduationCap, BookOpen, Layers, Bell, BarChart3, DollarSign,
  Download, Loader2, FileText, Calendar, TrendingUp,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: Home },
  { label: 'Students', href: '/admin/students', icon: GraduationCap },
  { label: 'Faculty', href: '/admin/faculty', icon: Users },
  { label: 'Courses', href: '/admin/courses', icon: BookOpen },
  { label: 'Classes', href: '/admin/classes', icon: Layers },
  { label: 'Batches', href: '/admin/batches', icon: Layers },
  { label: 'Fees', href: '/admin/fees', icon: DollarSign },
  { label: 'Circulars', href: '/admin/circulars', icon: Bell },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
];

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('students');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalCourses: 0,
    attendanceRate: 0,
    feeCollection: 0,
    pendingFees: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [reportType]);

  const fetchStats = async () => {
    try {
      const [studentsRes, facultyRes, coursesRes, attendanceRes, feesRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('faculty').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('attendance').select('status'),
        supabase.from('fee_invoices').select('amount, payment_status'),
      ]);

      const attendance = attendanceRes.data || [];
      const presentCount = attendance.filter(a => a.status === 'present').length;
      const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

      const fees = feesRes.data || [];
      const feeCollection = fees.filter(f => f.payment_status === 'paid').reduce((sum, f) => sum + Number(f.amount), 0);
      const pendingFees = fees.filter(f => f.payment_status !== 'paid').reduce((sum, f) => sum + Number(f.amount), 0);

      setStats({
        totalStudents: studentsRes.count || 0,
        totalFaculty: facultyRes.count || 0,
        totalCourses: coursesRes.count || 0,
        attendanceRate,
        feeCollection,
        pendingFees,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let data: any[] = [];

      switch (reportType) {
        case 'students':
          const { data: students } = await supabase.from('students').select('*');
          data = await Promise.all(
            (students || []).map(async (s) => {
              if (s.user_id) {
                const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', s.user_id).maybeSingle();
                return { ...s, profile };
              }
              return s;
            })
          );
          break;

        case 'attendance':
          const { data: attendance } = await supabase
            .from('attendance')
            .select('*, class:classes(name)')
            .order('date', { ascending: false })
            .limit(100);
          data = await Promise.all(
            (attendance || []).map(async (a) => {
              const { data: student } = await supabase.from('students').select('student_id, user_id').eq('id', a.student_id).maybeSingle();
              let profile = null;
              if (student?.user_id) {
                const { data: p } = await supabase.from('profiles').select('full_name').eq('id', student.user_id).maybeSingle();
                profile = p;
              }
              return { ...a, student: { student_id: student?.student_id, profile } };
            })
          );
          break;

        case 'results':
          const { data: results } = await supabase.from('results').select('*').order('created_at', { ascending: false }).limit(100);
          data = await Promise.all(
            (results || []).map(async (r) => {
              const { data: student } = await supabase.from('students').select('student_id, user_id').eq('id', r.student_id).maybeSingle();
              const { data: subject } = await supabase.from('subjects').select('name').eq('id', r.subject_id).maybeSingle();
              let profile = null;
              if (student?.user_id) {
                const { data: p } = await supabase.from('profiles').select('full_name').eq('id', student.user_id).maybeSingle();
                profile = p;
              }
              return { ...r, student: { student_id: student?.student_id, profile }, subject };
            })
          );
          break;

        case 'fees':
          const { data: fees } = await supabase.from('fee_invoices').select('*').order('created_at', { ascending: false });
          data = await Promise.all(
            (fees || []).map(async (f) => {
              const { data: student } = await supabase.from('students').select('student_id, user_id').eq('id', f.student_id).maybeSingle();
              let profile = null;
              if (student?.user_id) {
                const { data: p } = await supabase.from('profiles').select('full_name').eq('id', student.user_id).maybeSingle();
                profile = p;
              }
              return { ...f, student: { student_id: student?.student_id, profile } };
            })
          );
          break;
      }

      setReportData(data);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    let csv = '';
    let headers: string[] = [];
    let rows: string[][] = [];

    switch (reportType) {
      case 'students':
        headers = ['Student ID', 'Name', 'Email', 'Status', 'Enrollment Date'];
        rows = reportData.map(s => [s.student_id, s.profile?.full_name || '-', s.profile?.email || '-', s.status, s.enrollment_date]);
        break;
      case 'attendance':
        headers = ['Date', 'Student ID', 'Name', 'Class', 'Status'];
        rows = reportData.map(a => [a.date, a.student?.student_id || '-', a.student?.profile?.full_name || '-', a.class?.name || '-', a.status]);
        break;
      case 'results':
        headers = ['Student ID', 'Name', 'Subject', 'Marks', 'Grade', 'Exam Type'];
        rows = reportData.map(r => [r.student?.student_id || '-', r.student?.profile?.full_name || '-', r.subject?.name || '-', `${r.marks_obtained}/${r.max_marks}`, r.grade || '-', r.exam_type]);
        break;
      case 'fees':
        headers = ['Student ID', 'Name', 'Semester', 'Amount', 'Status', 'Due Date'];
        rows = reportData.map(f => [f.student?.student_id || '-', f.student?.profile?.full_name || '-', `Sem ${f.semester}`, `₹${f.amount}`, f.payment_status, f.due_date ? new Date(f.due_date).toLocaleDateString() : '-']);
        break;
    }

    csv = headers.join(',') + '\n' + rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (reportData.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No data available for this report</p>
        </div>
      );
    }

    switch (reportType) {
      case 'students':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrollment Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.student_id}</TableCell>
                  <TableCell>{s.profile?.full_name || '-'}</TableCell>
                  <TableCell>{s.profile?.email || '-'}</TableCell>
                  <TableCell>{s.status}</TableCell>
                  <TableCell>{new Date(s.enrollment_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'attendance':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{a.student?.student_id || '-'}</TableCell>
                  <TableCell>{a.student?.profile?.full_name || '-'}</TableCell>
                  <TableCell>{a.class?.name || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${a.status === 'present' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {a.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'results':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Exam Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.student?.student_id || '-'}</TableCell>
                  <TableCell>{r.student?.profile?.full_name || '-'}</TableCell>
                  <TableCell>{r.subject?.name || '-'}</TableCell>
                  <TableCell>{r.marks_obtained}/{r.max_marks}</TableCell>
                  <TableCell>{r.grade || '-'}</TableCell>
                  <TableCell>{r.exam_type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'fees':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{f.student?.profile?.full_name || '-'}</p>
                      <p className="text-xs text-muted-foreground">{f.student?.student_id}</p>
                    </div>
                  </TableCell>
                  <TableCell>Sem {f.semester}</TableCell>
                  <TableCell>₹{Number(f.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${f.payment_status === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {f.payment_status}
                    </span>
                  </TableCell>
                  <TableCell>{f.due_date ? new Date(f.due_date).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Reports">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate and export various reports</p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Students</p>
              </div>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Faculty</p>
              </div>
              <p className="text-2xl font-bold">{stats.totalFaculty}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Courses</p>
              </div>
              <p className="text-2xl font-bold">{stats.totalCourses}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Attendance</p>
              </div>
              <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <p className="text-sm text-muted-foreground">Collected</p>
              </div>
              <p className="text-2xl font-bold">₹{(stats.feeCollection / 1000).toFixed(0)}K</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-warning" />
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <p className="text-2xl font-bold">₹{(stats.pendingFees / 1000).toFixed(0)}K</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generate Report</CardTitle>
                <CardDescription>Select report type and export data</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="students">Student Directory</SelectItem>
                    <SelectItem value="attendance">Attendance Report</SelectItem>
                    <SelectItem value="results">Results Report</SelectItem>
                    <SelectItem value="fees">Fee Collection Report</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={exportToCSV} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {renderTable()}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
