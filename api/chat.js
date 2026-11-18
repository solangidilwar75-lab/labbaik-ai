export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI service is not configured yet." });
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) return res.status(400).json({ error: "Please enter a message." });
  if (message.length > 4000) return res.status(400).json({ error: "Message is too long." });
  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        instructions: "You are Labbaik AI, a helpful, respectful multilingual assistant. Reply in the language the user uses (Urdu, Roman Urdu, English, or Arabic). Be clear and concise. Do not claim to make bookings, payments, visa approvals, or other real-world actions unless actually completed.",
        input: message,
        max_output_tokens: 700
      })
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      console.error("OpenAI API error:", data.error?.message || upstream.status);
      return res.status(502).json({ error: "AI service could not complete the request." });
    }
    const reply = (data.output || []).flatMap(item => item.content || []).filter(item => item.type === "output_text").map(item => item.text).join("\n").trim();
    return res.status(200).json({ reply: reply || "Maazrat, is waqt jawab nahi mil saka." });
  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
}