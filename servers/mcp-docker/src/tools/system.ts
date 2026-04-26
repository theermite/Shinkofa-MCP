import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DockerClient } from "../lib/client.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerSystemTools(server: McpServer, client: DockerClient): void {
  server.tool("docker_info", "Get Docker system info", {}, async () => {
    return withErrorHandler(() => client.callApi("GET", "/info").then(toolResult));
  });
  server.tool("docker_version", "Get Docker version", {}, async () => {
    return withErrorHandler(() => client.callApi("GET", "/version").then(toolResult));
  });
  server.tool("docker_ping", "Ping Docker daemon", {}, async () => {
    return withErrorHandler(() => client.callApi("GET", "/_ping").then(toolResult));
  });
  server.tool("docker_df", "Get disk usage info", {}, async () => {
    return withErrorHandler(() => client.callApi("GET", "/system/df").then(toolResult));
  });
  server.tool("exec_inspect", "Inspect an exec instance", { id: z.string().describe("Exec ID") }, async (p) => {
    return withErrorHandler(() => client.callApi("GET", `/exec/${p.id}/json`).then(toolResult));
  });
  server.tool(
    "raw_api_call",
    "Call any Docker Engine API endpoint directly. Use for: build, commit, export/import, swarm, services, nodes, tasks, secrets, configs, plugins, distribution.",
    {
      method: z.enum(["GET", "POST", "PUT", "DELETE"]),
      path: z.string(),
      body: z.record(z.unknown()).optional(),
      query: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
    },
    async (params) => {
      return withErrorHandler(() =>
        client
          .callApi(
            params.method,
            params.path,
            params.body ?? undefined,
            params.query as Record<string, string | number | boolean | undefined> | undefined,
          )
          .then(toolResult),
      );
    },
  );
}
