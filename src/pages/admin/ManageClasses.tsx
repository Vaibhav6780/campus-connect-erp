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
  UserPlus,
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

interface Class {
  id: string;
  name: string;
  semester: number;
  section: string | null;
  batch_id: string | null;
  batch?: { name: string };
  faculty_assignments?: FacultyAssignment[];
}

interface Batch {
  id: string;
  name: string;
  department: string;
  year: number;
}

interface Faculty {
  id: string;
  faculty_id: string;
  department: string;
  user_id: string | null;
  profile?: { full_name: string };
}

interface FacultyAssignment {
  id: string;
  faculty_id: string;
  subject: string;
  faculty?: {
    faculty_id: string;
    profile?: { full_name: string };
  };
}

const ManageClasses: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    semester: '1',
    section: '',
    batch_id: '',
  });

  const [assignmentData, setAssignmentData] = useState({
    faculty_id: '',
    subject: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesRes, batchesRes, facultyRes] = await Promise.all([
        supabase
          .from('classes')
          .select(`
            *,
            batch:batches(name)
          `)
          .order('name'),
        supabase.from('batches').select('*').order('name'),
        supabase.from('faculty').select('*').order('faculty_id'),
      ]);

      if (classesRes.error) throw classesRes.error;
      if (batchesRes.error) throw batchesRes.error;
      if (facultyRes.error) throw facultyRes.error;

      // Fetch faculty assignments for each class
      const classesWithAssignments = await Promise.all(
        (classesRes.data || []).map(async (cls) => {
          const { data: assignments } = await supabase
            .from('faculty_classes')
            .select('id, faculty_id, subject')
            .eq('class_id', cls.id);

          const assignmentsWithNames = await Promise.all(
            (assignments || []).map(async (assignment) => {
              const { data: fac } = await supabase
                .from('faculty')
                .select('faculty_id, user_id')
                .eq('id', assignment.faculty_id)
                .maybeSingle();

              let profile = null;
              if (fac?.user_id) {
                const { data: p } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', fac.user_id)
                  .maybeSingle();
                profile = p;
              }

              return {
                ...assignment,
                faculty: { faculty_id: fac?.faculty_id, profile },
              };
            })
          );

          return { ...cls, faculty_assignments: assignmentsWithNames };
        })
      );

      // Fetch profiles for faculty
      const facultyWithProfiles = await Promise.all(
        (facultyRes.data || []).map(async (fac) => {
          if (fac.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', fac.user_id)
              .maybeSingle();
            return { ...fac, profile };
          }
          return fac;
        })
      );

      setClasses(classesWithAssignments);
      setBatches(batchesRes.data || []);
      setFaculty(facultyWithProfiles);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', semester: '1', section: '', batch_id: '' });
    setEditingClass(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingClass) {
        const { error } = await supabase
          .from('classes')
          .update({
            name: formData.name,
            semester: parseInt(formData.semester),
            section: formData.section || null,
            batch_id: formData.batch_id || null,
          })
          .eq('id', editingClass.id);

        if (error) throw error;
        toast.success('Class updated successfully');
      } else {
        const { error } = await supabase.from('classes').insert({
          name: formData.name,
          semester: parseInt(formData.semester),
          section: formData.section || null,
          batch_id: formData.batch_id || null,
        });

        if (error) throw error;
        toast.success('Class created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving class:', error);
      toast.error(error.message || 'Failed to save class');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      semester: cls.semester.toString(),
      section: cls.section || '',
      batch_id: cls.batch_id || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (cls: Class) => {
    if (!confirm('Are you sure you want to delete this class?')) return;

    try {
      const { error } = await supabase.from('classes').delete().eq('id', cls.id);
      if (error) throw error;
      toast.success('Class deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting class:', error);
      toast.error(error.message || 'Failed to delete class');
    }
  };

  const handleAssignFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    setSaving(true);

    try {
      const { error } = await supabase.from('faculty_classes').insert({
        class_id: selectedClass.id,
        faculty_id: assignmentData.faculty_id,
        subject: assignmentData.subject,
      });

      if (error) throw error;
      toast.success('Faculty assigned successfully');
      setAssignDialogOpen(false);
      setAssignmentData({ faculty_id: '', subject: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error assigning faculty:', error);
      toast.error(error.message || 'Failed to assign faculty');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Remove this faculty assignment?')) return;

    try {
      const { error } = await supabase.from('faculty_classes').delete().eq('id', assignmentId);
      if (error) throw error;
      toast.success('Assignment removed');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to remove assignment');
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Manage Classes">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Classes</h1>
            <p className="text-muted-foreground">Manage classes and faculty assignments</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
                <DialogDescription>
                  {editingClass ? 'Update class details' : 'Create a new class'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Class Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester *</Label>
                    <Select
                      value={formData.semester}
                      onValueChange={(value) => setFormData({ ...formData, semester: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <SelectItem key={sem} value={sem.toString()}>
                            Semester {sem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section">Section</Label>
                    <Input
                      id="section"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      placeholder="e.g., A"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch">Batch</Label>
                  <Select
                    value={formData.batch_id}
                    onValueChange={(value) => setFormData({ ...formData, batch_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name} ({batch.year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingClass ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Assign Faculty Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Faculty to {selectedClass?.name}</DialogTitle>
              <DialogDescription>
                Select a faculty member and subject for this class
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAssignFaculty} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assign_faculty">Faculty *</Label>
                <Select
                  value={assignmentData.faculty_id}
                  onValueChange={(value) => setAssignmentData({ ...assignmentData, faculty_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculty.map((fac) => (
                      <SelectItem key={fac.id} value={fac.id}>
                        {fac.profile?.full_name || fac.faculty_id} - {fac.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={assignmentData.subject}
                  onChange={(e) => setAssignmentData({ ...assignmentData, subject: e.target.value })}
                  placeholder="e.g., Data Structures"
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !assignmentData.faculty_id}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Assign
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No classes yet</h3>
                <p className="text-muted-foreground mb-4">Add your first class to get started</p>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Class
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Assigned Faculty</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>Sem {cls.semester}</TableCell>
                      <TableCell>{cls.section || '-'}</TableCell>
                      <TableCell>{cls.batch?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {cls.faculty_assignments?.length ? (
                            cls.faculty_assignments.map((assignment) => (
                              <Badge
                                key={assignment.id}
                                variant="secondary"
                                className="cursor-pointer"
                                onClick={() => handleRemoveAssignment(assignment.id)}
                              >
                                {assignment.faculty?.profile?.full_name || assignment.faculty?.faculty_id} - {assignment.subject}
                                <Trash2 className="h-3 w-3 ml-1" />
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">No faculty assigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedClass(cls);
                            setAssignDialogOpen(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cls)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cls)}>
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

export default ManageClasses;
