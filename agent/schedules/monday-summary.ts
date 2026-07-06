import { defineSchedule } from "eve/schedules";

export default defineSchedule({
  cron: "0 9 * * 1",
  markdown:
    "Run the Pulse weekly metrics report for 2026-06-29 through 2026-07-05 versus 2026-06-22 through 2026-06-28. Use query_metrics with weekly grain, delegate anomaly review to the investigator subagent, then run_analysis for signups and MRR. Finish with a concise executive summary and an Agent Stack note.",
});
