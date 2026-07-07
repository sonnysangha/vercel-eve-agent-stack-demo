// Eve seeds files under agent/sandbox/workspace/** into /workspace before the
// session starts. This is the real Python program that runs in the isolated
// sandbox, not a TypeScript string written by the app at runtime.
const seededPythonScriptPath = "/workspace/scripts/pulse_analysis.py";

// These are the per-call files the tool creates inside the Eve sandbox.
// Keeping the names stable makes the recording easy to narrate and makes the
// artifact list predictable in the final answer.
const artifactFileNames = {
  chart: "pulse_chart.svg",
  input: "input.json",
  output: "pulse_analysis.json",
  report: "report.md",
} as const;

const pythonCommand = `python3 ${seededPythonScriptPath} || python ${seededPythonScriptPath}`;

export type SandboxPaths = ReturnType<typeof createSandboxPaths>;

export function createSandboxPaths(callId: string) {
  // Eve gives each tool call a stable call id. We turn that into a safe folder
  // name so repeated run_analysis calls never overwrite each other's artifacts.
  const runFolderName = safePathSegment(callId);
  const artifactDir = `analysis/${runFolderName}`;

  // Sandbox file APIs accept paths relative to /workspace. These are the paths
  // we pass to writeTextFile/readTextFile.
  const relativePaths = {
    chart: `${artifactDir}/${artifactFileNames.chart}`,
    input: `${artifactDir}/${artifactFileNames.input}`,
    output: `${artifactDir}/${artifactFileNames.output}`,
    report: `${artifactDir}/${artifactFileNames.report}`,
  };

  // The sandbox itself lives at /workspace. These absolute-looking paths are
  // what we show in the UI/model output so viewers can see the isolation
  // boundary: Python writes files in the sandbox, not in the Next.js app.
  const workspacePaths = {
    chart: toWorkspacePath(relativePaths.chart),
    input: toWorkspacePath(relativePaths.input),
    output: toWorkspacePath(relativePaths.output),
    report: toWorkspacePath(relativePaths.report),
    script: seededPythonScriptPath,
  };

  return {
    ...relativePaths,
    dir: artifactDir,
    filesWritten: [
      workspacePaths.input,
      workspacePaths.output,
      workspacePaths.chart,
      workspacePaths.report,
    ],
    root: toWorkspacePath(artifactDir),
    workspace: workspacePaths,
  };
}

export function buildPythonCommand(resolvedDir: string) {
  // resolvePath() gives us the backend-specific absolute path for this sandbox.
  // JSON.stringify safely quotes spaces and shell-sensitive characters before
  // we cd into the artifact folder and run the script there.
  return `cd ${JSON.stringify(resolvedDir)} && (${pythonCommand})`;
}

export function quoteShell(value: string) {
  // Used for mkdir -p. Single-quote shell escaping keeps the generated command
  // readable while still handling odd call ids safely.
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function toWorkspacePath(path: string) {
  return `/workspace/${path}`;
}

function safePathSegment(value: string) {
  // A call id may contain provider-specific punctuation. Keep only boring path
  // characters so the same code works on local, Docker, and Vercel sandboxes.
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 72) || "run";
}
