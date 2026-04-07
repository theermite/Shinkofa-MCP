/**
 * Zod schemas for FFmpeg MCP tool inputs.
 */
import { z } from "zod";

// ── Probe ──

export const ProbeSchema = z.object({
  input: z.string().describe("Path to the media file to analyze"),
  show_streams: z.boolean().optional().default(true).describe("Include stream info"),
  show_format: z.boolean().optional().default(true).describe("Include format/container info"),
  show_chapters: z.boolean().optional().default(false).describe("Include chapter info"),
});

// ── Convert ──

export const ConvertSchema = z.object({
  input: z.string().describe("Input file path"),
  output: z.string().describe("Output file path (extension determines format)"),
  video_codec: z.string().optional().describe("Video codec (libx264, h264_nvenc, libx265, hevc_nvenc, av1_nvenc, libvpx-vp9, copy)"),
  audio_codec: z.string().optional().describe("Audio codec (aac, libmp3lame, libopus, flac, copy)"),
  crf: z.number().min(0).max(63).optional().describe("Constant Rate Factor (quality, lower = better)"),
  bitrate_video: z.string().optional().describe("Video bitrate (e.g. '5000k', '8M')"),
  bitrate_audio: z.string().optional().describe("Audio bitrate (e.g. '128k', '320k')"),
  preset: z.string().optional().describe("Encoder preset (ultrafast..veryslow for x264/x265, p1..p7 for NVENC)"),
  tune: z.string().optional().describe("Encoder tune (film, animation, zerolatency, hq, ll)"),
  pixel_format: z.string().optional().describe("Pixel format (yuv420p, yuv420p10le, etc.)"),
  resolution: z.string().optional().describe("Output resolution (e.g. '1920x1080', '1280x720')"),
  framerate: z.number().optional().describe("Output framerate"),
  extra_args: z.array(z.string()).optional().describe("Additional FFmpeg arguments"),
  gpu: z.boolean().optional().default(false).describe("Use NVIDIA GPU acceleration (NVENC/NVDEC)"),
});

// ── Trim ──

export const TrimSchema = z.object({
  input: z.string().describe("Input file path"),
  output: z.string().describe("Output file path"),
  start: z.string().describe("Start time (HH:MM:SS or seconds)"),
  end: z.string().optional().describe("End time (HH:MM:SS or seconds)"),
  duration: z.string().optional().describe("Duration (HH:MM:SS or seconds) — alternative to end"),
  copy: z.boolean().optional().default(true).describe("Stream copy (fast, no re-encode). Set false for frame-precise cuts."),
});

// ── Extract Audio ──

export const ExtractAudioSchema = z.object({
  input: z.string().describe("Input video file path"),
  output: z.string().describe("Output audio file path (extension determines format)"),
  codec: z.string().optional().describe("Audio codec (copy, libmp3lame, aac, flac, pcm_s16le, libopus)"),
  bitrate: z.string().optional().describe("Audio bitrate (e.g. '320k')"),
  sample_rate: z.number().optional().describe("Sample rate in Hz (e.g. 44100, 48000)"),
  track: z.number().optional().default(0).describe("Audio track index (0-based)"),
});

// ── Extract Frames ──

export const ExtractFramesSchema = z.object({
  input: z.string().describe("Input video file path"),
  output_pattern: z.string().describe("Output pattern (e.g. 'frames/frame_%04d.png')"),
  timestamp: z.string().optional().describe("Extract single frame at this timestamp"),
  fps: z.string().optional().describe("Frames per second to extract (e.g. '1', '1/5' for 1 every 5 sec)"),
  quality: z.number().min(1).max(31).optional().describe("JPEG quality (1=best, 31=worst)"),
});

// ── Thumbnail ──

export const ThumbnailSchema = z.object({
  input: z.string().describe("Input video file path"),
  output: z.string().describe("Output image path (jpg, png, webp)"),
  timestamp: z.string().optional().default("00:00:01").describe("Timestamp to capture"),
  width: z.number().optional().describe("Output width (height auto-calculated)"),
  smart: z.boolean().optional().default(false).describe("Use thumbnail filter for best frame selection"),
});

// ── Resize ──

export const ResizeSchema = z.object({
  input: z.string().describe("Input file path"),
  output: z.string().describe("Output file path"),
  width: z.number().optional().describe("Target width (-1 for auto)"),
  height: z.number().optional().describe("Target height (-1 for auto)"),
  scale: z.string().optional().describe("Scale expression (e.g. '1920:1080', 'iw/2:ih/2')"),
  algorithm: z.enum(["lanczos", "bicubic", "bilinear", "neighbor", "area"]).optional().default("lanczos"),
  letterbox: z.boolean().optional().default(false).describe("Add black bars to maintain aspect ratio"),
  video_codec: z.string().optional(),
  gpu: z.boolean().optional().default(false).describe("Use CUDA scale filter"),
});

// ── Concat ──

export const ConcatSchema = z.object({
  inputs: z.array(z.string()).min(2).describe("List of input file paths"),
  output: z.string().describe("Output file path"),
  copy: z.boolean().optional().default(true).describe("Stream copy (files must have same codec/resolution)"),
  transition: z.string().optional().describe("Crossfade transition type (fade, wipeleft, dissolve, etc.)"),
  transition_duration: z.number().optional().default(1).describe("Transition duration in seconds"),
});

// ── Watermark ──

export const WatermarkSchema = z.object({
  input: z.string().describe("Input video file path"),
  watermark: z.string().describe("Watermark image file path"),
  output: z.string().describe("Output file path"),
  position: z.enum(["top-left", "top-right", "bottom-left", "bottom-right", "center"]).optional().default("bottom-right"),
  margin: z.number().optional().default(10).describe("Margin in pixels from the edge"),
  opacity: z.number().min(0).max(1).optional().default(1).describe("Watermark opacity (0-1)"),
  scale: z.number().optional().describe("Scale watermark relative to video width (e.g. 0.1 = 10%)"),
});

// ── Drawtext ──

export const DrawtextSchema = z.object({
  input: z.string().describe("Input video file path"),
  output: z.string().describe("Output file path"),
  text: z.string().describe("Text to overlay"),
  font_file: z.string().optional().describe("Path to TTF/OTF font file"),
  font_size: z.number().optional().default(48),
  font_color: z.string().optional().default("white"),
  x: z.string().optional().default("(w-text_w)/2").describe("X position expression"),
  y: z.string().optional().default("(h-text_h)/2").describe("Y position expression"),
  box: z.boolean().optional().default(false).describe("Draw background box"),
  box_color: z.string().optional().default("black@0.5"),
  box_border: z.number().optional().default(10),
  shadow_color: z.string().optional(),
  shadow_x: z.number().optional(),
  shadow_y: z.number().optional(),
  enable: z.string().optional().describe("Enable expression (e.g. 'between(t,2,5)')"),
});

// ── GIF ──

export const GifSchema = z.object({
  input: z.string().describe("Input video file path"),
  output: z.string().describe("Output GIF file path"),
  start: z.string().optional().describe("Start timestamp"),
  duration: z.number().optional().default(3).describe("Duration in seconds"),
  fps: z.number().optional().default(15).describe("Frames per second"),
  width: z.number().optional().default(480).describe("Output width"),
  high_quality: z.boolean().optional().default(true).describe("Use palettegen for better colors"),
});

// ── Normalize Audio ──

export const NormalizeAudioSchema = z.object({
  input: z.string().describe("Input file path"),
  output: z.string().describe("Output file path"),
  target_lufs: z.number().optional().default(-16).describe("Target integrated loudness (LUFS)"),
  target_lra: z.number().optional().default(11).describe("Target loudness range"),
  target_tp: z.number().optional().default(-1.5).describe("Target true peak (dB)"),
});

// ── Speed Change ──

export const SpeedSchema = z.object({
  input: z.string().describe("Input file path"),
  output: z.string().describe("Output file path"),
  speed: z.number().min(0.25).max(4).describe("Speed multiplier (0.5 = half speed, 2 = double)"),
  adjust_audio: z.boolean().optional().default(true).describe("Adjust audio speed (atempo)"),
});

// ── Subtitles ──

export const BurnSubtitlesSchema = z.object({
  input: z.string().describe("Input video file path"),
  output: z.string().describe("Output file path"),
  subtitle_file: z.string().describe("Subtitle file path (SRT, ASS, VTT)"),
  font_name: z.string().optional(),
  font_size: z.number().optional(),
  primary_color: z.string().optional().describe("ASS color format (e.g. '&HFFFFFF&')"),
  stream_index: z.number().optional().describe("Subtitle stream index (for embedded subs in MKV)"),
});

// ── Streaming ──

export const StreamSchema = z.object({
  input: z.string().describe("Input file path or device"),
  url: z.string().describe("RTMP/SRT/HLS output URL"),
  video_codec: z.string().optional().default("libx264"),
  audio_codec: z.string().optional().default("aac"),
  bitrate_video: z.string().optional().default("6000k"),
  bitrate_audio: z.string().optional().default("160k"),
  preset: z.string().optional().default("veryfast"),
  tune: z.string().optional(),
  framerate: z.number().optional(),
  resolution: z.string().optional(),
  gpu: z.boolean().optional().default(false),
  extra_args: z.array(z.string()).optional(),
});

// ── HLS Generation ──

export const HlsSchema = z.object({
  input: z.string().describe("Input file path"),
  output_dir: z.string().describe("Output directory for segments and playlist"),
  segment_duration: z.number().optional().default(6).describe("Segment duration in seconds"),
  playlist_name: z.string().optional().default("stream.m3u8"),
  video_codec: z.string().optional().default("libx264"),
  audio_codec: z.string().optional().default("aac"),
  bitrate_video: z.string().optional(),
  resolution: z.string().optional(),
  gpu: z.boolean().optional().default(false),
});

// ── Chromakey ──

export const ChromakeySchema = z.object({
  foreground: z.string().describe("Foreground video with green/blue screen"),
  background: z.string().describe("Background video or image"),
  output: z.string().describe("Output file path"),
  color: z.string().optional().default("0x00FF00").describe("Key color hex (default: green)"),
  similarity: z.number().min(0).max(1).optional().default(0.1),
  blend: z.number().min(0).max(1).optional().default(0.2),
});

// ── Compose (PiP, side-by-side, mosaic) ──

export const ComposeSchema = z.object({
  inputs: z.array(z.string()).min(2).describe("Input file paths"),
  output: z.string().describe("Output file path"),
  layout: z.enum(["pip", "hstack", "vstack", "grid"]).describe("Layout mode"),
  pip_scale: z.number().optional().default(0.25).describe("PiP video scale relative to main"),
  pip_position: z.enum(["top-left", "top-right", "bottom-left", "bottom-right"]).optional().default("bottom-right"),
  pip_margin: z.number().optional().default(10),
});

// ── Raw FFmpeg ──

export const RawFfmpegSchema = z.object({
  args: z.array(z.string()).min(1).describe("FFmpeg CLI arguments (without 'ffmpeg' prefix)"),
  timeout_ms: z.number().optional().describe("Custom timeout in milliseconds"),
});

// ── Raw FFprobe ──

export const RawFfprobeSchema = z.object({
  args: z.array(z.string()).min(1).describe("FFprobe CLI arguments (without 'ffprobe' prefix)"),
});
