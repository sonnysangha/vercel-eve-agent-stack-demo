import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Pulse analyzes SaaS business metrics with tools, sandbox analysis, and a specialist investigator subagent.",
  model: "anthropic/claude-sonnet-5",
  reasoning: "medium",
  compaction: {
    thresholdPercent: 0.78,
  },
  limits: {
    maxInputTokensPerSession: 350_000,
    maxOutputTokensPerSession: 18_000,
    maxSubagentDepth: 2,
  },
});
