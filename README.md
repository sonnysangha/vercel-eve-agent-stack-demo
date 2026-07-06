# Pulse

Pulse is a Vercel Eve + Agent Stack demo that turns a local SaaS metrics dataset
into a runnable analyst agent.

The app lives in `pulse/`. When importing this repository into Vercel, set the
project root directory to:

```txt
pulse
```

## Local Development

```bash
cd pulse
nvm use
npm install
npm run dev
```

Open `http://localhost:3000`.

## Required Environment

Set this locally and in Vercel project environment variables:

```txt
AI_GATEWAY_API_KEY=...
```

The demo uses a Vercel AI Gateway model ID in `agent/agent.ts`.

## Demo Surface

- Eve filesystem-first agent in `pulse/agent`
- AI Gateway model routing
- Read-only `query_metrics` tool over local demo data
- Sandbox-backed `run_analysis` Python execution
- Durable `monday-summary` schedule
- Next.js web chat channel for recording
