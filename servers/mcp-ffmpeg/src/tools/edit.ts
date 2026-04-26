/**
 * Edit tools — trim, resize, speed, concat.
 */

import { unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type ExecutorConfig, exec, validateInputFile } from "../lib/executor.js";
import { ConcatSchema, ResizeSchema, SpeedSchema, TrimSchema } from "../lib/schemas.js";
import { toolError, toolResult, withErrorHandler } from "../lib/utils.js";

async function runFfmpeg(config: ExecutorConfig, args: string[]): Promise<ReturnType<typeof toolResult>> {
  const result = await exec(config.ffmpegPath, args, { timeoutMs: config.timeoutMs });
  if (result.exitCode !== 0) {
    return toolError(`FFmpeg failed (exit ${result.exitCode}): ${result.stderr.slice(-500)}`);
  }
  return toolResult({ status: "success", log: result.stderr.slice(-300) });
}

export function registerEditTools(server: McpServer, config: ExecutorConfig): void {
  server.tool(
    "trim",
    "Cut a segment from a media file by start/end time or duration",
    TrimSchema.shape,
    async (params) => {
      return withErrorHandler(async () => {
        await validateInputFile(params.input);
        const args = ["-y"];
        if (params.copy) {
          args.push("-ss", params.start);
          if (params.end) args.push("-to", params.end);
          if (params.duration) args.push("-t", params.duration);
          args.push("-i", params.input, "-c", "copy", params.output);
        } else {
          args.push("-i", params.input, "-ss", params.start);
          if (params.end) args.push("-to", params.end);
          if (params.duration) args.push("-t", params.duration);
          args.push(params.output);
        }
        return runFfmpeg(config, args);
      });
    },
  );

  server.tool(
    "resize",
    "Resize/scale a video (with optional letterboxing and GPU acceleration)",
    ResizeSchema.shape,
    async (params) => {
      return withErrorHandler(async () => {
        await validateInputFile(params.input);
        const args = ["-y"];
        if (params.gpu) args.push("-hwaccel", "cuda", "-hwaccel_output_format", "cuda");
        args.push("-i", params.input);
        let scaleExpr: string;
        if (params.scale) {
          scaleExpr = params.scale;
        } else {
          const w = params.width ?? -2;
          const h = params.height ?? -2;
          scaleExpr = `${w}:${h}`;
        }
        if (params.gpu) {
          args.push("-vf", `scale_cuda=${scaleExpr}`);
        } else if (params.letterbox && params.width && params.height) {
          args.push(
            "-vf",
            `scale=${params.width}:${params.height}:force_original_aspect_ratio=decrease:flags=${params.algorithm},pad=${params.width}:${params.height}:(ow-iw)/2:(oh-ih)/2:black`,
          );
        } else {
          args.push("-vf", `scale=${scaleExpr}:flags=${params.algorithm}`);
        }
        if (params.video_codec) args.push("-c:v", params.video_codec);
        else if (params.gpu) args.push("-c:v", "h264_nvenc");
        args.push("-c:a", "copy", params.output);
        return runFfmpeg(config, args);
      });
    },
  );

  server.tool("speed", "Change playback speed of a video (0.25x to 4x)", SpeedSchema.shape, async (params) => {
    return withErrorHandler(async () => {
      await validateInputFile(params.input);
      const pts = 1 / params.speed;
      const filters: string[] = [`setpts=${pts.toFixed(4)}*PTS`];
      const args = ["-y", "-i", params.input, "-vf", filters.join(",")];
      if (params.adjust_audio) {
        const tempos: string[] = [];
        let remaining = params.speed;
        while (remaining > 2.0) {
          tempos.push("atempo=2.0");
          remaining /= 2.0;
        }
        while (remaining < 0.5) {
          tempos.push("atempo=0.5");
          remaining /= 0.5;
        }
        tempos.push(`atempo=${remaining.toFixed(4)}`);
        args.push("-af", tempos.join(","));
      } else {
        args.push("-an");
      }
      args.push(params.output);
      return runFfmpeg(config, args);
    });
  });

  server.tool(
    "concat",
    "Concatenate multiple media files (with optional crossfade transitions)",
    ConcatSchema.shape,
    async (params) => {
      return withErrorHandler(async () => {
        for (const input of params.inputs) await validateInputFile(input);
        if (params.copy && !params.transition) {
          const listContent = params.inputs.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
          const listPath = join(dirname(params.output), `.concat_list_${Date.now()}.txt`);
          await writeFile(listPath, listContent);
          try {
            return await runFfmpeg(config, [
              "-y",
              "-f",
              "concat",
              "-safe",
              "0",
              "-i",
              listPath,
              "-c",
              "copy",
              params.output,
            ]);
          } finally {
            await unlink(listPath).catch(() => {});
          }
        } else {
          const args = ["-y"];
          for (const input of params.inputs) args.push("-i", input);
          const n = params.inputs.length;
          if (params.transition && n === 2) {
            const dur = params.transition_duration;
            args.push(
              "-filter_complex",
              `[0:v][1:v]xfade=transition=${params.transition}:duration=${dur}:offset=4[v];[0:a][1:a]acrossfade=d=${dur}[a]`,
              "-map",
              "[v]",
              "-map",
              "[a]",
            );
          } else {
            const streams = params.inputs.map((_, i) => `[${i}:v][${i}:a]`).join("");
            args.push("-filter_complex", `${streams}concat=n=${n}:v=1:a=1[v][a]`, "-map", "[v]", "-map", "[a]");
          }
          args.push(params.output);
          return runFfmpeg(config, args);
        }
      });
    },
  );
}
