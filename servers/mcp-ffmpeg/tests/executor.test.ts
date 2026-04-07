import { describe, it, expect, vi } from "vitest";
import { buildFfmpegArgs, createConfig } from "../src/lib/executor.js";

describe("createConfig", () => {
  it("should use defaults with empty env", () => {
    const config = createConfig({} as NodeJS.ProcessEnv);
    expect(config.ffmpegPath).toBe("ffmpeg");
    expect(config.ffprobePath).toBe("ffprobe");
    expect(config.timeoutMs).toBe(300_000);
  });

  it("should use env variables", () => {
    const config = createConfig({
      FFMPEG_PATH: "/usr/local/bin/ffmpeg",
      FFPROBE_PATH: "/usr/local/bin/ffprobe",
      FFMPEG_TIMEOUT_MS: "60000",
    } as unknown as NodeJS.ProcessEnv);
    expect(config.ffmpegPath).toBe("/usr/local/bin/ffmpeg");
    expect(config.ffprobePath).toBe("/usr/local/bin/ffprobe");
    expect(config.timeoutMs).toBe(60_000);
  });
});

describe("buildFfmpegArgs", () => {
  it("should build basic conversion args", () => {
    const args = buildFfmpegArgs({
      inputs: [{ path: "input.mp4" }],
      outputPath: "output.mkv",
      videoCodec: "libx264",
      audioCodec: "aac",
    });
    expect(args).toEqual([
      "-y", "-i", "input.mp4",
      "-c:v", "libx264",
      "-c:a", "aac",
      "output.mkv",
    ]);
  });

  it("should include input options before -i", () => {
    const args = buildFfmpegArgs({
      inputs: [{ path: "input.mp4", options: ["-ss", "00:01:00"] }],
      outputPath: "output.mp4",
    });
    expect(args).toEqual(["-y", "-ss", "00:01:00", "-i", "input.mp4", "output.mp4"]);
  });

  it("should handle multiple inputs", () => {
    const args = buildFfmpegArgs({
      inputs: [
        { path: "video.mp4" },
        { path: "logo.png" },
      ],
      outputPath: "output.mp4",
      complexFilter: "overlay=10:10",
    });
    expect(args).toContain("-i");
    expect(args.indexOf("video.mp4")).toBeLessThan(args.indexOf("logo.png"));
    expect(args).toContain("-filter_complex");
    expect(args).toContain("overlay=10:10");
  });

  it("should add video filters", () => {
    const args = buildFfmpegArgs({
      inputs: [{ path: "input.mp4" }],
      outputPath: "output.mp4",
      videoFilters: ["scale=1920:1080", "fps=30"],
    });
    expect(args).toContain("-vf");
    expect(args).toContain("scale=1920:1080,fps=30");
  });

  it("should skip simple vf when complexFilter is set", () => {
    const args = buildFfmpegArgs({
      inputs: [{ path: "input.mp4" }],
      outputPath: "output.mp4",
      videoFilters: ["scale=1920:1080"],
      complexFilter: "[0:v][1:v]overlay",
    });
    expect(args).not.toContain("-vf");
    expect(args).toContain("-filter_complex");
  });

  it("should add audio filters", () => {
    const args = buildFfmpegArgs({
      inputs: [{ path: "input.mp4" }],
      outputPath: "output.mp4",
      audioFilters: ["loudnorm=I=-16"],
    });
    expect(args).toContain("-af");
    expect(args).toContain("loudnorm=I=-16");
  });

  it("should add maps", () => {
    const args = buildFfmpegArgs({
      inputs: [{ path: "input.mp4" }],
      outputPath: "output.mp4",
      maps: ["[v]", "[a]"],
    });
    expect(args.filter(a => a === "-map").length).toBe(2);
  });

  it("should add format", () => {
    const args = buildFfmpegArgs({
      inputs: [{ path: "input.mp4" }],
      outputPath: "pipe:1",
      format: "flv",
    });
    expect(args).toContain("-f");
    expect(args).toContain("flv");
  });

  it("should add extra args", () => {
    const args = buildFfmpegArgs({
      inputs: [{ path: "input.mp4" }],
      outputPath: "output.mp4",
      extraArgs: ["-crf", "23", "-preset", "medium"],
    });
    expect(args).toContain("-crf");
    expect(args).toContain("23");
    expect(args).toContain("-preset");
    expect(args).toContain("medium");
  });

  it("should not add -y when overwrite is false", () => {
    const args = buildFfmpegArgs({
      inputs: [{ path: "input.mp4" }],
      outputPath: "output.mp4",
      overwrite: false,
    });
    expect(args).not.toContain("-y");
  });

  it("should have output as last argument", () => {
    const args = buildFfmpegArgs({
      inputs: [{ path: "input.mp4" }],
      outputPath: "output.mp4",
      videoCodec: "libx264",
      audioCodec: "aac",
      extraArgs: ["-crf", "20"],
    });
    expect(args[args.length - 1]).toBe("output.mp4");
  });
});
