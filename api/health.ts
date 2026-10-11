import type { VercelRequest, VercelResponse } from "@vercel/node";

// Endpoint de saúde, chamado pelo heartbeat a cada 30 minutos.
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: "online",
    time: new Date().toISOString(),
    claudeConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}
