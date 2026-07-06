import { defineTool } from "eve/tools";
import { z } from "zod";

const primitiveValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export default defineTool({
  description:
    "Run a deterministic Python analysis script inside the Eve sandbox for Pulse metric rows. Use for comparisons and chart-ready trend output.",
  inputSchema: z.object({
    title: z.string().min(1),
    metric: z.string().min(1).describe("Metric field to analyze, for example signups or mrr."),
    rows: z.array(z.record(z.string(), primitiveValue)).min(1),
    labelField: z.string().optional().describe("Label field. Defaults to label, then date."),
    valueField: z.string().optional().describe("Numeric value field. Defaults to metric."),
  }),
  async execute({ labelField, metric, rows, title, valueField }, ctx) {
    const points = toPoints(rows, valueField ?? metric, labelField);
    const fallback = analyze(points, title, metric);
    const script = buildPythonScript(points, title, metric);

    try {
      const sandbox = await ctx.getSandbox();
      await sandbox.writeTextFile({ path: "pulse_analysis.py", content: script });
      const result = await sandbox.run({
        command: "python3 pulse_analysis.py || python pulse_analysis.py",
      });
      const command = result as { readonly stderr?: string; readonly stdout?: string };
      const outputText = await sandbox.readTextFile({ path: "pulse_analysis.json" });
      if (outputText === null) {
        throw new Error("Sandbox did not produce pulse_analysis.json.");
      }
      const output = JSON.parse(outputText) as typeof fallback;

      return {
        ...output,
        sandbox: {
          used: true,
          id: sandbox.id,
          scriptPath: "/workspace/pulse_analysis.py",
          outputPath: "/workspace/pulse_analysis.json",
          chartPath: "/workspace/pulse_chart.svg",
          stdout: command.stdout ?? "",
          stderr: command.stderr ?? "",
        },
      };
    } catch (error) {
      return {
        ...fallback,
        sandbox: {
          used: false,
          reason:
            error instanceof Error
              ? error.message
              : "Sandbox execution failed before producing output.",
        },
      };
    }
  },
});

function toPoints(
  rows: readonly Record<string, string | number | boolean | null>[],
  valueField: string,
  labelField?: string,
) {
  return rows.map((row, index) => {
    const rawValue = row[valueField];
    if (typeof rawValue !== "number") {
      throw new Error(`Row ${index + 1} does not contain numeric field ${valueField}.`);
    }

    const rawLabel = labelField ? row[labelField] : (row.label ?? row.date ?? `Row ${index + 1}`);

    return {
      label: String(rawLabel),
      value: rawValue,
    };
  });
}

function analyze(points: readonly { readonly label: string; readonly value: number }[], title: string, metric: string) {
  const first = points[0] ?? { label: "n/a", value: 0 };
  const last = points.at(-1) ?? first;
  const absoluteChange = last.value - first.value;
  const percentChange = first.value === 0 ? null : (absoluteChange / first.value) * 100;
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const average = points.length === 0 ? 0 : total / points.length;
  const max = points.reduce((best, point) => (point.value > best.value ? point : best), first);
  const min = points.reduce((best, point) => (point.value < best.value ? point : best), first);

  return {
    title,
    metric,
    points,
    first,
    last,
    total,
    average,
    min,
    max,
    absoluteChange,
    percentChange,
    takeaway:
      percentChange === null
        ? `${metric} moved by ${absoluteChange.toLocaleString()} from ${first.label} to ${last.label}.`
        : `${metric} changed ${formatPercent(percentChange)} from ${first.label} to ${last.label}.`,
  };
}

function buildPythonScript(
  points: readonly { readonly label: string; readonly value: number }[],
  title: string,
  metric: string,
) {
  return `import json
from html import escape

points = ${JSON.stringify(points)}
title = ${JSON.stringify(title)}
metric = ${JSON.stringify(metric)}

first = points[0]
last = points[-1]
absolute_change = last["value"] - first["value"]
percent_change = None if first["value"] == 0 else (absolute_change / first["value"]) * 100
total = sum(point["value"] for point in points)
average = total / len(points)
min_point = min(points, key=lambda point: point["value"])
max_point = max(points, key=lambda point: point["value"])

width = 720
height = 320
padding = 44
values = [point["value"] for point in points]
low = min(values)
high = max(values)
span = high - low or 1
step = (width - padding * 2) / max(len(points) - 1, 1)

coords = []
for index, point in enumerate(points):
    x = padding + index * step
    y = height - padding - ((point["value"] - low) / span) * (height - padding * 2)
    coords.append((x, y, point))

polyline = " ".join(f"{x:.2f},{y:.2f}" for x, y, _ in coords)
circles = "\\n".join(
    f'<circle cx="{x:.2f}" cy="{y:.2f}" r="5" fill="#00c2a8"><title>{escape(point["label"])}: {point["value"]}</title></circle>'
    for x, y, point in coords
)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">
  <rect width="{width}" height="{height}" fill="#07110f"/>
  <text x="{padding}" y="30" fill="#f5f2e8" font-family="monospace" font-size="18">{escape(title)}</text>
  <polyline points="{polyline}" fill="none" stroke="#00c2a8" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
  {circles}
  <text x="{padding}" y="{height - 12}" fill="#f2b84b" font-family="monospace" font-size="13">{escape(metric)} trend generated in Eve sandbox</text>
</svg>'''

output = {
    "title": title,
    "metric": metric,
    "points": points,
    "first": first,
    "last": last,
    "total": total,
    "average": average,
    "min": min_point,
    "max": max_point,
    "absoluteChange": absolute_change,
    "percentChange": percent_change,
    "takeaway": (
        f"{metric} moved by {absolute_change:,.0f} from {first['label']} to {last['label']}."
        if percent_change is None
        else f"{metric} changed {percent_change:+.1f}% from {first['label']} to {last['label']}."
    ),
}

open("pulse_analysis.json", "w").write(json.dumps(output, indent=2))
open("pulse_chart.svg", "w").write(svg)
print(output["takeaway"])
`;
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}
