/**
 * FFmpeg/FFprobe process executor.
 * Spawns CLI processes and captures output safely.
 */
import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access } from "node:fs/promises";

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ExecutorConfig {
  ffmpegPath: string;
  ffprobePath: string;
  timeoutMs: number;
  maxOutputBytes: number;
}

const DEFAULT_CONFIG: ExecutorConfig = {
  ffmpegPath: "ffmpeg",
  ffprobePath: "ffprobe",
  timeoutMs: 300_000, // 5 minutes
  maxOutputBytes: 10 * 1024 * 1024, // 10MB
};

export function createConfig(env: NodeJS.ProcessEnv): ExecutorConfig {
  return {
    ffmpegPath: env.FFMPEG_PATH ?? DEFAULT_CONFIG.ffmpegPath,
    ffprobePath: env.FFPROBE_PATH ?? DEFAULT_CONFIG.ffprobePath,
    timeoutMs: env.FFMPEG_TIMEOUT_MS ? parseInt(env.FFMPEG_TIMEOUT_MS, 10) : DEFAULT_CONFIG.timeoutMs,
    maxOutputBytes: DEFAULT_CONFIG.maxOutputBytes,
  };
}

export async function checkBinaryExists(path: string): Promise<boolean> {
  // Try running with -version to check availability
  try {
    const result = await exec(path, ["-version"], { timeoutMs: 5000, maxOutputBytes: 4096 });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

export async function validateInputFile(filePath: string): Promise<void> {
  try {
    await access(filePath, constants.R_OK);
  } catch {
    throw new Error(`Input file not found or not readable: ${filePath}`);
  }
}

export function exec(
  command: string,
  args: string[],
  options?: Partial<Pick<ExecutorConfig, "timeoutMs" | "maxOutputBytes">>,
): Promise<ExecResult> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_CONFIG.timeoutMs;
  const maxBytes = options?.maxOutputBytes ?? DEFAULT_CONFIG.maxOutputBytes;

  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGKILL");
      reject(new Error(`Process timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    proc.stdout.on("data", (chunk: Buffer) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes <= maxBytes) {
        stdout += chunk.toString();
      }
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      stderrBytes += chunk.length;
      if (stderrBytes <= maxBytes) {
        stderr += chunk.toString();
      }
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (!killed) {
        resolve({ stdout, stderr, exitCode: code ?? 1 });
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to spawn ${command}: ${err.message}`));
    });

    // Close stdin immediately — we don't pipe input
    proc.stdin.end();
  });
}

/**
 * Build an ffmpeg argument array from structured options.
 * Ensures safe argument construction — no shell injection.
 */
export function buildFfmpegArgs(options: {
  inputs: Array<{ path: string; options?: string[] }>;
  outputPath: string;
  videoCodec?: string;
  audioCodec?: string;
  videoFilters?: string[];
  audioFilters?: string[];
  complexFilter?: string;
  maps?: string[];
  format?: string;
  overwrite?: boolean;
  extraArgs?: string[];
}): string[] {
  const args: string[] = [];

  // Global options
  if (options.overwrite !== false) {
    args.push("-y");
  }

  // Inputs
  for (const input of options.inputs) {
    if (input.options) {
      args.push(...input.options);
    }
    args.push("-i", input.path);
  }

  // Complex filter (must come before maps)
  if (options.complexFilter) {
    args.push("-filter_complex", options.complexFilter);
  }

  // Maps
  if (options.maps) {
    for (const map of options.maps) {
      args.push("-map", map);
    }
  }

  // Video codec
  if (options.videoCodec) {
    args.push("-c:v", options.videoCodec);
  }

  // Audio codec
  if (options.audioCodec) {
    args.push("-c:a", options.audioCodec);
  }

  // Video filters (simple, not complex)
  if (options.videoFilters?.length && !options.complexFilter) {
    args.push("-vf", options.videoFilters.join(","));
  }

  // Audio filters
  if (options.audioFilters?.length) {
    args.push("-af", options.audioFilters.join(","));
  }

  // Format
  if (options.format) {
    args.push("-f", options.format);
  }

  // Extra args (codec params, quality settings, etc.)
  if (options.extraArgs) {
    args.push(...options.extraArgs);
  }

  // Output
  args.push(options.outputPath);

  return args;
}
