import { describe, expect, it } from "vitest";
import {
  AttachPaymentMethodSchema,
  CancelPaymentIntentSchema,
  CancelSubscriptionSchema,
  ConfirmPaymentIntentSchema,
  CreateCheckoutSessionSchema,
  CreateCouponSchema,
  CreateCustomerSchema,
  CreateInvoiceSchema,
  CreatePaymentIntentSchema,
  CreatePaymentLinkSchema,
  CreatePayoutSchema,
  CreatePortalSessionSchema,
  CreatePriceSchema,
  CreateProductSchema,
  CreatePromoCodeSchema,
  CreateRefundSchema,
  CreateSubscriptionSchema,
  CreateWebhookSchema,
  FinalizeInvoiceSchema,
  RawApiCallSchema,
  SearchCustomersSchema,
  UpdateCustomerSchema,
  UpdateDisputeSchema,
  UpdateSubscriptionSchema,
} from "../src/lib/schemas.js";

describe("Customer schemas", () => {
  it("create", () => {
    expect(CreateCustomerSchema.safeParse({ email: "jay@shinkofa.com", name: "Jay" }).success).toBe(true);
  });
  it("update", () => {
    expect(UpdateCustomerSchema.safeParse({ customer_id: "cus_123", name: "Jay Updated" }).success).toBe(true);
  });
  it("search", () => {
    expect(SearchCustomersSchema.safeParse({ query: "email:'jay@shinkofa.com'" }).success).toBe(true);
  });
});

describe("Payment schemas", () => {
  it("create PI", () => {
    expect(CreatePaymentIntentSchema.safeParse({ amount: 2000, currency: "eur" }).success).toBe(true);
  });
  it("reject amount 0", () => {
    expect(CreatePaymentIntentSchema.safeParse({ amount: 0, currency: "eur" }).success).toBe(false);
  });
  it("confirm", () => {
    expect(ConfirmPaymentIntentSchema.safeParse({ payment_intent_id: "pi_123" }).success).toBe(true);
  });
  it("cancel", () => {
    expect(
      CancelPaymentIntentSchema.safeParse({ payment_intent_id: "pi_123", cancellation_reason: "duplicate" }).success,
    ).toBe(true);
  });
  it("refund", () => {
    expect(CreateRefundSchema.safeParse({ payment_intent: "pi_123", amount: 500 }).success).toBe(true);
  });
});

describe("Subscription schemas", () => {
  it("create", () => {
    expect(CreateSubscriptionSchema.safeParse({ customer: "cus_123", items: [{ price: "price_123" }] }).success).toBe(
      true,
    );
  });
  it("reject empty items", () => {
    expect(CreateSubscriptionSchema.safeParse({ customer: "cus_123", items: [] }).success).toBe(false);
  });
  it("update", () => {
    expect(UpdateSubscriptionSchema.safeParse({ subscription_id: "sub_123", cancel_at_period_end: true }).success).toBe(
      true,
    );
  });
  it("cancel with feedback", () => {
    expect(
      CancelSubscriptionSchema.safeParse({
        subscription_id: "sub_123",
        cancellation_details: { feedback: "too_expensive" },
      }).success,
    ).toBe(true);
  });
});

describe("Invoice schemas", () => {
  it("create", () => {
    expect(CreateInvoiceSchema.safeParse({ customer: "cus_123" }).success).toBe(true);
  });
  it("finalize", () => {
    expect(FinalizeInvoiceSchema.safeParse({ invoice_id: "in_123" }).success).toBe(true);
  });
});

describe("Catalog schemas", () => {
  it("create product", () => {
    expect(CreateProductSchema.safeParse({ name: "Coaching Sensei" }).success).toBe(true);
  });
  it("create price recurring", () => {
    expect(
      CreatePriceSchema.safeParse({
        product: "prod_123",
        unit_amount: 9900,
        currency: "eur",
        recurring: { interval: "month" },
      }).success,
    ).toBe(true);
  });
  it("create coupon", () => {
    expect(CreateCouponSchema.safeParse({ percent_off: 20, duration: "once" }).success).toBe(true);
  });
  it("create promo code", () => {
    expect(CreatePromoCodeSchema.safeParse({ coupon: "coupon_123", code: "SHINKOFA20" }).success).toBe(true);
  });
});

describe("Checkout schemas", () => {
  it("create session", () => {
    expect(
      CreateCheckoutSessionSchema.safeParse({
        mode: "subscription",
        line_items: [{ price: "price_123", quantity: 1 }],
        success_url: "https://shinkofa.com/success",
      }).success,
    ).toBe(true);
  });
  it("create payment link", () => {
    expect(CreatePaymentLinkSchema.safeParse({ line_items: [{ price: "price_123" }] }).success).toBe(true);
  });
});

describe("Billing schemas", () => {
  it("attach PM", () => {
    expect(AttachPaymentMethodSchema.safeParse({ payment_method_id: "pm_123", customer: "cus_123" }).success).toBe(
      true,
    );
  });
  it("portal session", () => {
    expect(
      CreatePortalSessionSchema.safeParse({ customer: "cus_123", return_url: "https://shinkofa.com" }).success,
    ).toBe(true);
  });
});

describe("Finance schemas", () => {
  it("create payout", () => {
    expect(CreatePayoutSchema.safeParse({ amount: 10000, currency: "eur" }).success).toBe(true);
  });
  it("update dispute", () => {
    expect(
      UpdateDisputeSchema.safeParse({ dispute_id: "dp_123", evidence: { customer_email_address: "jay@shinkofa.com" } })
        .success,
    ).toBe(true);
  });
  it("create webhook", () => {
    expect(
      CreateWebhookSchema.safeParse({ url: "https://shinkofa.com/webhook", enabled_events: ["invoice.paid"] }).success,
    ).toBe(true);
  });
});

describe("Raw schema", () => {
  it("GET", () => {
    expect(RawApiCallSchema.safeParse({ method: "GET", path: "/tax/settings" }).success).toBe(true);
  });
  it("POST with params", () => {
    expect(
      RawApiCallSchema.safeParse({ method: "POST", path: "/tax/calculations", params: { currency: "eur" } }).success,
    ).toBe(true);
  });
});
