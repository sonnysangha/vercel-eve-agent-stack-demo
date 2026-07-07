import type { InputRow } from "./schema";
import type { AnalysisDelta, AnalysisDirection, AnalysisPoint, AnalysisResult } from "./types";

export function toPoints(
  rows: readonly InputRow[],
  valueField: string,
  labelField?: string,
) {
  return rows.map((row, index): AnalysisPoint => {
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

export function analyze(
  points: readonly AnalysisPoint[],
  title: string,
  metric: string,
): AnalysisResult {
  const first = points[0] ?? { label: "n/a", value: 0 };
  const last = points.at(-1) ?? first;
  const absoluteChange = last.value - first.value;
  const percentChange = first.value === 0 ? null : (absoluteChange / first.value) * 100;
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const average = points.length === 0 ? 0 : total / points.length;
  const max = points.reduce((best, point) => (point.value > best.value ? point : best), first);
  const min = points.reduce((best, point) => (point.value < best.value ? point : best), first);
  const deltas = getDeltas(points);
  const averageAbsDelta = getAverageAbsDelta(deltas);

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
    diagnostics: {
      direction: getDirection(absoluteChange),
      pointCount: points.length,
      deltas,
      averageAbsDelta,
      notableMoves: deltas.filter(
        (delta) => averageAbsDelta > 0 && Math.abs(delta.absolute) >= averageAbsDelta * 1.35,
      ),
      movingAverage3: getMovingAverage(points, 3),
    },
    takeaway:
      percentChange === null
        ? `${metric} moved by ${absoluteChange.toLocaleString()} from ${first.label} to ${last.label}.`
        : `${metric} changed ${formatPercent(percentChange)} from ${first.label} to ${last.label}.`,
  };
}

function getDeltas(points: readonly AnalysisPoint[]): readonly AnalysisDelta[] {
  return points.slice(1).map((point, index) => {
    const previous = points[index];
    const absolute = point.value - previous.value;

    return {
      from: previous.label,
      to: point.label,
      absolute,
      percent: previous.value === 0 ? null : (absolute / previous.value) * 100,
    };
  });
}

function getAverageAbsDelta(deltas: readonly AnalysisDelta[]) {
  if (deltas.length === 0) return 0;

  return deltas.reduce((sum, delta) => sum + Math.abs(delta.absolute), 0) / deltas.length;
}

function getMovingAverage(points: readonly AnalysisPoint[], windowSize: number) {
  return points.map((point, index) => {
    const window = points.slice(Math.max(0, index - windowSize + 1), index + 1);

    return {
      label: point.label,
      value: window.reduce((sum, item) => sum + item.value, 0) / window.length,
    };
  });
}

function getDirection(value: number): AnalysisDirection {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}
