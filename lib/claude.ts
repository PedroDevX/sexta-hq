// Cliente minimalista do Claude (fetch puro, sem SDK).

export type ClaudeResult = {
  ok: boolean;
  text?: string;
  error?: string;
  ms: number;
};

export async function askClaude(prompt: string, system?: string): Promise<ClaudeResult> {
  const start = Date.now();
  try {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY ausente");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
        max_tokens: 2048,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { content?: { text?: string }[] };
    const text = data.content?.map((b) => b.text ?? "").join("") ?? "";
    return { ok: true, text, ms: Date.now() - start };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      ms: Date.now() - start,
    };
  }
}
