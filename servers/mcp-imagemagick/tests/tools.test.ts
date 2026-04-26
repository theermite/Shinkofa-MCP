import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";
import { ImageMagickRunner } from "../src/lib/runner.js";
import { registerAdvancedTools } from "../src/tools/advanced.js";
import { registerBasicTools } from "../src/tools/basic.js";
import { registerEffectTools } from "../src/tools/effects.js";

function setup() {
  const runner = new ImageMagickRunner();
  const server = new McpServer({ name: "test-imagemagick", version: "1.0.0" });
  return { runner, server };
}

describe("Basic tool registration", () => {
  it("should_register_9_basic_tools_without_throwing", () => {
    const { server, runner } = setup();
    expect(() => registerBasicTools(server, runner)).not.toThrow();
  });

  it("should_register_all_expected_basic_tool_names", () => {
    const { server, runner } = setup();
    const registered: string[] = [];
    const origTool = server.tool.bind(server);
    server.tool = ((name: string, ...args: unknown[]) => {
      registered.push(name);
      return origTool(name, ...args);
    }) as typeof server.tool;
    registerBasicTools(server, runner);
    expect(registered).toEqual([
      "identify",
      "convert",
      "resize_image",
      "crop_image",
      "rotate_image",
      "flip_image",
      "create_thumbnail",
      "strip_metadata",
      "optimize_image",
    ]);
    expect(registered).toHaveLength(9);
  });
});

describe("Effect tool registration", () => {
  it("should_register_5_effect_tools_without_throwing", () => {
    const { server, runner } = setup();
    expect(() => registerEffectTools(server, runner)).not.toThrow();
  });

  it("should_register_all_expected_effect_tool_names", () => {
    const { server, runner } = setup();
    const registered: string[] = [];
    const origTool = server.tool.bind(server);
    server.tool = ((name: string, ...args: unknown[]) => {
      registered.push(name);
      return origTool(name, ...args);
    }) as typeof server.tool;
    registerEffectTools(server, runner);
    expect(registered).toEqual(["blur_image", "sharpen_image", "adjust_colors", "add_border", "add_shadow"]);
    expect(registered).toHaveLength(5);
  });
});

describe("Advanced tool registration", () => {
  it("should_register_7_advanced_tools_without_throwing", () => {
    const { server, runner } = setup();
    expect(() => registerAdvancedTools(server, runner)).not.toThrow();
  });

  it("should_register_all_expected_advanced_tool_names", () => {
    const { server, runner } = setup();
    const registered: string[] = [];
    const origTool = server.tool.bind(server);
    server.tool = ((name: string, ...args: unknown[]) => {
      registered.push(name);
      return origTool(name, ...args);
    }) as typeof server.tool;
    registerAdvancedTools(server, runner);
    expect(registered).toEqual([
      "text_overlay",
      "composite_images",
      "batch_convert",
      "create_gif",
      "create_sprite_sheet",
      "raw_magick",
      "raw_identify",
    ]);
    expect(registered).toHaveLength(7);
  });
});

describe("Combined registration", () => {
  it("should_register_21_total_tools", () => {
    const { server, runner } = setup();
    const registered: string[] = [];
    const origTool = server.tool.bind(server);
    server.tool = ((name: string, ...args: unknown[]) => {
      registered.push(name);
      return origTool(name, ...args);
    }) as typeof server.tool;
    registerBasicTools(server, runner);
    registerEffectTools(server, runner);
    registerAdvancedTools(server, runner);
    expect(registered).toHaveLength(21);
  });
});
