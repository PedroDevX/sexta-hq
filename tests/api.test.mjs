import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import ask from "../dist/api/ask.js";
import health from "../dist/api/health.js";

// Resposta simulada no formato da API do Claude
function mockClaude({ status = 200, text = "Sistemas online, Chefe." } = {}) {
  globalThis.fetch = async (url, init) => {
    mockClaude.lastCall = { url: String(url), init };
    return new Response(
      status === 200
        ? JSON.stringify({ content: [{ type: "text", text }] })
        : JSON.stringify({ error: { message: "falha simulada" } }),
      { status, headers: { "content-type": "application/json" } }
    );
  };
}

function makeRes() {
  const res = { statusCode: 200, body: undefined };
  res.status = (code) => ((res.statusCode = code), res);
  res.json = (payload) => ((res.body = payload), res);
  return res;
}

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = "chave-de-teste";
  process.env.SEXTA_API_TOKEN = "token-de-teste";
  delete process.env.ANTHROPIC_MODEL;
  mockClaude();
});

const authed = { authorization: "Bearer token-de-teste" };

test("ask: GET retorna 405", async () => {
  const res = makeRes();
  await ask({ method: "GET", headers: authed, body: {} }, res);
  assert.equal(res.statusCode, 405);
});

test("ask: sem token retorna 401", async () => {
  const res = makeRes();
  await ask({ method: "POST", headers: {}, body: { prompt: "oi" } }, res);
  assert.equal(res.statusCode, 401);
});

test("ask: token errado retorna 401", async () => {
  const res = makeRes();
  await ask(
    { method: "POST", headers: { authorization: "Bearer errado" }, body: { prompt: "oi" } },
    res
  );
  assert.equal(res.statusCode, 401);
});

test("ask: prompt ausente ou vazio retorna 400", async () => {
  for (const body of [{}, { prompt: "" }, { prompt: "   " }, { prompt: 42 }]) {
    const res = makeRes();
    await ask({ method: "POST", headers: authed, body }, res);
    assert.equal(res.statusCode, 400, `corpo ${JSON.stringify(body)}`);
  }
});

test("ask: sucesso devolve a resposta do Claude e envia a requisição correta", async () => {
  mockClaude({ text: "Pronto, Chefe." });
  const res = makeRes();
  await ask({ method: "POST", headers: authed, body: { prompt: "Status?" } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.answer, "Pronto, Chefe.");
  assert.equal(res.body.log.provider, "claude");
  assert.equal(res.body.log.ok, true);

  const { url, init } = mockClaude.lastCall;
  assert.equal(url, "https://api.anthropic.com/v1/messages");
  assert.equal(init.headers["x-api-key"], "chave-de-teste");
  const sent = JSON.parse(init.body);
  assert.equal(sent.model, "claude-sonnet-5-5");
  assert.equal(sent.messages[0].content, "Status?");
  assert.match(sent.system, /S\.E\.X\.T\.A\./);
});

test("ask: respeita ANTHROPIC_MODEL", async () => {
  process.env.ANTHROPIC_MODEL = "modelo-customizado";
  const res = makeRes();
  await ask({ method: "POST", headers: authed, body: { prompt: "oi" } }, res);
  assert.equal(JSON.parse(mockClaude.lastCall.init.body).model, "modelo-customizado");
});

test("ask: erro da API do Claude retorna 502", async () => {
  mockClaude({ status: 500 });
  const res = makeRes();
  await ask({ method: "POST", headers: authed, body: { prompt: "oi" } }, res);
  assert.equal(res.statusCode, 502);
  assert.equal(res.body.log.ok, false);
  assert.match(res.body.log.error, /500/);
});

test("ask: sem ANTHROPIC_API_KEY retorna 502 com motivo claro", async () => {
  delete process.env.ANTHROPIC_API_KEY;
  const res = makeRes();
  await ask({ method: "POST", headers: authed, body: { prompt: "oi" } }, res);
  assert.equal(res.statusCode, 502);
  assert.match(res.body.log.error, /ANTHROPIC_API_KEY/);
});

test("health: online e informa se o Claude está configurado", () => {
  const res = makeRes();
  health({}, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, "online");
  assert.equal(res.body.claudeConfigured, true);
  assert.ok(!Number.isNaN(Date.parse(res.body.time)));
});
