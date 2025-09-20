import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export interface PartsRule {
  id: string;
  part_name: string;
  rule_type: 'required_for' | 'not_required_for' | 'none';
  brands: string[];
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// PUT - Update a parts rule
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = cookies();
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Cookie: cookieStore.toString(),
          },
        },
      }
    );

    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseWithAuth
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { part_name, rule_type, brands, description } = body;

    // Validate required fields
    if (!part_name || !rule_type) {
      return NextResponse.json({ error: 'part_name and rule_type are required' }, { status: 400 });
    }

    // Validate rule_type
    if (!['required_for', 'not_required_for', 'none'].includes(rule_type)) {
      return NextResponse.json({ error: 'Invalid rule_type' }, { status: 400 });
    }

    // Update the rule
    const { id } = await params;
    const { data: rule, error } = await supabaseWithAuth
      .from('parts_rules')
      .update({
        part_name,
        rule_type,
        brands: brands || [],
        description: description || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating parts rule:', error);
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'A rule for this part already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to update parts rule' }, { status: 500 });
    }

    if (!rule) {
      return NextResponse.json({ error: 'Parts rule not found' }, { status: 404 });
    }

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a parts rule
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = cookies();
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Cookie: cookieStore.toString(),
          },
        },
      }
    );

    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseWithAuth
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Delete the rule
    const { id } = await params;
    const { error } = await supabaseWithAuth
      .from('parts_rules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting parts rule:', error);
      return NextResponse.json({ error: 'Failed to delete parts rule' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Parts rule deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
