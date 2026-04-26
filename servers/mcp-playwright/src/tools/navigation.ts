import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrowserManager } from "../lib/browser.js";
import { GoBackSchema, GoForwardSchema, NavigateSchema, ReloadSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerNavigationTools(server: McpServer, browser: BrowserManager): void {
  server.tool(
    "navigate",
    "Navigate to a URL and wait for the page to load. Returns the final URL and page title.",
    NavigateSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const page = await browser.getActivePage();
        const response = await page.goto(p.url, {
          waitUntil: p.waitUntil ?? "load",
          timeout: p.timeout,
        });
        return toolResult({
          url: page.url(),
          title: await page.title(),
          status: response?.status() ?? null,
        });
      }),
  );

  server.tool(
    "go_back",
    "Navigate back in browser history. Returns the new URL and title.",
    GoBackSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const page = await browser.getActivePage();
        await page.goBack({ waitUntil: p.waitUntil ?? "load" });
        return toolResult({ url: page.url(), title: await page.title() });
      }),
  );

  server.tool(
    "go_forward",
    "Navigate forward in browser history. Returns the new URL and title.",
    GoForwardSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const page = await browser.getActivePage();
        await page.goForward({ waitUntil: p.waitUntil ?? "load" });
        return toolResult({ url: page.url(), title: await page.title() });
      }),
  );

  server.tool(
    "reload",
    "Reload the current page. Returns the URL and title after reload.",
    ReloadSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const page = await browser.getActivePage();
        await page.reload({ waitUntil: p.waitUntil ?? "load" });
        return toolResult({ url: page.url(), title: await page.title() });
      }),
  );
}
