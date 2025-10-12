import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function OPTIONS(req: NextRequest) {
  // Handle preflight requests
  const res = NextResponse.json({});
  res.headers.set('Access-Control-Allow-Origin', '*'); // or restrict to your domain
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

export async function POST(req: NextRequest) {
  try {
    // --- CORS headers ---
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*', // or your domain
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    });

    const { partText } = await req.json();

    const prompt = `
You are an expert automotive parts specialist trained to identify front-end car parts from short, often incomplete or abbreviated text inputs.

You will receive a short text describing or abbreviating a car part (for example: "RH HLAMP", "LH RAD", "COND", "RADAR", "AUX RAD", etc.).

Your goal is to determine which exact part the user is referring to and return ONLY one standardized part name from the list below — or "Ignore" if the meaning is not clear with at least 80% confidence.

Valid part names:
- Right Headlamp
- Left Headlamp
- Right Daytime Lamp
- Left Daytime Lamp
- Radiator
- Condenser
- Intercooler
- Oil Cooler
- Radar Sensor
- Auxiliary Radiator

### Rules:
1. Return only **one** of the exact part names above, or "Ignore".
2. Ignore any special symbols (*, -, ., #, etc.) and spacing differences.
3. Understand common abbreviations and shorthand:
   - RH / R / RIGHT → Right side
   - LH / L / LEFT → Left side
   - H/LAMP, HLAMP, HEADLAMP, HEAD LIGHT → Headlamp
   - DRL, D/LAMP, DAYLAMP, DAYTIME → Daytime Lamp
   - RAD, RADIATOR, COOLER (for coolant), MAIN COOLER → Radiator
   - CON, COND, CONDENSER → Condenser
   - I/C, INTERCOOLER, CHARGE AIR COOLER, ADD COOLER → Intercooler
   - OIL COOLER, ENG OIL COOLER → Oil Cooler
   - RADAR, SENSOR, WAVE SENSOR, CRUISE SENSOR, GRILL SENSOR, SPEED SENSOR → Radar Sensor
   - AUX RAD, AUXILIARY RADIATOR, SUB RAD → Auxiliary Radiator
4. If multiple possibilities exist or the text is ambiguous or incomplete such that you are **less than 30% confident**, return "Ignore" instead of guessing.
5. Do not add explanations, reasoning, or extra words — return only the final label.

Now determine the correct part name for this input:

Part Text: "${partText}"
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);

    const text = result.response.text().trim();

    return new Response(JSON.stringify({ part: text }), { headers });
  } catch (err) {
    console.error("AI error:", err);
    return new Response(JSON.stringify({
      part: "Ignore",
      error: err instanceof Error ? err.message : 'Unknown error'
    }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
