import { z } from "zod";

const Selector = z.string().describe("CSS selector or text selector (e.g. 'text=Click me')");

const WaitUntil = z
  .enum(["load", "domcontentloaded", "networkidle", "commit"])
  .optional()
  .describe("When to consider navigation complete (default: load)");

// ── Navigation ──

export const NavigateSchema = z.object({
  url: z.string().url().describe("URL to navigate to"),
  waitUntil: WaitUntil,
  timeout: z.number().positive().optional().describe("Timeout in ms"),
});

export const GoBackSchema = z.object({
  waitUntil: WaitUntil,
});

export const GoForwardSchema = z.object({
  waitUntil: WaitUntil,
});

export const ReloadSchema = z.object({
  waitUntil: WaitUntil,
});

// ── Content ──

export const GetContentSchema = z.object({
  selector: Selector.optional().describe("CSS selector to get innerHTML of. Omit for full page HTML"),
});

export const GetTextSchema = z.object({
  selector: Selector.optional().describe("CSS selector to get text from. Omit for full page text"),
});

export const ScreenshotSchema = z.object({
  selector: Selector.optional().describe("CSS selector to screenshot. Omit for full page"),
  fullPage: z.boolean().optional().describe("Capture full scrollable page (default: false)"),
});

export const PdfSchema = z.object({
  format: z
    .enum(["A4", "A3", "Letter", "Legal", "Tabloid"])
    .optional()
    .describe("Paper format (default: A4)"),
  landscape: z.boolean().optional().describe("Landscape orientation (default: false)"),
});

// ── Interaction ──

export const ClickSchema = z.object({
  selector: Selector,
  button: z.enum(["left", "right", "middle"]).optional().describe("Mouse button (default: left)"),
  clickCount: z.number().int().positive().optional().describe("Number of clicks (default: 1)"),
  timeout: z.number().positive().optional().describe("Timeout in ms"),
});

export const FillSchema = z.object({
  selector: Selector,
  value: z.string().describe("Value to fill"),
  timeout: z.number().positive().optional().describe("Timeout in ms"),
});

export const SelectOptionSchema = z.object({
  selector: Selector,
  value: z.string().optional().describe("Option value to select"),
  label: z.string().optional().describe("Option label to select"),
  index: z.number().int().nonnegative().optional().describe("Option index to select"),
});

export const PressKeySchema = z.object({
  key: z.string().describe("Key to press (e.g. 'Enter', 'Tab', 'ArrowDown', 'a')"),
  selector: Selector.optional().describe("Element to focus before pressing. Omit for active element"),
});

export const HoverSchema = z.object({
  selector: Selector,
  timeout: z.number().positive().optional().describe("Timeout in ms"),
});

// ── Query ──

export const QuerySelectorSchema = z.object({
  selector: Selector,
  attributes: z.array(z.string()).optional().describe("Attribute names to extract (default: all standard)"),
});

export const QuerySelectorAllSchema = z.object({
  selector: Selector,
  limit: z.number().int().positive().optional().describe("Max elements to return (default: 100)"),
  attributes: z.array(z.string()).optional().describe("Attribute names to extract"),
});

export const EvaluateSchema = z.object({
  expression: z.string().describe("JavaScript expression to evaluate in page context"),
});

export const WaitForSelectorSchema = z.object({
  selector: Selector,
  state: z
    .enum(["attached", "detached", "visible", "hidden"])
    .optional()
    .describe("Wait for this state (default: visible)"),
  timeout: z.number().positive().optional().describe("Timeout in ms"),
});

// ── Session ──

export const NewPageSchema = z.object({});

export const ClosePageSchema = z.object({
  pageId: z.string().optional().describe("Page ID to close. Omit to close active page"),
});

export const ListPagesSchema = z.object({});
