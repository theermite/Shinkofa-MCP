/**
 * Edit tools — trim, resize, speed, concat, watermark, drawtext, chromakey, compose.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  TrimSchema, ResizeSchema, SpeedSchema, ConcatSchema,
  WatermarkSchema, DrawtextSchema, ChromakeySchema, ComposeSchema,
} from "../lib/schemas.js";
import { exec, type ExecutorConfig, validateInputFile } from "../lib/executor.js";
import { toolResult, toolError } from "../lib/utils.js";
import { writeFile, unlink } from "node:fs/promises";
import { join, dirname } from "node:path";

async function runFfmpeg(config: ExecutorConfig, args: string[]): Promise<ReturnType<typeof toolResult>> {
  const result = await exec(config.ffmpegPath, args, { timeoutMs: config.timeoutMs });
  if (result.exitCode !== 0) {
    return toolError(`FFmpeg failed (exit ${result.exitCode}): ${result.stderr.slice(-500)}`);
  }
  return toolResult({ status: "success", log: result.stderr.slice(-300) });
}

export function registerEditTools(server: McpServer, config: ExecutorConfig): void {

  // ── Trim ──
  server.tool(
    "trim",
    "Cut a segment from a media file by start/end time or duration",
    TrimSchema.shape,
    async (params) => {
      await validateInputFile(params.input);
      const args = ["-y"];

      if (params.copy) {
        // Fast seek before input for stream copy
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
    }
  );

  // ── Resize ──
  server.tool(
    "resize",
    "Resize/scale a video (with optional letterboxing and GPU acceleration)",
    ResizeSchema.shape,
    async (params) => {
      await validateInputFile(params.input);
      const args = ["-y"];

      if (params.gpu) {
        args.push("-hwaccel", "cuda", "-hwaccel_output_format", "cuda");
      }

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
        args.push("-vf",
          `scale=${params.width}:${params.height}:force_original_aspect_ratio=decrease:flags=${params.algorithm},pad=${params.width}:${params.height}:(ow-iw)/2:(oh-ih)/2:black`
        );
      } else {
        args.push("-vf", `scale=${scaleExpr}:flags=${params.algorithm}`);
      }

      if (params.video_codec) {
        args.push("-c:v", params.video_codec);
      } else if (params.gpu) {
        args.push("-c:v", "h264_nvenc");
      }
      args.push("-c:a", "copy", params.output);

      return runFfmpeg(config, args);
    }
  );

  // ── Speed ──
  server.tool(
    "speed",
    "Change playback speed of a video (0.25x to 4x)",
    SpeedSchema.shape,
    async (params) => {
      await validateInputFile(params.input);
      const pts = 1 / params.speed;

      const filters: string[] = [`setpts=${pts.toFixed(4)}*PTS`];
      const args = ["-y", "-i", params.input, "-vf", filters.join(",")];

      if (params.adjust_audio) {
        // atempo range is [0.5, 2.0], chain for values outside
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
    }
  );

  // ── Concat ──
  server.tool(
    "concat",
    "Concatenate multiple media files (with optional crossfade transitions)",
    ConcatSchema.shape,
    async (params) => {
      for (const input of params.inputs) {
        await validateInputFile(input);
      }

      if (params.copy && !params.transition) {
        // Fast concat via demuxer
        const listContent = params.inputs.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
        const listPath = join(dirname(params.output), `.concat_list_${Date.now()}.txt`);
        await writeFile(listPath, listContent);

        try {
          const result = await runFfmpeg(config, [
            "-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", params.output,
          ]);
          return result;
        } finally {
          await unlink(listPath).catch(() => {});
        }
      } else {
        // Re-encode with filter_complex
        const args = ["-y"];
        for (const input of params.inputs) {
          args.push("-i", input);
        }

        const n = params.inputs.length;

        if (params.transition && n === 2) {
          const dur = params.transition_duration;
          args.push(
            "-filter_complex",
            `[0:v][1:v]xfade=transition=${params.transition}:duration=${dur}:offset=4[v];[0:a][1:a]acrossfade=d=${dur}[a]`,
            "-map", "[v]", "-map", "[a]",
          );
        } else {
          // Generic concat
          const streams = params.inputs.map((_, i) => `[${i}:v][${i}:a]`).join("");
          args.push(
            "-filter_complex",
            `${streams}concat=n=${n}:v=1:a=1[v][a]`,
            "-map", "[v]", "-map", "[a]",
          );
        }

        args.push(params.output);
        return runFfmpeg(config, args);
      }
    }
  );

  // ── Watermark ──
  server.tool(
    "watermark",
    "Add an image watermark/overlay to a video",
    WatermarkSchema.shape,
    async (params) => {
      await validateInputFile(params.input);
      await validateInputFile(params.watermark);

      const m = params.margin;
      const posMap: Record<string, string> = {
        "top-left": `${m}:${m}`,
        "top-right": `W-w-${m}:${m}`,
        "bottom-left": `${m}:H-h-${m}`,
        "bottom-right": `W-w-${m}:H-h-${m}`,
        "center": `(W-w)/2:(H-h)/2`,
      };
      const pos = posMap[params.position] ?? posMap["bottom-right"];

      const filterParts: string[] = [];

      if (params.scale) {
        filterParts.push(`[1:v]scale=iw*${params.scale}:-1[wm]`);
        if (params.opacity < 1) {
          filterParts.push(`[wm]colorchannelmixer=aa=${params.opacity}[wm2]`);
          filterParts.push(`[0:v][wm2]overlay=${pos}`);
        } else {
          filterParts.push(`[0:v][wm]overlay=${pos}`);
        }
      } else if (params.opacity < 1) {
        filterParts.push(`[1:v]colorchannelmixer=aa=${params.opacity}[wm]`);
        filterParts.push(`[0:v][wm]overlay=${pos}`);
      } else {
        filterParts.push(`overlay=${pos}`);
      }

      const args = ["-y", "-i", params.input, "-i", params.watermark];

      if (filterParts.length > 1) {
        args.push("-filter_complex", filterParts.join(";"));
      } else {
        args.push("-filter_complex", filterParts[0]!);
      }

      args.push("-c:a", "copy", params.output);
      return runFfmpeg(config, args);
    }
  );

  // ── Drawtext ──
  server.tool(
    "drawtext",
    "Overlay text on a video (title, timestamp, watermark text, credits)",
    DrawtextSchema.shape,
    async (params) => {
      await validateInputFile(params.input);

      const escapedText = params.text.replace(/'/g, "'\\\\\\''").replace(/:/g, "\\:");
      const parts = [`text='${escapedText}'`, `fontsize=${params.font_size}`, `fontcolor=${params.font_color}`, `x=${params.x}`, `y=${params.y}`];

      if (params.font_file) parts.push(`fontfile='${params.font_file}'`);
      if (params.box) {
        parts.push(`box=1`, `boxcolor=${params.box_color}`, `boxborderw=${params.box_border}`);
      }
      if (params.shadow_color) parts.push(`shadowcolor=${params.shadow_color}`);
      if (params.shadow_x !== undefined) parts.push(`shadowx=${params.shadow_x}`);
      if (params.shadow_y !== undefined) parts.push(`shadowy=${params.shadow_y}`);
      if (params.enable) parts.push(`enable='${params.enable}'`);

      const args = ["-y", "-i", params.input, "-vf", `drawtext=${parts.join(":")}`, "-c:a", "copy", params.output];
      return runFfmpeg(config, args);
    }
  );

  // ── Chromakey ──
  server.tool(
    "chromakey",
    "Remove green/blue screen and composite with a background",
    ChromakeySchema.shape,
    async (params) => {
      await validateInputFile(params.foreground);
      await validateInputFile(params.background);

      const args = [
        "-y", "-i", params.foreground, "-i", params.background,
        "-filter_complex",
        `[0:v]chromakey=${params.color}:${params.similarity}:${params.blend}[fg];[1:v][fg]overlay[out]`,
        "-map", "[out]", "-c:a", "copy", params.output,
      ];
      return runFfmpeg(config, args);
    }
  );

  // ── Compose (PiP, hstack, vstack, grid) ──
  server.tool(
    "compose",
    "Compose multiple videos: picture-in-picture, side-by-side, vertical stack, or grid",
    ComposeSchema.shape,
    async (params) => {
      for (const input of params.inputs) {
        await validateInputFile(input);
      }

      const args = ["-y"];
      for (const input of params.inputs) {
        args.push("-i", input);
      }

      switch (params.layout) {
        case "pip": {
          const m = params.pip_margin;
          const posMap: Record<string, string> = {
            "top-left": `${m}:${m}`,
            "top-right": `W-w-${m}:${m}`,
            "bottom-left": `${m}:H-h-${m}`,
            "bottom-right": `W-w-${m}:H-h-${m}`,
          };
          const pos = posMap[params.pip_position] ?? posMap["bottom-right"];
          args.push(
            "-filter_complex",
            `[1:v]scale=iw*${params.pip_scale}:ih*${params.pip_scale}[small];[0:v][small]overlay=${pos}`,
          );
          break;
        }
        case "hstack":
          args.push("-filter_complex", `[0:v][1:v]hstack=inputs=2[v]`, "-map", "[v]");
          break;
        case "vstack":
          args.push("-filter_complex", `[0:v][1:v]vstack=inputs=2[v]`, "-map", "[v]");
          break;
        case "grid": {
          const n = params.inputs.length;
          if (n === 4) {
            args.push("-filter_complex", `[0:v][1:v]hstack[top];[2:v][3:v]hstack[bot];[top][bot]vstack[v]`, "-map", "[v]");
          } else {
            const streams = params.inputs.map((_, i) => `[${i}:v]`).join("");
            const cols = Math.ceil(Math.sqrt(n));
            args.push("-filter_complex", `${streams}xstack=inputs=${n}:layout=${buildGridLayout(n, cols)}[v]`, "-map", "[v]");
          }
          break;
        }
      }

      args.push("-c:a", "copy", params.output);
      return runFfmpeg(config, args);
    }
  );
}

function buildGridLayout(n: number, cols: number): string {
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col === 0 ? "0" : Array.from({ length: col }, (_, c) => `w${c}`).join("+");
    const y = row === 0 ? "0" : Array.from({ length: row }, (_, r) => `h${r * cols}`).join("+");
    parts.push(`${x}_${y}`);
  }
  return parts.join("|");
}
