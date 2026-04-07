/**
 * Streaming tools — RTMP push, HLS generation.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamSchema, HlsSchema } from "../lib/schemas.js";
import { exec, type ExecutorConfig, validateInputFile } from "../lib/executor.js";
import { toolResult, toolError } from "../lib/utils.js";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

export function registerStreamingTools(server: McpServer, config: ExecutorConfig): void {

  // ── RTMP/SRT Push ──
  server.tool(
    "stream_push",
    "Push a file or device to RTMP/SRT endpoint (Twitch, YouTube, custom server)",
    StreamSchema.shape,
    async (params) => {
      const args = ["-y", "-re"];

      if (params.gpu) {
        args.push("-hwaccel", "cuda");
        if (params.video_codec.includes("nvenc")) {
          args.push("-hwaccel_output_format", "cuda");
        }
      }

      args.push("-i", params.input);

      // Video
      args.push("-c:v", params.gpu ? "h264_nvenc" : params.video_codec);
      if (params.preset) args.push("-preset", params.preset);
      if (params.tune) args.push("-tune", params.tune);
      args.push("-b:v", params.bitrate_video);
      if (!params.gpu) {
        args.push("-maxrate", params.bitrate_video);
        const bufNum = parseInt(params.bitrate_video) * 2;
        args.push("-bufsize", `${bufNum}k`);
      }

      if (params.resolution) {
        const [w, h] = params.resolution.split("x");
        if (params.gpu) {
          args.push("-vf", `scale_cuda=${w}:${h}`);
        } else {
          args.push("-vf", `scale=${w}:${h}`);
        }
      }

      if (params.framerate) {
        args.push("-r", String(params.framerate));
      }

      args.push("-pix_fmt", "yuv420p", "-g", "60");

      // Audio
      args.push("-c:a", params.audio_codec, "-b:a", params.bitrate_audio, "-ar", "44100");

      // Extra args
      if (params.extra_args) {
        args.push(...params.extra_args);
      }

      // Output format
      if (params.url.startsWith("rtmp")) {
        args.push("-f", "flv");
      } else if (params.url.startsWith("srt")) {
        args.push("-f", "mpegts");
      }

      args.push(params.url);

      const result = await exec(config.ffmpegPath, args, { timeoutMs: 0 }); // No timeout for streaming
      if (result.exitCode !== 0 && result.exitCode !== 255) {
        return toolError(`Stream push failed: ${result.stderr.slice(-500)}`);
      }
      return toolResult({ status: "stream_ended", log: result.stderr.slice(-300) });
    }
  );

  // ── HLS Generation ──
  server.tool(
    "generate_hls",
    "Generate HLS segments and playlist from a video file (for web streaming)",
    HlsSchema.shape,
    async (params) => {
      await validateInputFile(params.input);
      await mkdir(params.output_dir, { recursive: true });

      const args = ["-y", "-i", params.input];

      if (params.gpu) {
        args.push("-c:v", "h264_nvenc", "-preset", "p4");
      } else {
        args.push("-c:v", params.video_codec);
      }

      args.push("-c:a", params.audio_codec);

      if (params.bitrate_video) {
        args.push("-b:v", params.bitrate_video);
      }

      if (params.resolution) {
        const [w, h] = params.resolution.split("x");
        args.push("-vf", `scale=${w}:${h}`);
      }

      args.push(
        "-f", "hls",
        "-hls_time", String(params.segment_duration),
        "-hls_list_size", "0",
        "-hls_segment_filename", join(params.output_dir, "segment_%03d.ts"),
        join(params.output_dir, params.playlist_name),
      );

      const result = await exec(config.ffmpegPath, args, { timeoutMs: config.timeoutMs });
      if (result.exitCode !== 0) {
        return toolError(`HLS generation failed: ${result.stderr.slice(-500)}`);
      }
      return toolResult({
        status: "success",
        playlist: join(params.output_dir, params.playlist_name),
        log: result.stderr.slice(-300),
      });
    }
  );
}
