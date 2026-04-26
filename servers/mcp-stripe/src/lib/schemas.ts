/**
 * Zod schemas for Stripe MCP tool inputs.
 */
import { z } from "zod";

const Metadata = z.record(z.string()).optional().describe("Key-value metadata");
const OptionalCursor = z.string().optional().describe("Pagination cursor (starting_after or ending_before)");
const Expand = z.array(z.string()).optional().describe("Expand nested objects (e.g. ['data.customer'])");

// ── Customers ──

export const CreateCustomerSchema = z.object({
  email: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  payment_method: z.string().optional(),
  metadata: Metadata,
  address: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

export const UpdateCustomerSchema = z.object({
  customer_id: z.string(),
  email: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  default_payment_method: z.string().optional(),
  metadata: Metadata,
});

export const GetCustomerSchema = z.object({ customer_id: z.string(), expand: Expand });
export const ListCustomersSchema = z.object({
  email: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  starting_after: OptionalCursor,
  ending_before: OptionalCursor,
  expand: Expand,
});
export const SearchCustomersSchema = z.object({
  query: z.string().describe("Search query (e.g. \"email:'jay@shinkofa.com'\")"),
  limit: z.number().min(1).max(100).optional(),
});
export const DeleteCustomerSchema = z.object({ customer_id: z.string() });

// ── Payment Intents ──

export const CreatePaymentIntentSchema = z.object({
  amount: z.number().min(1).describe("Amount in smallest currency unit (cents)"),
  currency: z.string().min(3).max(3).describe("ISO 4217 currency code"),
  customer: z.string().optional(),
  payment_method: z.string().optional(),
  description: z.string().optional(),
  receipt_email: z.string().optional(),
  confirm: z.boolean().optional(),
  automatic_payment_methods: z.object({ enabled: z.boolean() }).optional(),
  metadata: Metadata,
});

export const GetPaymentIntentSchema = z.object({ payment_intent_id: z.string(), expand: Expand });
export const ListPaymentIntentsSchema = z.object({
  customer: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  starting_after: OptionalCursor,
  expand: Expand,
});
export const UpdatePaymentIntentSchema = z.object({
  payment_intent_id: z.string(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  customer: z.string().optional(),
  description: z.string().optional(),
  metadata: Metadata,
});
export const ConfirmPaymentIntentSchema = z.object({
  payment_intent_id: z.string(),
  payment_method: z.string().optional(),
  return_url: z.string().optional(),
});
export const CapturePaymentIntentSchema = z.object({
  payment_intent_id: z.string(),
  amount_to_capture: z.number().optional(),
});
export const CancelPaymentIntentSchema = z.object({
  payment_intent_id: z.string(),
  cancellation_reason: z.enum(["duplicate", "fraudulent", "requested_by_customer", "abandoned"]).optional(),
});

// ── Refunds ──

export const CreateRefundSchema = z.object({
  payment_intent: z.string().optional(),
  charge: z.string().optional(),
  amount: z.number().optional(),
  reason: z.enum(["duplicate", "fraudulent", "requested_by_customer"]).optional(),
  metadata: Metadata,
});
export const GetRefundSchema = z.object({ refund_id: z.string(), expand: Expand });
export const ListRefundsSchema = z.object({
  payment_intent: z.string().optional(),
  charge: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  starting_after: OptionalCursor,
});

// ── Products ──

export const CreateProductSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  active: z.boolean().optional(),
  default_price_data: z
    .object({
      unit_amount: z.number(),
      currency: z.string(),
      recurring: z
        .object({ interval: z.enum(["day", "week", "month", "year"]), interval_count: z.number().optional() })
        .optional(),
    })
    .optional(),
  metadata: Metadata,
});
export const UpdateProductSchema = z.object({
  product_id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
  default_price: z.string().optional(),
  metadata: Metadata,
});
export const GetProductSchema = z.object({ product_id: z.string(), expand: Expand });
export const ListProductsSchema = z.object({
  active: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional(),
  starting_after: OptionalCursor,
});
export const DeleteProductSchema = z.object({ product_id: z.string() });

// ── Prices ──

export const CreatePriceSchema = z.object({
  product: z.string().optional(),
  unit_amount: z.number().optional(),
  currency: z.string(),
  recurring: z
    .object({
      interval: z.enum(["day", "week", "month", "year"]),
      interval_count: z.number().optional(),
      usage_type: z.enum(["licensed", "metered"]).optional(),
    })
    .optional(),
  nickname: z.string().optional(),
  active: z.boolean().optional(),
  billing_scheme: z.enum(["per_unit", "tiered"]).optional(),
  tiers_mode: z.enum(["graduated", "volume"]).optional(),
  tiers: z
    .array(
      z.object({
        up_to: z.union([z.number(), z.literal("inf")]),
        unit_amount: z.number().optional(),
        flat_amount: z.number().optional(),
      }),
    )
    .optional(),
  metadata: Metadata,
});
export const UpdatePriceSchema = z.object({
  price_id: z.string(),
  nickname: z.string().optional(),
  active: z.boolean().optional(),
  metadata: Metadata,
});
export const GetPriceSchema = z.object({ price_id: z.string(), expand: Expand });
export const ListPricesSchema = z.object({
  product: z.string().optional(),
  active: z.boolean().optional(),
  type: z.enum(["one_time", "recurring"]).optional(),
  limit: z.number().min(1).max(100).optional(),
  starting_after: OptionalCursor,
});

// ── Subscriptions ──

export const CreateSubscriptionSchema = z.object({
  customer: z.string(),
  items: z.array(z.object({ price: z.string(), quantity: z.number().optional() })).min(1),
  default_payment_method: z.string().optional(),
  trial_period_days: z.number().optional(),
  coupon: z.string().optional(),
  promotion_code: z.string().optional(),
  cancel_at_period_end: z.boolean().optional(),
  collection_method: z.enum(["charge_automatically", "send_invoice"]).optional(),
  days_until_due: z.number().optional(),
  metadata: Metadata,
  expand: Expand,
});
export const UpdateSubscriptionSchema = z.object({
  subscription_id: z.string(),
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        price: z.string().optional(),
        quantity: z.number().optional(),
        deleted: z.boolean().optional(),
      }),
    )
    .optional(),
  default_payment_method: z.string().optional(),
  cancel_at_period_end: z.boolean().optional(),
  coupon: z.string().optional(),
  proration_behavior: z.enum(["create_prorations", "none", "always_invoice"]).optional(),
  metadata: Metadata,
});
export const GetSubscriptionSchema = z.object({ subscription_id: z.string(), expand: Expand });
export const ListSubscriptionsSchema = z.object({
  customer: z.string().optional(),
  price: z.string().optional(),
  status: z
    .enum(["active", "past_due", "unpaid", "canceled", "incomplete", "incomplete_expired", "trialing", "all", "paused"])
    .optional(),
  limit: z.number().min(1).max(100).optional(),
  starting_after: OptionalCursor,
  expand: Expand,
});
export const CancelSubscriptionSchema = z.object({
  subscription_id: z.string(),
  invoice_now: z.boolean().optional(),
  prorate: z.boolean().optional(),
  cancellation_details: z
    .object({
      comment: z.string().optional(),
      feedback: z
        .enum([
          "customer_service",
          "low_quality",
          "missing_features",
          "other",
          "switched_service",
          "too_complex",
          "too_expensive",
          "unused",
        ])
        .optional(),
    })
    .optional(),
});
export const ResumeSubscriptionSchema = z.object({
  subscription_id: z.string(),
  billing_cycle_anchor: z.enum(["now", "unchanged"]).optional(),
});

// ── Invoices ──

export const CreateInvoiceSchema = z.object({
  customer: z.string(),
  subscription: z.string().optional(),
  collection_method: z.enum(["charge_automatically", "send_invoice"]).optional(),
  days_until_due: z.number().optional(),
  description: z.string().optional(),
  auto_advance: z.boolean().optional(),
  metadata: Metadata,
});
export const GetInvoiceSchema = z.object({ invoice_id: z.string(), expand: Expand });
export const ListInvoicesSchema = z.object({
  customer: z.string().optional(),
  subscription: z.string().optional(),
  status: z.enum(["draft", "open", "paid", "uncollectible", "void"]).optional(),
  limit: z.number().min(1).max(100).optional(),
  starting_after: OptionalCursor,
  expand: Expand,
});
export const UpdateInvoiceSchema = z.object({
  invoice_id: z.string(),
  description: z.string().optional(),
  auto_advance: z.boolean().optional(),
  collection_method: z.enum(["charge_automatically", "send_invoice"]).optional(),
  days_until_due: z.number().optional(),
  metadata: Metadata,
});
export const FinalizeInvoiceSchema = z.object({ invoice_id: z.string(), auto_advance: z.boolean().optional() });
export const PayInvoiceSchema = z.object({ invoice_id: z.string(), payment_method: z.string().optional() });
export const SendInvoiceSchema = z.object({ invoice_id: z.string() });
export const VoidInvoiceSchema = z.object({ invoice_id: z.string() });
export const DeleteDraftInvoiceSchema = z.object({ invoice_id: z.string() });

// ── Checkout Sessions ──

export const CreateCheckoutSessionSchema = z.object({
  mode: z.enum(["payment", "subscription", "setup"]),
  success_url: z.string().optional(),
  cancel_url: z.string().optional(),
  customer: z.string().optional(),
  customer_email: z.string().optional(),
  line_items: z.array(z.object({ price: z.string(), quantity: z.number().optional() })).optional(),
  payment_method_types: z.array(z.string()).optional(),
  allow_promotion_codes: z.boolean().optional(),
  subscription_data: z.object({ trial_period_days: z.number().optional(), metadata: Metadata }).optional(),
  metadata: Metadata,
  expand: Expand,
});
export const GetCheckoutSessionSchema = z.object({ session_id: z.string(), expand: Expand });
export const ListCheckoutSessionsSchema = z.object({
  customer: z.string().optional(),
  payment_intent: z.string().optional(),
  subscription: z.string().optional(),
  status: z.enum(["open", "complete", "expired"]).optional(),
  limit: z.number().min(1).max(100).optional(),
  starting_after: OptionalCursor,
});
export const ExpireCheckoutSessionSchema = z.object({ session_id: z.string() });

// ── Payment Methods ──

export const ListPaymentMethodsSchema = z.object({
  customer: z.string(),
  type: z.string().optional().describe("card, sepa_debit, etc."),
  limit: z.number().min(1).max(100).optional(),
  starting_after: OptionalCursor,
});
export const GetPaymentMethodSchema = z.object({ payment_method_id: z.string(), expand: Expand });
export const AttachPaymentMethodSchema = z.object({ payment_method_id: z.string(), customer: z.string() });
export const DetachPaymentMethodSchema = z.object({ payment_method_id: z.string() });

// ── Payment Links ──

export const CreatePaymentLinkSchema = z.object({
  line_items: z.array(z.object({ price: z.string(), quantity: z.number().optional() })).min(1),
  after_completion: z
    .object({ type: z.enum(["redirect", "hosted_confirmation"]), redirect: z.object({ url: z.string() }).optional() })
    .optional(),
  allow_promotion_codes: z.boolean().optional(),
  metadata: Metadata,
});
export const GetPaymentLinkSchema = z.object({ payment_link_id: z.string() });
export const UpdatePaymentLinkSchema = z.object({
  payment_link_id: z.string(),
  active: z.boolean().optional(),
  metadata: Metadata,
});
export const ListPaymentLinksSchema = z.object({
  active: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional(),
  starting_after: OptionalCursor,
});

// ── Coupons ──

export const CreateCouponSchema = z.object({
  percent_off: z.number().optional(),
  amount_off: z.number().optional(),
  currency: z.string().optional(),
  duration: z.enum(["once", "repeating", "forever"]),
  duration_in_months: z.number().optional(),
  max_redemptions: z.number().optional(),
  name: z.string().optional(),
  metadata: Metadata,
});
export const GetCouponSchema = z.object({ coupon_id: z.string() });
export const ListCouponsSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  starting_after: OptionalCursor,
});
export const DeleteCouponSchema = z.object({ coupon_id: z.string() });

// ── Promotion Codes ──

export const CreatePromoCodeSchema = z.object({
  coupon: z.string(),
  code: z.string().optional(),
  max_redemptions: z.number().optional(),
  active: z.boolean().optional(),
  customer: z.string().optional(),
  metadata: Metadata,
});
export const GetPromoCodeSchema = z.object({ promo_code_id: z.string() });
export const ListPromoCodesSchema = z.object({
  coupon: z.string().optional(),
  code: z.string().optional(),
  active: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional(),
  starting_after: OptionalCursor,
});
export const UpdatePromoCodeSchema = z.object({
  promo_code_id: z.string(),
  active: z.boolean().optional(),
  metadata: Metadata,
});

// ── Billing Portal ──

export const CreatePortalSessionSchema = z.object({
  customer: z.string(),
  return_url: z.string().optional(),
  flow_data: z.record(z.unknown()).optional(),
});

// ── Balance & Payouts ──

export const GetBalanceSchema = z.object({});
export const ListBalanceTransactionsSchema = z.object({
  type: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  starting_after: OptionalCursor,
  expand: Expand,
});
export const CreatePayoutSchema = z.object({
  amount: z.number(),
  currency: z.string(),
  description: z.string().optional(),
  destination: z.string().optional(),
  metadata: Metadata,
});
export const GetPayoutSchema = z.object({ payout_id: z.string(), expand: Expand });
export const ListPayoutsSchema = z.object({
  status: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  starting_after: OptionalCursor,
});
export const CancelPayoutSchema = z.object({ payout_id: z.string() });

// ── Disputes ──

export const GetDisputeSchema = z.object({ dispute_id: z.string(), expand: Expand });
export const ListDisputesSchema = z.object({
  payment_intent: z.string().optional(),
  charge: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  starting_after: OptionalCursor,
});
export const UpdateDisputeSchema = z.object({
  dispute_id: z.string(),
  evidence: z.record(z.unknown()).optional(),
  metadata: Metadata,
});
export const CloseDisputeSchema = z.object({ dispute_id: z.string() });

// ── Webhooks ──

export const CreateWebhookSchema = z.object({
  url: z.string(),
  enabled_events: z.array(z.string()).describe("Event types (e.g. ['invoice.paid', 'customer.subscription.deleted'])"),
  api_version: z.string().optional(),
  description: z.string().optional(),
  metadata: Metadata,
});
export const GetWebhookSchema = z.object({ webhook_id: z.string() });
export const ListWebhooksSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  starting_after: OptionalCursor,
});
export const UpdateWebhookSchema = z.object({
  webhook_id: z.string(),
  url: z.string().optional(),
  enabled_events: z.array(z.string()).optional(),
  disabled: z.boolean().optional(),
  description: z.string().optional(),
  metadata: Metadata,
});
export const DeleteWebhookSchema = z.object({ webhook_id: z.string() });

// ── Events ──

export const GetEventSchema = z.object({ event_id: z.string() });
export const ListEventsSchema = z.object({
  type: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  starting_after: OptionalCursor,
});

// ── Raw ──

export const RawApiCallSchema = z.object({
  method: z.enum(["GET", "POST", "DELETE"]).describe("HTTP method"),
  path: z.string().describe("API path (e.g. '/tax/calculations')"),
  params: z.record(z.unknown()).optional().describe("Parameters (form-encoded for POST, query for GET)"),
});
