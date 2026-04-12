import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DockerClient } from "../lib/client.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";
import { z } from "zod";

export function registerImageTools(server: McpServer, client: DockerClient): void {
  server.tool("list_images", "List images", { all: z.boolean().optional(), filters: z.string().optional(), digests: z.boolean().optional() }, async (p) => {
    return withErrorHandler(() => client.callApi("GET", "/images/json", undefined, p as Record<string, string | number | boolean | undefined>).then(toolResult));
  });
  server.tool("inspect_image", "Inspect an image", { name: z.string().describe("Image name or ID") }, async (p) => {
    return withErrorHandler(() => client.callApi("GET", `/images/${encodeURIComponent(p.name)}/json`).then(toolResult));
  });
  server.tool("pull_image", "Pull an image from a registry", { fromImage: z.string().describe("Image name (e.g. 'nginx', 'ubuntu:22.04')"), tag: z.string().optional().describe("Tag (default: latest)") }, async (p) => {
    return withErrorHandler(() => client.callApi("POST", "/images/create", undefined, { fromImage: p.fromImage, tag: p.tag ?? "latest" }).then(toolResult));
  });
  server.tool("remove_image", "Remove an image", { name: z.string(), force: z.boolean().optional(), noprune: z.boolean().optional() }, async (p) => {
    const { name, ...query } = p;
    return withErrorHandler(() => client.callApi("DELETE", `/images/${encodeURIComponent(name)}`, undefined, query as Record<string, string | number | boolean | undefined>).then(toolResult));
  });
  server.tool("tag_image", "Tag an image", { name: z.string().describe("Source image"), repo: z.string().describe("Target repository"), tag: z.string().optional() }, async (p) => {
    const { name, ...query } = p;
    return withErrorHandler(() => client.callApi("POST", `/images/${encodeURIComponent(name)}/tag`, undefined, query as Record<string, string | number | boolean | undefined>).then(toolResult));
  });
  server.tool("search_images", "Search Docker Hub", { term: z.string(), limit: z.number().optional(), filters: z.string().optional() }, async (p) => {
    return withErrorHandler(() => client.callApi("GET", "/images/search", undefined, p as Record<string, string | number | boolean | undefined>).then(toolResult));
  });
  server.tool("image_history", "Get image layer history", { name: z.string() }, async (p) => {
    return withErrorHandler(() => client.callApi("GET", `/images/${encodeURIComponent(p.name)}/history`).then(toolResult));
  });
  server.tool("prune_images", "Remove unused images", { filters: z.string().optional().describe("JSON filters e.g. {\"dangling\":[\"true\"]}") }, async (p) => {
    return withErrorHandler(() => client.callApi("POST", "/images/prune", undefined, p.filters ? { filters: p.filters } : undefined).then(toolResult));
  });
}
