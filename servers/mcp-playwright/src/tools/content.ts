import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrowserManager } from "../lib/browser.js";
import { GetContentSchema, GetTextSchema, PdfSchema, ScreenshotSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerContentTools(server: McpServer, browser: BrowserManager): void {
  server.tool(
    "get_content",
    "Get HTML content of the page or a specific element. Returns the HTML string.",
    GetContentSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const page = await browser.getActivePage();
        if (p.selector) {
          const el = await page.$(p.selector);
          if (!el) return toolResult({ html: null, error: `No element found for: ${p.selector}` });
          return toolResult({ html: await el.innerHTML() });
        }
        return toolResult({ html: await page.content() });
      }),
  );

  server.tool(
    "get_text",
    "Get visible text content of the page or a specific element. Returns the text string.",
    GetTextSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const page = await browser.getActivePage();
        if (p.selector) {
          const el = await page.$(p.selector);
          if (!el) return toolResult({ text: null, error: `No element found for: ${p.selector}` });
          return toolResult({ text: await el.innerText() });
        }
        return toolResult({ text: await page.innerText("body") });
      }),
  );

  server.tool(
    "screenshot",
    "Take a screenshot of the page or a specific element. Returns base64-encoded PNG image.",
    ScreenshotSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const page = await browser.getActivePage();
        let buffer: Buffer;
        if (p.selector) {
          const el = await page.$(p.selector);
          if (!el) return toolResult({ error: `No element found for: ${p.selector}` });
          buffer = await el.screenshot({ type: "png" });
        } else {
          buffer = await page.screenshot({ type: "png", fullPage: p.fullPage ?? false });
        }
        return {
          content: [{ type: "image" as const, data: buffer.toString("base64"), mimeType: "image/png" }],
        };
      }),
  );

  server.tool(
    "pdf",
    "Generate a PDF of the current page. Only works in headless Chromium. Returns base64-encoded PDF.",
    PdfSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const page = await browser.getActivePage();
        const buffer = await page.pdf({
          format: p.format ?? "A4",
          landscape: p.landscape ?? false,
        });
        return toolResult({
          pdf: buffer.toString("base64"),
          format: p.format ?? "A4",
          size: buffer.length,
        });
      }),
  );
}
