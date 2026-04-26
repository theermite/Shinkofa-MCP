/**
 * FFprobe tools — media analysis and metadata extraction.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type ExecutorConfig, exec, validateInputFile } from "../lib/executor.js";
import { ProbeSchema } from "../lib/schemas.js";
import { toolError, toolResult, withErrorHandler } from "../lib/utils.js";

export function registerProbeTools(server: McpServer, config: ExecutorConfig): void {
  server.tool(
    "probe",
    "Analyze a media file — get duration, resolution, codecs, bitrate, streams, chapters (JSON output)",
    ProbeSchema.shape,
    async (params) => {
      return withErrorHandler(async () => {
        await validateInputFile(params.input);
        const args: string[] = ["-v", "quiet", "-print_format", "json"];
        if (params.show_format) args.push("-show_format");
        if (params.show_streams) args.push("-show_streams");
        if (params.show_chapters) args.push("-show_chapters");
        args.push(params.input);
        const result = await exec(config.ffprobePath, args, { timeoutMs: 30_000 });
        if (result.exitCode !== 0) {
          return toolError(`FFprobe failed (exit ${result.exitCode}): ${result.stderr}`);
        }
        try {
          const parsed = JSON.parse(result.stdout);
          return toolResult(parsed);
        } catch {
          return toolResult(result.stdout);
        }
      });
    },
  );
}
