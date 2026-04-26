import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BrowserManager } from "../src/lib/browser.js";
import { PlaywrightError } from "../src/lib/browser.js";
import { registerSessionTools } from "../src/tools/session.js";

function createMockBrowser() {
  return {
    newPage: vi.fn().mockResolvedValue({}),
    closePage: vi.fn().mockResolvedValue(undefined),
    listPages: vi.fn().mockReturnValue([
      { id: "page_1", url: "https://example.com", title: "Example" },
      { id: "page_2", url: "about:blank", title: "" },
    ]),
    getActivePageId: vi.fn().mockReturnValue("page_1"),
  } as unknown as BrowserManager;
}

let server: McpServer;
let browser: ReturnType<typeof createMockBrowser>;
let registeredTools: Map<string, (...args: unknown[]) => unknown>;

beforeEach(() => {
  vi.clearAllMocks();
  server = new McpServer({ name: "test", version: "1.0.0" });
  browser = createMockBrowser();
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as (...a: unknown[]) => unknown);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerSessionTools(server, browser as unknown as BrowserManager);
});

describe("Session tools — registration", () => {
  it("should_register_all_3_tools", () => {
    expect(registeredTools.has("new_page")).toBe(true);
    expect(registeredTools.has("close_page")).toBe(true);
    expect(registeredTools.has("list_pages")).toBe(true);
    expect(registeredTools.size).toBe(3);
  });
});

describe("Session tools — new_page", () => {
  it("should_create_new_page", async () => {
    const cb = registeredTools.get("new_page")!;
    const result = (await cb({})) as { content: { text: string }[] };
    expect((browser as unknown as { newPage: ReturnType<typeof vi.fn> }).newPage).toHaveBeenCalledOnce();
    const data = JSON.parse(result.content[0].text);
    expect(data.pageId).toBe("page_1");
    expect(data.message).toContain("New page");
  });
});

describe("Session tools — close_page", () => {
  it("should_close_active_page_when_no_id", async () => {
    const cb = registeredTools.get("close_page")!;
    const result = (await cb({})) as { content: { text: string }[] };
    expect((browser as unknown as { closePage: ReturnType<typeof vi.fn> }).closePage).toHaveBeenCalledWith(undefined);
    const data = JSON.parse(result.content[0].text);
    expect(data.closed).toBe("active page");
  });

  it("should_close_page_by_id", async () => {
    const cb = registeredTools.get("close_page")!;
    await cb({ pageId: "page_2" });
    expect((browser as unknown as { closePage: ReturnType<typeof vi.fn> }).closePage).toHaveBeenCalledWith("page_2");
  });

  it("should_handle_error_on_unknown_page", async () => {
    (browser as unknown as { closePage: ReturnType<typeof vi.fn> }).closePage.mockRejectedValue(
      new PlaywrightError("close_page", "Page page_99 not found"),
    );
    const cb = registeredTools.get("close_page")!;
    const result = (await cb({ pageId: "page_99" })) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("close_page");
  });
});

describe("Session tools — list_pages", () => {
  it("should_list_all_pages", async () => {
    const cb = registeredTools.get("list_pages")!;
    const result = (await cb({})) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBe(2);
    expect(data.pages).toHaveLength(2);
    expect(data.activePageId).toBe("page_1");
  });

  it("should_return_empty_list_when_no_pages", async () => {
    (browser as unknown as { listPages: ReturnType<typeof vi.fn> }).listPages.mockReturnValue([]);
    (browser as unknown as { getActivePageId: ReturnType<typeof vi.fn> }).getActivePageId.mockReturnValue(null);
    const cb = registeredTools.get("list_pages")!;
    const result = (await cb({})) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBe(0);
    expect(data.activePageId).toBeNull();
  });
});
