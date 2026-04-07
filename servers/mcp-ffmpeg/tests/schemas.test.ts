import { describe, it, expect } from "vitest";
import {
  ProbeSchema, ConvertSchema, TrimSchema, ExtractAudioSchema,
  ExtractFramesSchema, ThumbnailSchema, ResizeSchema, ConcatSchema,
  WatermarkSchema, DrawtextSchema, GifSchema, NormalizeAudioSchema,
  SpeedSchema, BurnSubtitlesSchema, StreamSchema, HlsSchema,
  ChromakeySchema, ComposeSchema, RawFfmpegSchema, RawFfprobeSchema,
} from "../src/lib/schemas.js";

describe("ProbeSchema", () => {
  it("should accept minimal input", () => {
    expect(ProbeSchema.safeParse({ input: "video.mp4" }).success).toBe(true);
  });

  it("should accept all options", () => {
    expect(ProbeSchema.safeParse({
      input: "video.mp4",
      show_streams: true,
      show_format: true,
      show_chapters: true,
    }).success).toBe(true);
  });
});

describe("ConvertSchema", () => {
  it("should accept basic conversion", () => {
    expect(ConvertSchema.safeParse({
      input: "in.avi",
      output: "out.mp4",
    }).success).toBe(true);
  });

  it("should accept full GPU conversion", () => {
    expect(ConvertSchema.safeParse({
      input: "in.mp4",
      output: "out.mp4",
      video_codec: "h264_nvenc",
      audio_codec: "aac",
      crf: 23,
      preset: "p6",
      tune: "hq",
      pixel_format: "yuv420p",
      resolution: "1920x1080",
      framerate: 60,
      gpu: true,
    }).success).toBe(true);
  });

  it("should reject invalid CRF", () => {
    expect(ConvertSchema.safeParse({
      input: "in.mp4",
      output: "out.mp4",
      crf: 100,
    }).success).toBe(false);
  });
});

describe("TrimSchema", () => {
  it("should accept start and end", () => {
    expect(TrimSchema.safeParse({
      input: "video.mp4",
      output: "clip.mp4",
      start: "00:01:00",
      end: "00:02:00",
    }).success).toBe(true);
  });

  it("should accept start and duration", () => {
    expect(TrimSchema.safeParse({
      input: "video.mp4",
      output: "clip.mp4",
      start: "60",
      duration: "30",
    }).success).toBe(true);
  });
});

describe("ExtractAudioSchema", () => {
  it("should accept minimal", () => {
    expect(ExtractAudioSchema.safeParse({
      input: "video.mp4",
      output: "audio.mp3",
    }).success).toBe(true);
  });

  it("should accept all options", () => {
    expect(ExtractAudioSchema.safeParse({
      input: "video.mp4",
      output: "audio.flac",
      codec: "flac",
      bitrate: "320k",
      sample_rate: 48000,
      track: 1,
    }).success).toBe(true);
  });
});

describe("ThumbnailSchema", () => {
  it("should accept with smart mode", () => {
    expect(ThumbnailSchema.safeParse({
      input: "video.mp4",
      output: "thumb.jpg",
      smart: true,
      width: 320,
    }).success).toBe(true);
  });
});

describe("ResizeSchema", () => {
  it("should accept width and height", () => {
    expect(ResizeSchema.safeParse({
      input: "video.mp4",
      output: "resized.mp4",
      width: 1280,
      height: 720,
    }).success).toBe(true);
  });

  it("should accept scale expression", () => {
    expect(ResizeSchema.safeParse({
      input: "video.mp4",
      output: "resized.mp4",
      scale: "iw/2:ih/2",
    }).success).toBe(true);
  });

  it("should accept letterbox mode", () => {
    expect(ResizeSchema.safeParse({
      input: "video.mp4",
      output: "resized.mp4",
      width: 1920,
      height: 1080,
      letterbox: true,
      algorithm: "lanczos",
    }).success).toBe(true);
  });
});

describe("ConcatSchema", () => {
  it("should accept multiple inputs", () => {
    expect(ConcatSchema.safeParse({
      inputs: ["part1.mp4", "part2.mp4", "part3.mp4"],
      output: "full.mp4",
    }).success).toBe(true);
  });

  it("should reject single input", () => {
    expect(ConcatSchema.safeParse({
      inputs: ["only.mp4"],
      output: "full.mp4",
    }).success).toBe(false);
  });

  it("should accept with transition", () => {
    expect(ConcatSchema.safeParse({
      inputs: ["part1.mp4", "part2.mp4"],
      output: "full.mp4",
      copy: false,
      transition: "fade",
      transition_duration: 2,
    }).success).toBe(true);
  });
});

describe("WatermarkSchema", () => {
  it("should accept with defaults", () => {
    expect(WatermarkSchema.safeParse({
      input: "video.mp4",
      watermark: "logo.png",
      output: "watermarked.mp4",
    }).success).toBe(true);
  });

  it("should accept all options", () => {
    expect(WatermarkSchema.safeParse({
      input: "video.mp4",
      watermark: "logo.png",
      output: "out.mp4",
      position: "top-left",
      margin: 20,
      opacity: 0.7,
      scale: 0.15,
    }).success).toBe(true);
  });
});

describe("DrawtextSchema", () => {
  it("should accept text with defaults", () => {
    expect(DrawtextSchema.safeParse({
      input: "video.mp4",
      output: "out.mp4",
      text: "Hello World",
    }).success).toBe(true);
  });

  it("should accept with shadow and enable", () => {
    expect(DrawtextSchema.safeParse({
      input: "video.mp4",
      output: "out.mp4",
      text: "Title",
      font_size: 64,
      shadow_color: "black",
      shadow_x: 3,
      shadow_y: 3,
      enable: "between(t,2,5)",
    }).success).toBe(true);
  });
});

describe("GifSchema", () => {
  it("should accept with defaults", () => {
    expect(GifSchema.safeParse({
      input: "video.mp4",
      output: "out.gif",
    }).success).toBe(true);
  });
});

describe("NormalizeAudioSchema", () => {
  it("should accept with custom LUFS", () => {
    expect(NormalizeAudioSchema.safeParse({
      input: "audio.mp3",
      output: "normalized.mp3",
      target_lufs: -14,
    }).success).toBe(true);
  });
});

describe("SpeedSchema", () => {
  it("should accept 2x speed", () => {
    expect(SpeedSchema.safeParse({
      input: "video.mp4",
      output: "fast.mp4",
      speed: 2,
    }).success).toBe(true);
  });

  it("should reject speed out of range", () => {
    expect(SpeedSchema.safeParse({
      input: "video.mp4",
      output: "fast.mp4",
      speed: 10,
    }).success).toBe(false);
  });
});

describe("BurnSubtitlesSchema", () => {
  it("should accept external subs", () => {
    expect(BurnSubtitlesSchema.safeParse({
      input: "video.mp4",
      output: "subbed.mp4",
      subtitle_file: "subs.srt",
    }).success).toBe(true);
  });

  it("should accept embedded subs", () => {
    expect(BurnSubtitlesSchema.safeParse({
      input: "video.mkv",
      output: "subbed.mp4",
      subtitle_file: "video.mkv",
      stream_index: 0,
    }).success).toBe(true);
  });
});

describe("StreamSchema", () => {
  it("should accept RTMP push", () => {
    expect(StreamSchema.safeParse({
      input: "video.mp4",
      url: "rtmp://live.twitch.tv/app/KEY",
    }).success).toBe(true);
  });

  it("should accept GPU streaming", () => {
    expect(StreamSchema.safeParse({
      input: "video.mp4",
      url: "rtmp://server/app/key",
      gpu: true,
      video_codec: "h264_nvenc",
      bitrate_video: "8000k",
    }).success).toBe(true);
  });
});

describe("HlsSchema", () => {
  it("should accept basic HLS", () => {
    expect(HlsSchema.safeParse({
      input: "video.mp4",
      output_dir: "/tmp/hls",
    }).success).toBe(true);
  });
});

describe("ChromakeySchema", () => {
  it("should accept green screen", () => {
    expect(ChromakeySchema.safeParse({
      foreground: "greenscreen.mp4",
      background: "bg.mp4",
      output: "composited.mp4",
    }).success).toBe(true);
  });

  it("should accept blue screen with custom params", () => {
    expect(ChromakeySchema.safeParse({
      foreground: "bluescreen.mp4",
      background: "bg.jpg",
      output: "composited.mp4",
      color: "0x0000FF",
      similarity: 0.15,
      blend: 0.1,
    }).success).toBe(true);
  });
});

describe("ComposeSchema", () => {
  it("should accept PiP", () => {
    expect(ComposeSchema.safeParse({
      inputs: ["main.mp4", "cam.mp4"],
      output: "pip.mp4",
      layout: "pip",
    }).success).toBe(true);
  });

  it("should accept grid with 4 inputs", () => {
    expect(ComposeSchema.safeParse({
      inputs: ["v1.mp4", "v2.mp4", "v3.mp4", "v4.mp4"],
      output: "grid.mp4",
      layout: "grid",
    }).success).toBe(true);
  });

  it("should accept hstack", () => {
    expect(ComposeSchema.safeParse({
      inputs: ["left.mp4", "right.mp4"],
      output: "side.mp4",
      layout: "hstack",
    }).success).toBe(true);
  });
});

describe("RawFfmpegSchema", () => {
  it("should accept args array", () => {
    expect(RawFfmpegSchema.safeParse({
      args: ["-y", "-i", "input.mp4", "-c", "copy", "output.mkv"],
    }).success).toBe(true);
  });

  it("should reject empty args", () => {
    expect(RawFfmpegSchema.safeParse({
      args: [],
    }).success).toBe(false);
  });

  it("should accept with timeout", () => {
    expect(RawFfmpegSchema.safeParse({
      args: ["-i", "input.mp4", "output.mp4"],
      timeout_ms: 600000,
    }).success).toBe(true);
  });
});

describe("RawFfprobeSchema", () => {
  it("should accept args", () => {
    expect(RawFfprobeSchema.safeParse({
      args: ["-v", "quiet", "-print_format", "json", "-show_format", "video.mp4"],
    }).success).toBe(true);
  });
});
