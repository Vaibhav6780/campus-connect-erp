import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, BookOpen, Bell, BarChart3, ArrowRight } from 'lucide-react';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="gradient-primary text-white">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold">College ERP</span>
          </div>
          <Link to="/auth">
            <Button variant="secondary" className="font-semibold">
              Login <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </nav>

        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
            SDGI Global University<br />College ERP System
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto animate-slide-up">
            Streamline academic management with our comprehensive ERP solution for attendance, results, and more.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="font-semibold animate-scale-in">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Features */}
      <section className="py-20 container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Users, title: 'Attendance', desc: 'Track student attendance in real-time' },
            { icon: BookOpen, title: 'Results', desc: 'Upload and view academic results' },
            { icon: Bell, title: 'Circulars', desc: 'Publish announcements instantly' },
            { icon: BarChart3, title: 'Reports', desc: 'Generate detailed reports' },
          ].map((feature, i) => (
            <div key={i} className="p-6 bg-card rounded-xl shadow-card card-hover border border-border">
              <div className="p-3 gradient-primary rounded-lg w-fit mb-4">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar text-sidebar-foreground py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm opacity-70">© 2025 SDGI Global University. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
