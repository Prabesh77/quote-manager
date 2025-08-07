import supabase from './supabase';

export async function deleteAndRecreateUsers() {
  console.log('Deleting existing users and recreating...');

  try {
    // Delete existing user profiles
    const { error: deleteProfilesError } = await supabase
      .from('user_profiles')
      .delete()
      .in('email', ['admin@delivery.com', 'driver@delivery.com']);

    if (deleteProfilesError) {
      console.error('Error deleting profiles:', deleteProfilesError);
    } else {
      console.log('✅ Deleted existing user profiles');
    }

    // Create new admin user
    const { data: adminAuth, error: adminAuthError } = await supabase.auth.signUp({
      email: 'admin@delivery.com',
      password: 'admin123',
    });

    if (adminAuthError) {
      console.error('Error creating admin auth:', adminAuthError);
    } else if (adminAuth.user) {
      // Create admin profile
      const { error: adminProfileError } = await supabase
        .from('user_profiles')
        .insert({
          id: adminAuth.user.id,
          email: 'admin@delivery.com',
          name: 'Admin User',
          type: 'admin',
        });

      if (adminProfileError) {
        console.error('Error creating admin profile:', adminProfileError);
      } else {
        console.log('✅ Admin user created: admin@delivery.com / admin123');
      }
    }

    // Create new driver user
    const { data: driverAuth, error: driverAuthError } = await supabase.auth.signUp({
      email: 'driver@delivery.com',
      password: 'driver123',
    });

    if (driverAuthError) {
      console.error('Error creating driver auth:', driverAuthError);
    } else if (driverAuth.user) {
      // Create driver profile
      const { error: driverProfileError } = await supabase
        .from('user_profiles')
        .insert({
          id: driverAuth.user.id,
          email: 'driver@delivery.com',
          name: 'John Driver',
          type: 'driver',
        });

      if (driverProfileError) {
        console.error('Error creating driver profile:', driverProfileError);
      } else {
        console.log('✅ Driver user created: driver@delivery.com / driver123');
      }
    }

    console.log('\n🎉 Users recreated successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@delivery.com / admin123');
    console.log('Driver: driver@delivery.com / driver123');
    console.log('\n✅ You should now be able to login without email confirmation.');

  } catch (error) {
    console.error('Error in delete and recreate process:', error);
  }
} 