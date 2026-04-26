import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BrowserManager } from "../src/lib/browser.js";
import { PlaywrightError } from "../src/lib/browser.js";
import { registerQueryTools } from "../src/tools/query.js";

const mockElement = {
  getAttribute: vi.fn().mockImplementation((attr: string) => {
    const attrs: Record<string, string> = { id: "main", class: "content", href: "/about" };
    return Promise.resolve(attrs[attr] ?? null);
  }),
  innerText: vi.fn().mockResolvedValue("Element text"),
  isVisible: vi.fn().mockResolvedValue(true),
};

const mockPage = {
  $: vi.fn().mockResolvedValue(mockElement),
  $$: vi.fn().mockResolvedValue([mockElement, mockElement, mockElement]),
  evaluate: vi.fn().mockResolvedValue("evaluated result"),
  waitForSelector: vi.fn().mockResolvedValue(mockElement),
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
  mockPage.$$.mockResolvedValue([mockElement, mockElement, mockElement]);
  mockPage.evaluate.mockResolvedValue("evaluated result");
  mockPage.waitForSelector.mockResolvedValue(mockElement);
  mockElement.getAttribute.mockImplementation((attr: string) => {
    const attrs: Record<string, string> = { id: "main", class: "content", href: "/about" };
    return Promise.resolve(attrs[attr] ?? null);
  });
  server = new McpServer({ name: "test", version: "1.0.0" });
  browser = createMockBrowser();
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as (...a: unknown[]) => unknown);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerQueryTools(server, browser);
});

describe("Query tools — registration", () => {
  it("should_register_all_4_tools", () => {
    expect(registeredTools.has("query_selector")).toBe(true);
    expect(registeredTools.has("query_selector_all")).toBe(true);
    expect(registeredTools.has("evaluate")).toBe(true);
    expect(registeredTools.has("wait_for_selector")).toBe(true);
    expect(registeredTools.size).toBe(4);
  });
});

describe("Query tools — query_selector", () => {
  it("should_return_element_info_when_found", async () => {
    const cb = registeredTools.get("query_selector")!;
    const result = (await cb({ selector: "#main" })) as { content: { text: string }[] };
    expect(mockPage.$).toHaveBeenCalledWith("#main");
    const data = JSON.parse(result.content[0].text);
    expect(data.found).toBe(true);
    expect(data.text).toBe("Element text");
    expect(data.visible).toBe(true);
    expect(data.attributes.id).toBe("main");
    expect(data.attributes.class).toBe("content");
  });

  it("should_return_found_false_when_not_found", async () => {
    mockPage.$.mockResolvedValue(null);
    const cb = registeredTools.get("query_selector")!;
    const result = (await cb({ selector: ".missing" })) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data.found).toBe(false);
  });

  it("should_extract_custom_attributes", async () => {
    const cb = registeredTools.get("query_selector")!;
    await cb({ selector: "a", attributes: ["href", "id"] });
    expect(mockElement.getAttribute).toHaveBeenCalledWith("href");
    expect(mockElement.getAttribute).toHaveBeenCalledWith("id");
  });

  it("should_filter_null_attributes", async () => {
    const cb = registeredTools.get("query_selector")!;
    const result = (await cb({ selector: "#main", attributes: ["id", "data-nonexistent"] })) as {
      content: { text: string }[];
    };
    const data = JSON.parse(result.content[0].text);
    expect(data.attributes.id).toBe("main");
    expect(data.attributes["data-nonexistent"]).toBeUndefined();
  });
});

describe("Query tools — query_selector_all", () => {
  it("should_return_all_matching_elements", async () => {
    const cb = registeredTools.get("query_selector_all")!;
    const result = (await cb({ selector: "li" })) as { content: { text: string }[] };
    expect(mockPage.$$).toHaveBeenCalledWith("li");
    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBe(3);
    expect(data.elements).toHaveLength(3);
    expect(data.truncated).toBe(false);
  });

  it("should_respect_limit", async () => {
    const cb = registeredTools.get("query_selector_all")!;
    const result = (await cb({ selector: "li", limit: 2 })) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBe(3);
    expect(data.elements).toHaveLength(2);
    expect(data.truncated).toBe(true);
  });
});

describe("Query tools — evaluate", () => {
  it("should_evaluate_expression", async () => {
    const cb = registeredTools.get("evaluate")!;
    const result = (await cb({ expression: "document.title" })) as { content: { text: string }[] };
    expect(mockPage.evaluate).toHaveBeenCalledWith("document.title");
    const data = JSON.parse(result.content[0].text);
    expect(data.result).toBe("evaluated result");
  });

  it("should_handle_complex_return_values", async () => {
    mockPage.evaluate.mockResolvedValue({ count: 5, items: ["a", "b"] });
    const cb = registeredTools.get("evaluate")!;
    const result = (await cb({ expression: "getItems()" })) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data.result).toEqual({ count: 5, items: ["a", "b"] });
  });
});

describe("Query tools — wait_for_selector", () => {
  it("should_wait_with_default_state", async () => {
    const cb = registeredTools.get("wait_for_selector")!;
    const result = (await cb({ selector: "#loaded" })) as { content: { text: string }[] };
    expect(mockPage.waitForSelector).toHaveBeenCalledWith("#loaded", { state: "visible", timeout: undefined });
    const data = JSON.parse(result.content[0].text);
    expect(data.selector).toBe("#loaded");
    expect(data.state).toBe("visible");
  });

  it("should_wait_with_custom_state_and_timeout", async () => {
    const cb = registeredTools.get("wait_for_selector")!;
    await cb({ selector: ".spinner", state: "hidden", timeout: 10000 });
    expect(mockPage.waitForSelector).toHaveBeenCalledWith(".spinner", { state: "hidden", timeout: 10000 });
  });
});

describe("Query tools — error handling", () => {
  it("should_handle_PlaywrightError_on_evaluate", async () => {
    mockPage.evaluate.mockRejectedValue(new PlaywrightError("evaluate", "Execution context destroyed"));
    const cb = registeredTools.get("evaluate")!;
    const result = (await cb({ expression: "x" })) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("evaluate");
  });

  it("should_handle_PlaywrightError_on_wait", async () => {
    mockPage.waitForSelector.mockRejectedValue(new PlaywrightError("wait_for_selector", "Timeout 5000ms exceeded"));
    const cb = registeredTools.get("wait_for_selector")!;
    const result = (await cb({ selector: "#never" })) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("wait_for_selector");
  });

  it("should_rethrow_unhandled_error", async () => {
    mockPage.evaluate.mockRejectedValue(new Error("unknown"));
    const cb = registeredTools.get("evaluate")!;
    await expect(cb({ expression: "x" })).rejects.toThrow("unknown");
  });
});
