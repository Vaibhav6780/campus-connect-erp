import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Home, Calendar, FileText, Bell, DollarSign, Loader2 } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/student', icon: Home },
  { label: 'Attendance', href: '/student/attendance', icon: Calendar },
  { label: 'Results', href: '/student/results', icon: FileText },
  { label: 'Fees', href: '/student/fees', icon: DollarSign },
  { label: 'Circulars', href: '/student/circulars', icon: Bell },
];

interface Circular {
  id: string;
  title: string;
  content: string;
  priority: string;
  category: string;
  published_at: string;
}

const StudentCirculars: React.FC = () => {
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCirculars();
  }, []);

  const fetchCirculars = async () => {
    try {
      const { data } = await supabase
        .from('circulars')
        .select('id, title, content, priority, category, published_at')
        .eq('is_active', true)
        .order('published_at', { ascending: false });

      setCirculars(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive/10 text-destructive';
      case 'high': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Circulars">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Circulars">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Circulars</h1>
          <p className="text-muted-foreground">View all announcements</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Circulars</CardTitle>
            <CardDescription>Latest announcements from administration</CardDescription>
          </CardHeader>
          <CardContent>
            {circulars.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No circulars available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {circulars.map((circular) => (
                  <div key={circular.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{circular.title}</h4>
                      <Badge variant="outline" className={getPriorityColor(circular.priority)}>
                        {circular.priority}
                      </Badge>
                      <Badge variant="secondary">{circular.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{circular.content}</p>
                    <p className="text-xs text-muted-foreground">
                      Published: {new Date(circular.published_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentCirculars;
