import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Home,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  Bell,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: Home },
  { label: 'Students', href: '/admin/students', icon: GraduationCap },
  { label: 'Faculty', href: '/admin/faculty', icon: Users },
  { label: 'Classes', href: '/admin/classes', icon: BookOpen },
  { label: 'Batches', href: '/admin/batches', icon: Layers },
  { label: 'Circulars', href: '/admin/circulars', icon: Bell },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
];

interface Faculty {
  id: string;
  faculty_id: string;
  department: string;
  designation: string | null;
  status: string;
  joining_date: string;
  user_id: string | null;
  profile?: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

const ManageFaculty: React.FC = () => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);

  const [formData, setFormData] = useState({
    faculty_id: '',
    full_name: '',
    email: '',
    phone: '',
    password: '',
    department: '',
    designation: '',
    status: 'active',
  });

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const { data, error } = await supabase
        .from('faculty')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for faculty with user_id
      const facultyWithProfiles = await Promise.all(
        (data || []).map(async (fac) => {
          if (fac.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email, phone')
              .eq('id', fac.user_id)
              .maybeSingle();
            return { ...fac, profile };
          }
          return fac;
        })
      );

      setFaculty(facultyWithProfiles);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast.error('Failed to fetch faculty');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      faculty_id: '',
      full_name: '',
      email: '',
      phone: '',
      password: '',
      department: '',
      designation: '',
      status: 'active',
    });
    setEditingFaculty(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingFaculty) {
        const { error: facultyError } = await supabase
          .from('faculty')
          .update({
            faculty_id: formData.faculty_id,
            department: formData.department,
            designation: formData.designation || null,
            status: formData.status,
          })
          .eq('id', editingFaculty.id);

        if (facultyError) throw facultyError;

        if (editingFaculty.user_id) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              full_name: formData.full_name,
              phone: formData.phone || null,
            })
            .eq('id', editingFaculty.user_id);

          if (profileError) throw profileError;
        }

        toast.success('Faculty updated successfully');
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: formData.full_name,
              role: 'faculty',
              phone: formData.phone,
            },
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        const { error: facultyError } = await supabase.from('faculty').insert({
          faculty_id: formData.faculty_id,
          user_id: authData.user.id,
          department: formData.department,
          designation: formData.designation || null,
          status: formData.status,
        });

        if (facultyError) throw facultyError;

        toast.success('Faculty created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchFaculty();
    } catch (error: any) {
      console.error('Error saving faculty:', error);
      toast.error(error.message || 'Failed to save faculty');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (fac: Faculty) => {
    setEditingFaculty(fac);
    setFormData({
      faculty_id: fac.faculty_id,
      full_name: fac.profile?.full_name || '',
      email: fac.profile?.email || '',
      phone: fac.profile?.phone || '',
      password: '',
      department: fac.department,
      designation: fac.designation || '',
      status: fac.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (fac: Faculty) => {
    if (!confirm('Are you sure you want to delete this faculty member?')) return;

    try {
      const { error } = await supabase.from('faculty').delete().eq('id', fac.id);
      if (error) throw error;
      toast.success('Faculty deleted successfully');
      fetchFaculty();
    } catch (error: any) {
      console.error('Error deleting faculty:', error);
      toast.error(error.message || 'Failed to delete faculty');
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Manage Faculty">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Faculty</h1>
            <p className="text-muted-foreground">Add, edit, or remove faculty members</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Faculty
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}</DialogTitle>
                <DialogDescription>
                  {editingFaculty ? 'Update faculty information' : 'Create a new faculty account'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="faculty_id">Faculty ID *</Label>
                    <Input
                      id="faculty_id"
                      value={formData.faculty_id}
                      onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                      placeholder="e.g., FAC001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Dr. Jane Smith"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="faculty@example.com"
                      required
                      disabled={!!editingFaculty}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>

                {!editingFaculty && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Computer Science"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="Professor"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingFaculty ? 'Update' : 'Create'}
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
            ) : faculty.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No faculty yet</h3>
                <p className="text-muted-foreground mb-4">Add your first faculty member to get started</p>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Faculty
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faculty ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faculty.map((fac) => (
                    <TableRow key={fac.id}>
                      <TableCell className="font-medium">{fac.faculty_id}</TableCell>
                      <TableCell>{fac.profile?.full_name || '-'}</TableCell>
                      <TableCell>{fac.profile?.email || '-'}</TableCell>
                      <TableCell>{fac.department}</TableCell>
                      <TableCell>{fac.designation || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          fac.status === 'active' ? 'bg-success/10 text-success' :
                          fac.status === 'on_leave' ? 'bg-warning/10 text-warning' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {fac.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(fac)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(fac)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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

export default ManageFaculty;
