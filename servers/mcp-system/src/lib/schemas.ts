import { z } from "zod";

export const EmptySchema = z.object({});

export const GetEnvVarsSchema = z.object({
  filter: z.string().optional().describe("Case-insensitive substring filter on variable names"),
  unmask: z
    .boolean()
    .default(false)
    .describe("Unmask values of secret-looking vars (TOKEN/KEY/SECRET/...). Default false."),
});

export const ListProcessesSchema = z.object({
  limit: z.number().int().positive().max(500).default(20).describe("Max processes to return (default 20, max 500)"),
  sortBy: z.enum(["cpu", "memory", "pid"]).default("cpu").describe("Sort key"),
});

export const GetProcessSchema = z.object({
  pid: z.number().int().positive().describe("Process ID"),
});

export const WhichCommandSchema = z.object({
  command: z.string().min(1).describe("Executable name to resolve in PATH"),
});

// === Exec-gated schemas ===

export const KillProcessSchema = z.object({
  pid: z.number().int().positive().describe("Target PID"),
  signal: z.union([z.string(), z.number()]).default("SIGTERM").describe("Signal to send (default SIGTERM)"),
});

export const ExecCommandSchema = z.object({
  command: z.string().min(1).describe("Executable to run (no shell)"),
  args: z.array(z.string()).default([]).describe("Arguments passed to executable"),
  cwd: z.string().optional().describe("Working directory"),
  timeoutMs: z
    .number()
    .int()
    .positive()
    .max(600_000)
    .default(30_000)
    .describe("Timeout in ms (default 30s, max 10min)"),
  env: z.record(z.string()).optional().describe("Additional env vars (merged on process.env)"),
});

export const ReadFileSchema = z.object({
  path: z.string().min(1).describe("Absolute path to file"),
  encoding: z.enum(["utf8", "base64"]).default("utf8").describe("Output encoding"),
  maxBytes: z
    .number()
    .int()
    .positive()
    .max(10_485_760)
    .default(1_048_576)
    .describe("Max bytes to read (default 1MB, max 10MB)"),
});

export const WriteFileSchema = z.object({
  path: z.string().min(1).describe("Absolute path to file"),
  content: z.string().describe("Content to write"),
  encoding: z.enum(["utf8", "base64"]).default("utf8"),
  append: z.boolean().default(false).describe("Append instead of overwrite"),
});
