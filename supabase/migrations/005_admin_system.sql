-- Enable pgcrypto extension for password hashing if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Alter doctors table to support roles and email caching
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'doctor' CHECK (role IN ('doctor', 'admin'));
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS email TEXT;

-- Sync existing doctors emails from auth.users
UPDATE doctors d
SET email = u.email
FROM auth.users u
WHERE d.user_id = u.id AND d.email IS NULL;

-- 2. Create password_reset_requests table
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Apply updated_at trigger to password_reset_requests
DROP TRIGGER IF EXISTS set_updated_at ON password_reset_requests;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON password_reset_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Configure RLS Policies
-- Enable RLS for password_reset_requests
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to submit forgot-password requests
CREATE POLICY "anonymous: insert requests" ON password_reset_requests
  FOR INSERT WITH CHECK (true);

-- Allow admins to manage password_reset_requests
CREATE POLICY "admins: manage all requests" ON password_reset_requests
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM doctors WHERE user_id = auth.uid() AND role = 'admin'));

-- Allow admins to read, update, and delete all doctors
CREATE POLICY "admins: manage all doctors" ON doctors
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM doctors WHERE user_id = auth.uid() AND role = 'admin'));

-- Allow admins to manage all courses
CREATE POLICY "admins: manage all courses" ON courses
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM doctors WHERE user_id = auth.uid() AND role = 'admin'));

-- 4. Create admin security helper functions (RPCs)
-- Function to delete user (auth.users + cascade to doctors/courses)
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Security check: check if executing user is admin
  IF EXISTS (SELECT 1 FROM doctors WHERE user_id = auth.uid() AND role = 'admin') THEN
    DELETE FROM auth.users WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized: Only administrators can delete users';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to lock/unlock user
CREATE OR REPLACE FUNCTION admin_toggle_lock_user(target_user_id UUID, is_locked BOOLEAN)
RETURNS VOID AS $$
BEGIN
  -- Security check: check if executing user is admin
  IF EXISTS (SELECT 1 FROM doctors WHERE user_id = auth.uid() AND role = 'admin') THEN
    IF is_locked THEN
      -- Ban user indefinitely
      UPDATE auth.users 
      SET banned_until = '2099-12-31T23:59:59Z'::timestamptz 
      WHERE id = target_user_id;
    ELSE
      -- Remove ban
      UPDATE auth.users 
      SET banned_until = NULL 
      WHERE id = target_user_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Unauthorized: Only administrators can lock/unlock users';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset user password
CREATE OR REPLACE FUNCTION admin_reset_user_password(target_user_id UUID, new_password TEXT)
RETURNS VOID AS $$
BEGIN
  -- Security check: check if executing user is admin
  IF EXISTS (SELECT 1 FROM doctors WHERE user_id = auth.uid() AND role = 'admin') THEN
    UPDATE auth.users 
    SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')) 
    WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized: Only administrators can reset user passwords';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to query banned users
CREATE OR REPLACE FUNCTION admin_get_banned_users()
RETURNS TABLE (user_id UUID) AS $$
BEGIN
  -- Security check: check if executing user is admin
  IF EXISTS (SELECT 1 FROM doctors WHERE user_id = auth.uid() AND role = 'admin') THEN
    RETURN QUERY 
    SELECT id FROM auth.users WHERE banned_until IS NOT NULL AND banned_until > now();
  ELSE
    RAISE EXCEPTION 'Unauthorized: Only administrators can query banned users';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seeding of initial admin removed to prevent credential leak. Administrative account must be provisioned via safe backend scripts or dashboard direct SQL.
