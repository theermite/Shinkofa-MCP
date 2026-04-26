import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";
import { createConfig } from "../src/lib/executor.js";
import { registerAudioTools } from "../src/tools/audio.js";
import { registerComposeTools } from "../src/tools/compose.js";
import { registerConvertTools } from "../src/tools/convert.js";
import { registerEditTools } from "../src/tools/edit.js";
import { registerExtractTools } from "../src/tools/extract.js";
import { registerProbeTools } from "../src/tools/probe.js";
import { registerRawTools } from "../src/tools/raw.js";
import { registerStreamingTools } from "../src/tools/streaming.js";

const config = createConfig({});

function setup() {
  const server = new McpServer({ name: "test-ffmpeg", version: "1.0.0" });
  return server;
}

function trackTools(server: McpServer) {
  const registered: string[] = [];
  const origTool = server.tool.bind(server);
  server.tool = ((name: string, ...args: unknown[]) => {
    registered.push(name);
    return origTool(name, ...args);
  }) as typeof server.tool;
  return registered;
}

describe("Probe tool registration", () => {
  it("should_register_1_probe_tool", () => {
    const server = setup();
    const registered = trackTools(server);
    registerProbeTools(server, config);
    expect(registered).toEqual(["probe"]);
  });
});

describe("Convert tool registration", () => {
  it("should_register_1_convert_tool", () => {
    const server = setup();
    const registered = trackTools(server);
    registerConvertTools(server, config);
    expect(registered).toEqual(["convert"]);
  });
});

describe("Edit tool registration", () => {
  it("should_register_4_edit_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerEditTools(server, config);
    expect(registered).toEqual(["trim", "resize", "speed", "concat"]);
    expect(registered).toHaveLength(4);
  });
});

describe("Compose tool registration", () => {
  it("should_register_4_compose_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerComposeTools(server, config);
    expect(registered).toEqual(["watermark", "drawtext", "chromakey", "compose"]);
    expect(registered).toHaveLength(4);
  });
});

describe("Extract tool registration", () => {
  it("should_register_4_extract_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerExtractTools(server, config);
    expect(registered).toEqual(["extract_audio", "extract_frames", "thumbnail", "burn_subtitles"]);
    expect(registered).toHaveLength(4);
  });
});

describe("Audio tool registration", () => {
  it("should_register_2_audio_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerAudioTools(server, config);
    expect(registered).toEqual(["normalize_audio", "create_gif"]);
    expect(registered).toHaveLength(2);
  });
});

describe("Streaming tool registration", () => {
  it("should_register_2_streaming_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerStreamingTools(server, config);
    expect(registered).toEqual(["stream_push", "generate_hls"]);
    expect(registered).toHaveLength(2);
  });
});

describe("Raw tool registration", () => {
  it("should_register_2_raw_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerRawTools(server, config);
    expect(registered).toEqual(["raw_ffmpeg", "raw_ffprobe"]);
    expect(registered).toHaveLength(2);
  });
});

describe("Combined registration", () => {
  it("should_register_20_total_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerProbeTools(server, config);
    registerConvertTools(server, config);
    registerEditTools(server, config);
    registerComposeTools(server, config);
    registerExtractTools(server, config);
    registerAudioTools(server, config);
    registerStreamingTools(server, config);
    registerRawTools(server, config);
    expect(registered).toHaveLength(20);
  });
});
