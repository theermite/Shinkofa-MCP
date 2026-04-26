import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";
import { createConfig, OBSClient } from "../src/lib/client.js";
import { registerFilterTools } from "../src/tools/filters.js";
import { registerGeneralTools } from "../src/tools/general.js";
import { registerInputTools } from "../src/tools/inputs.js";
import { registerSceneTools } from "../src/tools/scenes.js";
import { registerStreamingTools } from "../src/tools/streaming.js";
import { registerTransitionTools } from "../src/tools/transitions.js";

const config = createConfig({});
const obs = new OBSClient(config);

function setup() {
  return new McpServer({ name: "test-obs", version: "1.0.0" });
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

describe("General tool registration", () => {
  it("should_register_12_general_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerGeneralTools(server, obs);
    expect(registered).toEqual([
      "obs-get-version",
      "obs-get-stats",
      "obs-get-video-settings",
      "obs-set-video-settings",
      "obs-get-hotkey-list",
      "obs-trigger-hotkey-by-name",
      "obs-get-profile-list",
      "obs-set-current-profile",
      "obs-get-scene-collection-list",
      "obs-set-current-scene-collection",
      "obs-get-studio-mode",
      "obs-set-studio-mode",
    ]);
    expect(registered).toHaveLength(12);
  });
});

describe("Scene tool registration", () => {
  it("should_register_12_scene_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerSceneTools(server, obs);
    expect(registered).toEqual([
      "obs-get-scene-list",
      "obs-get-current-scene",
      "obs-set-current-scene",
      "obs-create-scene",
      "obs-remove-scene",
      "obs-get-scene-items",
      "obs-get-scene-item-id",
      "obs-get-scene-item-transform",
      "obs-set-scene-item-transform",
      "obs-set-scene-item-enabled",
      "obs-create-scene-item",
      "obs-remove-scene-item",
    ]);
    expect(registered).toHaveLength(12);
  });
});

describe("Input tool registration", () => {
  it("should_register_13_input_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerInputTools(server, obs);
    expect(registered).toEqual([
      "obs-get-input-list",
      "obs-get-input-kind-list",
      "obs-get-input-settings",
      "obs-set-input-settings",
      "obs-create-input",
      "obs-remove-input",
      "obs-set-input-name",
      "obs-get-input-mute",
      "obs-set-input-mute",
      "obs-toggle-input-mute",
      "obs-get-input-volume",
      "obs-set-input-volume",
      "obs-get-special-inputs",
    ]);
    expect(registered).toHaveLength(13);
  });
});

describe("Filter tool registration", () => {
  it("should_register_7_filter_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerFilterTools(server, obs);
    expect(registered).toEqual([
      "obs-get-source-filter-list",
      "obs-get-source-filter",
      "obs-create-source-filter",
      "obs-set-source-filter-settings",
      "obs-set-source-filter-enabled",
      "obs-remove-source-filter",
      "obs-get-filter-kind-list",
    ]);
    expect(registered).toHaveLength(7);
  });
});

describe("Streaming tool registration", () => {
  it("should_register_18_streaming_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerStreamingTools(server, obs);
    expect(registered).toEqual([
      "obs-get-stream-status",
      "obs-start-stream",
      "obs-stop-stream",
      "obs-toggle-stream",
      "obs-get-record-status",
      "obs-start-record",
      "obs-stop-record",
      "obs-toggle-record",
      "obs-toggle-record-pause",
      "obs-get-record-directory",
      "obs-set-record-directory",
      "obs-get-replay-buffer-status",
      "obs-start-replay-buffer",
      "obs-stop-replay-buffer",
      "obs-save-replay-buffer",
      "obs-get-virtual-cam-status",
      "obs-start-virtual-cam",
      "obs-stop-virtual-cam",
    ]);
    expect(registered).toHaveLength(18);
  });
});

describe("Transition tool registration", () => {
  it("should_register_9_transition_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerTransitionTools(server, obs);
    expect(registered).toEqual([
      "obs-get-transition-list",
      "obs-get-current-transition",
      "obs-set-current-transition",
      "obs-set-transition-duration",
      "obs-get-source-screenshot",
      "obs-save-source-screenshot",
      "obs-get-media-input-status",
      "obs-trigger-media-input-action",
      "obs-broadcast-custom-event",
    ]);
    expect(registered).toHaveLength(9);
  });
});

describe("Combined registration", () => {
  it("should_register_71_total_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerGeneralTools(server, obs);
    registerSceneTools(server, obs);
    registerInputTools(server, obs);
    registerFilterTools(server, obs);
    registerStreamingTools(server, obs);
    registerTransitionTools(server, obs);
    expect(registered).toHaveLength(71);
  });
});
