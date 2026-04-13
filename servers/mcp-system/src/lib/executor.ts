import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface ExecOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

export interface ExecOptions {
  cwd?: string;
  timeoutMs?: number;
  env?: Record<string, string>;
  maxBufferBytes?: number;
}

/**
 * Run a command WITHOUT a shell (execFile). Args are passed as array and
 * not interpreted by a shell — no injection surface.
 */
export async function runCommand(
  command: string,
  args: string[],
  options: ExecOptions = {},
): Promise<ExecOutput> {
  const timeout = options.timeoutMs ?? 30_000;
  const maxBuffer = options.maxBufferBytes ?? 10 * 1024 * 1024;
  const env = options.env ? { ...process.env, ...options.env } : process.env;

  try {
    const result = await execFileAsync(command, args, {
      cwd: options.cwd,
      timeout,
      maxBuffer,
      env,
      windowsHide: true,
    });
    return {
      stdout: result.stdout.toString(),
      stderr: result.stderr.toString(),
      exitCode: 0,
      timedOut: false,
    };
  } catch (err) {
    const e = err as NodeJS.ErrnoException & {
      stdout?: Buffer | string;
      stderr?: Buffer | string;
      code?: number | string;
      killed?: boolean;
      signal?: string;
    };
    const timedOut = e.killed === true && e.signal === "SIGTERM";
    return {
      stdout: e.stdout ? e.stdout.toString() : "",
      stderr: e.stderr ? e.stderr.toString() : (e.message ?? ""),
      exitCode: typeof e.code === "number" ? e.code : 1,
      timedOut,
    };
  }
}
