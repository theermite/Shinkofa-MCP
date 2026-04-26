import os from "node:os";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runCommand } from "../lib/executor.js";
import { GetProcessSchema, ListProcessesSchema } from "../lib/schemas.js";
import { SystemError, toolResult, withErrorHandler } from "../lib/utils.js";

interface ProcessEntry {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  user?: string;
}

export function registerProcessTools(server: McpServer) {
  server.tool(
    "list_processes",
    "List running processes sorted by CPU/memory/pid",
    ListProcessesSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const procs = await listProcesses();
        procs.sort((a, b) => {
          if (p.sortBy === "pid") return a.pid - b.pid;
          if (p.sortBy === "memory") return b.memory - a.memory;
          return b.cpu - a.cpu;
        });
        return toolResult(procs.slice(0, p.limit));
      }),
  );

  server.tool("get_process", "Get details about a single process by PID", GetProcessSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const procs = await listProcesses();
      const proc = procs.find((x) => x.pid === p.pid);
      if (!proc) {
        throw new SystemError("ENOENT", `Process ${p.pid} not found`);
      }
      return toolResult(proc);
    }),
  );
}

async function listProcesses(): Promise<ProcessEntry[]> {
  const isWin = os.platform() === "win32";
  if (isWin) {
    const res = await runCommand("tasklist", ["/FO", "CSV", "/NH"], { timeoutMs: 10_000 });
    return parseTasklist(res.stdout);
  }
  const res = await runCommand("ps", ["-eo", "pid,pcpu,pmem,comm,user"], { timeoutMs: 10_000 });
  return parsePs(res.stdout);
}

function parseTasklist(text: string): ProcessEntry[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines
    .map((line) => {
      const cols = line.split('","').map((c) => c.replace(/^"|"$/g, ""));
      const pid = Number(cols[1] ?? 0);
      const memStr = (cols[4] ?? "0 K").replace(/[^0-9]/g, "");
      return {
        pid,
        name: cols[0] ?? "",
        cpu: 0,
        memory: Number(memStr) * 1024,
      };
    })
    .filter((p) => p.pid > 0);
}

function parsePs(text: string): ProcessEntry[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines
    .slice(1)
    .map((line) => {
      const cols = line.trim().split(/\s+/);
      return {
        pid: Number(cols[0] ?? 0),
        cpu: Number(cols[1] ?? 0),
        memory: Number(cols[2] ?? 0),
        name: cols[3] ?? "",
        user: cols[4] ?? "",
      };
    })
    .filter((p) => p.pid > 0);
}
