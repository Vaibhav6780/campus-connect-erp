import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Home,
  Calendar,
  FileText,
  Bell,
  Users,
  ClipboardCheck,
  Upload,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/faculty', icon: Home },
  { label: 'Mark Attendance', href: '/faculty/attendance', icon: ClipboardCheck },
  { label: 'Upload Results', href: '/faculty/results', icon: Upload },
  { label: 'My Classes', href: '/faculty/classes', icon: Users },
  { label: 'Circulars', href: '/faculty/circulars', icon: Bell },
];

const FacultyDashboard: React.FC = () => {
  const { profile } = useAuth();

  return (
    <DashboardLayout navItems={navItems} title="Faculty Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div className="gradient-primary rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {profile?.full_name}!</h2>
          <p className="text-white/80">Manage your classes, attendance, and student results.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Classes
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground mt-2">
                Assigned to you
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">120</div>
              <p className="text-xs text-muted-foreground mt-2">
                Across all classes
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Classes Today
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground mt-2">
                1 completed, 1 remaining
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Results
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground mt-2">
                Awaiting upload
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="card-hover cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-4 gradient-primary rounded-lg">
                <ClipboardCheck className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Mark Attendance</h3>
                <p className="text-sm text-muted-foreground">
                  Record student attendance for your classes
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-4 gradient-success rounded-lg">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Upload Results</h3>
                <p className="text-sm text-muted-foreground">
                  Upload exam results via form or CSV
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Your classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Computer Science - Batch A</h4>
                  <p className="text-sm text-muted-foreground">9:00 AM - 10:00 AM</p>
                </div>
                <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">Completed</span>
              </div>
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Data Structures - Batch B</h4>
                  <p className="text-sm text-muted-foreground">2:00 PM - 3:00 PM</p>
                </div>
                <span className="text-xs bg-warning/10 text-warning px-2 py-1 rounded">Upcoming</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
