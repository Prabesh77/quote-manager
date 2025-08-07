import supabase from './supabase';

export async function createTestUsers() {
  console.log('Setting up test data...');

  try {
    // Since users already exist, we'll create profiles for them
    // You'll need to get the actual user IDs from Supabase dashboard
    console.log('⚠️  Users already exist. Please create profiles manually:');
    console.log('1. Go to Supabase Dashboard → Authentication → Users');
    console.log('2. Copy the user IDs for admin@delivery.com and driver@delivery.com');
    console.log('3. Run this SQL in Supabase SQL Editor:');
    console.log(`
-- Replace USER_ID_1 and USER_ID_2 with actual user IDs
INSERT INTO user_profiles (id, email, name, type)
VALUES 
  ('USER_ID_1', 'admin@delivery.com', 'Admin User', 'admin'),
  ('USER_ID_2', 'driver@delivery.com', 'John Driver', 'driver')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  type = EXCLUDED.type;
    `);

    // Add some test customers
    const testCustomers = [
      {
        account_number: 'ACC001',
        customer_name: 'John Smith',
        address: '123 Main St, Melbourne VIC 3000',
        phone: '0412345678',
        email: 'john.smith@email.com',
      },
      {
        account_number: 'ACC002',
        customer_name: 'Sarah Johnson',
        address: '456 Oak Ave, Sydney NSW 2000',
        phone: '0423456789',
        email: 'sarah.johnson@email.com',
      },
      {
        account_number: 'ACC003',
        customer_name: 'Mike Wilson',
        address: '789 Pine Rd, Brisbane QLD 4000',
        phone: '0434567890',
        email: 'mike.wilson@email.com',
      },
    ];

    for (const customer of testCustomers) {
      const { error } = await supabase
        .from('customers')
        .upsert(customer, { onConflict: 'account_number' });

      if (error) {
        console.error(`Error creating customer ${customer.account_number}:`, error);
      } else {
        console.log(`✅ Customer created/updated: ${customer.customer_name} (${customer.account_number})`);
      }
    }

    // Add some test deliveries
    const testDeliveries = [
      {
        account_number: 'ACC001',
        customer_name: 'John Smith',
        address: '123 Main St, Melbourne VIC 3000',
        delivery_round: 'Morning',
        invoice_number: 'INV001',
        status: 'pending',
      },
      {
        account_number: 'ACC002',
        customer_name: 'Sarah Johnson',
        address: '456 Oak Ave, Sydney NSW 2000',
        delivery_round: 'Afternoon',
        invoice_number: 'INV002',
        status: 'pending',
      },
      {
        account_number: 'ACC003',
        customer_name: 'Mike Wilson',
        address: '789 Pine Rd, Brisbane QLD 4000',
        delivery_round: 'Evening',
        invoice_number: 'INV003',
        status: 'pending',
      },
    ];

    for (const delivery of testDeliveries) {
      const { error } = await supabase
        .from('deliveries')
        .upsert(delivery, { onConflict: 'invoice_number' });

      if (error) {
        console.error(`Error creating delivery ${delivery.invoice_number}:`, error);
      } else {
        console.log(`✅ Delivery created/updated: ${delivery.customer_name} (${delivery.invoice_number})`);
      }
    }

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@delivery.com / admin123');
    console.log('Driver: driver@delivery.com / driver123');
    console.log('\n⚠️  Remember to create user profiles manually using the SQL above!');

  } catch (error) {
    console.error('Error in createTestUsers:', error);
    throw error;
  }
} 