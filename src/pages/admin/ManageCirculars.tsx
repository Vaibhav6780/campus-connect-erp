import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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

interface Circular {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  is_active: boolean;
  published_at: string;
  expires_at: string | null;
  target_audience: string[];
}

const ManageCirculars: React.FC = () => {
  const { user } = useAuth();
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCircular, setEditingCircular] = useState<Circular | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'normal',
    is_active: true,
  });

  useEffect(() => {
    fetchCirculars();
  }, []);

  const fetchCirculars = async () => {
    try {
      const { data, error } = await supabase
        .from('circulars')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setCirculars(data || []);
    } catch (error) {
      console.error('Error fetching circulars:', error);
      toast.error('Failed to fetch circulars');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'general',
      priority: 'normal',
      is_active: true,
    });
    setEditingCircular(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingCircular) {
        const { error } = await supabase
          .from('circulars')
          .update({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            priority: formData.priority,
            is_active: formData.is_active,
          })
          .eq('id', editingCircular.id);

        if (error) throw error;
        toast.success('Circular updated successfully');
      } else {
        const { error } = await supabase.from('circulars').insert({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          priority: formData.priority,
          is_active: formData.is_active,
          published_by: user?.id,
          target_audience: ['all'],
        });

        if (error) throw error;
        toast.success('Circular published successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchCirculars();
    } catch (error: any) {
      console.error('Error saving circular:', error);
      toast.error(error.message || 'Failed to save circular');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (circular: Circular) => {
    setEditingCircular(circular);
    setFormData({
      title: circular.title,
      content: circular.content,
      category: circular.category,
      priority: circular.priority,
      is_active: circular.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (circular: Circular) => {
    if (!confirm('Are you sure you want to delete this circular?')) return;

    try {
      const { error } = await supabase.from('circulars').delete().eq('id', circular.id);
      if (error) throw error;
      toast.success('Circular deleted successfully');
      fetchCirculars();
    } catch (error: any) {
      console.error('Error deleting circular:', error);
      toast.error(error.message || 'Failed to delete circular');
    }
  };

  const toggleActive = async (circular: Circular) => {
    try {
      const { error } = await supabase
        .from('circulars')
        .update({ is_active: !circular.is_active })
        .eq('id', circular.id);

      if (error) throw error;
      fetchCirculars();
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive/10 text-destructive';
      case 'high':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Manage Circulars">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Circulars</h1>
            <p className="text-muted-foreground">Publish announcements and notifications</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Circular
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingCircular ? 'Edit Circular' : 'Publish New Circular'}</DialogTitle>
                <DialogDescription>
                  {editingCircular ? 'Update circular details' : 'Create a new announcement'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Circular title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your announcement here..."
                    rows={5}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="examination">Examination</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="holiday">Holiday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active (visible to users)</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingCircular ? 'Update' : 'Publish'}
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
            ) : circulars.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No circulars yet</h3>
                <p className="text-muted-foreground mb-4">Publish your first announcement</p>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Circular
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {circulars.map((circular) => (
                    <TableRow key={circular.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {circular.title}
                      </TableCell>
                      <TableCell className="capitalize">{circular.category}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(circular.priority)}>
                          {circular.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={circular.is_active}
                          onCheckedChange={() => toggleActive(circular)}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(circular.published_at).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(circular)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(circular)}>
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

export default ManageCirculars;
