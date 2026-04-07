/**
 * Extract tools — audio, frames, thumbnails, subtitles.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExtractAudioSchema, ExtractFramesSchema, ThumbnailSchema, BurnSubtitlesSchema } from "../lib/schemas.js";
import { exec, type ExecutorConfig, validateInputFile } from "../lib/executor.js";
import { toolResult, toolError } from "../lib/utils.js";

async function runFfmpeg(config: ExecutorConfig, args: string[]): Promise<ReturnType<typeof toolResult>> {
  const result = await exec(config.ffmpegPath, args, { timeoutMs: config.timeoutMs });
  if (result.exitCode !== 0) {
    return toolError(`FFmpeg failed (exit ${result.exitCode}): ${result.stderr.slice(-500)}`);
  }
  return toolResult({ status: "success", log: result.stderr.slice(-300) });
}

export function registerExtractTools(server: McpServer, config: ExecutorConfig): void {

  // ── Extract Audio ──
  server.tool(
    "extract_audio",
    "Extract audio track from a video file",
    ExtractAudioSchema.shape,
    async (params) => {
      await validateInputFile(params.input);
      const args = ["-y", "-i", params.input, "-vn"];

      args.push("-map", `0:a:${params.track}`);

      if (params.codec) {
        args.push("-c:a", params.codec);
      }
      if (params.bitrate) {
        args.push("-b:a", params.bitrate);
      }
      if (params.sample_rate) {
        args.push("-ar", String(params.sample_rate));
      }

      args.push(params.output);
      return runFfmpeg(config, args);
    }
  );

  // ── Extract Frames ──
  server.tool(
    "extract_frames",
    "Extract frames/images from a video (single frame, interval, or all)",
    ExtractFramesSchema.shape,
    async (params) => {
      await validateInputFile(params.input);
      const args = ["-y", "-i", params.input];

      if (params.timestamp) {
        args.push("-ss", params.timestamp, "-frames:v", "1");
      } else if (params.fps) {
        args.push("-vf", `fps=${params.fps}`);
      }

      if (params.quality) {
        args.push("-q:v", String(params.quality));
      }

      args.push(params.output_pattern);
      return runFfmpeg(config, args);
    }
  );

  // ── Thumbnail ──
  server.tool(
    "thumbnail",
    "Generate a thumbnail image from a video (smart scene detection or timestamp)",
    ThumbnailSchema.shape,
    async (params) => {
      await validateInputFile(params.input);
      const args = ["-y", "-i", params.input];

      if (params.smart) {
        const filters = ["thumbnail=300"];
        if (params.width) filters.push(`scale=${params.width}:-1`);
        args.push("-vf", filters.join(","), "-frames:v", "1");
      } else {
        args.push("-ss", params.timestamp);
        if (params.width) {
          args.push("-vf", `scale=${params.width}:-1`);
        }
        args.push("-frames:v", "1");
      }

      args.push("-q:v", "2", params.output);
      return runFfmpeg(config, args);
    }
  );

  // ── Burn Subtitles ──
  server.tool(
    "burn_subtitles",
    "Burn (hardcode) subtitles into a video",
    BurnSubtitlesSchema.shape,
    async (params) => {
      await validateInputFile(params.input);

      let subtitleFilter: string;
      if (params.stream_index !== undefined) {
        // Embedded subs from MKV
        subtitleFilter = `subtitles='${params.input.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}':si=${params.stream_index}`;
      } else {
        await validateInputFile(params.subtitle_file);
        const escapedPath = params.subtitle_file.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:");
        subtitleFilter = `subtitles='${escapedPath}'`;
      }

      const styleParts: string[] = [];
      if (params.font_name) styleParts.push(`FontName=${params.font_name}`);
      if (params.font_size) styleParts.push(`FontSize=${params.font_size}`);
      if (params.primary_color) styleParts.push(`PrimaryColour=${params.primary_color}`);

      if (styleParts.length > 0) {
        subtitleFilter += `:force_style='${styleParts.join(",")}'`;
      }

      const args = ["-y", "-i", params.input, "-vf", subtitleFilter, "-c:a", "copy", params.output];
      return runFfmpeg(config, args);
    }
  );
}
