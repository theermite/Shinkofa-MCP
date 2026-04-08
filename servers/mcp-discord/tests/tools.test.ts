import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient } from "../src/lib/client.js";
import { registerMessageTools } from "../src/tools/messages.js";
import { registerChannelTools } from "../src/tools/channels.js";
import { registerGuildTools } from "../src/tools/guilds.js";
import { registerMemberTools } from "../src/tools/members.js";
import { registerWebhookTools } from "../src/tools/webhooks.js";
import { registerCommandTools } from "../src/tools/commands.js";
import { registerInteractionTools } from "../src/tools/interactions.js";
import { registerUserTools } from "../src/tools/users.js";
import { registerEmojiTools } from "../src/tools/emojis.js";
import { registerEventTools } from "../src/tools/events.js";
import { registerModerationTools } from "../src/tools/moderation.js";
import { registerInviteTools } from "../src/tools/invites.js";
import { registerRawTool } from "../src/tools/raw.js";

function createTestSetup() {
  const client = new DiscordClient({ botToken: "test-token" });
  const server = new McpServer({ name: "test", version: "1.0.0" });
  return { client, server };
}

describe("Tool registration", () => {
  it("should register message tools without error", () => {
    const { server, client } = createTestSetup();
    expect(() => registerMessageTools(server, client)).not.toThrow();
  });

  it("should register channel tools without error", () => {
    const { server, client } = createTestSetup();
    expect(() => registerChannelTools(server, client)).not.toThrow();
  });

  it("should register guild tools without error", () => {
    const { server, client } = createTestSetup();
    expect(() => registerGuildTools(server, client)).not.toThrow();
  });

  it("should register member tools without error", () => {
    const { server, client } = createTestSetup();
    expect(() => registerMemberTools(server, client)).not.toThrow();
  });

  it("should register webhook tools without error", () => {
    const { server, client } = createTestSetup();
    expect(() => registerWebhookTools(server, client)).not.toThrow();
  });

  it("should register command tools without error", () => {
    const { server, client } = createTestSetup();
    expect(() => registerCommandTools(server, client)).not.toThrow();
  });

  it("should register interaction tools without error", () => {
    const { server, client } = createTestSetup();
    expect(() => registerInteractionTools(server, client)).not.toThrow();
  });

  it("should register user tools without error", () => {
    const { server, client } = createTestSetup();
    expect(() => registerUserTools(server, client)).not.toThrow();
  });

  it("should register emoji tools without error", () => {
    const { server, client } = createTestSetup();
    expect(() => registerEmojiTools(server, client)).not.toThrow();
  });

  it("should register event tools without error", () => {
    const { server, client } = createTestSetup();
    expect(() => registerEventTools(server, client)).not.toThrow();
  });

  it("should register moderation tools without error", () => {
    const { server, client } = createTestSetup();
    expect(() => registerModerationTools(server, client)).not.toThrow();
  });

  it("should register invite tools without error", () => {
    const { server, client } = createTestSetup();
    expect(() => registerInviteTools(server, client)).not.toThrow();
  });

  it("should register raw tool without error", () => {
    const { server, client } = createTestSetup();
    expect(() => registerRawTool(server, client)).not.toThrow();
  });

  it("should register ALL tools on a single server without conflict", () => {
    const { server, client } = createTestSetup();
    expect(() => {
      registerMessageTools(server, client);
      registerChannelTools(server, client);
      registerGuildTools(server, client);
      registerMemberTools(server, client);
      registerWebhookTools(server, client);
      registerCommandTools(server, client);
      registerInteractionTools(server, client);
      registerUserTools(server, client);
      registerEmojiTools(server, client);
      registerEventTools(server, client);
      registerModerationTools(server, client);
      registerInviteTools(server, client);
      registerRawTool(server, client);
    }).not.toThrow();
  });
});
