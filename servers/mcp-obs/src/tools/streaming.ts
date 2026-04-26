/**
 * Streaming tools — stream, record, replay buffer, virtual camera.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OBSClient } from "../lib/client.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerStreamingTools(server: McpServer, obs: OBSClient): void {
  // ===== Streaming =====

  server.tool("obs-get-stream-status", "Get streaming status", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetStreamStatus")));
  });

  server.tool("obs-start-stream", "Start streaming", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("StartStream")));
  });

  server.tool("obs-stop-stream", "Stop streaming", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("StopStream")));
  });

  server.tool("obs-toggle-stream", "Toggle streaming on/off", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("ToggleStream")));
  });

  // ===== Recording =====

  server.tool("obs-get-record-status", "Get recording status", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetRecordStatus")));
  });

  server.tool("obs-start-record", "Start recording", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("StartRecord")));
  });

  server.tool("obs-stop-record", "Stop recording", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("StopRecord")));
  });

  server.tool("obs-toggle-record", "Toggle recording on/off", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("ToggleRecord")));
  });

  server.tool("obs-toggle-record-pause", "Toggle record pause", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("ToggleRecordPause")));
  });

  server.tool("obs-get-record-directory", "Get recording output directory", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetRecordDirectory")));
  });

  server.tool(
    "obs-set-record-directory",
    "Set recording output directory",
    {
      recordDirectory: z.string(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("SetRecordDirectory", args)));
    },
  );

  // ===== Replay Buffer =====

  server.tool("obs-get-replay-buffer-status", "Get replay buffer status", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetReplayBufferStatus")));
  });

  server.tool("obs-start-replay-buffer", "Start replay buffer", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("StartReplayBuffer")));
  });

  server.tool("obs-stop-replay-buffer", "Stop replay buffer", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("StopReplayBuffer")));
  });

  server.tool("obs-save-replay-buffer", "Save current replay buffer", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("SaveReplayBuffer")));
  });

  // ===== Virtual Camera =====

  server.tool("obs-get-virtual-cam-status", "Get virtual camera status", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetVirtualCamStatus")));
  });

  server.tool("obs-start-virtual-cam", "Start virtual camera", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("StartVirtualCam")));
  });

  server.tool("obs-stop-virtual-cam", "Stop virtual camera", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("StopVirtualCam")));
  });
}
