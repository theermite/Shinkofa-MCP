import { describe, expect, it } from "vitest";
import {
  ClickSchema,
  ClosePageSchema,
  EvaluateSchema,
  FillSchema,
  GetContentSchema,
  GetTextSchema,
  GoBackSchema,
  GoForwardSchema,
  HoverSchema,
  ListPagesSchema,
  NavigateSchema,
  NewPageSchema,
  PdfSchema,
  PressKeySchema,
  QuerySelectorAllSchema,
  QuerySelectorSchema,
  ReloadSchema,
  ScreenshotSchema,
  SelectOptionSchema,
  WaitForSelectorSchema,
} from "../src/lib/schemas.js";

// ── Navigation ──

describe("NavigateSchema", () => {
  it("should_accept_valid_url", () => {
    expect(NavigateSchema.safeParse({ url: "https://example.com" }).success).toBe(true);
  });

  it("should_accept_url_with_waitUntil", () => {
    expect(NavigateSchema.safeParse({ url: "https://example.com", waitUntil: "networkidle" }).success).toBe(true);
  });

  it("should_accept_url_with_timeout", () => {
    expect(NavigateSchema.safeParse({ url: "https://example.com", timeout: 5000 }).success).toBe(true);
  });

  it("should_reject_invalid_url", () => {
    expect(NavigateSchema.safeParse({ url: "not-a-url" }).success).toBe(false);
  });

  it("should_reject_missing_url", () => {
    expect(NavigateSchema.safeParse({}).success).toBe(false);
  });

  it("should_reject_invalid_waitUntil", () => {
    expect(NavigateSchema.safeParse({ url: "https://example.com", waitUntil: "invalid" }).success).toBe(false);
  });

  it("should_reject_negative_timeout", () => {
    expect(NavigateSchema.safeParse({ url: "https://example.com", timeout: -1 }).success).toBe(false);
  });
});

describe("GoBackSchema", () => {
  it("should_accept_empty_object", () => {
    expect(GoBackSchema.safeParse({}).success).toBe(true);
  });

  it("should_accept_valid_waitUntil", () => {
    expect(GoBackSchema.safeParse({ waitUntil: "domcontentloaded" }).success).toBe(true);
  });

  it("should_reject_invalid_waitUntil", () => {
    expect(GoBackSchema.safeParse({ waitUntil: "nope" }).success).toBe(false);
  });
});

describe("GoForwardSchema", () => {
  it("should_accept_empty_object", () => {
    expect(GoForwardSchema.safeParse({}).success).toBe(true);
  });

  it("should_accept_valid_waitUntil", () => {
    expect(GoForwardSchema.safeParse({ waitUntil: "commit" }).success).toBe(true);
  });
});

describe("ReloadSchema", () => {
  it("should_accept_empty_object", () => {
    expect(ReloadSchema.safeParse({}).success).toBe(true);
  });

  it("should_accept_valid_waitUntil", () => {
    expect(ReloadSchema.safeParse({ waitUntil: "load" }).success).toBe(true);
  });
});

// ── Content ──

describe("GetContentSchema", () => {
  it("should_accept_empty_object", () => {
    expect(GetContentSchema.safeParse({}).success).toBe(true);
  });

  it("should_accept_selector", () => {
    expect(GetContentSchema.safeParse({ selector: "#main" }).success).toBe(true);
  });
});

describe("GetTextSchema", () => {
  it("should_accept_empty_object", () => {
    expect(GetTextSchema.safeParse({}).success).toBe(true);
  });

  it("should_accept_selector", () => {
    expect(GetTextSchema.safeParse({ selector: ".content" }).success).toBe(true);
  });
});

describe("ScreenshotSchema", () => {
  it("should_accept_empty_object", () => {
    expect(ScreenshotSchema.safeParse({}).success).toBe(true);
  });

  it("should_accept_selector_and_fullPage", () => {
    expect(ScreenshotSchema.safeParse({ selector: "#hero", fullPage: true }).success).toBe(true);
  });
});

describe("PdfSchema", () => {
  it("should_accept_empty_object", () => {
    expect(PdfSchema.safeParse({}).success).toBe(true);
  });

  it("should_accept_valid_format", () => {
    expect(PdfSchema.safeParse({ format: "A3", landscape: true }).success).toBe(true);
  });

  it("should_reject_invalid_format", () => {
    expect(PdfSchema.safeParse({ format: "B5" }).success).toBe(false);
  });
});

// ── Interaction ──

describe("ClickSchema", () => {
  it("should_accept_selector_only", () => {
    expect(ClickSchema.safeParse({ selector: "#btn" }).success).toBe(true);
  });

  it("should_accept_full_options", () => {
    expect(ClickSchema.safeParse({ selector: "#btn", button: "right", clickCount: 2, timeout: 3000 }).success).toBe(
      true,
    );
  });

  it("should_reject_missing_selector", () => {
    expect(ClickSchema.safeParse({}).success).toBe(false);
  });

  it("should_reject_invalid_button", () => {
    expect(ClickSchema.safeParse({ selector: "#btn", button: "top" }).success).toBe(false);
  });
});

describe("FillSchema", () => {
  it("should_accept_valid_input", () => {
    expect(FillSchema.safeParse({ selector: "input[name=email]", value: "test@test.com" }).success).toBe(true);
  });

  it("should_reject_missing_value", () => {
    expect(FillSchema.safeParse({ selector: "input" }).success).toBe(false);
  });

  it("should_reject_missing_selector", () => {
    expect(FillSchema.safeParse({ value: "test" }).success).toBe(false);
  });
});

describe("SelectOptionSchema", () => {
  it("should_accept_value_selection", () => {
    expect(SelectOptionSchema.safeParse({ selector: "select", value: "opt1" }).success).toBe(true);
  });

  it("should_accept_label_selection", () => {
    expect(SelectOptionSchema.safeParse({ selector: "select", label: "Option 1" }).success).toBe(true);
  });

  it("should_accept_index_selection", () => {
    expect(SelectOptionSchema.safeParse({ selector: "select", index: 0 }).success).toBe(true);
  });

  it("should_accept_selector_only", () => {
    expect(SelectOptionSchema.safeParse({ selector: "select" }).success).toBe(true);
  });

  it("should_reject_missing_selector", () => {
    expect(SelectOptionSchema.safeParse({ value: "opt1" }).success).toBe(false);
  });
});

describe("PressKeySchema", () => {
  it("should_accept_key_only", () => {
    expect(PressKeySchema.safeParse({ key: "Enter" }).success).toBe(true);
  });

  it("should_accept_key_with_selector", () => {
    expect(PressKeySchema.safeParse({ key: "Tab", selector: "input" }).success).toBe(true);
  });

  it("should_reject_missing_key", () => {
    expect(PressKeySchema.safeParse({}).success).toBe(false);
  });
});

describe("HoverSchema", () => {
  it("should_accept_valid_input", () => {
    expect(HoverSchema.safeParse({ selector: ".menu-item" }).success).toBe(true);
  });

  it("should_accept_with_timeout", () => {
    expect(HoverSchema.safeParse({ selector: ".menu-item", timeout: 5000 }).success).toBe(true);
  });

  it("should_reject_missing_selector", () => {
    expect(HoverSchema.safeParse({}).success).toBe(false);
  });
});

// ── Query ──

describe("QuerySelectorSchema", () => {
  it("should_accept_selector_only", () => {
    expect(QuerySelectorSchema.safeParse({ selector: "h1" }).success).toBe(true);
  });

  it("should_accept_custom_attributes", () => {
    expect(QuerySelectorSchema.safeParse({ selector: "h1", attributes: ["id", "data-testid"] }).success).toBe(true);
  });

  it("should_reject_missing_selector", () => {
    expect(QuerySelectorSchema.safeParse({}).success).toBe(false);
  });
});

describe("QuerySelectorAllSchema", () => {
  it("should_accept_selector_only", () => {
    expect(QuerySelectorAllSchema.safeParse({ selector: "li" }).success).toBe(true);
  });

  it("should_accept_with_limit", () => {
    expect(QuerySelectorAllSchema.safeParse({ selector: "li", limit: 10 }).success).toBe(true);
  });

  it("should_reject_zero_limit", () => {
    expect(QuerySelectorAllSchema.safeParse({ selector: "li", limit: 0 }).success).toBe(false);
  });

  it("should_reject_negative_limit", () => {
    expect(QuerySelectorAllSchema.safeParse({ selector: "li", limit: -5 }).success).toBe(false);
  });
});

describe("EvaluateSchema", () => {
  it("should_accept_expression", () => {
    expect(EvaluateSchema.safeParse({ expression: "document.title" }).success).toBe(true);
  });

  it("should_reject_missing_expression", () => {
    expect(EvaluateSchema.safeParse({}).success).toBe(false);
  });
});

describe("WaitForSelectorSchema", () => {
  it("should_accept_selector_only", () => {
    expect(WaitForSelectorSchema.safeParse({ selector: "#loaded" }).success).toBe(true);
  });

  it("should_accept_all_states", () => {
    for (const state of ["attached", "detached", "visible", "hidden"]) {
      expect(WaitForSelectorSchema.safeParse({ selector: "#el", state }).success).toBe(true);
    }
  });

  it("should_reject_invalid_state", () => {
    expect(WaitForSelectorSchema.safeParse({ selector: "#el", state: "ready" }).success).toBe(false);
  });
});

// ── Session ──

describe("NewPageSchema", () => {
  it("should_accept_empty_object", () => {
    expect(NewPageSchema.safeParse({}).success).toBe(true);
  });
});

describe("ClosePageSchema", () => {
  it("should_accept_empty_object", () => {
    expect(ClosePageSchema.safeParse({}).success).toBe(true);
  });

  it("should_accept_pageId", () => {
    expect(ClosePageSchema.safeParse({ pageId: "page_1" }).success).toBe(true);
  });
});

describe("ListPagesSchema", () => {
  it("should_accept_empty_object", () => {
    expect(ListPagesSchema.safeParse({}).success).toBe(true);
  });
});
