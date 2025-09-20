import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

// GET - Fetch all parts rules
export async function GET() {
  try {
    const { data: rules, error } = await supabase
      .from('parts_rules')
      .select('*')
      .order('part_name', { ascending: true });

    if (error) {
      console.error('Error fetching parts rules:', error);
      return NextResponse.json({ error: 'Failed to fetch parts rules' }, { status: 500 });
    }

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new parts rule
export async function POST(request: NextRequest) {
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

    // Create the rule
    const { data: rule, error } = await supabaseWithAuth
      .from('parts_rules')
      .insert({
        part_name,
        rule_type,
        brands: brands || [],
        description: description || null,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating parts rule:', error);
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'A rule for this part already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create parts rule' }, { status: 500 });
    }

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
