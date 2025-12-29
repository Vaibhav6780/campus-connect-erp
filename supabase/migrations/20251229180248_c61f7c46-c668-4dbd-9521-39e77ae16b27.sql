-- Create courses table (replaces subjects for better alignment with ERP requirements)
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_code TEXT NOT NULL UNIQUE,
  course_name TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 3,
  program TEXT NOT NULL,
  assigned_faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enrollments table (student-course enrollment)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  enrollment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Create fee_invoices table
CREATE TABLE IF NOT EXISTS public.fee_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_invoices ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Anyone authenticated can view courses"
ON public.courses FOR SELECT
USING (true);

CREATE POLICY "Admins can manage courses"
ON public.courses FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- Enrollments policies
CREATE POLICY "Admins can manage enrollments"
ON public.enrollments FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Students can view their own enrollments"
ON public.enrollments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM students s
  WHERE s.id = enrollments.student_id AND s.user_id = auth.uid()
));

CREATE POLICY "Faculty can view enrollments for their courses"
ON public.enrollments FOR SELECT
USING (
  has_role(auth.uid(), 'faculty'::user_role) AND
  EXISTS (
    SELECT 1 FROM courses c
    JOIN faculty f ON f.id = c.assigned_faculty_id
    WHERE c.id = enrollments.course_id AND f.user_id = auth.uid()
  )
);

-- Fee invoices policies
CREATE POLICY "Admins can manage fee invoices"
ON public.fee_invoices FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Students can view their own fee invoices"
ON public.fee_invoices FOR SELECT
USING (EXISTS (
  SELECT 1 FROM students s
  WHERE s.id = fee_invoices.student_id AND s.user_id = auth.uid()
));

-- Add triggers for updated_at
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fee_invoices_updated_at
BEFORE UPDATE ON public.fee_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();