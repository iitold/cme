-- Force update password for the admin account to KsTh@nh77
UPDATE auth.users 
SET encrypted_password = extensions.crypt('KsTh@nh77', extensions.gen_salt('bf')) 
WHERE email = 'doancongthanh92@gmail.com';
