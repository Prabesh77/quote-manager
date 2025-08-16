// Helper script to set up user profiles in Supabase
// Run this in your browser console on the Supabase dashboard or use the SQL directly

// First, run this SQL in Supabase SQL Editor to create the table:
/*
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

-- Create policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);
*/

// Then, manually insert your user profile (replace with your actual user ID):
/*
-- Get your user ID from Supabase Auth > Users
-- Then run this SQL (replace 'your-user-id-here' with your actual UUID):

INSERT INTO public.user_profiles (id, username, full_name, role) 
VALUES (
  'your-user-id-here',  -- Replace with your actual user ID
  'your-username',       -- Replace with your desired username
  'Your Full Name',      -- Replace with your full name
  'admin'                -- Replace with desired role: 'quote_creator', 'price_manager', 'quality_controller', or 'admin'
);
*/

console.log('Setup instructions:');
console.log('1. Run the CREATE TABLE SQL in Supabase SQL Editor');
console.log('2. Get your user ID from Supabase Auth > Users');
console.log('3. Run the INSERT SQL with your actual user ID');
console.log('4. Refresh your app and you should see your role!');
