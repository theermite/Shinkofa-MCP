import fs from "node:fs/promises";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ExecCommandSchema,
  KillProcessSchema,
  ReadFileSchema,
  WriteFileSchema,
} from "../lib/schemas.js";
import { SystemError, toolResult, withErrorHandler } from "../lib/utils.js";
import { runCommand } from "../lib/executor.js";

/**
 * WRITE / EXEC tools — registered only when MCP_SYSTEM_ALLOW_EXEC=true.
 * These surface arbitrary-command execution and filesystem writes, so they
 * are gated at the index level.
 */
export function registerExecTools(server: McpServer) {
  server.tool(
    "kill_process",
    "Send a signal to a process (default SIGTERM). Requires MCP_SYSTEM_ALLOW_EXEC=true.",
    KillProcessSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        try {
          process.kill(p.pid, p.signal as NodeJS.Signals | number);
          return toolResult({ pid: p.pid, signal: p.signal, sent: true });
        } catch (err) {
          const e = err as NodeJS.ErrnoException;
          throw new SystemError(
            e.code ?? "EKILL",
            `Failed to signal PID ${p.pid}: ${e.message}`,
          );
        }
      }),
  );

  server.tool(
    "exec_command",
    "Execute a command (no shell, args array). Requires MCP_SYSTEM_ALLOW_EXEC=true.",
    ExecCommandSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const result = await runCommand(p.command, p.args, {
          cwd: p.cwd,
          timeoutMs: p.timeoutMs,
          env: p.env,
        });
        return toolResult({
          command: p.command,
          args: p.args,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
          timedOut: result.timedOut,
        });
      }),
  );

  server.tool(
    "read_file",
    "Read a file from disk. Requires MCP_SYSTEM_ALLOW_EXEC=true.",
    ReadFileSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const stat = await fs.stat(p.path);
        if (!stat.isFile()) {
          throw new SystemError("ENOTFILE", `${p.path} is not a regular file`);
        }
        if (stat.size > p.maxBytes) {
          throw new SystemError(
            "ETOOBIG",
            `File size ${stat.size} exceeds maxBytes ${p.maxBytes}`,
          );
        }
        const buf = await fs.readFile(p.path);
        const content =
          p.encoding === "base64"
            ? buf.toString("base64")
            : buf.toString("utf8");
        return toolResult({
          path: p.path,
          size: stat.size,
          encoding: p.encoding,
          content,
        });
      }),
  );

  server.tool(
    "write_file",
    "Write to a file (overwrite or append). Requires MCP_SYSTEM_ALLOW_EXEC=true.",
    WriteFileSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const data =
          p.encoding === "base64"
            ? Buffer.from(p.content, "base64")
            : Buffer.from(p.content, "utf8");
        if (p.append) {
          await fs.appendFile(p.path, data);
        } else {
          await fs.writeFile(p.path, data);
        }
        return toolResult({
          path: p.path,
          bytesWritten: data.byteLength,
          mode: p.append ? "append" : "overwrite",
        });
      }),
  );
}
