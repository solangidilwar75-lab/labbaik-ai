export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "Gemini API key is not configured yet. Add GEMINI_API_KEY in Vercel." });
  }

  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) return res.status(400).json({ error: "Please enter a message." });
  if (message.length > 4000) return res.status(400).json({ error: "Message is too long." });

  try {
    const upstream = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: "You are Labbaik AI, a helpful, respectful multilingual assistant. Reply in the language the user uses (Urdu, Roman Urdu, English, or Arabic). Be clear and concise. Do not claim to make bookings, payments, visa approvals, or other real-world actions unless actually completed."
            }]
          },
          contents: [{ role: "user", parts: [{ text: message }] }],
          generationConfig: { maxOutputTokens: 700, temperature: 0.7 }
        })
      }
    );

    const data = await upstream.json();
    if (!upstream.ok) {
      console.error("Gemini API error:", data.error?.message || upstream.status);
      return res.status(502).json({ error: "AI service could not complete the request. Please try again." });
    }

    const reply = (data.candidates?.[0]?.content?.parts || [])
      .map(part => part.text || "")
      .join("\n")
      .trim();

    return res.status(200).json({ reply: reply || "Maazrat, is waqt jawab nahi mil saka." });
  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
}
