import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrowserManager } from "../lib/browser.js";
import { EvaluateSchema, QuerySelectorAllSchema, QuerySelectorSchema, WaitForSelectorSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

const DEFAULT_ATTRIBUTES = [
  "id",
  "class",
  "href",
  "src",
  "alt",
  "title",
  "type",
  "name",
  "value",
  "role",
  "aria-label",
];

async function extractElementInfo(
  el: {
    getAttribute: (name: string) => Promise<string | null>;
    innerText: () => Promise<string>;
    isVisible: () => Promise<boolean>;
  },
  attributes: string[],
): Promise<Record<string, unknown>> {
  const attrs: Record<string, string | null> = {};
  for (const attr of attributes) {
    attrs[attr] = await el.getAttribute(attr);
  }
  return {
    text: await el.innerText(),
    visible: await el.isVisible(),
    attributes: Object.fromEntries(Object.entries(attrs).filter(([, v]) => v !== null)),
  };
}

export function registerQueryTools(server: McpServer, browser: BrowserManager): void {
  server.tool(
    "query_selector",
    "Find a single element matching a CSS selector. Returns its text, visibility, and attributes.",
    QuerySelectorSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const page = await browser.getActivePage();
        const el = await page.$(p.selector);
        if (!el) return toolResult({ found: false, selector: p.selector });
        const info = await extractElementInfo(el, p.attributes ?? DEFAULT_ATTRIBUTES);
        return toolResult({ found: true, selector: p.selector, ...info });
      }),
  );

  server.tool(
    "query_selector_all",
    "Find all elements matching a CSS selector. Returns an array of element info (text, visibility, attributes).",
    QuerySelectorAllSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const page = await browser.getActivePage();
        const limit = p.limit ?? 100;
        const elements = await page.$$(p.selector);
        const attrs = p.attributes ?? DEFAULT_ATTRIBUTES;
        const results = [];
        for (let i = 0; i < Math.min(elements.length, limit); i++) {
          const el = elements[i];
          if (el) results.push(await extractElementInfo(el, attrs));
        }
        return toolResult({
          selector: p.selector,
          count: elements.length,
          truncated: elements.length > limit,
          elements: results,
        });
      }),
  );

  server.tool(
    "evaluate",
    "Execute JavaScript in the page context and return the result. The expression is evaluated as-is (not wrapped in a function).",
    EvaluateSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const page = await browser.getActivePage();
        const result = await page.evaluate(p.expression);
        return toolResult({ result });
      }),
  );

  server.tool(
    "wait_for_selector",
    "Wait for an element matching a CSS selector to reach the specified state (visible, hidden, attached, detached).",
    WaitForSelectorSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const page = await browser.getActivePage();
        await page.waitForSelector(p.selector, {
          state: p.state ?? "visible",
          timeout: p.timeout,
        });
        return toolResult({ selector: p.selector, state: p.state ?? "visible" });
      }),
  );
}
