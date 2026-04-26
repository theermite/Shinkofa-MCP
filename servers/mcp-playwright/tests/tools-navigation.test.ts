import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BrowserManager } from "../src/lib/browser.js";
import { PlaywrightError } from "../src/lib/browser.js";
import { registerNavigationTools } from "../src/tools/navigation.js";

const mockPage = {
  goto: vi.fn().mockResolvedValue({ status: () => 200 }),
  goBack: vi.fn().mockResolvedValue(null),
  goForward: vi.fn().mockResolvedValue(null),
  reload: vi.fn().mockResolvedValue(null),
  url: vi.fn().mockReturnValue("https://example.com"),
  title: vi.fn().mockResolvedValue("Example"),
};

function createMockBrowser(): BrowserManager {
  return { getActivePage: vi.fn().mockResolvedValue(mockPage) } as unknown as BrowserManager;
}

let server: McpServer;
let browser: BrowserManager;
let registeredTools: Map<string, (...args: unknown[]) => unknown>;

beforeEach(() => {
  vi.clearAllMocks();
  mockPage.goto.mockResolvedValue({ status: () => 200 });
  mockPage.goBack.mockResolvedValue(null);
  mockPage.goForward.mockResolvedValue(null);
  mockPage.reload.mockResolvedValue(null);
  mockPage.url.mockReturnValue("https://example.com");
  mockPage.title.mockResolvedValue("Example");
  server = new McpServer({ name: "test", version: "1.0.0" });
  browser = createMockBrowser();
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as (...a: unknown[]) => unknown);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerNavigationTools(server, browser);
});

describe("Navigation tools — registration", () => {
  it("should_register_all_4_tools", () => {
    expect(registeredTools.has("navigate")).toBe(true);
    expect(registeredTools.has("go_back")).toBe(true);
    expect(registeredTools.has("go_forward")).toBe(true);
    expect(registeredTools.has("reload")).toBe(true);
    expect(registeredTools.size).toBe(4);
  });
});

describe("Navigation tools — calls", () => {
  it("should_navigate_to_url", async () => {
    const cb = registeredTools.get("navigate")!;
    const result = (await cb({ url: "https://example.com" })) as { content: { text: string }[] };
    expect(mockPage.goto).toHaveBeenCalledWith("https://example.com", { waitUntil: "load", timeout: undefined });
    const data = JSON.parse(result.content[0].text);
    expect(data.url).toBe("https://example.com");
    expect(data.title).toBe("Example");
    expect(data.status).toBe(200);
  });

  it("should_pass_waitUntil_and_timeout", async () => {
    const cb = registeredTools.get("navigate")!;
    await cb({ url: "https://example.com", waitUntil: "networkidle", timeout: 5000 });
    expect(mockPage.goto).toHaveBeenCalledWith("https://example.com", { waitUntil: "networkidle", timeout: 5000 });
  });

  it("should_handle_null_response_status", async () => {
    mockPage.goto.mockResolvedValue(null);
    const cb = registeredTools.get("navigate")!;
    const result = (await cb({ url: "https://example.com" })) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data.status).toBeNull();
  });

  it("should_go_back", async () => {
    const cb = registeredTools.get("go_back")!;
    const result = (await cb({})) as { content: { text: string }[] };
    expect(mockPage.goBack).toHaveBeenCalledWith({ waitUntil: "load" });
    const data = JSON.parse(result.content[0].text);
    expect(data.url).toBe("https://example.com");
  });

  it("should_go_forward_with_waitUntil", async () => {
    const cb = registeredTools.get("go_forward")!;
    await cb({ waitUntil: "domcontentloaded" });
    expect(mockPage.goForward).toHaveBeenCalledWith({ waitUntil: "domcontentloaded" });
  });

  it("should_reload_page", async () => {
    const cb = registeredTools.get("reload")!;
    const result = (await cb({})) as { content: { text: string }[] };
    expect(mockPage.reload).toHaveBeenCalledWith({ waitUntil: "load" });
    const data = JSON.parse(result.content[0].text);
    expect(data.title).toBe("Example");
  });
});

describe("Navigation tools — error handling", () => {
  it("should_handle_PlaywrightError", async () => {
    mockPage.goto.mockRejectedValue(new PlaywrightError("navigate", "net::ERR_NAME_NOT_RESOLVED"));
    const cb = registeredTools.get("navigate")!;
    const result = (await cb({ url: "https://bad.invalid" })) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("navigate");
  });

  it("should_handle_TypeError", async () => {
    mockPage.goBack.mockRejectedValue(new TypeError("Navigation failed"));
    const cb = registeredTools.get("go_back")!;
    const result = (await cb({})) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Navigation failed");
  });

  it("should_rethrow_unhandled_error", async () => {
    mockPage.reload.mockRejectedValue(new Error("unknown crash"));
    const cb = registeredTools.get("reload")!;
    await expect(cb({})).rejects.toThrow("unknown crash");
  });
});
