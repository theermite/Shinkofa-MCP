#!/usr/bin/env node
/**
 * @shinkofa/mcp-imagemagick — MCP server for ImageMagick.
 *
 * Typed tools for identify, convert, resize, crop, rotate, flip, blur,
 * sharpen, text overlay, composite, batch convert, GIF creation,
 * sprite sheets, color adjustment + raw_magick and raw_identify.
 *
 * Requires ImageMagick 7+ installed (magick command).
 *
 * Usage:
 *   npx @shinkofa/mcp-imagemagick
 *   MAGICK_PATH=/usr/local/bin/magick npx @shinkofa/mcp-imagemagick
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { connectTransport } from "@shinkofa/mcp-shared";
import { ImageMagickRunner } from "./lib/runner.js";
import { registerAdvancedTools } from "./tools/advanced.js";
import { registerBasicTools } from "./tools/basic.js";
import { registerEffectTools } from "./tools/effects.js";

async function main(): Promise<void> {
  const runner = new ImageMagickRunner(
    process.env.MAGICK_PATH,
    process.env.MAGICK_TIMEOUT_MS ? parseInt(process.env.MAGICK_TIMEOUT_MS, 10) : undefined,
  );

  const server = new McpServer({ name: "@shinkofa/mcp-imagemagick", version: "1.0.0" });

  registerBasicTools(server, runner);
  registerEffectTools(server, runner);
  registerAdvancedTools(server, runner);

  await connectTransport(server);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
