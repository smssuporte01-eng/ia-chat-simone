// api/ai-chat.js
// Serverless Function para Vercel usando CommonJS + fetch nativo (sem dependências).

module.exports = async function handler(req, res) {
  // CORS básico (libere * para testar; depois troque pelo domínio da The Members)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Tenta ler o body como objeto; se vier string, faz parse.
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

    // Chamada direta à API da OpenAI (sem SDK)
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
      return res.status(500).json({
        error: "Falha na OpenAI",
        detail: data
      });
    }

    const reply = data?.choices?.[0]?.message?.content || "Desculpe, não consegui responder agora.";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("SERVER ERROR", err);
    return res.status(500).json({ error: "Falha ao gerar resposta" });
  }
};

