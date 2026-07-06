import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  currentWeek,
  metricDefinitions,
  metricKeys,
  previousWeek,
  queryMetricRows,
  type MetricKey,
} from "../lib/pulse-data.js";

const metricSchema = z.enum(metricKeys);

export default defineTool({
  description:
    "Read Pulse demo SaaS metrics for signups, activation, paid conversions, MRR, churn, and active accounts. Use before answering metric questions.",
  inputSchema: z.object({
    metrics: z.array(metricSchema).optional().describe("Metrics to include. Defaults to all."),
    startDate: z.string().optional().describe("Inclusive YYYY-MM-DD start date."),
    endDate: z.string().optional().describe("Inclusive YYYY-MM-DD end date."),
    grain: z.enum(["daily", "weekly"]).default("daily"),
  }),
  async execute({ endDate, grain, metrics, startDate }) {
    const selectedMetrics: readonly MetricKey[] =
      metrics && metrics.length > 0 ? metrics : metricKeys;
    const rows = queryMetricRows({
      endDate,
      grain,
      metrics: selectedMetrics,
      startDate,
    });

    return {
      dataset: "Pulse demo SaaS metrics",
      availableRange: {
        startDate: previousWeek.startDate,
        endDate: currentWeek.endDate,
      },
      currentWeek,
      previousWeek,
      grain,
      metrics: selectedMetrics,
      definitions: Object.fromEntries(
        selectedMetrics.map((metric) => [metric, metricDefinitions[metric]]),
      ),
      rows,
      notes: [
        "Flow metrics are summed across a period.",
        "MRR and activeAccounts are end-of-period values for weekly comparison.",
        "This is deterministic demo data for recording the Agent Stack walkthrough.",
      ],
    };
  },
});
