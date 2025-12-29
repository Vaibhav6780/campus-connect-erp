import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Home, Users, GraduationCap, BookOpen, Layers, Bell, BarChart3, DollarSign,
  Plus, Pencil, Loader2, CheckCircle,
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

interface FeeInvoice {
  id: string;
  student_id: string;
  semester: number;
  amount: number;
  payment_status: string;
  payment_date: string | null;
  due_date: string | null;
  description: string | null;
  student?: { student_id: string; profile?: { full_name: string } };
}

interface Student {
  id: string;
  student_id: string;
  user_id: string | null;
  profile?: { full_name: string };
}

const ManageFees: React.FC = () => {
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<FeeInvoice | null>(null);

  const [formData, setFormData] = useState({
    student_id: '',
    semester: '1',
    amount: '',
    payment_status: 'pending',
    due_date: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesRes, studentsRes] = await Promise.all([
        supabase.from('fee_invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('students').select('id, student_id, user_id'),
      ]);

      if (invoicesRes.error) throw invoicesRes.error;

      // Fetch student details for invoices
      const invoicesWithStudents = await Promise.all(
        (invoicesRes.data || []).map(async (invoice) => {
          const { data: student } = await supabase
            .from('students')
            .select('student_id, user_id')
            .eq('id', invoice.student_id)
            .maybeSingle();

          let profile = null;
          if (student?.user_id) {
            const { data: p } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', student.user_id)
              .maybeSingle();
            profile = p;
          }

          return { ...invoice, student: { student_id: student?.student_id, profile } };
        })
      );

      // Fetch profiles for students
      const studentsWithProfiles = await Promise.all(
        (studentsRes.data || []).map(async (student) => {
          if (student.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', student.user_id)
              .maybeSingle();
            return { ...student, profile };
          }
          return student;
        })
      );

      setInvoices(invoicesWithStudents);
      setStudents(studentsWithProfiles);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      semester: '1',
      amount: '',
      payment_status: 'pending',
      due_date: '',
      description: '',
    });
    setEditingInvoice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        student_id: formData.student_id,
        semester: parseInt(formData.semester),
        amount: parseFloat(formData.amount),
        payment_status: formData.payment_status,
        due_date: formData.due_date || null,
        description: formData.description || null,
        payment_date: formData.payment_status === 'paid' ? new Date().toISOString() : null,
      };

      if (editingInvoice) {
        const { error } = await supabase.from('fee_invoices').update(payload).eq('id', editingInvoice.id);
        if (error) throw error;
        toast.success('Invoice updated successfully');
      } else {
        const { error } = await supabase.from('fee_invoices').insert(payload);
        if (error) throw error;
        toast.success('Invoice created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      toast.error(error.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (invoice: FeeInvoice) => {
    setEditingInvoice(invoice);
    setFormData({
      student_id: invoice.student_id,
      semester: invoice.semester.toString(),
      amount: invoice.amount.toString(),
      payment_status: invoice.payment_status,
      due_date: invoice.due_date ? invoice.due_date.split('T')[0] : '',
      description: invoice.description || '',
    });
    setDialogOpen(true);
  };

  const handleMarkPaid = async (invoice: FeeInvoice) => {
    try {
      const { error } = await supabase
        .from('fee_invoices')
        .update({ payment_status: 'paid', payment_date: new Date().toISOString() })
        .eq('id', invoice.id);
      if (error) throw error;
      toast.success('Payment recorded successfully');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to record payment');
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

  return (
    <DashboardLayout navItems={navItems} title="Manage Fees">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Fee Management</h1>
            <p className="text-muted-foreground">Create and manage student fee invoices</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create Fee Invoice'}</DialogTitle>
                <DialogDescription>
                  {editingInvoice ? 'Update invoice details' : 'Generate a new fee invoice for a student'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Student *</Label>
                  <Select value={formData.student_id} onValueChange={(v) => setFormData({ ...formData, student_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.profile?.full_name || student.student_id} ({student.student_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Semester *</Label>
                    <Select value={formData.semester} onValueChange={(v) => setFormData({ ...formData, semester: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₹) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="50000"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select value={formData.payment_status} onValueChange={(v) => setFormData({ ...formData, payment_status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Tuition fee for Semester 1"
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingInvoice ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
                <p className="text-muted-foreground mb-4">Create your first fee invoice</p>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Invoice
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.student?.profile?.full_name || '-'}</p>
                          <p className="text-xs text-muted-foreground">{invoice.student?.student_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>Sem {invoice.semester}</TableCell>
                      <TableCell className="font-medium">₹{invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(invoice.payment_status)}>
                          {invoice.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{invoice.payment_date ? new Date(invoice.payment_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-right">
                        {invoice.payment_status !== 'paid' && (
                          <Button variant="ghost" size="icon" onClick={() => handleMarkPaid(invoice)} title="Mark as Paid">
                            <CheckCircle className="h-4 w-4 text-success" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(invoice)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
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

export default ManageFees;
