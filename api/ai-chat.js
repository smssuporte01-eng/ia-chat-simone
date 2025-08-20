import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Vercel (Node/Serverless) — rota POST /api/ai-chat
export default async function handler(req, res) {
  // Permite apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // CORS simples (libera seu domínio da The Members)
  const ORIGINS = [
    // Coloque aqui o domínio onde seu curso roda:
    // exemplo: "https://SEU-SUBDOMINIO.themembers.com"
    // enquanto não sabe, temporariamente deixe "*"
    "*"
  ];
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Origin", ORIGINS.includes("*") ? "*" : (ORIGINS.includes(origin) ? origin : ""));
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Body inválido: 'messages' deve ser um array" });
    }

    // Instruções do seu “agente clonado”
    const systemPrompt = `
Você é a IA da Simone, especialista em neuropsicopedagogia.
Ajude com orientações práticas, acolhedoras e baseadas em evidências.
Seja clara, objetiva e use linguagem acessível.
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // custo baixo e bom para chat
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ]
    });

    const reply = completion?.choices?.[0]?.message?.content || "Desculpe, não consegui responder agora.";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("OPENAI ERROR", err);
    return res.status(500).json({ error: "Erro ao gerar resposta" });
  }
}
