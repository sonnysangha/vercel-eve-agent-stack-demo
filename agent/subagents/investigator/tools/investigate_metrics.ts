import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  compareMetric,
  currentWeek,
  getWeeklyRows,
  metricDefinitions,
  metricKeys,
  previousWeek,
  type MetricKey,
} from "../../../lib/pulse-data.js";

const metricSchema = z.enum(metricKeys);

export default defineTool({
  description:
    "Investigate week-over-week Pulse metric movement and return notable changes, supported drivers, and watchouts.",
  inputSchema: z.object({
    question: z.string().optional(),
    metrics: z.array(metricSchema).optional().describe("Metrics to inspect. Defaults to all."),
    thresholdPercent: z.number().min(0).max(100).default(15),
  }),
  async execute({ metrics, question, thresholdPercent }) {
    const selectedMetrics: readonly MetricKey[] =
      metrics && metrics.length > 0 ? metrics : metricKeys;
    const [previous, current] = getWeeklyRows();
    const findings = selectedMetrics
      .map((metric) => {
        const comparison = compareMetric(metric);
        const absPercent = Math.abs(comparison.percentChange ?? 0);

        return {
          metric,
          definition: metricDefinitions[metric],
          aggregation: comparison.aggregation,
          previous: comparison.previous,
          current: comparison.current,
          absoluteChange: comparison.absoluteChange,
          percentChange: comparison.percentChange,
          severity:
            absPercent >= 25 ? "headline" : absPercent >= thresholdPercent ? "notable" : "normal",
          interpretation: interpret(metric, comparison.absoluteChange, comparison.percentChange),
        };
      })
      .sort((left, right) => Math.abs(right.percentChange ?? 0) - Math.abs(left.percentChange ?? 0));

    const activationRatePrevious = rate(previous.activated, previous.signups);
    const activationRateCurrent = rate(current.activated, current.signups);
    const conversionRatePrevious = rate(previous.paidConversions, previous.signups);
    const conversionRateCurrent = rate(current.paidConversions, current.signups);

    return {
      question,
      weekRanges: {
        previousWeek,
        currentWeek,
      },
      thresholdPercent,
      findings,
      funnelChecks: {
        activationRate: {
          previous: activationRatePrevious,
          current: activationRateCurrent,
          pointChange: activationRateCurrent - activationRatePrevious,
        },
        paidConversionRate: {
          previous: conversionRatePrevious,
          current: conversionRateCurrent,
          pointChange: conversionRateCurrent - conversionRatePrevious,
        },
      },
      likelyDrivers: buildDrivers({
        activationRateCurrent,
        activationRatePrevious,
        conversionRateCurrent,
        conversionRatePrevious,
        current,
        previous,
      }),
      watchouts: [
        "This demo dataset covers only two weeks, so seasonality and campaign attribution are not available.",
        "Churn is represented as cancelled account count, not a rate with beginning-period paid accounts.",
        "Treat driver language as supported interpretation, not causal proof.",
      ],
    };
  },
});

function interpret(metric: MetricKey, absoluteChange: number, percentChange: number | null) {
  const direction = absoluteChange >= 0 ? "increased" : "decreased";
  const magnitude =
    percentChange === null ? `${Math.abs(absoluteChange).toLocaleString()} units` : formatPercent(Math.abs(percentChange));

  if (metric === "churnedAccounts") {
    return `Churned accounts ${direction} by ${magnitude}; lower is better for this metric.`;
  }

  return `${metric} ${direction} by ${magnitude} week over week.`;
}

function buildDrivers({
  activationRateCurrent,
  activationRatePrevious,
  conversionRateCurrent,
  conversionRatePrevious,
  current,
  previous,
}: {
  readonly activationRateCurrent: number;
  readonly activationRatePrevious: number;
  readonly conversionRateCurrent: number;
  readonly conversionRatePrevious: number;
  readonly current: ReturnType<typeof getWeeklyRows>[number];
  readonly previous: ReturnType<typeof getWeeklyRows>[number];
}) {
  const drivers: string[] = [];

  if (current.signups > previous.signups && current.activated > previous.activated) {
    drivers.push("Top-of-funnel volume and activated workspaces both rose, so signup growth did not come alone.");
  }

  if (activationRateCurrent >= activationRatePrevious) {
    drivers.push("Activation rate held or improved while signup volume increased.");
  } else {
    drivers.push("Activation rate softened, so some signup growth may not be reaching activation quality.");
  }

  if (conversionRateCurrent >= conversionRatePrevious) {
    drivers.push("Paid conversion rate held or improved, supporting the MRR increase.");
  } else {
    drivers.push("Paid conversion rate softened, so MRR growth is more volume-led than efficiency-led.");
  }

  if (current.churnedAccounts <= previous.churnedAccounts) {
    drivers.push("Churned account count decreased or stayed controlled during the MRR expansion.");
  }

  return drivers;
}

function rate(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}
