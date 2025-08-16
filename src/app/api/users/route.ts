import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, full_name, role } = await request.json();

    // Validate required fields
    if (!email || !password || !username || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['quote_creator', 'price_manager', 'quality_controller', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        username,
        full_name
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return NextResponse.json(
        { error: `Failed to create user in authentication: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user in authentication' },
        { status: 500 }
      );
    }

    // Step 2: Create or update user profile
    // The trigger might have already created a profile, so we'll upsert
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: authData.user.id,
        username,
        full_name,
        role,
        is_active: true
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      // If profile creation fails, we should clean up the auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error('Failed to clean up auth user after profile creation failure:', deleteError);
      }
      
      return NextResponse.json(
        { error: `Failed to create user profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Verify the profile was created/updated
    const { data: verifyProfile, error: verifyError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (verifyError || !verifyProfile) {
      console.error('Profile verification failed:', verifyError);
      return NextResponse.json(
        { error: 'Failed to verify user profile creation' },
        { status: 500 }
      );
    }

    console.log('User profile verified:', verifyProfile);

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: verifyProfile.username,
        full_name: verifyProfile.full_name,
        role: verifyProfile.role,
        is_active: verifyProfile.is_active
      }
    });

  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
