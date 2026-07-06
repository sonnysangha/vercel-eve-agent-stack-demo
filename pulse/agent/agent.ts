import { defineAgent } from "eve";

export default defineAgent({
  model: "anthropic/claude-sonnet-5",
  reasoning: "medium",
  compaction: {
    thresholdPercent: 0.78,
  },
  limits: {
    maxInputTokensPerSession: 350_000,
    maxOutputTokensPerSession: 18_000,
  },
});
