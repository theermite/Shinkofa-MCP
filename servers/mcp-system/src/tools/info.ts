import os from "node:os";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runCommand } from "../lib/executor.js";
import { EmptySchema, GetEnvVarsSchema, WhichCommandSchema } from "../lib/schemas.js";
import { maskSecretValue, toolResult, withErrorHandler } from "../lib/utils.js";

export function registerInfoTools(server: McpServer) {
  server.tool("get_system_info", "Get OS, hostname, architecture, release, user, uptime", EmptySchema.shape, async () =>
    withErrorHandler(async () => {
      const userInfo = os.userInfo();
      return toolResult({
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        release: os.release(),
        version: os.version(),
        type: os.type(),
        uptimeSeconds: os.uptime(),
        username: userInfo.username,
        homedir: userInfo.homedir,
        shell: userInfo.shell,
        nodeVersion: process.version,
        pid: process.pid,
      });
    }),
  );

  server.tool("get_uptime", "Get system uptime in seconds", EmptySchema.shape, async () =>
    withErrorHandler(async () => {
      return toolResult({
        uptimeSeconds: os.uptime(),
        uptimeHuman: formatUptime(os.uptime()),
      });
    }),
  );

  server.tool(
    "get_env_vars",
    "List environment variables (secret-looking values masked by default)",
    GetEnvVarsSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const filter = p.filter?.toLowerCase();
        const entries = Object.entries(process.env)
          .filter(([k]) => !filter || k.toLowerCase().includes(filter))
          .map(([k, v]) => {
            const value = v ?? "";
            return [k, p.unmask ? value : maskSecretValue(k, value)] as const;
          });
        entries.sort(([a], [b]) => a.localeCompare(b));
        return toolResult(Object.fromEntries(entries));
      }),
  );

  server.tool("which_command", "Resolve an executable name in PATH (cross-OS)", WhichCommandSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const isWin = os.platform() === "win32";
      const finder = isWin ? "where" : "which";
      const result = await runCommand(finder, [p.command], {
        timeoutMs: 5_000,
      });
      const path = result.stdout.split(/\r?\n/)[0]?.trim() ?? "";
      return toolResult({
        command: p.command,
        found: result.exitCode === 0 && path.length > 0,
        path,
      });
    }),
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}
