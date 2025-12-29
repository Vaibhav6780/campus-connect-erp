import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Home, Calendar, FileText, Bell, DollarSign, AlertCircle, Loader2 } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/student', icon: Home },
  { label: 'Attendance', href: '/student/attendance', icon: Calendar },
  { label: 'Results', href: '/student/results', icon: FileText },
  { label: 'Fees', href: '/student/fees', icon: DollarSign },
  { label: 'Circulars', href: '/student/circulars', icon: Bell },
];

interface FeeInvoice {
  id: string;
  semester: number;
  amount: number;
  payment_status: string;
  payment_date: string | null;
  due_date: string | null;
  description: string | null;
}

const StudentFees: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [stats, setStats] = useState({ totalDue: 0, totalPaid: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchFees();
  }, [user]);

  const fetchFees = async () => {
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
        .from('fee_invoices')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      const records = data || [];
      setInvoices(records);

      const totalPaid = records
        .filter(f => f.payment_status === 'paid')
        .reduce((sum, f) => sum + Number(f.amount), 0);
      const totalDue = records
        .filter(f => f.payment_status !== 'paid')
        .reduce((sum, f) => sum + Number(f.amount), 0);

      setStats({ totalPaid, totalDue });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success/10 text-success';
      case 'pending': return 'bg-warning/10 text-warning';
      case 'overdue': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Fees">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Fees">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Fee Status</h1>
          <p className="text-muted-foreground">View your fee invoices and payment status</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-success" />
                <p className="text-sm text-muted-foreground">Total Paid</p>
              </div>
              <p className="text-2xl font-bold text-success">₹{stats.totalPaid.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-warning" />
                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
              </div>
              <p className="text-2xl font-bold text-warning">₹{stats.totalDue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Invoices</CardTitle>
            <CardDescription>Your fee payment history</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No fee invoices found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Payment Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.description || 'Tuition Fee'}</TableCell>
                      <TableCell>Sem {invoice.semester}</TableCell>
                      <TableCell className="font-medium">₹{Number(invoice.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(invoice.payment_status)}>
                          {invoice.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{invoice.payment_date ? new Date(invoice.payment_date).toLocaleDateString() : '-'}</TableCell>
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

export default StudentFees;
