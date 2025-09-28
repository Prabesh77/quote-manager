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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Step 1: Delete user profile from user_profiles table
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Profile deletion error:', profileError);
      return NextResponse.json(
        { error: `Failed to delete user profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Step 2: Delete user from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Auth deletion error:', authError);
      return NextResponse.json(
        { error: `Failed to delete user from authentication: ${authError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
