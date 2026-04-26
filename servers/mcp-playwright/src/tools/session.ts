import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrowserManager } from "../lib/browser.js";
import { ClosePageSchema, ListPagesSchema, NewPageSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerSessionTools(server: McpServer, browser: BrowserManager): void {
  server.tool(
    "new_page",
    "Open a new browser tab/page. The new page becomes the active page.",
    NewPageSchema.shape,
    async () =>
      withErrorHandler(async () => {
        await browser.newPage();
        return toolResult({
          pageId: browser.getActivePageId(),
          message: "New page created and set as active",
        });
      }),
  );

  server.tool(
    "close_page",
    "Close a browser tab/page by ID. If no ID given, closes the active page.",
    ClosePageSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        await browser.closePage(p.pageId);
        return toolResult({
          closed: p.pageId ?? "active page",
          activePageId: browser.getActivePageId(),
        });
      }),
  );

  server.tool(
    "list_pages",
    "List all open browser pages with their IDs, URLs, and titles.",
    ListPagesSchema.shape,
    async () =>
      withErrorHandler(async () => {
        const pages = browser.listPages();
        return toolResult({
          activePageId: browser.getActivePageId(),
          pages,
          count: pages.length,
        });
      }),
  );
}
