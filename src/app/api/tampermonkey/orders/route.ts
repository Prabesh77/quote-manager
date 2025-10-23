import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = "https://ofpvxrsvnmgktypwluoo.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

// ✅ POST: insert or update record for quote_ref
export async function POST(req: NextRequest) {
  try {
    const { quote_ref, opened_by } = await req.json();

    if (!quote_ref || !opened_by) {
      return NextResponse.json(
        { error: "quote_ref and opened_by are required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const payload = [{ quote_ref, opened_by }];

    const res = await fetch(`${SUPABASE_URL}/rest/v1/order_track`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Supabase insert failed: ${text}`);
    }

    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { headers: CORS_HEADERS });

  } catch (err) {
    console.error("POST /ordertrack error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// ✅ GET: fetch opened_by by quote_ref + total count for that opened_by
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quote_ref = searchParams.get("quote_ref");

    if (!quote_ref) {
      return NextResponse.json(
        { error: "quote_ref is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 1️⃣ Fetch opened_by for the given quote_ref
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/order_track?quote_ref=eq.${encodeURIComponent(
        quote_ref
      )}&select=opened_by`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0 || !data[0].opened_by) {
      return NextResponse.json(
        { opened_by: null, total_count: 0 },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    const opened_by = data[0].opened_by;

    // 2️⃣ Fetch total count of rows by that opened_by
    const countRes = await fetch(
      `${SUPABASE_URL}/rest/v1/order_track?opened_by=eq.${encodeURIComponent(
        opened_by
      )}&select=quote_ref`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: "count=exact", // ✅ Ask Supabase to return count in headers
        },
      }
    );

    const totalCount = Number(countRes.headers.get("content-range")?.split("/")[1]) || 0;

    // 3️⃣ Respond with both values
    return NextResponse.json(
      { opened_by, total_count: totalCount },
      { headers: CORS_HEADERS }
    );

  } catch (err) {
    console.error("GET /ordertrack error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
