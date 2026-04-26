import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BrowserManager } from "../src/lib/browser.js";
import { PlaywrightError } from "../src/lib/browser.js";
import { registerInteractionTools } from "../src/tools/interaction.js";

const mockPage = {
  click: vi.fn().mockResolvedValue(undefined),
  fill: vi.fn().mockResolvedValue(undefined),
  selectOption: vi.fn().mockResolvedValue(["opt1"]),
  press: vi.fn().mockResolvedValue(undefined),
  hover: vi.fn().mockResolvedValue(undefined),
  keyboard: { press: vi.fn().mockResolvedValue(undefined) },
};

function createMockBrowser(): BrowserManager {
  return { getActivePage: vi.fn().mockResolvedValue(mockPage) } as unknown as BrowserManager;
}

let server: McpServer;
let browser: BrowserManager;
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

  registerInteractionTools(server, browser);
});

describe("Interaction tools — registration", () => {
  it("should_register_all_5_tools", () => {
    expect(registeredTools.has("click")).toBe(true);
    expect(registeredTools.has("fill")).toBe(true);
    expect(registeredTools.has("select_option")).toBe(true);
    expect(registeredTools.has("press_key")).toBe(true);
    expect(registeredTools.has("hover")).toBe(true);
    expect(registeredTools.size).toBe(5);
  });
});

describe("Interaction tools — click", () => {
  it("should_click_with_defaults", async () => {
    const cb = registeredTools.get("click")!;
    const result = (await cb({ selector: "#btn" })) as { content: { text: string }[] };
    expect(mockPage.click).toHaveBeenCalledWith("#btn", { button: "left", clickCount: 1, timeout: undefined });
    const data = JSON.parse(result.content[0].text);
    expect(data.clicked).toBe("#btn");
  });

  it("should_click_with_custom_options", async () => {
    const cb = registeredTools.get("click")!;
    await cb({ selector: "a.link", button: "right", clickCount: 2, timeout: 3000 });
    expect(mockPage.click).toHaveBeenCalledWith("a.link", { button: "right", clickCount: 2, timeout: 3000 });
  });
});

describe("Interaction tools — fill", () => {
  it("should_fill_input", async () => {
    const cb = registeredTools.get("fill")!;
    const result = (await cb({ selector: "#email", value: "test@test.com" })) as { content: { text: string }[] };
    expect(mockPage.fill).toHaveBeenCalledWith("#email", "test@test.com", { timeout: undefined });
    const data = JSON.parse(result.content[0].text);
    expect(data.filled).toBe("#email");
    expect(data.value).toBe("test@test.com");
  });

  it("should_fill_with_timeout", async () => {
    const cb = registeredTools.get("fill")!;
    await cb({ selector: "#name", value: "Jay", timeout: 5000 });
    expect(mockPage.fill).toHaveBeenCalledWith("#name", "Jay", { timeout: 5000 });
  });
});

describe("Interaction tools — select_option", () => {
  it("should_select_by_value", async () => {
    const cb = registeredTools.get("select_option")!;
    const result = (await cb({ selector: "select#country", value: "FR" })) as { content: { text: string }[] };
    expect(mockPage.selectOption).toHaveBeenCalledWith("select#country", { value: "FR" });
    const data = JSON.parse(result.content[0].text);
    expect(data.selected).toEqual(["opt1"]);
  });

  it("should_select_by_label", async () => {
    const cb = registeredTools.get("select_option")!;
    await cb({ selector: "select", label: "France" });
    expect(mockPage.selectOption).toHaveBeenCalledWith("select", { label: "France" });
  });

  it("should_select_by_index", async () => {
    const cb = registeredTools.get("select_option")!;
    await cb({ selector: "select", index: 2 });
    expect(mockPage.selectOption).toHaveBeenCalledWith("select", { index: 2 });
  });

  it("should_pass_empty_option_when_none_specified", async () => {
    const cb = registeredTools.get("select_option")!;
    await cb({ selector: "select" });
    expect(mockPage.selectOption).toHaveBeenCalledWith("select", {});
  });
});

describe("Interaction tools — press_key", () => {
  it("should_press_key_on_element", async () => {
    const cb = registeredTools.get("press_key")!;
    const result = (await cb({ key: "Enter", selector: "#input" })) as { content: { text: string }[] };
    expect(mockPage.press).toHaveBeenCalledWith("#input", "Enter");
    const data = JSON.parse(result.content[0].text);
    expect(data.pressed).toBe("Enter");
    expect(data.selector).toBe("#input");
  });

  it("should_press_key_globally_without_selector", async () => {
    const cb = registeredTools.get("press_key")!;
    const result = (await cb({ key: "Escape" })) as { content: { text: string }[] };
    expect(mockPage.keyboard.press).toHaveBeenCalledWith("Escape");
    const data = JSON.parse(result.content[0].text);
    expect(data.selector).toBe("active element");
  });
});

describe("Interaction tools — hover", () => {
  it("should_hover_over_element", async () => {
    const cb = registeredTools.get("hover")!;
    const result = (await cb({ selector: ".menu" })) as { content: { text: string }[] };
    expect(mockPage.hover).toHaveBeenCalledWith(".menu", { timeout: undefined });
    const data = JSON.parse(result.content[0].text);
    expect(data.hovered).toBe(".menu");
  });

  it("should_hover_with_timeout", async () => {
    const cb = registeredTools.get("hover")!;
    await cb({ selector: ".item", timeout: 2000 });
    expect(mockPage.hover).toHaveBeenCalledWith(".item", { timeout: 2000 });
  });
});

describe("Interaction tools — error handling", () => {
  it("should_handle_PlaywrightError_on_click", async () => {
    mockPage.click.mockRejectedValue(new PlaywrightError("click", "Element detached", "#btn"));
    const cb = registeredTools.get("click")!;
    const result = (await cb({ selector: "#btn" })) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("click");
  });

  it("should_handle_PlaywrightError_on_fill", async () => {
    mockPage.fill.mockRejectedValue(new PlaywrightError("fill", "Element is not an input", "#x"));
    const cb = registeredTools.get("fill")!;
    const result = (await cb({ selector: "#x", value: "v" })) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("fill");
    expect(result.content[0].text).toContain("#x");
  });

  it("should_handle_TypeError_on_hover", async () => {
    mockPage.hover.mockRejectedValue(new TypeError("fetch failed"));
    const cb = registeredTools.get("hover")!;
    const result = (await cb({ selector: ".x" })) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("fetch failed");
  });
});
