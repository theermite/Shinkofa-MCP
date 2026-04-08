import { describe, it, expect, vi } from "vitest";
import { toolResult, toolError, withErrorHandler, buildRawEmail } from "../src/lib/utils.js";
import { GmailError } from "../src/lib/client.js";

// ── toolResult ────────────────────────────────────────────────────────────────

describe("toolResult", () => {
  it("should return JSON-stringified content for an object", () => {
    const result = toolResult({ id: "msg1", snippet: "Hello" });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "msg1", snippet: "Hello" });
  });

  it('should return {"status":"success"} for undefined input', () => {
    const result = toolResult(undefined);
    expect(result.content[0].text).toBe('{"status":"success"}');
  });

  it("should serialize arrays correctly", () => {
    const result = toolResult([1, 2, 3]);
    expect(JSON.parse(result.content[0].text)).toEqual([1, 2, 3]);
  });

  it("should serialize strings directly", () => {
    const result = toolResult("hello");
    // JSON.stringify("hello") = '"hello"'
    expect(JSON.parse(result.content[0].text)).toBe("hello");
  });

  it("should not have isError flag", () => {
    const result = toolResult({ ok: true }) as Record<string, unknown>;
    expect(result.isError).toBeUndefined();
  });
});

// ── toolError ─────────────────────────────────────────────────────────────────

describe("toolError", () => {
  it("should return error content with isError flag set to true", () => {
    const result = toolError("Something went wrong");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Something went wrong");
  });

  it("should set content type to text", () => {
    const result = toolError("Bad token");
    expect(result.content[0].type).toBe("text");
  });
});

// ── withErrorHandler ──────────────────────────────────────────────────────────

describe("withErrorHandler", () => {
  it("should return the function result on success", async () => {
    const result = await withErrorHandler(async () => toolResult({ ok: true }));
    expect(result).toEqual(toolResult({ ok: true }));
  });

  it("should catch GmailError and return toolError with code and description", async () => {
    const result = await withErrorHandler(async () => {
      throw new GmailError(403, "Forbidden");
    });
    expect((result as ReturnType<typeof toolError>).isError).toBe(true);
    expect((result as ReturnType<typeof toolError>).content[0].text).toContain("403");
    expect((result as ReturnType<typeof toolError>).content[0].text).toContain("Forbidden");
  });

  it("should catch AbortError and return timeout message", async () => {
    const result = await withErrorHandler(async () => {
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      throw err;
    });
    expect((result as ReturnType<typeof toolError>).isError).toBe(true);
    expect((result as ReturnType<typeof toolError>).content[0].text).toContain("timed out");
  });

  it("should catch SyntaxError and return non-JSON message", async () => {
    const result = await withErrorHandler(async () => {
      const err = new SyntaxError("Unexpected token");
      throw err;
    });
    expect((result as ReturnType<typeof toolError>).isError).toBe(true);
    expect((result as ReturnType<typeof toolError>).content[0].text).toContain("non-JSON");
  });

  it("should catch TypeError and return network error message with detail", async () => {
    const result = await withErrorHandler(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect((result as ReturnType<typeof toolError>).isError).toBe(true);
    expect((result as ReturnType<typeof toolError>).content[0].text).toContain("Network error");
    expect((result as ReturnType<typeof toolError>).content[0].text).toContain("Failed to fetch");
  });

  it("should rethrow unknown errors (not Error instances)", async () => {
    await expect(
      withErrorHandler(async () => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw "raw string error";
      })
    ).rejects.toBe("raw string error");
  });

  it("should rethrow unknown Error subclasses that are not GmailError/AbortError/SyntaxError/TypeError", async () => {
    class CustomError extends Error {
      constructor() {
        super("custom");
        this.name = "CustomError";
      }
    }

    await expect(
      withErrorHandler(async () => {
        throw new CustomError();
      })
    ).rejects.toBeInstanceOf(CustomError);
  });
});

// ── buildRawEmail ─────────────────────────────────────────────────────────────

describe("buildRawEmail", () => {
  const base = { to: "recipient@example.com", subject: "Hello", body: "World" };

  it("should produce valid base64url output (no +, /, or = chars)", () => {
    const encoded = buildRawEmail(base);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });

  it("should decode to a string containing the To header", () => {
    const encoded = buildRawEmail(base);
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
    expect(decoded).toContain("To: recipient@example.com");
  });

  it("should include Subject header", () => {
    const encoded = buildRawEmail(base);
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
    expect(decoded).toContain("Subject: Hello");
  });

  it("should include From header when provided", () => {
    const encoded = buildRawEmail({ ...base, from: "sender@example.com" });
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
    expect(decoded).toContain("From: sender@example.com");
  });

  it("should omit From header when not provided", () => {
    const encoded = buildRawEmail(base);
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
    expect(decoded).not.toContain("From:");
  });

  it("should include Cc header when cc is provided", () => {
    const encoded = buildRawEmail({ ...base, cc: "cc@example.com" });
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
    expect(decoded).toContain("Cc: cc@example.com");
  });

  it("should include Bcc header when bcc is provided", () => {
    const encoded = buildRawEmail({ ...base, bcc: "bcc@example.com" });
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
    expect(decoded).toContain("Bcc: bcc@example.com");
  });

  it("should include Reply-To header when replyTo is provided", () => {
    const encoded = buildRawEmail({ ...base, replyTo: "reply@example.com" });
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
    expect(decoded).toContain("Reply-To: reply@example.com");
  });

  it("should include In-Reply-To header when inReplyTo is provided", () => {
    const encoded = buildRawEmail({ ...base, inReplyTo: "<msg-id-123@mail.example.com>" });
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
    expect(decoded).toContain("In-Reply-To: <msg-id-123@mail.example.com>");
  });

  it("should include References header when references is provided", () => {
    const encoded = buildRawEmail({ ...base, references: "<ref1@mail> <ref2@mail>" });
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
    expect(decoded).toContain("References: <ref1@mail> <ref2@mail>");
  });

  it("should set Content-Type to text/plain by default", () => {
    const encoded = buildRawEmail(base);
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
    expect(decoded).toContain("Content-Type: text/plain");
  });

  it("should set Content-Type to text/html when isHtml is true", () => {
    const encoded = buildRawEmail({ ...base, isHtml: true });
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
    expect(decoded).toContain("Content-Type: text/html");
  });

  it("should sanitize headers by collapsing CR and LF so no injected headers are created", () => {
    const encoded = buildRawEmail({
      ...base,
      subject: "Injected\r\nBcc: attacker@evil.com",
    });
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
    const lines = decoded.split("\r\n");
    // CR/LF collapsed into spaces — no standalone "Bcc: attacker@evil.com" line
    const injectedBccLine = lines.find((l) => l.trim() === "Bcc: attacker@evil.com");
    expect(injectedBccLine).toBeUndefined();
    // Still exactly one Subject header line
    const subjectLines = lines.filter((l) => l.startsWith("Subject:"));
    expect(subjectLines).toHaveLength(1);
  });

  it("should include the body content after headers", () => {
    const encoded = buildRawEmail({ ...base, body: "This is the email body." });
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
    expect(decoded).toContain("This is the email body.");
  });

  it("should use CRLF line endings", () => {
    const encoded = buildRawEmail(base);
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
    // Must have at least one CRLF sequence
    expect(decoded).toContain("\r\n");
  });

  it("should include charset=utf-8 in Content-Type", () => {
    const encoded = buildRawEmail(base);
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
    expect(decoded).toContain("charset=utf-8");
  });

  it("should include MIME-Version header", () => {
    const encoded = buildRawEmail(base);
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
    expect(decoded).toContain("MIME-Version: 1.0");
  });
});
