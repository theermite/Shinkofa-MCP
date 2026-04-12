import { describe, it, expect } from "vitest";
import { N8nClient, N8nError } from "../src/lib/client.js";
describe("N8nClient", () => { it("throw if no key", () => { expect(() => new N8nClient({ apiKey: "", baseUrl: "http://localhost" })).toThrow(); }); it("construct", () => { expect(new N8nClient({ apiKey: "k", baseUrl: "http://localhost:5678" })).toBeDefined(); }); });
describe("N8nError", () => { it("create", () => { expect(new N8nError(401, "Unauthorized").status).toBe(401); }); });
