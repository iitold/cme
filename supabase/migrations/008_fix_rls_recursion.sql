-- 1. Create is_admin function as SECURITY DEFINER to bypass RLS when checking admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.doctors 
    WHERE doctors.user_id = auth.uid() AND doctors.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update RLS policy for doctors table
DROP POLICY IF EXISTS "admins: manage all doctors" ON public.doctors;
CREATE POLICY "admins: manage all doctors" ON public.doctors
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 3. Update RLS policy for password_reset_requests table
DROP POLICY IF EXISTS "admins: manage all requests" ON public.password_reset_requests;
CREATE POLICY "admins: manage all requests" ON public.password_reset_requests
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 4. Update RLS policy for courses table
DROP POLICY IF EXISTS "admins: manage all courses" ON public.courses;
CREATE POLICY "admins: manage all courses" ON public.courses
  FOR ALL TO authenticated
  USING (public.is_admin());
