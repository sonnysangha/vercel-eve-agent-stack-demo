"use client";

import { useEveAgent } from "eve/react";
import {
  ActivityIcon,
  AlertCircleIcon,
  BarChart3Icon,
  CalendarClockIcon,
  DatabaseIcon,
  Layers3Icon,
  PlayIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TerminalSquareIcon,
  WorkflowIcon,
} from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDashboardSnapshot } from "@/agent/lib/pulse-data";
import { AgentMessage } from "./agent-message";

const AGENT_NAME = "Pulse";
const snapshot = getDashboardSnapshot();

const suggestions = [
  "How did signups do this week compared to last week?",
  "Run the weekly metrics report and include MRR, activation, and churn.",
  "Plot paid conversions for the last two weeks and explain the trend.",
];

const stackMoments = [
  { label: "Eve", value: "filesystem agent", icon: Layers3Icon },
  { label: "AI Gateway", value: "model routing", icon: SparklesIcon },
  { label: "Sandbox", value: "isolated Python", icon: TerminalSquareIcon },
  { label: "Workflow", value: "durable sessions", icon: WorkflowIcon },
];

type AgentStatus = ReturnType<typeof useEveAgent>["status"];
type StreamEvent = {
  readonly type: string;
  readonly data?: unknown;
};

export function AgentChat() {
  const agent = useEveAgent();
  const isBusy = agent.status === "submitted" || agent.status === "streaming";
  const isEmpty = agent.data.messages.length === 0;

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || isBusy) return;

    await agent.send({ message: text });
  };

  const sendSuggestion = async (text: string) => {
    if (isBusy) return;
    await agent.send({
      message: text,
      clientContext: {
        demo: "Pulse Eve Agent Stack walkthrough",
        currentWeek: snapshot.currentWeek,
        previousWeek: snapshot.previousWeek,
      },
    });
  };

  const composer = (
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputTextarea placeholder="Ask Pulse about signups, MRR, activation, or churn..." />
      <PromptInputSubmit onStop={agent.stop} status={agent.status} />
    </PromptInput>
  );

  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <div className="mx-auto grid min-h-dvh w-full max-w-[1560px] gap-4 px-4 py-4 lg:grid-cols-[360px_minmax(0,1fr)_360px]">
        <aside className="flex min-h-0 flex-col gap-4">
          <section className="dashboard-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Vercel Agent Stack demo</p>
                <h1 className="mt-3 text-4xl font-semibold leading-none tracking-normal">
                  {AGENT_NAME}
                </h1>
              </div>
              <StatusBadge status={agent.status} />
            </div>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              A runnable Eve analyst that reads demo SaaS data, runs sandboxed
              analysis, and streams the durable run into this web channel.
            </p>
          </section>

          <section className="dashboard-panel p-4">
            <div className="mb-4 flex items-center gap-2">
              <DatabaseIcon className="size-4 text-accent-teal" />
              <h2 className="section-title">Metrics Snapshot</h2>
            </div>
            <div className="grid gap-3">
              {snapshot.comparisons.map((comparison) => (
                <MetricTile key={comparison.metric} comparison={comparison} />
              ))}
            </div>
          </section>

          <section className="dashboard-panel p-4">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3Icon className="size-4 text-accent-gold" />
              <h2 className="section-title">Signup Trend</h2>
            </div>
            <TrendBars />
          </section>
        </aside>

        <section className="dashboard-panel flex min-h-[calc(100dvh-2rem)] flex-col overflow-hidden">
          <header className="border-b border-border px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Live Eve session</p>
                <h2 className="mt-1 text-xl font-semibold tracking-normal">
                  Ask Pulse anything about the two-week dataset
                </h2>
              </div>
              <Button
                className="rounded-md"
                disabled={isBusy}
                onClick={() => sendSuggestion(suggestions[1])}
                type="button"
              >
                <CalendarClockIcon className="size-4" />
                Weekly report
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  className="suggestion-chip"
                  disabled={isBusy}
                  key={suggestion}
                  onClick={() => sendSuggestion(suggestion)}
                  type="button"
                >
                  <PlayIcon className="size-3.5" />
                  {suggestion}
                </button>
              ))}
            </div>
          </header>

          {agent.error ? (
            <div className="mx-5 mt-4 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm">
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div>
                <p className="font-medium">Request failed</p>
                <p className="mt-0.5 text-muted-foreground">{agent.error.message}</p>
              </div>
            </div>
          ) : null}

          {isEmpty ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="max-w-2xl">
                <div className="mx-auto flex size-14 items-center justify-center rounded-md border border-accent-teal/35 bg-accent-teal/10 text-accent-teal">
                  <ActivityIcon className="size-7" />
                </div>
                <h3 className="mt-6 text-3xl font-semibold tracking-normal">
                  Start with the hero prompt from the video.
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  Pulse will query deterministic SaaS data, run a sandboxed
                  analysis step, and return a recording-ready summary with
                  concrete dates.
                </p>
              </div>
            </div>
          ) : (
            <Conversation className="min-h-0 flex-1">
              <ConversationContent className="mx-auto w-full max-w-4xl gap-6 px-5 py-6">
                {agent.data.messages.map((message, index) => (
                  <AgentMessage
                    canRespond={!isBusy}
                    isStreaming={
                      agent.status === "streaming" &&
                      index === agent.data.messages.length - 1
                    }
                    key={message.id}
                    message={message}
                    onInputResponses={(inputResponses) => agent.send({ inputResponses })}
                  />
                ))}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
          )}

          <div className="border-t border-border bg-card/70 px-5 py-4">
            {composer}
          </div>
        </section>

        <aside className="flex min-h-0 flex-col gap-4">
          <section className="dashboard-panel p-4">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-accent-teal" />
              <h2 className="section-title">Agent Stack</h2>
            </div>
            <div className="grid gap-2">
              {stackMoments.map((moment) => (
                <StackMoment key={moment.label} {...moment} />
              ))}
            </div>
          </section>

          <section className="dashboard-panel min-h-0 flex-1 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <WorkflowIcon className="size-4 text-accent-cyan" />
                <h2 className="section-title">Run Timeline</h2>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                {agent.events.length} events
              </span>
            </div>
            <Timeline events={agent.events as readonly StreamEvent[]} isEmpty={isEmpty} />
          </section>
        </aside>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { readonly status: AgentStatus }) {
  const isLive = status === "submitted" || status === "streaming";

  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium uppercase tracking-[0.12em]">
      <span className="relative flex size-2">
        {isLive ? (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-teal opacity-75" />
        ) : null}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full transition-colors",
            status === "error"
              ? "bg-destructive"
              : isLive
                ? "bg-accent-teal"
                : "bg-muted-foreground",
          )}
        />
      </span>
      {status}
    </span>
  );
}

function MetricTile({
  comparison,
}: {
  readonly comparison: (typeof snapshot.comparisons)[number];
}) {
  const positive = comparison.absoluteChange >= 0;

  return (
    <div className="metric-tile">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{labelForMetric(comparison.metric)}</p>
        <span
          className={cn(
            "rounded-sm px-1.5 py-0.5 font-mono text-[11px]",
            positive
              ? "bg-accent-teal/10 text-accent-teal"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {comparison.percentChange === null
            ? "n/a"
            : `${positive ? "+" : ""}${comparison.percentChange.toFixed(1)}%`}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="font-mono text-2xl font-semibold">
          {formatValue(comparison.metric, comparison.current.value)}
        </span>
        <span className="text-xs text-muted-foreground">
          was {formatValue(comparison.metric, comparison.previous.value)}
        </span>
      </div>
    </div>
  );
}

function TrendBars() {
  const max = Math.max(...snapshot.dailySignups.map((point) => point.value));

  return (
    <div className="flex h-36 items-end gap-1.5 rounded-md border border-border bg-ink p-3">
      {snapshot.dailySignups.map((point) => (
        <div
          className="group relative flex flex-1 flex-col items-center justify-end"
          key={point.date}
        >
          <div
            className="w-full rounded-sm bg-accent-teal transition-colors group-hover:bg-accent-gold"
            style={{ height: `${Math.max(12, (point.value / max) * 100)}%` }}
          />
          <span className="sr-only">
            {point.date}: {point.value} signups
          </span>
        </div>
      ))}
    </div>
  );
}

function StackMoment({
  icon: Icon,
  label,
  value,
}: {
  readonly icon: typeof Layers3Icon;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="stack-row">
      <span className="flex size-8 items-center justify-center rounded-md bg-muted text-foreground">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{value}</span>
      </span>
    </div>
  );
}

function Timeline({
  events,
  isEmpty,
}: {
  readonly events: readonly StreamEvent[];
  readonly isEmpty: boolean;
}) {
  const visible = events.slice(-10).map(toTimelineItem);

  if (isEmpty || visible.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-border text-center text-sm text-muted-foreground">
        Session events will appear here while Pulse works.
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {visible.map((event, index) => (
        <li className="timeline-item" key={`${event.title}-${index}`}>
          <span className={cn("timeline-dot", event.tone)} />
          <div>
            <p className="text-sm font-medium">{event.title}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{event.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function toTimelineItem(event: StreamEvent) {
  switch (event.type) {
    case "message.received":
      return { title: "Message received", detail: "Eve accepted the user turn.", tone: "teal" };
    case "actions.requested":
      return {
        title: "Tool call requested",
        detail: readToolNames(event.data) || "The model selected an authored tool.",
        tone: "gold",
      };
    case "action.result":
      return {
        title: "Tool result returned",
        detail: readToolResult(event.data) || "A durable step completed.",
        tone: "cyan",
      };
    case "step.started":
      return { title: "Workflow step started", detail: "The durable turn advanced.", tone: "cyan" };
    case "session.waiting":
      return { title: "Session parked", detail: "Pulse is ready for the next turn.", tone: "teal" };
    case "turn.failed":
    case "session.failed":
      return { title: "Run failed", detail: "Inspect the chat error for details.", tone: "red" };
    default:
      return { title: event.type, detail: "Raw Eve stream event.", tone: "muted" };
  }
}

function readToolNames(data: unknown) {
  const record = asRecord(data);
  const actions = Array.isArray(record?.actions) ? record.actions : [];
  const names = actions
    .map((action) => asRecord(action)?.name ?? asRecord(action)?.toolName)
    .filter((name): name is string => typeof name === "string");
  return names.length > 0 ? names.join(", ") : null;
}

function readToolResult(data: unknown) {
  const record = asRecord(data);
  const name = typeof record?.name === "string" ? record.name : null;
  return name ? `${name} returned data to the model.` : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function labelForMetric(metric: string) {
  const labels: Record<string, string> = {
    activated: "Activated",
    mrr: "MRR",
    paidConversions: "Paid conversions",
    signups: "Signups",
  };
  return labels[metric] ?? metric;
}

function formatValue(metric: string, value: number) {
  if (metric === "mrr") {
    return new Intl.NumberFormat("en-US", {
      currency: "USD",
      maximumFractionDigits: 0,
      style: "currency",
    }).format(value);
  }
  return new Intl.NumberFormat("en-US").format(value);
}
