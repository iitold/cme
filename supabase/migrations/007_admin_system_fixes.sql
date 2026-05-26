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
