-- College ERP System Database Schema

-- Create role enum for user types
CREATE TYPE public.user_role AS ENUM ('admin', 'faculty', 'student');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create batches table
CREATE TABLE public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  department TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  section TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL UNIQUE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create faculty table
CREATE TABLE public.faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  faculty_id TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  designation TEXT,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create faculty_classes junction table (faculty can teach multiple classes)
CREATE TABLE public.faculty_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(faculty_id, class_id, subject)
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, class_id, date)
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create results table
CREATE TABLE public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL,
  marks_obtained DECIMAL(5,2) NOT NULL,
  max_marks DECIMAL(5,2) NOT NULL DEFAULT 100,
  grade TEXT,
  semester INTEGER NOT NULL,
  academic_year TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject_id, exam_type, academic_year)
);

-- Create circulars table
CREATE TABLE public.circulars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_audience TEXT[] NOT NULL DEFAULT ARRAY['all'],
  attachment_url TEXT,
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table for RBAC (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_roles.user_id = $1 LIMIT 1;
$$;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for batches
CREATE POLICY "Anyone authenticated can view batches" ON public.batches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage batches" ON public.batches
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for classes
CREATE POLICY "Anyone authenticated can view classes" ON public.classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for students
CREATE POLICY "Students can view their own record" ON public.students
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Faculty can view students in their classes" ON public.students
  FOR SELECT USING (
    public.has_role(auth.uid(), 'faculty') AND
    EXISTS (
      SELECT 1 FROM public.faculty f
      JOIN public.faculty_classes fc ON f.id = fc.faculty_id
      WHERE f.user_id = auth.uid() AND fc.class_id = students.class_id
    )
  );

CREATE POLICY "Admins can manage students" ON public.students
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for faculty
CREATE POLICY "Faculty can view their own record" ON public.faculty
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Anyone authenticated can view faculty" ON public.faculty
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage faculty" ON public.faculty
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for faculty_classes
CREATE POLICY "Anyone authenticated can view faculty_classes" ON public.faculty_classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage faculty_classes" ON public.faculty_classes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for attendance
CREATE POLICY "Students can view their own attendance" ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = attendance.student_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Faculty can view attendance for their classes" ON public.attendance
  FOR SELECT USING (
    public.has_role(auth.uid(), 'faculty') AND
    EXISTS (
      SELECT 1 FROM public.faculty f
      JOIN public.faculty_classes fc ON f.id = fc.faculty_id
      WHERE f.user_id = auth.uid() AND fc.class_id = attendance.class_id
    )
  );

CREATE POLICY "Faculty can mark attendance for their classes" ON public.attendance
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'faculty') AND
    EXISTS (
      SELECT 1 FROM public.faculty f
      JOIN public.faculty_classes fc ON f.id = fc.faculty_id
      WHERE f.user_id = auth.uid() AND fc.class_id = class_id
    )
  );

CREATE POLICY "Faculty can update attendance for their classes" ON public.attendance
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'faculty') AND
    EXISTS (
      SELECT 1 FROM public.faculty f
      JOIN public.faculty_classes fc ON f.id = fc.faculty_id
      WHERE f.user_id = auth.uid() AND fc.class_id = attendance.class_id
    )
  );

CREATE POLICY "Admins can manage attendance" ON public.attendance
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for subjects
CREATE POLICY "Anyone authenticated can view subjects" ON public.subjects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage subjects" ON public.subjects
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for results
CREATE POLICY "Students can view their own results" ON public.results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = results.student_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Faculty can view results for their classes" ON public.results
  FOR SELECT USING (
    public.has_role(auth.uid(), 'faculty') AND
    EXISTS (
      SELECT 1 FROM public.faculty f
      JOIN public.faculty_classes fc ON f.id = fc.faculty_id
      WHERE f.user_id = auth.uid() AND fc.class_id = results.class_id
    )
  );

CREATE POLICY "Faculty can upload results for their classes" ON public.results
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'faculty') AND
    EXISTS (
      SELECT 1 FROM public.faculty f
      JOIN public.faculty_classes fc ON f.id = fc.faculty_id
      WHERE f.user_id = auth.uid() AND fc.class_id = class_id
    )
  );

CREATE POLICY "Faculty can update results for their classes" ON public.results
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'faculty') AND
    EXISTS (
      SELECT 1 FROM public.faculty f
      JOIN public.faculty_classes fc ON f.id = fc.faculty_id
      WHERE f.user_id = auth.uid() AND fc.class_id = results.class_id
    )
  );

CREATE POLICY "Admins can manage results" ON public.results
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for circulars
CREATE POLICY "Anyone authenticated can view active circulars" ON public.circulars
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can manage circulars" ON public.circulars
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faculty_updated_at BEFORE UPDATE ON public.faculty
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_circulars_updated_at BEFORE UPDATE ON public.circulars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_value user_role;
BEGIN
  -- Get role from metadata, default to 'student'
  user_role_value := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'student'
  );
  
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    user_role_value,
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role_value);
  
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_students_batch_id ON public.students(batch_id);
CREATE INDEX idx_students_class_id ON public.students(class_id);
CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_faculty_user_id ON public.faculty(user_id);
CREATE INDEX idx_faculty_classes_faculty_id ON public.faculty_classes(faculty_id);
CREATE INDEX idx_faculty_classes_class_id ON public.faculty_classes(class_id);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_results_student_id ON public.results(student_id);
CREATE INDEX idx_results_class_id ON public.results(class_id);
CREATE INDEX idx_circulars_published_at ON public.circulars(published_at DESC);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);