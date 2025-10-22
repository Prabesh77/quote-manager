import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = 'https://ofpvxrsvnmgktypwluoo.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Or restrict to your domain
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: CORS_HEADERS });
}

/**
 * 🟢 GET /api/tampermonkey/opened?quote_ref=A12345
 * Returns: { quote_ref, opened_by } if found, else 404
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quote_ref = searchParams.get("quote_ref");

    if (!quote_ref) {
      return NextResponse.json(
        { error: "Missing quote_ref" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/opened_quotes?select=quote_ref,opened_by&quote_ref=eq.${encodeURIComponent(quote_ref)}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(data[0], { headers: CORS_HEADERS });
  } catch (err) {
    console.error("GET /opened error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * 🟠 POST /api/tampermonkey/opened
 * Body: { quote_ref: string, opened_by: string }
 * Saves or updates record in DB.
 */
export async function POST(req: NextRequest) {
  try {
    const { quote_ref, opened_by } = await req.json();

    if (!quote_ref || !opened_by) {
      return NextResponse.json(
        { error: "quote_ref and opened_by are required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Upsert (insert or update if quote_ref already exists)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/opened_quotes`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify([{ quote_ref, opened_by }]),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase insert failed: ${text}`);
    }

    return NextResponse.json(
      { success: true, quote_ref, opened_by },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("POST /opened error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
