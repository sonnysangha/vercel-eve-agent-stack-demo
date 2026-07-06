# Vercel Eve Agent Stack Demo

Pulse is a Vercel Eve + Agent Stack demo that turns a local SaaS metrics dataset
into a runnable analyst agent. The demo is designed to support the sponsored
script: Pulse answers business-metrics questions, runs Python analysis inside an
Eve sandbox, delegates anomaly review to a specialist subagent, and has a Monday
weekly-report schedule.

The app lives at the repository root so Vercel can auto-detect it as a Next.js
project during import.

## Local Development

```bash
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
- Declared `investigator` subagent with its own instructions, skill, and tool
- Durable `monday-summary` schedule
- Next.js web chat channel for recording

## Agent Folder Tour

```txt
agent/
  instructions.md
  agent.ts
  skills/metric-definitions.md
  tools/query_metrics.ts
  tools/run_analysis.ts
  sandbox/workspace/pulse_schema.md
  channels/eve.ts
  subagents/investigator/
    agent.ts
    instructions.md
    skills/anomaly-playbook.md
    tools/investigate_metrics.ts
  schedules/monday-summary.ts
```
