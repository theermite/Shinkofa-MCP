import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DockerClient } from "../lib/client.js";
import { toolResult } from "../lib/utils.js";
import { z } from "zod";

export function registerResourceTools(server: McpServer, client: DockerClient): void {
  // Volumes
  server.tool("list_volumes", "List volumes", { filters: z.string().optional() }, async (p) => {
    return toolResult(await client.callApi("GET", "/volumes", undefined, p.filters ? { filters: p.filters } : undefined));
  });
  server.tool("create_volume", "Create a volume", { Name: z.string().optional(), Driver: z.string().optional(), DriverOpts: z.record(z.string()).optional(), Labels: z.record(z.string()).optional() }, async (p) => {
    return toolResult(await client.callApi("POST", "/volumes/create", p));
  });
  server.tool("inspect_volume", "Inspect a volume", { name: z.string() }, async (p) => {
    return toolResult(await client.callApi("GET", `/volumes/${p.name}`));
  });
  server.tool("remove_volume", "Remove a volume", { name: z.string(), force: z.boolean().optional() }, async (p) => {
    return toolResult(await client.callApi("DELETE", `/volumes/${p.name}`, undefined, p.force ? { force: p.force } : undefined));
  });
  server.tool("prune_volumes", "Remove unused volumes", { filters: z.string().optional() }, async (p) => {
    return toolResult(await client.callApi("POST", "/volumes/prune", undefined, p.filters ? { filters: p.filters } : undefined));
  });
  // Networks
  server.tool("list_networks", "List networks", { filters: z.string().optional() }, async (p) => {
    return toolResult(await client.callApi("GET", "/networks", undefined, p.filters ? { filters: p.filters } : undefined));
  });
  server.tool("create_network", "Create a network", { Name: z.string(), Driver: z.string().optional(), Internal: z.boolean().optional(), IPAM: z.record(z.unknown()).optional(), Labels: z.record(z.string()).optional() }, async (p) => {
    return toolResult(await client.callApi("POST", "/networks/create", p));
  });
  server.tool("inspect_network", "Inspect a network", { id: z.string() }, async (p) => {
    return toolResult(await client.callApi("GET", `/networks/${p.id}`));
  });
  server.tool("remove_network", "Remove a network", { id: z.string() }, async (p) => {
    return toolResult(await client.callApi("DELETE", `/networks/${p.id}`));
  });
  server.tool("connect_network", "Connect a container to a network", { id: z.string().describe("Network ID"), Container: z.string(), EndpointConfig: z.record(z.unknown()).optional() }, async (p) => {
    const { id, ...body } = p;
    return toolResult(await client.callApi("POST", `/networks/${id}/connect`, body));
  });
  server.tool("disconnect_network", "Disconnect a container from a network", { id: z.string().describe("Network ID"), Container: z.string(), Force: z.boolean().optional() }, async (p) => {
    const { id, ...body } = p;
    return toolResult(await client.callApi("POST", `/networks/${id}/disconnect`, body));
  });
  server.tool("prune_networks", "Remove unused networks", { filters: z.string().optional() }, async (p) => {
    return toolResult(await client.callApi("POST", "/networks/prune", undefined, p.filters ? { filters: p.filters } : undefined));
  });
}
