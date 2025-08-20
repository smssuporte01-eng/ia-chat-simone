// api/ai-chat.js
// Função Serverless para Vercel (Node.js) com CORS e diagnóstico claro.

module.exports = async function handler(req, res) {
  // ===== CORS =====
  // Em testes: "*". Depois restrinja para seu domínio da The Members.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    // Checagem de chave antes de chamar a OpenAI
    if (!process.env.OPENAI_API_KEY || !/^sk-[\w-]{20,}/.test(process.env.OPENAI_API_KEY)) {
      return res.status(500).json({
        error: "OPENAI_API_KEY ausente ou inválida no ambiente da Vercel (Production).",
        hint: "Defina Settings → Environment Variables → OPENAI_API_KEY (sk-...) e faça Redeploy."
      });
    }

    // Normaliza body
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
        model: "gpt-4o-mini", // pode trocar para "gpt-4o-mini" mesmo (recomendado/custo baixo)
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ]
      })
    });

    const data = await oaRes.json();

    if (!oaRes.ok) {
      // Retorna a mensagem EXATA da OpenAI para diagnosticar (temporariamente)
      const msg = data?.error?.message || JSON.stringify(data);
      return res.status(500).json({
        error: "Falha na OpenAI",
        status: oaRes.status,
        detail: msg,
        hint: "Cheque se a chave está ativa, se há créditos/billing, se o modelo está disponível para sua conta."
      });
    }

    const reply = data?.choices?.[0]?.message?.content || "Desculpe, não consegui responder agora.";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("SERVER ERROR", err);
    return res.status(500).json({ error: "Falha ao gerar resposta" });
  }
};
