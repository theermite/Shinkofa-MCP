/**
 * Audio processing tools — normalize, GIF creation.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type ExecutorConfig, exec, validateInputFile } from "../lib/executor.js";
import { GifSchema, NormalizeAudioSchema } from "../lib/schemas.js";
import { toolError, toolResult, withErrorHandler } from "../lib/utils.js";

async function runFfmpeg(config: ExecutorConfig, args: string[]): Promise<ReturnType<typeof toolResult>> {
  const result = await exec(config.ffmpegPath, args, { timeoutMs: config.timeoutMs });
  if (result.exitCode !== 0) {
    return toolError(`FFmpeg failed (exit ${result.exitCode}): ${result.stderr.slice(-500)}`);
  }
  return toolResult({ status: "success", log: result.stderr.slice(-300) });
}

export function registerAudioTools(server: McpServer, config: ExecutorConfig): void {
  server.tool(
    "normalize_audio",
    "Normalize audio loudness to EBU R128 standard (broadcast standard)",
    NormalizeAudioSchema.shape,
    async (params) => {
      return withErrorHandler(async () => {
        await validateInputFile(params.input);
        const args = [
          "-y",
          "-i",
          params.input,
          "-af",
          `loudnorm=I=${params.target_lufs}:LRA=${params.target_lra}:TP=${params.target_tp}`,
          params.output,
        ];
        return runFfmpeg(config, args);
      });
    },
  );

  server.tool(
    "create_gif",
    "Create a high-quality GIF from a video segment (with palette optimization)",
    GifSchema.shape,
    async (params) => {
      return withErrorHandler(async () => {
        await validateInputFile(params.input);
        if (params.high_quality) {
          const palettePath = `${params.output}.palette.png`;
          const pass1Args = ["-y", "-i", params.input];
          if (params.start) pass1Args.push("-ss", params.start);
          pass1Args.push(
            "-t",
            String(params.duration),
            "-vf",
            `fps=${params.fps},scale=${params.width}:-1:flags=lanczos,palettegen`,
            palettePath,
          );
          const pass1 = await exec(config.ffmpegPath, pass1Args, { timeoutMs: config.timeoutMs });
          if (pass1.exitCode !== 0) {
            return toolError(`GIF palette generation failed: ${pass1.stderr.slice(-500)}`);
          }
          const pass2Args = ["-y", "-i", params.input, "-i", palettePath];
          if (params.start) pass2Args.push("-ss", params.start);
          pass2Args.push(
            "-t",
            String(params.duration),
            "-lavfi",
            `fps=${params.fps},scale=${params.width}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
            params.output,
          );
          const pass2 = await exec(config.ffmpegPath, pass2Args, { timeoutMs: config.timeoutMs });
          try {
            const { unlink } = await import("node:fs/promises");
            await unlink(palettePath);
          } catch {}
          if (pass2.exitCode !== 0) {
            return toolError(`GIF creation failed: ${pass2.stderr.slice(-500)}`);
          }
          return toolResult({ status: "success", output: params.output });
        } else {
          const args = ["-y", "-i", params.input];
          if (params.start) args.push("-ss", params.start);
          args.push("-t", String(params.duration), "-vf", `fps=${params.fps},scale=${params.width}:-1`, params.output);
          return runFfmpeg(config, args);
        }
      });
    },
  );
}
