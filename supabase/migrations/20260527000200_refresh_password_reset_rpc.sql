CREATE OR REPLACE FUNCTION public.admin_reset_user_password_by_email(target_email TEXT, new_password TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can reset user passwords';
  END IF;

  SELECT id INTO target_user_id
  FROM auth.users
  WHERE lower(email) = lower(trim(target_email))
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No authentication account found for this email';
  END IF;

  UPDATE auth.users
  SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = target_user_id;

  RETURN target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_user_password_by_email(TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
