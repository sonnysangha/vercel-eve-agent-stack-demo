import { defineTool } from "eve/tools";
import { z } from "zod";

import { analyze, toPoints } from "../lib/run-analysis/analysis";
import {
  runPythonAnalysisInSandbox,
  withSandboxFailure,
} from "../lib/run-analysis/sandbox-runner";
import { primitiveValue } from "../lib/run-analysis/schema";
import { createSandboxPaths } from "../lib/run-analysis/sandbox-paths";

export default defineTool({
  description:
    "Run a deterministic Python analysis script inside the Eve sandbox for Pulse metric rows. Use for comparisons and chart-ready trend output.",
  inputSchema: z.object({
    title: z.string().min(1),
    metric: z
      .string()
      .min(1)
      .describe("Metric field to analyze, for example signups or mrr."),
    rows: z.array(z.record(z.string(), primitiveValue)).min(1),
    labelField: z
      .string()
      .optional()
      .describe("Label field. Defaults to label, then date."),
    valueField: z
      .string()
      .optional()
      .describe("Numeric value field. Defaults to metric."),
  }),
  async execute({ labelField, metric, rows, title, valueField }, ctx) {
    const points = toPoints(rows, valueField ?? metric, labelField);
    const fallback = analyze(points, title, metric);
    const paths = createSandboxPaths(ctx.callId);

    try {
      const sandbox = await ctx.getSandbox();

      return await runPythonAnalysisInSandbox({
        fallback,
        metric,
        paths,
        points,
        sandbox,
        title,
      });
    } catch (error) {
      return withSandboxFailure(fallback, error);
    }
  },
  toModelOutput(output) {
    return {
      type: "json",
      value: {
        title: output.title,
        metric: output.metric,
        takeaway: output.takeaway,
        diagnostics: output.diagnostics,
        sandbox: output.sandbox,
      },
    };
  },
});
