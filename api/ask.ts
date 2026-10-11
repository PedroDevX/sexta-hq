import type { VercelRequest, VercelResponse } from "@vercel/node";
import { askClaude } from "../lib/claude.js";

const PERSONA = `Você é S.E.X.T.A., assistente de IA do Chefe. Seja eficiente, profissional e levemente irônica, no estilo Tony Stark. Responda em português do Brasil.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  // Autenticação simples por token
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!process.env.SEXTA_API_TOKEN || token !== process.env.SEXTA_API_TOKEN) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  const prompt: unknown = req.body?.prompt;
  if (typeof prompt !== "string" || prompt.trim() === "") {
    return res.status(400).json({ error: "Campo 'prompt' obrigatório" });
  }

  const result = await askClaude(prompt, PERSONA);

  if (!result.ok) {
    return res.status(502).json({
      error: "Falha ao consultar o Claude",
      log: { provider: "claude", ok: false, ms: result.ms, error: result.error },
    });
  }

  return res.status(200).json({
    answer: result.text,
    log: { provider: "claude", ok: true, ms: result.ms },
  });
}
