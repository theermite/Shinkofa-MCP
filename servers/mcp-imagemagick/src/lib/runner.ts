/**
 * ImageMagick CLI runner — executes magick/convert commands.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class ImageMagickRunner {
  private readonly magickPath: string;
  private readonly timeoutMs: number;

  constructor(magickPath?: string, timeoutMs?: number) {
    this.magickPath = magickPath ?? "magick";
    this.timeoutMs = timeoutMs ?? 120_000;
  }

  async run(args: string[]): Promise<RunResult> {
    try {
      const { stdout, stderr } = await execFileAsync(this.magickPath, args, {
        timeout: this.timeoutMs,
        maxBuffer: 50 * 1024 * 1024,
      });
      return { stdout, stderr, exitCode: 0 };
    } catch (error) {
      const err = error as { stdout?: string; stderr?: string; code?: number };
      return {
        stdout: err.stdout ?? "",
        stderr: err.stderr ?? (error as Error).message,
        exitCode: err.code ?? 1,
      };
    }
  }

  async identify(args: string[]): Promise<RunResult> {
    return this.run(["identify", ...args]);
  }

  async convert(args: string[]): Promise<RunResult> {
    return this.run(["convert", ...args]);
  }
}
