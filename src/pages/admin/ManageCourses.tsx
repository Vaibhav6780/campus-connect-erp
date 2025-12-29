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
  Home, Users, GraduationCap, BookOpen, Layers, Bell, BarChart3, DollarSign,
  Plus, Pencil, Trash2, Loader2,
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

interface Course {
  id: string;
  course_code: string;
  course_name: string;
  credits: number;
  program: string;
  assigned_faculty_id: string | null;
  class_id: string | null;
  faculty?: { faculty_id: string; profile?: { full_name: string } };
  class?: { name: string };
}

interface Faculty {
  id: string;
  faculty_id: string;
  profile?: { full_name: string };
}

interface Class {
  id: string;
  name: string;
  semester: number;
}

const ManageCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    credits: '3',
    program: '',
    assigned_faculty_id: '',
    class_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, facultyRes, classesRes] = await Promise.all([
        supabase.from('courses').select('*').order('course_code'),
        supabase.from('faculty').select('id, faculty_id, user_id'),
        supabase.from('classes').select('id, name, semester').order('name'),
      ]);

      if (coursesRes.error) throw coursesRes.error;

      // Fetch faculty profiles and class names for courses
      const coursesWithDetails = await Promise.all(
        (coursesRes.data || []).map(async (course) => {
          let faculty = null;
          let classData = null;

          if (course.assigned_faculty_id) {
            const { data: fac } = await supabase
              .from('faculty')
              .select('faculty_id, user_id')
              .eq('id', course.assigned_faculty_id)
              .maybeSingle();
            
            if (fac?.user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', fac.user_id)
                .maybeSingle();
              faculty = { faculty_id: fac.faculty_id, profile };
            } else if (fac) {
              faculty = { faculty_id: fac.faculty_id };
            }
          }

          if (course.class_id) {
            const { data: cls } = await supabase
              .from('classes')
              .select('name')
              .eq('id', course.class_id)
              .maybeSingle();
            classData = cls;
          }

          return { ...course, faculty, class: classData };
        })
      );

      // Fetch faculty with profiles
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

      setCourses(coursesWithDetails);
      setFaculty(facultyWithProfiles);
      setClasses(classesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      course_code: '',
      course_name: '',
      credits: '3',
      program: '',
      assigned_faculty_id: '',
      class_id: '',
    });
    setEditingCourse(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        course_code: formData.course_code,
        course_name: formData.course_name,
        credits: parseInt(formData.credits),
        program: formData.program,
        assigned_faculty_id: formData.assigned_faculty_id || null,
        class_id: formData.class_id || null,
      };

      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update(payload)
          .eq('id', editingCourse.id);
        if (error) throw error;
        toast.success('Course updated successfully');
      } else {
        const { error } = await supabase.from('courses').insert(payload);
        if (error) throw error;
        toast.success('Course created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast.error(error.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      course_code: course.course_code,
      course_name: course.course_name,
      credits: course.credits.toString(),
      program: course.program,
      assigned_faculty_id: course.assigned_faculty_id || '',
      class_id: course.class_id || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (course: Course) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const { error } = await supabase.from('courses').delete().eq('id', course.id);
      if (error) throw error;
      toast.success('Course deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast.error(error.message || 'Failed to delete course');
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Manage Courses">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Courses</h1>
            <p className="text-muted-foreground">Manage courses and assign faculty</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
                <DialogDescription>
                  {editingCourse ? 'Update course details' : 'Create a new course and assign faculty'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course_code">Course Code *</Label>
                    <Input
                      id="course_code"
                      value={formData.course_code}
                      onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                      placeholder="e.g., CS101"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits *</Label>
                    <Select value={formData.credits} onValueChange={(v) => setFormData({ ...formData, credits: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((c) => (
                          <SelectItem key={c} value={c.toString()}>{c} Credits</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course_name">Course Name *</Label>
                  <Input
                    id="course_name"
                    value={formData.course_name}
                    onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                    placeholder="e.g., Data Structures"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program">Program *</Label>
                  <Input
                    id="program"
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                    placeholder="e.g., B.Tech Computer Science"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Assign Faculty</Label>
                    <Select value={formData.assigned_faculty_id} onValueChange={(v) => setFormData({ ...formData, assigned_faculty_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select faculty" /></SelectTrigger>
                      <SelectContent>
                        {faculty.map((fac) => (
                          <SelectItem key={fac.id} value={fac.id}>
                            {fac.profile?.full_name || fac.faculty_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={formData.class_id} onValueChange={(v) => setFormData({ ...formData, class_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} - Sem {cls.semester}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingCourse ? 'Update' : 'Create'}
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
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-4">Add your first course to get started</p>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Course
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Assigned Faculty</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.course_code}</TableCell>
                      <TableCell>{course.course_name}</TableCell>
                      <TableCell>{course.program}</TableCell>
                      <TableCell>{course.credits}</TableCell>
                      <TableCell>{course.faculty?.profile?.full_name || course.faculty?.faculty_id || '-'}</TableCell>
                      <TableCell>{course.class?.name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(course)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(course)}>
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

export default ManageCourses;
