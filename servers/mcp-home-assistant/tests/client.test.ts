import { describe, it, expect } from "vitest";
import { HAClient, HAError } from "../src/lib/client.js";
describe("HAClient", () => { it("throw if no token", () => { expect(() => new HAClient({ accessToken: "", baseUrl: "http://localhost" })).toThrow(); }); it("construct", () => { expect(new HAClient({ accessToken: "t", baseUrl: "http://ha:8123" })).toBeDefined(); }); });
describe("HAError", () => { it("create", () => { expect(new HAError(404, "Not found").status).toBe(404); }); });
