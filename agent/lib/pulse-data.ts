export const metricKeys = [
  "signups",
  "activated",
  "paidConversions",
  "mrr",
  "churnedAccounts",
  "activeAccounts",
] as const;

export type MetricKey = (typeof metricKeys)[number];

export type MetricRow = {
  readonly date: string;
  readonly signups: number;
  readonly activated: number;
  readonly paidConversions: number;
  readonly mrr: number;
  readonly churnedAccounts: number;
  readonly activeAccounts: number;
};

export type Grain = "daily" | "weekly";

export const currentWeek = {
  label: "Current week",
  startDate: "2026-06-29",
  endDate: "2026-07-05",
};

export const previousWeek = {
  label: "Previous week",
  startDate: "2026-06-22",
  endDate: "2026-06-28",
};

export const metricDefinitions: Record<MetricKey, string> = {
  signups: "New workspace accounts created during the period. Sum daily rows.",
  activated: "New workspaces that completed activation. Sum daily rows.",
  paidConversions: "Trial workspaces that became paid. Sum daily rows.",
  mrr: "Month recurring revenue in USD. Use end-of-period value.",
  churnedAccounts: "Paid workspaces that cancelled. Sum daily rows.",
  activeAccounts: "Active paid workspaces. Use end-of-period value.",
};

export const metricRows: readonly MetricRow[] = [
  {
    date: "2026-06-22",
    signups: 118,
    activated: 69,
    paidConversions: 14,
    mrr: 84200,
    churnedAccounts: 3,
    activeAccounts: 1224,
  },
  {
    date: "2026-06-23",
    signups: 126,
    activated: 75,
    paidConversions: 16,
    mrr: 85150,
    churnedAccounts: 2,
    activeAccounts: 1238,
  },
  {
    date: "2026-06-24",
    signups: 121,
    activated: 78,
    paidConversions: 13,
    mrr: 85840,
    churnedAccounts: 4,
    activeAccounts: 1247,
  },
  {
    date: "2026-06-25",
    signups: 134,
    activated: 82,
    paidConversions: 18,
    mrr: 86910,
    churnedAccounts: 2,
    activeAccounts: 1263,
  },
  {
    date: "2026-06-26",
    signups: 142,
    activated: 89,
    paidConversions: 19,
    mrr: 88140,
    churnedAccounts: 1,
    activeAccounts: 1281,
  },
  {
    date: "2026-06-27",
    signups: 96,
    activated: 58,
    paidConversions: 11,
    mrr: 88720,
    churnedAccounts: 2,
    activeAccounts: 1288,
  },
  {
    date: "2026-06-28",
    signups: 88,
    activated: 52,
    paidConversions: 9,
    mrr: 89100,
    churnedAccounts: 1,
    activeAccounts: 1294,
  },
  {
    date: "2026-06-29",
    signups: 151,
    activated: 95,
    paidConversions: 21,
    mrr: 90420,
    churnedAccounts: 1,
    activeAccounts: 1314,
  },
  {
    date: "2026-06-30",
    signups: 163,
    activated: 104,
    paidConversions: 24,
    mrr: 91980,
    churnedAccounts: 2,
    activeAccounts: 1336,
  },
  {
    date: "2026-07-01",
    signups: 172,
    activated: 111,
    paidConversions: 27,
    mrr: 93890,
    churnedAccounts: 1,
    activeAccounts: 1362,
  },
  {
    date: "2026-07-02",
    signups: 168,
    activated: 109,
    paidConversions: 28,
    mrr: 95710,
    churnedAccounts: 2,
    activeAccounts: 1388,
  },
  {
    date: "2026-07-03",
    signups: 181,
    activated: 119,
    paidConversions: 31,
    mrr: 97840,
    churnedAccounts: 1,
    activeAccounts: 1418,
  },
  {
    date: "2026-07-04",
    signups: 119,
    activated: 77,
    paidConversions: 17,
    mrr: 98620,
    churnedAccounts: 1,
    activeAccounts: 1434,
  },
  {
    date: "2026-07-05",
    signups: 112,
    activated: 71,
    paidConversions: 15,
    mrr: 99350,
    churnedAccounts: 0,
    activeAccounts: 1449,
  },
];

const stockMetrics = new Set<MetricKey>(["mrr", "activeAccounts"]);

export function filterRows(startDate = previousWeek.startDate, endDate = currentWeek.endDate) {
  return metricRows.filter((row) => row.date >= startDate && row.date <= endDate);
}

export function aggregatePeriod(
  label: string,
  startDate: string,
  endDate: string,
  rows = filterRows(startDate, endDate),
) {
  const periodRows = rows.filter((row) => row.date >= startDate && row.date <= endDate);
  const last = periodRows.at(-1);

  return {
    label,
    startDate,
    endDate,
    signups: sum(periodRows, "signups"),
    activated: sum(periodRows, "activated"),
    paidConversions: sum(periodRows, "paidConversions"),
    mrr: last?.mrr ?? 0,
    churnedAccounts: sum(periodRows, "churnedAccounts"),
    activeAccounts: last?.activeAccounts ?? 0,
  };
}

export function getWeeklyRows() {
  return [
    aggregatePeriod(previousWeek.label, previousWeek.startDate, previousWeek.endDate),
    aggregatePeriod(currentWeek.label, currentWeek.startDate, currentWeek.endDate),
  ];
}

export function queryMetricRows({
  endDate,
  grain,
  metrics,
  startDate,
}: {
  readonly endDate?: string;
  readonly grain: Grain;
  readonly metrics: readonly MetricKey[];
  readonly startDate?: string;
}) {
  const rows =
    grain === "weekly" ? getWeeklyRows() : filterRows(startDate, endDate);

  return rows.map((row) => {
    const selected: Record<string, number | string> = {
      label: "label" in row ? row.label : row.date,
      startDate: "startDate" in row ? row.startDate : row.date,
      endDate: "endDate" in row ? row.endDate : row.date,
    };

    for (const metric of metrics) {
      selected[metric] = row[metric];
    }

    return selected;
  });
}

export function compareMetric(metric: MetricKey) {
  const [previous, current] = getWeeklyRows();
  const previousValue = previous[metric];
  const currentValue = current[metric];
  const absoluteChange = currentValue - previousValue;
  const percentChange = previousValue === 0 ? null : (absoluteChange / previousValue) * 100;

  return {
    metric,
    aggregation: stockMetrics.has(metric) ? "end_of_period" : "sum",
    previous: {
      label: previous.label,
      startDate: previous.startDate,
      endDate: previous.endDate,
      value: previousValue,
    },
    current: {
      label: current.label,
      startDate: current.startDate,
      endDate: current.endDate,
      value: currentValue,
    },
    absoluteChange,
    percentChange,
  };
}

export function getDashboardSnapshot() {
  const weekly = getWeeklyRows();

  return {
    previousWeek: weekly[0],
    currentWeek: weekly[1],
    comparisons: [
      compareMetric("signups"),
      compareMetric("activated"),
      compareMetric("paidConversions"),
      compareMetric("mrr"),
    ],
    dailySignups: metricRows.map((row) => ({ date: row.date, value: row.signups })),
  };
}

function sum(rows: readonly MetricRow[], key: MetricKey) {
  return rows.reduce((total, row) => total + row[key], 0);
}
