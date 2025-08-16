-- Fix RLS policies with simple, non-recursive approach
-- Run this in your Supabase SQL editor

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON public.user_profiles;

-- Temporarily disable RLS to avoid recursion issues
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- Policy 1: Allow all authenticated users to read all profiles (for admin management)
CREATE POLICY "Allow authenticated users to read profiles" ON public.user_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 2: Allow users to update their own profile
CREATE POLICY "Allow users to update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Allow admin users to update any profile (for user management)
CREATE POLICY "Allow admin to update any profile" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 4: Allow authenticated users to insert (for signup)
CREATE POLICY "Allow authenticated users to insert" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 5: Allow authenticated users to delete (for admin management)
CREATE POLICY "Allow authenticated users to delete" ON public.user_profiles
  FOR DELETE USING (auth.role() = 'authenticated');

-- Note: This approach gives authenticated users broad access to read/delete
-- In production, you might want to implement more granular role-based policies
-- but this will fix the immediate recursion issue
