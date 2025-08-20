// api/ai-chat.js
// Serverless Function para Vercel (Node) usando fetch nativo.

module.exports = async function handler(req, res) {
  // ===== CORS =====
  // Durante testes, deixe "*". Depois TROQUE para seu domínio da The Members,
  // por ex: const ALLOWED_ORIGINS = ["https://SEU-SUBDOMINIO.themembers.com"];
  const ALLOWED_ORIGINS = ["*"];

  const origin = req.headers.origin || "";
  const allowOrigin = ALLOWED_ORIGINS.includes("*")
    ? "*"
    : (ALLOWED_ORIGINS.includes(origin) ? origin : "");

  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    // Preflight precisa sair com cabeçalhos já setados
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Body pode vir string; normalizamos:
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { messages } = body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Body inválido: 'messages' deve ser um array" });
    }

    const systemPrompt = `
Você é a IA da Simone, especialista em neuropsicopedagogia.
Ajude com orientações práticas, acolhedoras e baseadas em evidências.
Seja clara, objetiva e use linguagem acessível.
    `.trim();

    // Chamada direta à OpenAI (sem SDK)
    const oaRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ]
      })
    });

    const data = await oaRes.json();

    if (!oaRes.ok) {
      console.error("OpenAI error", oaRes.status, data);
      return res.status(500).json({ error: "Falha na OpenAI", detail: data });
    }

    const reply = data?.choices?.[0]?.message?.content || "Desculpe, não consegui responder agora.";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("SERVER ERROR", err);
    return res.status(500).json({ error: "Falha ao gerar resposta" });
  }
};
