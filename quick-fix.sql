-- Quick Fix for Current Issues
-- Run this in your Supabase SQL Editor

-- 1. Temporarily disable RLS on profiles to fix the 406 error
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Create the missing profile for your user
INSERT INTO profiles (id, full_name, email, phone, role, status) 
VALUES (
    '4760bc38-23a0-452a-b741-576ec16faedd', 
    'Admin User', 
    'aslentechsolutions@gmail.com', 
    '1234567890', 
    'admin', 
    'active'
)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

-- 3. Re-enable RLS with a simple policy
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create a simple policy that allows authenticated users to read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;

-- Simple policy: users can see their own profile
CREATE POLICY "profiles_own_select" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Admin users can see all profiles
CREATE POLICY "profiles_admin_all" ON profiles
    FOR ALL USING (
        id = auth.uid() OR 
        auth.uid() = '4760bc38-23a0-452a-b741-576ec16faedd'
    );

-- Success message
SELECT 'Profile created and RLS fixed! You should be able to access the app now.' as status;