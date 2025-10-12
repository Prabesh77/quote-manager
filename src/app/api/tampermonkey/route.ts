import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { partText } = req.body;
    if (!partText) {
        return res.status(400).json({ error: "Missing part text" });
    }

    try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + process.env.GEMINI_API_KEY, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: `
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
                                    4. If multiple possibilities exist or the text is ambiguous or incomplete such that you are **less than 80% confident**, return "Ignore" instead of guessing.
                                    5. Do not add explanations, reasoning, or extra words — return only the final label.

                                    Now determine the correct part name for this input:

                                    Part Text: "${partText}"
                                    `
                            }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();
        const aiResult = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        return res.status(200).json({ match: aiResult || "Unknown" });
    } catch (err: any) {
        console.error("AI API Error:", err);
        return res.status(500).json({ error: "AI request failed", details: err.message });
    }
}
