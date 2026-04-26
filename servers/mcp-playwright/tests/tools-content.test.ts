import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BrowserManager } from "../src/lib/browser.js";
import { registerContentTools } from "../src/tools/content.js";

const mockElement = {
  innerHTML: vi.fn().mockResolvedValue("<span>Hello</span>"),
  innerText: vi.fn().mockResolvedValue("Hello"),
  screenshot: vi.fn().mockResolvedValue(Buffer.from("fake-png")),
};

const mockPage = {
  $: vi.fn().mockResolvedValue(mockElement),
  content: vi.fn().mockResolvedValue("<html><body>Full page</body></html>"),
  innerText: vi.fn().mockResolvedValue("Full page text"),
  screenshot: vi.fn().mockResolvedValue(Buffer.from("page-png")),
  pdf: vi.fn().mockResolvedValue(Buffer.from("fake-pdf")),
};

function createMockBrowser(): BrowserManager {
  return { getActivePage: vi.fn().mockResolvedValue(mockPage) } as unknown as BrowserManager;
}

let server: McpServer;
let browser: BrowserManager;
let registeredTools: Map<string, (...args: unknown[]) => unknown>;

beforeEach(() => {
  vi.clearAllMocks();
  mockPage.$.mockResolvedValue(mockElement);
  mockElement.innerHTML.mockResolvedValue("<span>Hello</span>");
  mockElement.innerText.mockResolvedValue("Hello");
  server = new McpServer({ name: "test", version: "1.0.0" });
  browser = createMockBrowser();
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as (...a: unknown[]) => unknown);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerContentTools(server, browser);
});

describe("Content tools — registration", () => {
  it("should_register_all_4_tools", () => {
    expect(registeredTools.has("get_content")).toBe(true);
    expect(registeredTools.has("get_text")).toBe(true);
    expect(registeredTools.has("screenshot")).toBe(true);
    expect(registeredTools.has("pdf")).toBe(true);
    expect(registeredTools.size).toBe(4);
  });
});

describe("Content tools — get_content", () => {
  it("should_get_full_page_html_when_no_selector", async () => {
    const cb = registeredTools.get("get_content")!;
    const result = (await cb({})) as { content: { text: string }[] };
    expect(mockPage.content).toHaveBeenCalled();
    const data = JSON.parse(result.content[0].text);
    expect(data.html).toContain("Full page");
  });

  it("should_get_element_html_with_selector", async () => {
    const cb = registeredTools.get("get_content")!;
    const result = (await cb({ selector: "#main" })) as { content: { text: string }[] };
    expect(mockPage.$).toHaveBeenCalledWith("#main");
    const data = JSON.parse(result.content[0].text);
    expect(data.html).toBe("<span>Hello</span>");
  });

  it("should_return_null_html_when_element_not_found", async () => {
    mockPage.$.mockResolvedValue(null);
    const cb = registeredTools.get("get_content")!;
    const result = (await cb({ selector: ".missing" })) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data.html).toBeNull();
    expect(data.error).toContain(".missing");
  });
});

describe("Content tools — get_text", () => {
  it("should_get_full_page_text_when_no_selector", async () => {
    const cb = registeredTools.get("get_text")!;
    const result = (await cb({})) as { content: { text: string }[] };
    expect(mockPage.innerText).toHaveBeenCalledWith("body");
    const data = JSON.parse(result.content[0].text);
    expect(data.text).toBe("Full page text");
  });

  it("should_get_element_text_with_selector", async () => {
    const cb = registeredTools.get("get_text")!;
    const result = (await cb({ selector: "h1" })) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data.text).toBe("Hello");
  });

  it("should_return_null_when_element_not_found", async () => {
    mockPage.$.mockResolvedValue(null);
    const cb = registeredTools.get("get_text")!;
    const result = (await cb({ selector: ".gone" })) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data.text).toBeNull();
  });
});

describe("Content tools — screenshot", () => {
  it("should_take_full_page_screenshot", async () => {
    const cb = registeredTools.get("screenshot")!;
    const result = (await cb({})) as { content: { type: string; data: string; mimeType: string }[] };
    expect(mockPage.screenshot).toHaveBeenCalledWith({ type: "png", fullPage: false });
    expect(result.content[0].type).toBe("image");
    expect(result.content[0].mimeType).toBe("image/png");
  });

  it("should_take_fullPage_screenshot", async () => {
    const cb = registeredTools.get("screenshot")!;
    await cb({ fullPage: true });
    expect(mockPage.screenshot).toHaveBeenCalledWith({ type: "png", fullPage: true });
  });

  it("should_take_element_screenshot", async () => {
    const cb = registeredTools.get("screenshot")!;
    const result = (await cb({ selector: "#hero" })) as { content: { type: string }[] };
    expect(mockPage.$).toHaveBeenCalledWith("#hero");
    expect(mockElement.screenshot).toHaveBeenCalledWith({ type: "png" });
    expect(result.content[0].type).toBe("image");
  });

  it("should_return_error_when_element_not_found", async () => {
    mockPage.$.mockResolvedValue(null);
    const cb = registeredTools.get("screenshot")!;
    const result = (await cb({ selector: ".nope" })) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data.error).toContain(".nope");
  });
});

describe("Content tools — pdf", () => {
  it("should_generate_pdf_with_defaults", async () => {
    const cb = registeredTools.get("pdf")!;
    const result = (await cb({})) as { content: { text: string }[] };
    expect(mockPage.pdf).toHaveBeenCalledWith({ format: "A4", landscape: false });
    const data = JSON.parse(result.content[0].text);
    expect(data.format).toBe("A4");
    expect(data.pdf).toBeTruthy();
    expect(data.size).toBeGreaterThan(0);
  });

  it("should_generate_pdf_with_custom_options", async () => {
    const cb = registeredTools.get("pdf")!;
    await cb({ format: "Letter", landscape: true });
    expect(mockPage.pdf).toHaveBeenCalledWith({ format: "Letter", landscape: true });
  });
});
