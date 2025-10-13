import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const SUPABASE_URL = 'https://ofpvxrsvnmgktypwluoo.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // or restrict to your domain
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { status: 200, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const { quoteRef, userPartNames } = await req.json();

    if (!quoteRef || !Array.isArray(userPartNames) || !userPartNames.length) {
      return NextResponse.json(
        { error: 'quoteRef and userPartNames are required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 1️⃣ Fetch quote
    const quoteRes = await fetch(
      `${SUPABASE_URL}/rest/v1/quotes?select=id,quote_ref,notes,parts_requested&quote_ref=eq.${quoteRef}`,
      { headers: { apikey: SUPABASE_ANON_KEY || '', Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const quote = (await quoteRes.json())[0];
    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404, headers: CORS_HEADERS });

    // 2️⃣ Fetch parts by IDs
    const partsRequested = Array.isArray(quote.parts_requested) ? quote.parts_requested : [];
    const partIds = partsRequested.map((p: any) => p.part_id).filter(Boolean);

    let fetchedParts: any[] = [];
    if (partIds.length) {
      const partsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/parts?id=in.(${partIds.join(',')})&select=id,part_name,part_number,note`,
        { headers: { apikey: SUPABASE_ANON_KEY || '', Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const data = await partsRes.json();
      fetchedParts = Array.isArray(data) ? data : [];
    }

    // 3️⃣ Merge partsRequested with fetchedParts
    const partsMap: Record<string, any> = {};
    fetchedParts.forEach(p => { partsMap[p.id] = p; });

    const mergedParts = partsRequested.map((pr: any) => {
      const fetchedPart = partsMap[pr.part_id] || {};
      return {
        ...fetchedPart,              // Base part data from parts table (id, part_name, part_number, etc.)
        part_id: pr.part_id,         // Keep the part_id from parts_requested
        notes: pr.notes,             // Override with notes from parts_requested
        price: pr.price,             // Override with price from parts_requested
        list_price: pr.list_price,   // Override with list_price from parts_requested
        variants: pr.variants || fetchedPart.variants || []
      };
    });

    // 4️⃣ AI detection for each userPartName (with graceful error handling)
    let aiResults: any[] = [];
    let aiError: string | null = null;
    
    try {
      aiResults = await Promise.all(userPartNames.map(async (userPartName: string) => {
        try {
          const prompt = `
You are an expert automotive parts specialist trained to identify front-end car parts from short, often incomplete or abbreviated text inputs.

Valid part names:
- Right Headlamp
- Left Headlamp
- Right DayLight
- Left DayLight
- Radiator
- Condenser
- Intercooler
- Oil Cooler
- Radar Sensor
- Auxiliary Radiator

Rules:
1. Return only **one** of the exact part names above.
2. Ignore any special symbols (*, -, ., #, etc.) and spacing differences.
3. Understand common abbreviations and shorthand.
4. Do not add explanations, reasoning, or extra words — return only the final label.

Determine the correct part name for this input:

Part Text: "${userPartName}"
`;

          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
          const result = await model.generateContent(prompt);
          const realPartName = result.response.text().trim();

          // Strict, case-insensitive match with mergedParts
          const matchedPart = mergedParts.find((p: any) =>
            (p.part_name || '').trim().toLowerCase() === realPartName.toLowerCase()
          ) || null;

          return {
            userPartName,
            realPartName,
            partsData: matchedPart,
            error: null
          };
        } catch (partError) {
          // If individual part AI fails, return error for that part only
          console.error(`AI error for "${userPartName}":`, partError);
          return {
            userPartName,
            realPartName: null,
            partsData: null,
            error: partError instanceof Error ? partError.message : 'AI processing failed'
          };
        }
      }));
    } catch (err) {
      // If the entire AI process fails, log it but continue
      console.error('AI detection failed:', err);
      aiError = err instanceof Error ? err.message : 'AI service unavailable';
      // Return empty results for each user part name
      aiResults = userPartNames.map((userPartName: string) => ({
        userPartName,
        realPartName: null,
        partsData: null,
        error: aiError
      }));
    }

    // 5️⃣ Return all results (always successful, even if AI failed)
    return NextResponse.json({
      quoteNotes: quote.notes || '',
      aiParts: aiResults,
      allPartsInQuote: mergedParts,  // All parts from quote for manual selection
      aiError: aiError  // Include error if AI completely failed
    }, { headers: CORS_HEADERS });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
