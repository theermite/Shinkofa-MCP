import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DockerClient } from "../lib/client.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

const Id = z.string().describe("Container ID or name");
const Filters = z.string().optional().describe("JSON filters");

export function registerContainerTools(server: McpServer, client: DockerClient): void {
  server.tool(
    "list_containers",
    "List containers",
    { all: z.boolean().optional(), limit: z.number().optional(), size: z.boolean().optional(), filters: Filters },
    async (p) => {
      return withErrorHandler(() =>
        client
          .callApi("GET", "/containers/json", undefined, p as Record<string, string | number | boolean | undefined>)
          .then(toolResult),
      );
    },
  );
  server.tool(
    "create_container",
    "Create a container",
    {
      name: z.string().optional().describe("Container name"),
      Image: z.string().describe("Image to use"),
      Cmd: z.array(z.string()).optional(),
      Env: z.array(z.string()).optional(),
      ExposedPorts: z.record(z.unknown()).optional(),
      HostConfig: z.record(z.unknown()).optional(),
      Labels: z.record(z.string()).optional(),
      WorkingDir: z.string().optional(),
      Volumes: z.record(z.unknown()).optional(),
      NetworkingConfig: z.record(z.unknown()).optional(),
    },
    async (p) => {
      const { name, ...body } = p;
      return withErrorHandler(() =>
        client.callApi("POST", "/containers/create", body, name ? { name } : undefined).then(toolResult),
      );
    },
  );
  server.tool("inspect_container", "Inspect a container", { id: Id, size: z.boolean().optional() }, async (p) => {
    return withErrorHandler(() =>
      client
        .callApi("GET", `/containers/${p.id}/json`, undefined, p.size ? { size: p.size } : undefined)
        .then(toolResult),
    );
  });
  server.tool("start_container", "Start a container", { id: Id }, async (p) => {
    return withErrorHandler(() => client.callApi("POST", `/containers/${p.id}/start`).then(toolResult));
  });
  server.tool(
    "stop_container",
    "Stop a container",
    { id: Id, t: z.number().optional().describe("Seconds to wait before killing") },
    async (p) => {
      return withErrorHandler(() =>
        client.callApi("POST", `/containers/${p.id}/stop`, undefined, p.t ? { t: p.t } : undefined).then(toolResult),
      );
    },
  );
  server.tool("restart_container", "Restart a container", { id: Id, t: z.number().optional() }, async (p) => {
    return withErrorHandler(() =>
      client.callApi("POST", `/containers/${p.id}/restart`, undefined, p.t ? { t: p.t } : undefined).then(toolResult),
    );
  });
  server.tool(
    "kill_container",
    "Kill a container",
    { id: Id, signal: z.string().optional().describe("Signal (default SIGKILL)") },
    async (p) => {
      return withErrorHandler(() =>
        client
          .callApi("POST", `/containers/${p.id}/kill`, undefined, p.signal ? { signal: p.signal } : undefined)
          .then(toolResult),
      );
    },
  );
  server.tool(
    "remove_container",
    "Remove a container",
    { id: Id, v: z.boolean().optional().describe("Remove volumes"), force: z.boolean().optional() },
    async (p) => {
      const { id, ...query } = p;
      return withErrorHandler(() =>
        client
          .callApi(
            "DELETE",
            `/containers/${id}`,
            undefined,
            query as Record<string, string | number | boolean | undefined>,
          )
          .then(toolResult),
      );
    },
  );
  server.tool(
    "container_logs",
    "Get container logs",
    {
      id: Id,
      stdout: z.boolean().optional(),
      stderr: z.boolean().optional(),
      since: z.number().optional(),
      until: z.number().optional(),
      timestamps: z.boolean().optional(),
      tail: z.string().optional().describe("Number of lines from end (or 'all')"),
    },
    async (p) => {
      const { id, stdout, stderr, ...rest } = p;
      const q = { stdout: stdout ?? true, stderr: stderr ?? true, ...rest };
      return withErrorHandler(() =>
        client
          .callApi(
            "GET",
            `/containers/${id}/logs`,
            undefined,
            q as Record<string, string | number | boolean | undefined>,
          )
          .then(toolResult),
      );
    },
  );
  server.tool("container_stats", "Get container resource stats (one-shot)", { id: Id }, async (p) => {
    return withErrorHandler(() =>
      client.callApi("GET", `/containers/${p.id}/stats`, undefined, { stream: false }).then(toolResult),
    );
  });
  server.tool(
    "container_top",
    "List processes in a container",
    { id: Id, ps_args: z.string().optional() },
    async (p) => {
      return withErrorHandler(() =>
        client
          .callApi("GET", `/containers/${p.id}/top`, undefined, p.ps_args ? { ps_args: p.ps_args } : undefined)
          .then(toolResult),
      );
    },
  );
  server.tool(
    "rename_container",
    "Rename a container",
    { id: Id, name: z.string().describe("New name") },
    async (p) => {
      return withErrorHandler(() =>
        client.callApi("POST", `/containers/${p.id}/rename`, undefined, { name: p.name }).then(toolResult),
      );
    },
  );
  server.tool("pause_container", "Pause a container", { id: Id }, async (p) => {
    return withErrorHandler(() => client.callApi("POST", `/containers/${p.id}/pause`).then(toolResult));
  });
  server.tool("unpause_container", "Unpause a container", { id: Id }, async (p) => {
    return withErrorHandler(() => client.callApi("POST", `/containers/${p.id}/unpause`).then(toolResult));
  });
  server.tool("wait_container", "Wait for a container to stop", { id: Id }, async (p) => {
    return withErrorHandler(() => client.callApi("POST", `/containers/${p.id}/wait`).then(toolResult));
  });
  server.tool(
    "update_container",
    "Update container config (resources, restart policy)",
    {
      id: Id,
      RestartPolicy: z.record(z.unknown()).optional(),
      Memory: z.number().optional(),
      CpuShares: z.number().optional(),
      CpuQuota: z.number().optional(),
    },
    async (p) => {
      const { id, ...body } = p;
      return withErrorHandler(() => client.callApi("POST", `/containers/${id}/update`, body).then(toolResult));
    },
  );
  server.tool(
    "exec_create",
    "Create an exec instance in a container",
    {
      id: Id,
      Cmd: z.array(z.string()).describe("Command to run"),
      AttachStdout: z.boolean().optional(),
      AttachStderr: z.boolean().optional(),
      Tty: z.boolean().optional(),
      Env: z.array(z.string()).optional(),
      WorkingDir: z.string().optional(),
    },
    async (p) => {
      const { id, AttachStdout, AttachStderr, ...rest } = p;
      const execBody = { AttachStdout: AttachStdout ?? true, AttachStderr: AttachStderr ?? true, ...rest };
      return withErrorHandler(() => client.callApi("POST", `/containers/${id}/exec`, execBody).then(toolResult));
    },
  );
  server.tool("prune_containers", "Remove all stopped containers", { filters: Filters }, async (p) => {
    return withErrorHandler(() =>
      client
        .callApi("POST", "/containers/prune", undefined, p.filters ? { filters: p.filters } : undefined)
        .then(toolResult),
    );
  });
}
