/**
 * Compose tools — watermark, drawtext, chromakey, compose layouts.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WatermarkSchema, DrawtextSchema, ChromakeySchema, ComposeSchema } from "../lib/schemas.js";
import { exec, type ExecutorConfig, validateInputFile } from "../lib/executor.js";
import { toolResult, toolError, withErrorHandler } from "../lib/utils.js";

async function runFfmpeg(config: ExecutorConfig, args: string[]): Promise<ReturnType<typeof toolResult>> {
  const result = await exec(config.ffmpegPath, args, { timeoutMs: config.timeoutMs });
  if (result.exitCode !== 0) {
    return toolError(`FFmpeg failed (exit ${result.exitCode}): ${result.stderr.slice(-500)}`);
  }
  return toolResult({ status: "success", log: result.stderr.slice(-300) });
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

export function registerComposeTools(server: McpServer, config: ExecutorConfig): void {
  server.tool("watermark", "Add an image watermark/overlay to a video", WatermarkSchema.shape, async (params) => {
    return withErrorHandler(async () => {
      await validateInputFile(params.input);
      await validateInputFile(params.watermark);
      const m = params.margin;
      const posMap: Record<string, string> = {
        "top-left": `${m}:${m}`, "top-right": `W-w-${m}:${m}`,
        "bottom-left": `${m}:H-h-${m}`, "bottom-right": `W-w-${m}:H-h-${m}`,
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
      if (filterParts.length > 1) args.push("-filter_complex", filterParts.join(";"));
      else args.push("-filter_complex", filterParts[0]!);
      args.push("-c:a", "copy", params.output);
      return runFfmpeg(config, args);
    });
  });

  server.tool("drawtext", "Overlay text on a video (title, timestamp, watermark text, credits)", DrawtextSchema.shape, async (params) => {
    return withErrorHandler(async () => {
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
    });
  });

  server.tool("chromakey", "Remove green/blue screen and composite with a background", ChromakeySchema.shape, async (params) => {
    return withErrorHandler(async () => {
      await validateInputFile(params.foreground);
      await validateInputFile(params.background);
      const args = [
        "-y", "-i", params.foreground, "-i", params.background,
        "-filter_complex", `[0:v]chromakey=${params.color}:${params.similarity}:${params.blend}[fg];[1:v][fg]overlay[out]`,
        "-map", "[out]", "-c:a", "copy", params.output,
      ];
      return runFfmpeg(config, args);
    });
  });

  server.tool("compose", "Compose multiple videos: picture-in-picture, side-by-side, vertical stack, or grid", ComposeSchema.shape, async (params) => {
    return withErrorHandler(async () => {
      for (const input of params.inputs) await validateInputFile(input);
      const args = ["-y"];
      for (const input of params.inputs) args.push("-i", input);
      switch (params.layout) {
        case "pip": {
          const m = params.pip_margin;
          const posMap: Record<string, string> = {
            "top-left": `${m}:${m}`, "top-right": `W-w-${m}:${m}`,
            "bottom-left": `${m}:H-h-${m}`, "bottom-right": `W-w-${m}:H-h-${m}`,
          };
          const pos = posMap[params.pip_position] ?? posMap["bottom-right"];
          args.push("-filter_complex", `[1:v]scale=iw*${params.pip_scale}:ih*${params.pip_scale}[small];[0:v][small]overlay=${pos}`);
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
            const cols = Math.ceil(Math.sqrt(n));
            const streams = params.inputs.map((_, i) => `[${i}:v]`).join("");
            args.push("-filter_complex", `${streams}xstack=inputs=${n}:layout=${buildGridLayout(n, cols)}[v]`, "-map", "[v]");
          }
          break;
        }
      }
      args.push("-c:a", "copy", params.output);
      return runFfmpeg(config, args);
    });
  });
}
