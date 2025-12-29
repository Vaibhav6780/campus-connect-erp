import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentResults from "./pages/student/StudentResults";
import StudentFees from "./pages/student/StudentFees";
import StudentCirculars from "./pages/student/StudentCirculars";

// Faculty pages
import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import MarkAttendance from "./pages/faculty/MarkAttendance";
import UploadResults from "./pages/faculty/UploadResults";
import MyClasses from "./pages/faculty/MyClasses";
import FacultyCirculars from "./pages/faculty/FacultyCirculars";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageFaculty from "./pages/admin/ManageFaculty";
import ManageCourses from "./pages/admin/ManageCourses";
import ManageClasses from "./pages/admin/ManageClasses";
import ManageBatches from "./pages/admin/ManageBatches";
import ManageFees from "./pages/admin/ManageFees";
import ManageCirculars from "./pages/admin/ManageCirculars";
import Reports from "./pages/admin/Reports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Student Routes */}
            <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><StudentAttendance /></ProtectedRoute>} />
            <Route path="/student/results" element={<ProtectedRoute allowedRoles={['student']}><StudentResults /></ProtectedRoute>} />
            <Route path="/student/fees" element={<ProtectedRoute allowedRoles={['student']}><StudentFees /></ProtectedRoute>} />
            <Route path="/student/circulars" element={<ProtectedRoute allowedRoles={['student']}><StudentCirculars /></ProtectedRoute>} />

            {/* Faculty Routes */}
            <Route path="/faculty" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/faculty/attendance" element={<ProtectedRoute allowedRoles={['faculty']}><MarkAttendance /></ProtectedRoute>} />
            <Route path="/faculty/results" element={<ProtectedRoute allowedRoles={['faculty']}><UploadResults /></ProtectedRoute>} />
            <Route path="/faculty/classes" element={<ProtectedRoute allowedRoles={['faculty']}><MyClasses /></ProtectedRoute>} />
            <Route path="/faculty/circulars" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyCirculars /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><ManageStudents /></ProtectedRoute>} />
            <Route path="/admin/faculty" element={<ProtectedRoute allowedRoles={['admin']}><ManageFaculty /></ProtectedRoute>} />
            <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={['admin']}><ManageCourses /></ProtectedRoute>} />
            <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['admin']}><ManageClasses /></ProtectedRoute>} />
            <Route path="/admin/batches" element={<ProtectedRoute allowedRoles={['admin']}><ManageBatches /></ProtectedRoute>} />
            <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={['admin']}><ManageFees /></ProtectedRoute>} />
            <Route path="/admin/circulars" element={<ProtectedRoute allowedRoles={['admin']}><ManageCirculars /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
