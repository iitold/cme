-- 1. Revoke direct updates on the role column for doctors table
REVOKE UPDATE (role) ON public.doctors FROM authenticated;

-- 2. Create trigger function to prevent self-update of roles unless executor is admin
CREATE OR REPLACE FUNCTION public.prevent_role_self_update()
RETURNS trigger AS $$
BEGIN
  -- If trying to change role and not an admin, block it
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change account roles.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- Apply trigger to doctors
DROP TRIGGER IF EXISTS doctors_prevent_role_self_update ON public.doctors;
CREATE TRIGGER doctors_prevent_role_self_update
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_update();

-- 3. Harden storage bucket configuration for certificates
UPDATE storage.buckets
SET public = false,
    file_size_limit = 5242880, -- 5MB limit
    allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/webp']
WHERE id = 'certificates';

-- Reconfigure storage RLS policies for private bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "owners read certificates" ON storage.objects;

CREATE POLICY "owners read certificates"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'certificates'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
  )
);

-- 4. Harden search_path on all SECURITY DEFINER RPC functions
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public, auth, extensions
AS $$
BEGIN
  IF public.is_admin() THEN
    DELETE FROM auth.users WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized: Only administrators can delete users';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_toggle_lock_user(target_user_id UUID, is_locked BOOLEAN)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public, auth, extensions
AS $$
BEGIN
  IF public.is_admin() THEN
    IF is_locked THEN
      UPDATE auth.users 
      SET banned_until = '2099-12-31T23:59:59Z'::timestamptz 
      WHERE id = target_user_id;
    ELSE
      UPDATE auth.users 
      SET banned_until = NULL 
      WHERE id = target_user_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Unauthorized: Only administrators can lock/unlock users';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_user_password(target_user_id UUID, new_password TEXT)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public, auth, extensions
AS $$
BEGIN
  IF public.is_admin() THEN
    UPDATE auth.users 
    SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')) 
    WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized: Only administrators can reset user passwords';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_banned_users()
RETURNS TABLE (banned_user_id UUID) 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public, auth, extensions
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.doctors WHERE doctors.user_id = auth.uid() AND doctors.role = 'admin') THEN
    RETURN QUERY 
    SELECT id FROM auth.users WHERE banned_until IS NOT NULL AND banned_until > now();
  ELSE
    RAISE EXCEPTION 'Unauthorized: Only administrators can query banned users';
  END IF;
END;
$$;

-- 5. Add email format constraint for reset requests to prevent spam
ALTER TABLE public.password_reset_requests DROP CONSTRAINT IF EXISTS password_reset_email_format;
ALTER TABLE public.password_reset_requests
  ADD CONSTRAINT password_reset_email_format
  CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$');
