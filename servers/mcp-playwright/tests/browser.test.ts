import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPage, mockContext, mockBrowser } = vi.hoisted(() => {
  const mockPage = {
    setDefaultTimeout: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
    isClosed: vi.fn().mockReturnValue(false),
    url: vi.fn().mockReturnValue("about:blank"),
  };

  const mockContext = {
    newPage: vi.fn().mockResolvedValue(mockPage),
  };

  const mockBrowser = {
    isConnected: vi.fn().mockReturnValue(true),
    newContext: vi.fn().mockResolvedValue(mockContext),
    close: vi.fn().mockResolvedValue(undefined),
  };

  return { mockPage, mockContext, mockBrowser };
});

vi.mock("playwright", () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue(mockBrowser),
  },
}));

import { BrowserManager, PlaywrightError } from "../src/lib/browser.js";

describe("PlaywrightError", () => {
  it("should_set_action_and_message", () => {
    const err = new PlaywrightError("click", "Element not found");
    expect(err.action).toBe("click");
    expect(err.message).toBe("Playwright click: Element not found");
    expect(err.name).toBe("PlaywrightError");
  });

  it("should_store_selector_when_provided", () => {
    const err = new PlaywrightError("fill", "Timeout", "#input");
    expect(err.selector).toBe("#input");
  });

  it("should_be_instanceof_Error", () => {
    const err = new PlaywrightError("navigate", "failed");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("BrowserManager", () => {
  let manager: BrowserManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowser.isConnected.mockReturnValue(true);
    mockContext.newPage.mockResolvedValue(mockPage);
    mockPage.isClosed.mockReturnValue(false);
    manager = new BrowserManager();
  });

  it("should_use_default_config", () => {
    const m = new BrowserManager();
    expect(m).toBeDefined();
  });

  it("should_accept_custom_config", () => {
    const m = new BrowserManager({ headless: false, defaultTimeout: 5000 });
    expect(m).toBeDefined();
  });

  describe("getActivePage", () => {
    it("should_create_page_on_first_call", async () => {
      const page = await manager.getActivePage();
      expect(page).toBe(mockPage);
      expect(mockContext.newPage).toHaveBeenCalledOnce();
    });

    it("should_return_same_page_on_second_call", async () => {
      const page1 = await manager.getActivePage();
      const page2 = await manager.getActivePage();
      expect(page1).toBe(page2);
      expect(mockContext.newPage).toHaveBeenCalledOnce();
    });

    it("should_set_default_timeout_on_new_page", async () => {
      await manager.getActivePage();
      expect(mockPage.setDefaultTimeout).toHaveBeenCalledWith(30_000);
    });

    it("should_use_custom_timeout", async () => {
      const m = new BrowserManager({ defaultTimeout: 5000 });
      await m.getActivePage();
      expect(mockPage.setDefaultTimeout).toHaveBeenCalledWith(5000);
    });
  });

  describe("newPage", () => {
    it("should_create_new_page_and_set_active", async () => {
      await manager.newPage();
      expect(manager.getActivePageId()).toBe("page_1");
    });

    it("should_increment_page_ids", async () => {
      await manager.newPage();
      await manager.newPage();
      expect(manager.getActivePageId()).toBe("page_2");
    });

    it("should_launch_browser_if_not_connected", async () => {
      const { chromium } = await import("playwright");
      mockBrowser.isConnected.mockReturnValue(false);
      const freshManager = new BrowserManager();
      await freshManager.newPage();
      expect(chromium.launch).toHaveBeenCalled();
    });
  });

  describe("closePage", () => {
    it("should_close_active_page", async () => {
      await manager.newPage();
      await manager.closePage();
      expect(mockPage.close).toHaveBeenCalledOnce();
      expect(manager.getActivePageId()).toBeNull();
    });

    it("should_close_page_by_id", async () => {
      await manager.newPage();
      await manager.closePage("page_1");
      expect(mockPage.close).toHaveBeenCalledOnce();
    });

    it("should_throw_for_unknown_page", async () => {
      await expect(manager.closePage("page_999")).rejects.toThrow(PlaywrightError);
    });

    it("should_throw_when_no_active_page", async () => {
      await expect(manager.closePage()).rejects.toThrow(PlaywrightError);
    });

    it("should_set_last_remaining_page_as_active", async () => {
      const mockPage2 = {
        setDefaultTimeout: vi.fn(),
        close: vi.fn().mockResolvedValue(undefined),
        isClosed: vi.fn().mockReturnValue(false),
        url: vi.fn().mockReturnValue("about:blank"),
      };
      mockContext.newPage.mockResolvedValueOnce(mockPage).mockResolvedValueOnce(mockPage2);
      await manager.newPage();
      await manager.newPage();
      await manager.closePage("page_2");
      expect(manager.getActivePageId()).toBe("page_1");
    });

    it("should_skip_close_on_already_closed_page", async () => {
      mockPage.isClosed.mockReturnValue(true);
      await manager.newPage();
      await manager.closePage();
      expect(mockPage.close).not.toHaveBeenCalled();
    });
  });

  describe("listPages", () => {
    it("should_return_empty_array_initially", () => {
      expect(manager.listPages()).toEqual([]);
    });

    it("should_list_open_pages", async () => {
      await manager.newPage();
      const pages = manager.listPages();
      expect(pages).toHaveLength(1);
      expect(pages[0]).toEqual({ id: "page_1", url: "about:blank", title: "" });
    });

    it("should_exclude_closed_pages", async () => {
      mockPage.isClosed.mockReturnValue(true);
      await manager.newPage();
      expect(manager.listPages()).toHaveLength(0);
    });
  });

  describe("setActivePage", () => {
    it("should_set_active_page_by_id", async () => {
      const mockPage2 = {
        setDefaultTimeout: vi.fn(),
        isClosed: vi.fn().mockReturnValue(false),
        url: vi.fn().mockReturnValue("about:blank"),
      };
      mockContext.newPage.mockResolvedValueOnce(mockPage).mockResolvedValueOnce(mockPage2);
      await manager.newPage();
      await manager.newPage();
      manager.setActivePage("page_1");
      expect(manager.getActivePageId()).toBe("page_1");
    });

    it("should_throw_for_unknown_page", () => {
      expect(() => manager.setActivePage("page_999")).toThrow(PlaywrightError);
    });
  });

  describe("close", () => {
    it("should_close_browser_and_reset_state", async () => {
      await manager.newPage();
      await manager.close();
      expect(mockBrowser.close).toHaveBeenCalledOnce();
      expect(manager.getActivePageId()).toBeNull();
      expect(manager.listPages()).toEqual([]);
    });

    it("should_be_safe_to_call_when_not_launched", async () => {
      await manager.close();
      expect(mockBrowser.close).not.toHaveBeenCalled();
    });
  });
});
