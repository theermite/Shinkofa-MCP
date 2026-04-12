/**
 * Zod schemas for Ollama MCP tool inputs.
 */
import { z } from "zod";

// ── Common ──

export const ModelName = z
  .string()
  .min(1)
  .describe("Model name (e.g. 'llama3', 'qwen3:8b', 'gemma4:26b')");

export const KeepAlive = z
  .union([z.string(), z.number()])
  .optional()
  .describe("How long to keep model loaded (e.g. '5m', '1h', 0 to unload)");

export const ModelOptions = z
  .object({
    temperature: z.number().optional().describe("Sampling temperature"),
    top_p: z.number().optional().describe("Nucleus sampling threshold"),
    top_k: z.number().optional().describe("Top-K sampling"),
    seed: z.number().optional().describe("Random seed for reproducibility"),
    num_predict: z
      .number()
      .optional()
      .describe("Max tokens to generate (-1 = infinite)"),
    stop: z
      .array(z.string())
      .optional()
      .describe("Stop sequences"),
    num_ctx: z
      .number()
      .optional()
      .describe("Context window size (default: 2048)"),
    repeat_penalty: z.number().optional(),
    presence_penalty: z.number().optional(),
    frequency_penalty: z.number().optional(),
    mirostat: z.number().optional().describe("Mirostat mode (0/1/2)"),
    mirostat_tau: z.number().optional(),
    mirostat_eta: z.number().optional(),
  })
  .optional()
  .describe("Model parameters override");

export const Format = z
  .union([z.literal("json"), z.record(z.unknown())])
  .optional()
  .describe("Output format: 'json' or a JSON schema object");

// ── Generation ──

export const GenerateSchema = z.object({
  model: ModelName,
  prompt: z.string().describe("The prompt to generate from"),
  suffix: z.string().optional().describe("Suffix after the response (fill-in-the-middle)"),
  images: z
    .array(z.string())
    .optional()
    .describe("Base64-encoded images (for multimodal models)"),
  system: z.string().optional().describe("System message override"),
  template: z.string().optional().describe("Prompt template override"),
  format: Format,
  options: ModelOptions,
  keep_alive: KeepAlive,
  raw: z.boolean().optional().describe("Bypass prompt template"),
  think: z.boolean().optional().describe("Enable thinking/reasoning"),
});

export const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.string(),
  images: z
    .array(z.string())
    .optional()
    .describe("Base64-encoded images"),
  tool_calls: z
    .array(z.record(z.unknown()))
    .optional()
    .describe("Tool calls from assistant"),
});

export const ChatSchema = z.object({
  model: ModelName,
  messages: z
    .array(ChatMessageSchema)
    .min(1)
    .describe("Conversation messages"),
  tools: z
    .array(z.record(z.unknown()))
    .optional()
    .describe("Tool/function definitions for function calling"),
  format: Format,
  options: ModelOptions,
  keep_alive: KeepAlive,
  think: z.boolean().optional().describe("Enable thinking/reasoning"),
});

// ── Embeddings ──

export const EmbedSchema = z.object({
  model: ModelName,
  input: z
    .union([z.string(), z.array(z.string())])
    .describe("Text or array of texts to embed"),
  keep_alive: KeepAlive,
});

// ── Models ──

export const ShowModelSchema = z.object({
  model: ModelName,
  verbose: z.boolean().optional().describe("Show full model details"),
});

export const CopyModelSchema = z.object({
  source: z.string().min(1).describe("Source model name"),
  destination: z.string().min(1).describe("Destination model name"),
});

export const DeleteModelSchema = z.object({
  model: ModelName,
});

export const PullModelSchema = z.object({
  model: ModelName,
  insecure: z.boolean().optional().describe("Allow insecure connections"),
});

export const PushModelSchema = z.object({
  model: ModelName,
  insecure: z.boolean().optional().describe("Allow insecure connections"),
});

export const CreateModelSchema = z.object({
  model: ModelName,
  modelfile: z
    .string()
    .optional()
    .describe("Modelfile content (FROM, PARAMETER, SYSTEM, etc.)"),
  path: z.string().optional().describe("Path to Modelfile on server"),
  quantize: z.string().optional().describe("Quantization level (e.g. q4_0)"),
});

export const CheckBlobSchema = z.object({
  digest: z
    .string()
    .min(1)
    .describe("SHA256 digest (sha256:<hex>)"),
});

// ── Raw ──

export const RawApiCallSchema = z.object({
  method: z
    .enum(["GET", "POST", "DELETE", "HEAD", "PUT"])
    .describe("HTTP method"),
  path: z.string().min(1).describe("API path (e.g. '/api/tags')"),
  body: z
    .record(z.unknown())
    .optional()
    .describe("JSON request body"),
});
