-- Create admin_update_doctor_role function with SECURITY DEFINER and search_path set
CREATE OR REPLACE FUNCTION public.admin_update_doctor_role(target_doctor_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can update doctor roles';
  END IF;

  UPDATE public.doctors
  SET role = new_role
  WHERE id = target_doctor_id;
END;
$$;
