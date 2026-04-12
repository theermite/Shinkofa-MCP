import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HashnodeClient } from "../lib/client.js";
import {
  CreateDraftSchema,
  PublishDraftSchema,
  ScheduleDraftSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerDraftTools(
  server: McpServer,
  client: HashnodeClient,
): void {
  server.tool(
    "create_draft",
    "Create a new draft",
    CreateDraftSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const { coverImageURL, ...rest } = p;
        const input: Record<string, unknown> = { ...rest };
        if (coverImageURL) {
          input["coverImageOptions"] = { coverImageURL };
        }
        return toolResult(
          await client.query(
            `mutation($input: CreateDraftInput!) {
              createDraft(input: $input) {
                draft { id title }
              }
            }`,
            { input },
          ),
        );
      }),
  );

  server.tool(
    "publish_draft",
    "Publish an existing draft",
    PublishDraftSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.query(
            `mutation($input: PublishDraftInput!) {
              publishDraft(input: $input) {
                post { id title slug url }
              }
            }`,
            { input: { draftId: p.draftId } },
          ),
        ),
      ),
  );

  server.tool(
    "schedule_draft",
    "Schedule a draft for future publication",
    ScheduleDraftSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.query(
            `mutation($input: ScheduleDraftInput!) {
              scheduleDraft(input: $input) {
                scheduledDate
              }
            }`,
            { input: { draftId: p.draftId, publishAt: p.publishAt } },
          ),
        ),
      ),
  );
}
