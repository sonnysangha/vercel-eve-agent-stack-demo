import type { SandboxSession } from "eve/sandbox";

import { buildPythonCommand, quoteShell, type SandboxPaths } from "./sandbox-paths";
import type { AnalysisPoint, AnalysisResult, RunAnalysisOutput } from "./types";

type SandboxRunInput = {
  readonly fallback: AnalysisResult;
  readonly metric: string;
  readonly paths: SandboxPaths;
  readonly points: readonly AnalysisPoint[];
  readonly sandbox: SandboxSession;
  readonly title: string;
};

export async function runPythonAnalysisInSandbox({
  fallback,
  metric,
  paths,
  points,
  sandbox,
  title,
}: SandboxRunInput): Promise<RunAnalysisOutput> {
  await sandbox.run({ command: `mkdir -p ${quoteShell(paths.dir)}` });
  await sandbox.writeTextFile({
    path: paths.input,
    content: JSON.stringify({ metric, points, title }, null, 2),
  });

  const command = buildPythonCommand(sandbox.resolvePath(paths.dir));
  const commandResult = await sandbox.run({ command });
  const output = await readSandboxJson<AnalysisResult>(sandbox, paths.output, fallback);
  const reportMarkdown = await sandbox.readTextFile({ path: paths.report });

  return {
    ...output,
    ...(reportMarkdown === null ? {} : { reportMarkdown }),
    sandbox: {
      used: true,
      id: sandbox.id,
      command,
      filesWritten: paths.filesWritten,
      artifactRoot: paths.root,
      inputPath: paths.workspace.input,
      scriptPath: paths.workspace.script,
      outputPath: paths.workspace.output,
      chartPath: paths.workspace.chart,
      reportPath: paths.workspace.report,
      note: "Python executed inside the Eve sandbox and wrote analysis artifacts under /workspace.",
      stdout: commandResult.stdout ?? "",
      stderr: commandResult.stderr ?? "",
    },
  };
}

export function withSandboxFailure(
  fallback: AnalysisResult,
  error: unknown,
): RunAnalysisOutput {
  return {
    ...fallback,
    sandbox: {
      used: false,
      reason:
        error instanceof Error ? error.message : "Sandbox execution failed before producing output.",
    },
  };
}

async function readSandboxJson<T>(
  sandbox: SandboxSession,
  path: string,
  fallback: T,
): Promise<T> {
  const text = await sandbox.readTextFile({ path });
  if (text === null) {
    throw new Error(`Sandbox did not produce ${path}.`);
  }

  return JSON.parse(text) as T;
}
