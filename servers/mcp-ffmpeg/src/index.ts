#!/usr/bin/env node
/**
 * @shinkofa/mcp-ffmpeg — MCP server for FFmpeg/FFprobe.
 *
 * Provides typed tools for common video/audio operations + raw_ffmpeg/raw_ffprobe for 100% coverage.
 *
 * Environment variables:
 *   FFMPEG_PATH      — Path to ffmpeg binary (default: "ffmpeg")
 *   FFPROBE_PATH     — Path to ffprobe binary (default: "ffprobe")
 *   FFMPEG_TIMEOUT_MS — Process timeout in ms (default: 300000 = 5 min)
 *
 * Usage in Claude Code:
 *   {
 *     "mcpServers": {
 *       "ffmpeg": {
 *         "command": "node",
 *         "args": ["path/to/dist/index.js"]
 *       }
 *     }
 *   }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { checkBinaryExists, createConfig } from "./lib/executor.js";
import { registerAudioTools } from "./tools/audio.js";
import { registerComposeTools } from "./tools/compose.js";
import { registerConvertTools } from "./tools/convert.js";
import { registerEditTools } from "./tools/edit.js";
import { registerExtractTools } from "./tools/extract.js";
import { registerProbeTools } from "./tools/probe.js";
import { registerRawTools } from "./tools/raw.js";
import { registerStreamingTools } from "./tools/streaming.js";

async function main(): Promise<void> {
  const config = createConfig(process.env);

  // Verify binaries exist
  const ffmpegOk = await checkBinaryExists(config.ffmpegPath);
  if (!ffmpegOk) {
    console.error(`Error: FFmpeg not found at "${config.ffmpegPath}". Install FFmpeg or set FFMPEG_PATH.`);
    process.exit(1);
  }

  const ffprobeOk = await checkBinaryExists(config.ffprobePath);
  if (!ffprobeOk) {
    console.error(`Warning: FFprobe not found at "${config.ffprobePath}". Probe tools will fail.`);
  }

  const server = new McpServer({
    name: "@shinkofa/mcp-ffmpeg",
    version: "1.0.0",
  });

  // Register all tool groups
  registerProbeTools(server, config);
  registerConvertTools(server, config);
  registerEditTools(server, config);
  registerComposeTools(server, config);
  registerExtractTools(server, config);
  registerAudioTools(server, config);
  registerStreamingTools(server, config);
  registerRawTools(server, config);

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
