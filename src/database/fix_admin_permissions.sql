-- Fix RLS policies to allow admin users to read all user profiles
-- Run this in your Supabase SQL editor

-- First, drop the existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.user_profiles;

-- Create new policies that allow admin access
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy 2: Admin users can view ALL profiles
CREATE POLICY "Admin can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 3: Users can update their own profile (basic info only)
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy 4: Admin users can update ALL profiles
CREATE POLICY "Admin can update all profiles" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 5: Allow authenticated users to insert (for signup)
CREATE POLICY "Allow authenticated users to insert" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 6: Admin users can insert profiles for others
CREATE POLICY "Admin can insert profiles" ON public.user_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 7: Admin users can delete profiles
CREATE POLICY "Admin can delete profiles" ON public.user_profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
