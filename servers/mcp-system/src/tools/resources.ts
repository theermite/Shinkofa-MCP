import os from "node:os";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runCommand } from "../lib/executor.js";
import { EmptySchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerResourceTools(server: McpServer) {
  server.tool(
    "get_cpu_info",
    "Get CPU model, cores, speed, and 1/5/15 min load averages",
    EmptySchema.shape,
    async () =>
      withErrorHandler(async () => {
        const cpus = os.cpus();
        const first = cpus[0];
        return toolResult({
          model: first?.model ?? "unknown",
          cores: cpus.length,
          speedMHz: first?.speed ?? 0,
          loadAverage: os.loadavg(),
        });
      }),
  );

  server.tool("get_memory_info", "Get total, free, used memory in bytes and percent", EmptySchema.shape, async () =>
    withErrorHandler(async () => {
      const total = os.totalmem();
      const free = os.freemem();
      const used = total - free;
      return toolResult({
        totalBytes: total,
        freeBytes: free,
        usedBytes: used,
        usedPercent: Math.round((used / total) * 10000) / 100,
      });
    }),
  );

  server.tool("get_disk_info", "Get disk/filesystem usage for all mountpoints", EmptySchema.shape, async () =>
    withErrorHandler(async () => toolResult(await getDiskInfo())),
  );

  server.tool(
    "get_network_interfaces",
    "Get network interfaces (name, addresses, MAC, family)",
    EmptySchema.shape,
    async () =>
      withErrorHandler(async () => {
        const ifaces = os.networkInterfaces();
        return toolResult(ifaces);
      }),
  );
}

async function getDiskInfo(): Promise<unknown> {
  const isWin = os.platform() === "win32";
  if (isWin) {
    const res = await runCommand("wmic", ["logicaldisk", "get", "DeviceID,Size,FreeSpace,VolumeName", "/format:csv"], {
      timeoutMs: 10_000,
    });
    return parseWmicCsv(res.stdout);
  }
  const res = await runCommand("df", ["-kP"], { timeoutMs: 10_000 });
  return parseDfOutput(res.stdout);
}

function parseWmicCsv(text: string): unknown[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const header = lines[0]?.split(",");
  if (!header) return [];
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const row: Record<string, string> = {};
    header.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    return {
      mount: row.DeviceID ?? "",
      name: row.VolumeName ?? "",
      totalBytes: Number(row.Size ?? 0),
      freeBytes: Number(row.FreeSpace ?? 0),
    };
  });
}

function parseDfOutput(text: string): unknown[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.slice(1).map((line) => {
    const cols = line.split(/\s+/);
    return {
      filesystem: cols[0] ?? "",
      totalBytes: Number(cols[1] ?? 0) * 1024,
      usedBytes: Number(cols[2] ?? 0) * 1024,
      freeBytes: Number(cols[3] ?? 0) * 1024,
      usePercent: cols[4] ?? "",
      mount: cols[5] ?? "",
    };
  });
}
