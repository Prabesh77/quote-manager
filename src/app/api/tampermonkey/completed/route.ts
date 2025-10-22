import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = 'https://ofpvxrsvnmgktypwluoo.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { status: 200, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/quotes?select=quote_ref&status=eq.priced`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY || '',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('Failed to fetch priced quotes:', err);
      return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500, headers: CORS_HEADERS });
    }

    const quotes = await res.json();

    const cleanData = (Array.isArray(quotes) ? quotes : []).filter(q => q.quote_ref).map(q => ({
      quote_ref: q.quote_ref,
    }));

    return NextResponse.json(cleanData, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
