/**
 * Zod schemas for all Streamer.bot MCP tool inputs.
 */
import { z } from "zod";

export const DoActionSchema = z.object({
  name: z.string().optional().describe("Action name (use either name or id)"),
  id: z.string().optional().describe("Action ID/GUID (use either name or id)"),
  args: z.record(z.string()).optional().describe("Optional arguments to pass to the action"),
});

export const SendMessageSchema = z.object({
  message: z.string().describe("The message to send"),
  platform: z.enum(["twitch", "youtube"]).default("twitch").describe("Platform to send to"),
  bot: z.boolean().default(false).describe("Send as bot account instead of broadcaster"),
});

export const GetGlobalsSchema = z.object({
  persisted: z.boolean().default(true).describe("Get persisted (saved) variables"),
});

export const GetGlobalSchema = z.object({
  variable: z.string().describe("Variable name"),
  persisted: z.boolean().default(true).describe("Get persisted (saved) variable"),
});

export const ExecuteCodeTriggerSchema = z.object({
  triggerName: z.string().describe("Name of the code trigger to execute"),
  args: z.record(z.string()).optional().describe("Optional arguments"),
});

export const SubscribeSchema = z.object({
  events: z.record(z.array(z.string())).describe('Event map, e.g. {"Twitch": ["ChatMessage", "Follow"]}'),
});
