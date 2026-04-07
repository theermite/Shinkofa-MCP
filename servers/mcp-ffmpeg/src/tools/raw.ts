/**
 * Raw FFmpeg/FFprobe tools — 100% coverage via direct CLI arguments.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RawFfmpegSchema, RawFfprobeSchema } from "../lib/schemas.js";
import { exec, type ExecutorConfig } from "../lib/executor.js";
import { toolResult, toolError } from "../lib/utils.js";

export function registerRawTools(server: McpServer, config: ExecutorConfig): void {

  server.tool(
    "raw_ffmpeg",
    "Execute any FFmpeg command with custom arguments. Full access to all FFmpeg capabilities. Arguments are passed directly (without 'ffmpeg' prefix).",
    RawFfmpegSchema.shape,
    async (params) => {
      const timeoutMs = params.timeout_ms ?? config.timeoutMs;
      const result = await exec(config.ffmpegPath, params.args, { timeoutMs });

      if (result.exitCode !== 0) {
        return toolError(
          `FFmpeg exited with code ${result.exitCode}\n\n` +
          `stderr:\n${result.stderr.slice(-1000)}`
        );
      }

      const output = result.stdout || result.stderr.slice(-500);
      return toolResult({
        status: "success",
        exit_code: result.exitCode,
        output,
      });
    }
  );

  server.tool(
    "raw_ffprobe",
    "Execute any FFprobe command with custom arguments. Full access to all analysis capabilities. Arguments are passed directly (without 'ffprobe' prefix).",
    RawFfprobeSchema.shape,
    async (params) => {
      const result = await exec(config.ffprobePath, params.args, { timeoutMs: 30_000 });

      if (result.exitCode !== 0) {
        return toolError(
          `FFprobe exited with code ${result.exitCode}\n\n` +
          `stderr:\n${result.stderr.slice(-1000)}`
        );
      }

      // Try to parse JSON output
      try {
        const parsed = JSON.parse(result.stdout);
        return toolResult(parsed);
      } catch {
        return toolResult(result.stdout);
      }
    }
  );
}
