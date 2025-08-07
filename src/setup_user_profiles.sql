-- Step 1: Get the user IDs for existing users
SELECT id, email, created_at FROM auth.users 
WHERE email IN ('admin@delivery.com', 'driver@delivery.com')
ORDER BY email;

-- Step 2: Create user profiles (replace USER_ID_1 and USER_ID_2 with actual IDs from step 1)
-- Copy the user IDs from the query above and replace them in the INSERT statement below

/*
INSERT INTO user_profiles (id, email, name, type)
VALUES 
  ('USER_ID_1', 'admin@delivery.com', 'Admin User', 'admin'),
  ('USER_ID_2', 'driver@delivery.com', 'John Driver', 'driver')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  type = EXCLUDED.type;
*/

-- Step 3: Verify the profiles were created
SELECT * FROM user_profiles ORDER BY email; 