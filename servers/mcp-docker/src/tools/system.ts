import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DockerClient, DockerError } from "../lib/client.js";
import { toolResult, toolError } from "../lib/utils.js";
import { z } from "zod";

export function registerSystemTools(server: McpServer, client: DockerClient): void {
  server.tool("docker_info", "Get Docker system info", {}, async () => { return toolResult(await client.callApi("GET", "/info")); });
  server.tool("docker_version", "Get Docker version", {}, async () => { return toolResult(await client.callApi("GET", "/version")); });
  server.tool("docker_ping", "Ping Docker daemon", {}, async () => { return toolResult(await client.callApi("GET", "/_ping")); });
  server.tool("docker_df", "Get disk usage info", {}, async () => { return toolResult(await client.callApi("GET", "/system/df")); });
  server.tool("exec_inspect", "Inspect an exec instance", { id: z.string().describe("Exec ID") }, async (p) => { return toolResult(await client.callApi("GET", `/exec/${p.id}/json`)); });

  server.tool("raw_api_call", "Call any Docker Engine API endpoint directly. Use for: build, commit, export/import, swarm, services, nodes, tasks, secrets, configs, plugins, distribution.", { method: z.enum(["GET", "POST", "PUT", "DELETE"]), path: z.string(), body: z.record(z.unknown()).optional(), query: z.record(z.union([z.string(), z.number(), z.boolean()])).optional() }, async (params) => {
    try {
      return toolResult(await client.callApi(params.method, params.path, params.body ?? undefined, params.query as Record<string, string | number | boolean | undefined> | undefined));
    } catch (error) {
      if (error instanceof DockerError) return toolError(`Docker error ${error.status}: ${error.description}`);
      throw error;
    }
  });
}
