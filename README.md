# S.E.X.T.A. HQ

Assistente serverless baseado em Claude. Uma pergunta entra em `POST /api/ask` e o Claude responde com a persona da S.E.X.T.A. Roda na Vercel, sem usar processamento local.

## Estrutura

```
sexta-hq/
├── api/
│   ├── ask.ts          # POST /api/ask    (pergunta -> Claude)
│   └── health.ts       # GET  /api/health (usado pelo heartbeat)
├── lib/
│   └── claude.ts       # cliente da API do Claude
├── tests/
│   └── api.test.mjs    # testes automatizados (Claude simulado, sem custo)
├── .github/workflows/
│   └── heartbeat.yml   # checagem a cada 30 min (equivalente ao /loop 30m)
├── .env.example
├── package.json
├── tsconfig.json
└── vercel.json
```

## Testes

```bash
npm install
npm test
```

Os testes compilam o TypeScript e exercitam os dois endpoints com a API do Claude simulada: autenticação, validação, resposta de sucesso e falha do provedor.

## Deploy na Vercel

1. Importe o repositório em vercel.com/new.
2. Em Settings > Environment Variables, cadastre `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` e `SEXTA_API_TOKEN`.
3. Cada push na `main` gera deploy automático.

## Heartbeat de 30 minutos

No GitHub: Settings > Secrets and variables > Actions > New secret:

- `SEXTA_URL` = URL do deploy (ex.: `https://sexta-hq.vercel.app`)

O workflow roda a cada 30 minutos e falha (com e-mail do GitHub) se o deploy cair.

## Chamando o endpoint

```bash
curl -X POST https://SEU-DEPLOY.vercel.app/api/ask \
  -H "authorization: Bearer $SEXTA_API_TOKEN" \
  -H "content-type: application/json" \
  -d '{"prompt":"Resuma os riscos de migrar para serverless."}'
```

A resposta traz `answer` e `log` (status e latência).

## Agendamento (`/schedule`)

Para tarefas e lembretes, adicione novos workflows em `.github/workflows/` com `on: schedule` (cron). Cada rotina vira um arquivo versionado.
