-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

DROP POLICY IF EXISTS "Admins can manage customers" ON customers;
DROP POLICY IF EXISTS "Service role can manage customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;

DROP POLICY IF EXISTS "Admins can manage all deliveries" ON deliveries;
DROP POLICY IF EXISTS "Service role can manage deliveries" ON deliveries;
DROP POLICY IF EXISTS "Drivers can view assigned deliveries" ON deliveries;
DROP POLICY IF EXISTS "Drivers can update assigned deliveries" ON deliveries;
DROP POLICY IF EXISTS "Authenticated users can view deliveries" ON deliveries;

DROP POLICY IF EXISTS "Drivers can manage their own assignments" ON driver_deliveries;
DROP POLICY IF EXISTS "Admins can view all driver assignments" ON driver_deliveries;
DROP POLICY IF EXISTS "Service role can manage driver deliveries" ON driver_deliveries;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_deliveries_updated_at ON deliveries;

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('admin', 'driver')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deliveries Table
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  address TEXT NOT NULL,
  delivery_round TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'delivered')),
  assigned_to UUID REFERENCES user_profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  photo_proof TEXT,
  receiver_name TEXT,
  signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver Deliveries Table (for tracking driver assignments)
CREATE TABLE IF NOT EXISTS driver_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'delivered')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  photo_proof TEXT,
  receiver_name TEXT,
  signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies

-- User Profiles RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to manage profiles (for setup)
CREATE POLICY "Service role can manage profiles" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view all profiles (for admin check)
CREATE POLICY "Authenticated users can view profiles" ON user_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Customers RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage customers (for setup)
CREATE POLICY "Service role can manage customers" ON customers
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view customers
CREATE POLICY "Authenticated users can view customers" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to manage customers (for admin operations)
CREATE POLICY "Authenticated users can manage customers" ON customers
  FOR ALL USING (auth.role() = 'authenticated');

-- Deliveries RLS
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage deliveries (for setup)
CREATE POLICY "Service role can manage deliveries" ON deliveries
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view deliveries
CREATE POLICY "Authenticated users can view deliveries" ON deliveries
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to manage deliveries (for admin operations)
CREATE POLICY "Authenticated users can manage deliveries" ON deliveries
  FOR ALL USING (auth.role() = 'authenticated');

-- Driver Deliveries RLS
ALTER TABLE driver_deliveries ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage driver deliveries (for setup)
CREATE POLICY "Service role can manage driver deliveries" ON driver_deliveries
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to manage driver deliveries
CREATE POLICY "Authenticated users can manage driver deliveries" ON driver_deliveries
  FOR ALL USING (auth.role() = 'authenticated');

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_assigned_to ON deliveries(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON deliveries(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_account_number ON customers(account_number);
CREATE INDEX IF NOT EXISTS idx_driver_deliveries_driver_id ON driver_deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_deliveries_delivery_id ON driver_deliveries(delivery_id);

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 