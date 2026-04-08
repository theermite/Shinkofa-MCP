import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GmailClient } from "../src/lib/client.js";
import { registerMessageTools } from "../src/tools/messages.js";
import { registerDraftTools } from "../src/tools/drafts.js";
import { registerLabelTools } from "../src/tools/labels.js";
import { registerThreadTools } from "../src/tools/threads.js";
import { registerMiscTools } from "../src/tools/misc.js";
function setup() { return { client: new GmailClient({ accessToken: "test" }), server: new McpServer({ name: "test", version: "1.0.0" }) }; }
describe("Tool registration", () => {
  it("ALL tools", () => { const s = setup(); expect(() => { registerMessageTools(s.server, s.client); registerDraftTools(s.server, s.client); registerLabelTools(s.server, s.client); registerThreadTools(s.server, s.client); registerMiscTools(s.server, s.client); }).not.toThrow(); });
});
