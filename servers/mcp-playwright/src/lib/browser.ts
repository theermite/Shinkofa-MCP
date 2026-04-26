import { type Browser, type BrowserContext, chromium, type Page } from "playwright";

export interface BrowserManagerConfig {
  headless?: boolean;
  defaultTimeout?: number;
}

export class PlaywrightError extends Error {
  constructor(
    public readonly action: string,
    message: string,
    public readonly selector?: string,
  ) {
    super(`Playwright ${action}: ${message}`);
    this.name = "PlaywrightError";
  }
}

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private pages: Map<string, Page> = new Map();
  private activePageId: string | null = null;
  private nextPageId = 1;
  private readonly headless: boolean;
  private readonly defaultTimeout: number;

  constructor(config?: BrowserManagerConfig) {
    this.headless = config?.headless ?? true;
    this.defaultTimeout = config?.defaultTimeout ?? 30_000;
  }

  private async ensureBrowser(): Promise<Browser> {
    if (!this.browser?.isConnected()) {
      this.browser = await chromium.launch({ headless: this.headless });
      this.context = await this.browser.newContext();
      this.pages.clear();
      this.activePageId = null;
    }
    return this.browser;
  }

  private async ensureContext(): Promise<BrowserContext> {
    await this.ensureBrowser();
    if (!this.context) {
      if (!this.browser) throw new PlaywrightError("ensureContext", "Browser not available");
      this.context = await this.browser.newContext();
    }
    return this.context;
  }

  async getActivePage(): Promise<Page> {
    if (this.activePageId) {
      const existing = this.pages.get(this.activePageId);
      if (existing) return existing;
    }
    return this.newPage();
  }

  async newPage(): Promise<Page> {
    const ctx = await this.ensureContext();
    const page = await ctx.newPage();
    page.setDefaultTimeout(this.defaultTimeout);
    const id = `page_${this.nextPageId++}`;
    this.pages.set(id, page);
    this.activePageId = id;
    return page;
  }

  async closePage(pageId?: string): Promise<void> {
    const id = pageId ?? this.activePageId;
    if (!id || !this.pages.has(id)) {
      throw new PlaywrightError("close_page", `Page ${id ?? "none"} not found`);
    }
    const page = this.pages.get(id);
    if (!page) throw new PlaywrightError("close_page", `Page ${id} not found`);
    if (!page.isClosed()) {
      await page.close();
    }
    this.pages.delete(id);
    if (this.activePageId === id) {
      const remaining = [...this.pages.keys()];
      this.activePageId = remaining.at(-1) ?? null;
    }
  }

  listPages(): Array<{ id: string; url: string; title: string }> {
    const result: Array<{ id: string; url: string; title: string }> = [];
    for (const [id, page] of this.pages) {
      if (!page.isClosed()) {
        result.push({ id, url: page.url(), title: "" });
      }
    }
    return result;
  }

  getActivePageId(): string | null {
    return this.activePageId;
  }

  setActivePage(pageId: string): void {
    if (!this.pages.has(pageId)) {
      throw new PlaywrightError("set_active_page", `Page ${pageId} not found`);
    }
    this.activePageId = pageId;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.pages.clear();
      this.activePageId = null;
    }
  }
}
