import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YouTubeClient, YouTubeError } from "../src/lib/client.js";
import { registerChannelTools } from "../src/tools/channels.js";

let server: McpServer;
let client: YouTubeClient;
let callApiSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: any[]) => any>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new YouTubeClient({ apiKey: "test_key" });
  callApiSpy = vi.spyOn(client, "callApi").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as any);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerChannelTools(server, client);
});

describe("Channel tools — callbacks", () => {
  it("should_list_channels", async () => {
    const cb = registeredTools.get("list_channels")!;
    await cb({ part: "snippet", forHandle: "@test" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/channels", undefined, { part: "snippet", forHandle: "@test" });
  });

  it("should_update_channel_with_default_part", async () => {
    const cb = registeredTools.get("update_channel")!;
    await cb({ id: "ch1", snippet: { title: "New" } });
    expect(callApiSpy).toHaveBeenCalledWith("PUT", "/channels", { id: "ch1", snippet: { title: "New" } }, { part: "snippet,brandingSettings" });
  });

  it("should_update_channel_with_custom_part", async () => {
    const cb = registeredTools.get("update_channel")!;
    await cb({ id: "ch1", part: "snippet", snippet: { title: "T" } });
    expect(callApiSpy).toHaveBeenCalledWith("PUT", "/channels", { id: "ch1", snippet: { title: "T" } }, { part: "snippet" });
  });
});

describe("Playlist tools — callbacks", () => {
  it("should_list_playlists", async () => {
    const cb = registeredTools.get("list_playlists")!;
    await cb({ part: "snippet", mine: true });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/playlists", undefined, { part: "snippet", mine: true });
  });

  it("should_create_playlist_with_default_part", async () => {
    const cb = registeredTools.get("create_playlist")!;
    await cb({ snippet: { title: "My Playlist" } });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/playlists", { snippet: { title: "My Playlist" } }, { part: "snippet,status" });
  });

  it("should_update_playlist", async () => {
    const cb = registeredTools.get("update_playlist")!;
    await cb({ id: "pl1", snippet: { title: "Updated" } });
    expect(callApiSpy).toHaveBeenCalledWith("PUT", "/playlists", { id: "pl1", snippet: { title: "Updated" } }, { part: "snippet,status" });
  });

  it("should_delete_playlist", async () => {
    const cb = registeredTools.get("delete_playlist")!;
    await cb({ id: "pl1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/playlists", undefined, { id: "pl1" });
  });
});

describe("PlaylistItem tools — callbacks", () => {
  it("should_list_playlist_items", async () => {
    const cb = registeredTools.get("list_playlist_items")!;
    await cb({ part: "snippet", playlistId: "pl1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/playlistItems", undefined, { part: "snippet", playlistId: "pl1" });
  });

  it("should_add_to_playlist", async () => {
    const cb = registeredTools.get("add_to_playlist")!;
    await cb({ snippet: { playlistId: "pl1", resourceId: { kind: "youtube#video", videoId: "v1" } } });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/playlistItems", { snippet: { playlistId: "pl1", resourceId: { kind: "youtube#video", videoId: "v1" } } }, { part: "snippet" });
  });

  it("should_update_playlist_item", async () => {
    const cb = registeredTools.get("update_playlist_item")!;
    await cb({ id: "pi1", snippet: { playlistId: "pl1", resourceId: { kind: "youtube#video" }, position: 0 } });
    expect(callApiSpy).toHaveBeenCalledWith("PUT", "/playlistItems", { id: "pi1", snippet: { playlistId: "pl1", resourceId: { kind: "youtube#video" }, position: 0 } }, { part: "snippet" });
  });

  it("should_remove_from_playlist", async () => {
    const cb = registeredTools.get("remove_from_playlist")!;
    await cb({ id: "pi1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/playlistItems", undefined, { id: "pi1" });
  });
});

describe("Channel tools — error handling", () => {
  it("should_return_toolError_on_YouTubeError", async () => {
    callApiSpy.mockRejectedValueOnce(new YouTubeError(403, "Forbidden"));
    const cb = registeredTools.get("list_channels")!;
    const result = await cb({ part: "snippet" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("403");
  });

  it("should_return_toolError_on_TypeError", async () => {
    callApiSpy.mockRejectedValueOnce(new TypeError("fetch failed"));
    const cb = registeredTools.get("create_playlist")!;
    const result = await cb({ snippet: { title: "T" } });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network error");
  });

  it("should_rethrow_unknown_errors", async () => {
    callApiSpy.mockRejectedValueOnce(42);
    const cb = registeredTools.get("list_playlists")!;
    await expect(cb({ part: "snippet" })).rejects.toBe(42);
  });
});
