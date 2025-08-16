-- Create users table for role-based authentication
-- This table will store additional user information beyond Supabase auth.users

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) NOT NULL CHECK (role IN ('quote_creator', 'price_manager', 'quality_controller', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create simplified policies to avoid recursion
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (basic info only)
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to insert (for signup)
CREATE POLICY "Allow authenticated users to insert" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- For admin operations, we'll handle this in the application logic
-- rather than complex RLS policies that can cause recursion

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'quote_creator' -- Default role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);

-- Insert some sample users (you can modify these)
-- Note: These are just examples, you'll need to create actual Supabase auth users first
-- INSERT INTO public.user_profiles (id, username, full_name, role) VALUES
--   ('sample-uuid-1', 'admin', 'System Administrator', 'admin'),
--   ('sample-uuid-2', 'quoter1', 'Quote Creator 1', 'quote_creator'),
--   ('sample-uuid-3', 'pricer1', 'Price Manager 1', 'price_manager'),
--   ('sample-uuid-4', 'verifier1', 'Quality Controller 1', 'quality_controller');
