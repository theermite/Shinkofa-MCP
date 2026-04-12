/**
 * Conversion tools — transcode between formats, codecs, quality settings.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ConvertSchema } from "../lib/schemas.js";
import { exec, type ExecutorConfig, validateInputFile } from "../lib/executor.js";
import { toolResult, toolError, withErrorHandler } from "../lib/utils.js";

export function registerConvertTools(server: McpServer, config: ExecutorConfig): void {
  server.tool(
    "convert",
    "Convert/transcode a media file — change format, codec, quality, resolution. Supports GPU (NVENC) acceleration.",
    ConvertSchema.shape,
    async (params) => {
      return withErrorHandler(async () => {
      await validateInputFile(params.input);

      const args: string[] = ["-y"];

      // GPU decode
      if (params.gpu) {
        args.push("-hwaccel", "cuda");
        if (params.video_codec?.includes("nvenc")) {
          args.push("-hwaccel_output_format", "cuda");
        }
      }

      args.push("-i", params.input);

      // Video codec
      if (params.video_codec) {
        args.push("-c:v", params.video_codec);
      }

      // Audio codec
      if (params.audio_codec) {
        args.push("-c:a", params.audio_codec);
      }

      // CRF
      if (params.crf !== undefined) {
        if (params.video_codec?.includes("nvenc")) {
          args.push("-cq", String(params.crf), "-b:v", "0");
        } else {
          args.push("-crf", String(params.crf));
        }
      }

      // Bitrates
      if (params.bitrate_video) {
        args.push("-b:v", params.bitrate_video);
      }
      if (params.bitrate_audio) {
        args.push("-b:a", params.bitrate_audio);
      }

      // Preset
      if (params.preset) {
        args.push("-preset", params.preset);
      }

      // Tune
      if (params.tune) {
        args.push("-tune", params.tune);
      }

      // Pixel format
      if (params.pixel_format) {
        args.push("-pix_fmt", params.pixel_format);
      }

      // Resolution
      if (params.resolution) {
        const [w, h] = params.resolution.split("x");
        if (params.gpu && params.video_codec?.includes("nvenc")) {
          args.push("-vf", `scale_cuda=${w}:${h}`);
        } else {
          args.push("-vf", `scale=${w}:${h}`);
        }
      }

      // Framerate
      if (params.framerate) {
        args.push("-r", String(params.framerate));
      }

      // Extra args
      if (params.extra_args) {
        args.push(...params.extra_args);
      }

      args.push(params.output);

      const result = await exec(config.ffmpegPath, args, { timeoutMs: config.timeoutMs });

      if (result.exitCode !== 0) {
        return toolError(`FFmpeg convert failed (exit ${result.exitCode}): ${result.stderr.slice(-500)}`);
      }

      return toolResult({
        status: "success",
        output: params.output,
        log: result.stderr.slice(-300),
      });
      });
    }
  );
}
