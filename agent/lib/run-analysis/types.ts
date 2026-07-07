export type AnalysisPoint = {
  readonly label: string;
  readonly value: number;
};

export type AnalysisDelta = {
  readonly absolute: number;
  readonly from: string;
  readonly percent: number | null;
  readonly to: string;
};

export type AnalysisDirection = "down" | "flat" | "up";

export type AnalysisDiagnostics = {
  readonly averageAbsDelta: number;
  readonly deltas: readonly AnalysisDelta[];
  readonly direction: AnalysisDirection;
  readonly movingAverage3: readonly AnalysisPoint[];
  readonly notableMoves: readonly AnalysisDelta[];
  readonly pointCount: number;
};

export type AnalysisResult = {
  readonly absoluteChange: number;
  readonly average: number;
  readonly diagnostics: AnalysisDiagnostics;
  readonly first: AnalysisPoint;
  readonly last: AnalysisPoint;
  readonly max: AnalysisPoint;
  readonly metric: string;
  readonly min: AnalysisPoint;
  readonly percentChange: number | null;
  readonly points: readonly AnalysisPoint[];
  readonly takeaway: string;
  readonly title: string;
  readonly total: number;
};

export type SandboxSuccess = {
  readonly artifactRoot: string;
  readonly chartPath: string;
  readonly command: string;
  readonly filesWritten: readonly string[];
  readonly id: string;
  readonly inputPath: string;
  readonly note: string;
  readonly outputPath: string;
  readonly reportPath: string;
  readonly scriptPath: string;
  readonly stderr: string;
  readonly stdout: string;
  readonly used: true;
};

export type SandboxFailure = {
  readonly reason: string;
  readonly used: false;
};

export type RunAnalysisOutput = AnalysisResult & {
  readonly reportMarkdown?: string;
  readonly sandbox: SandboxSuccess | SandboxFailure;
};
