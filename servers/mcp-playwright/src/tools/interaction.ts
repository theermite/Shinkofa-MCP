import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrowserManager } from "../lib/browser.js";
import { ClickSchema, FillSchema, HoverSchema, PressKeySchema, SelectOptionSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerInteractionTools(server: McpServer, browser: BrowserManager): void {
  server.tool(
    "click",
    "Click an element on the page. Waits for the element to be actionable before clicking.",
    ClickSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const page = await browser.getActivePage();
        await page.click(p.selector, {
          button: p.button ?? "left",
          clickCount: p.clickCount ?? 1,
          timeout: p.timeout,
        });
        return toolResult({ clicked: p.selector });
      }),
  );

  server.tool(
    "fill",
    "Clear and fill an input or textarea element with the given value.",
    FillSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const page = await browser.getActivePage();
        await page.fill(p.selector, p.value, { timeout: p.timeout });
        return toolResult({ filled: p.selector, value: p.value });
      }),
  );

  server.tool(
    "select_option",
    "Select an option from a <select> element by value, label, or index.",
    SelectOptionSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const page = await browser.getActivePage();
        const option: Record<string, string | number> = {};
        if (p.value !== undefined) option.value = p.value;
        else if (p.label !== undefined) option.label = p.label;
        else if (p.index !== undefined) option.index = p.index;
        const selected = await page.selectOption(p.selector, option);
        return toolResult({ selector: p.selector, selected });
      }),
  );

  server.tool(
    "press_key",
    "Press a keyboard key, optionally on a specific element. Use key names like 'Enter', 'Tab', 'ArrowDown'.",
    PressKeySchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const page = await browser.getActivePage();
        if (p.selector) {
          await page.press(p.selector, p.key);
        } else {
          await page.keyboard.press(p.key);
        }
        return toolResult({ pressed: p.key, selector: p.selector ?? "active element" });
      }),
  );

  server.tool("hover", "Hover over an element on the page.", HoverSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const page = await browser.getActivePage();
      await page.hover(p.selector, { timeout: p.timeout });
      return toolResult({ hovered: p.selector });
    }),
  );
}
