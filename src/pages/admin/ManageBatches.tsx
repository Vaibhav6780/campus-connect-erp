import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface Batch {
  id: string;
  name: string;
  department: string;
  year: number;
  created_at: string;
}

const ManageBatches: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    year: new Date().getFullYear().toString(),
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('year', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      department: '',
      year: new Date().getFullYear().toString(),
    });
    setEditingBatch(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingBatch) {
        const { error } = await supabase
          .from('batches')
          .update({
            name: formData.name,
            department: formData.department,
            year: parseInt(formData.year),
          })
          .eq('id', editingBatch.id);

        if (error) throw error;
        toast.success('Batch updated successfully');
      } else {
        const { error } = await supabase.from('batches').insert({
          name: formData.name,
          department: formData.department,
          year: parseInt(formData.year),
        });

        if (error) throw error;
        toast.success('Batch created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchBatches();
    } catch (error: any) {
      console.error('Error saving batch:', error);
      toast.error(error.message || 'Failed to save batch');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      department: batch.department,
      year: batch.year.toString(),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (batch: Batch) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;

    try {
      const { error } = await supabase.from('batches').delete().eq('id', batch.id);
      if (error) throw error;
      toast.success('Batch deleted successfully');
      fetchBatches();
    } catch (error: any) {
      console.error('Error deleting batch:', error);
      toast.error(error.message || 'Failed to delete batch');
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Manage Batches">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Batches</h1>
            <p className="text-muted-foreground">Create and manage academic batches</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Batch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBatch ? 'Edit Batch' : 'Add New Batch'}</DialogTitle>
                <DialogDescription>
                  {editingBatch ? 'Update batch details' : 'Create a new academic batch'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Batch Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., CSE 2024"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingBatch ? 'Update' : 'Create'}
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
            ) : batches.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No batches yet</h3>
                <p className="text-muted-foreground mb-4">Add your first batch to get started</p>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Batch
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.name}</TableCell>
                      <TableCell>{batch.department}</TableCell>
                      <TableCell>{batch.year}</TableCell>
                      <TableCell>
                        {new Date(batch.created_at).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(batch)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(batch)}>
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

export default ManageBatches;
