import { GmailError } from "./client.js";

export function toolResult(data: unknown) { const text = data === undefined ? '{"status":"success"}' : JSON.stringify(data, null, 2); return { content: [{ type: "text" as const, text }] }; }
export function toolError(message: string) { return { content: [{ type: "text" as const, text: message }], isError: true }; }

export async function withErrorHandler<T>(fn: () => Promise<T>): Promise<T | ReturnType<typeof toolError>> {
  try { return await fn(); }
  catch (error) {
    if (error instanceof GmailError) return toolError(`Gmail error ${error.code}: ${error.description}`);
    if (error instanceof Error) {
      if (error.name === "AbortError") return toolError("Request timed out");
      if (error.name === "SyntaxError") return toolError("Invalid response from Gmail API (non-JSON)");
      if (error.name === "TypeError") return toolError(`Network error: ${error.message}`);
    }
    throw error;
  }
}

function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]/g, " ");
}

export function buildRawEmail(p: { to: string; subject: string; body: string; from?: string; cc?: string; bcc?: string; replyTo?: string; inReplyTo?: string; references?: string; isHtml?: boolean }): string {
  const lines: string[] = [];
  if (p.from) lines.push(`From: ${sanitizeHeader(p.from)}`);
  lines.push(`To: ${sanitizeHeader(p.to)}`);
  if (p.cc) lines.push(`Cc: ${sanitizeHeader(p.cc)}`);
  if (p.bcc) lines.push(`Bcc: ${sanitizeHeader(p.bcc)}`);
  lines.push(`Subject: ${sanitizeHeader(p.subject)}`);
  if (p.replyTo) lines.push(`Reply-To: ${sanitizeHeader(p.replyTo)}`);
  if (p.inReplyTo) lines.push(`In-Reply-To: ${sanitizeHeader(p.inReplyTo)}`);
  if (p.references) lines.push(`References: ${sanitizeHeader(p.references)}`);
  lines.push(`Content-Type: ${p.isHtml ? "text/html" : "text/plain"}; charset=utf-8`);
  lines.push("MIME-Version: 1.0");
  lines.push("");
  lines.push(p.body);
  return Buffer.from(lines.join("\r\n")).toString("base64url");
}
