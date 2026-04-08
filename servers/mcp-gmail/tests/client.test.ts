import { describe, it, expect } from "vitest";
import { GmailClient, GmailError } from "../src/lib/client.js";
describe("GmailClient", () => {
  it("throw if no token", () => { expect(() => new GmailClient({ accessToken: "" })).toThrow(); });
  it("construct", () => { expect(new GmailClient({ accessToken: "ya29.test" })).toBeDefined(); });
});
describe("GmailError", () => { it("create", () => { const e = new GmailError(401, "Unauthorized"); expect(e.code).toBe(401); }); });
