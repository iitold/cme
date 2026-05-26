-- 1. Fix the admin_get_banned_users RPC function to avoid column ambiguity and match return types
CREATE OR REPLACE FUNCTION admin_get_banned_users()
RETURNS TABLE (banned_user_id UUID) AS $$
BEGIN
  -- Security check: check if executing user is admin
  IF EXISTS (SELECT 1 FROM public.doctors WHERE doctors.user_id = auth.uid() AND doctors.role = 'admin') THEN
    RETURN QUERY 
    SELECT id FROM auth.users WHERE banned_until IS NOT NULL AND banned_until > now();
  ELSE
    RAISE EXCEPTION 'Unauthorized: Only administrators can query banned users';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure the doctor profile row exists for the admin user in public.doctors
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.doctors WHERE doctors.user_id = (SELECT id FROM auth.users WHERE email = 'doancongthanh92@gmail.com')) THEN
    INSERT INTO public.doctors (
      id,
      user_id,
      full_name,
      email,
      role,
      cchn_cycle_start,
      cme_target_credits,
      cme_min_per_year
    ) VALUES (
      gen_random_uuid(),
      (SELECT id FROM auth.users WHERE email = 'doancongthanh92@gmail.com'),
      'Administrator',
      'doancongthanh92@gmail.com',
      'admin',
      current_date,
      0,
      0
    );
  ELSE
    -- If it exists, ensure the role is set to admin and email is cached
    UPDATE public.doctors 
    SET role = 'admin', email = 'doancongthanh92@gmail.com' 
    WHERE doctors.user_id = (SELECT id FROM auth.users WHERE email = 'doancongthanh92@gmail.com');
  END IF;
END $$;
