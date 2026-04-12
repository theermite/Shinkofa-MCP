import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LinkedInClient } from "../lib/client.js";
import {
  CreateTextPostSchema,
  CreateArticlePostSchema,
  InitializeImageUploadSchema,
  CreateImagePostSchema,
  DeletePostSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

function buildPostBody(
  author: string,
  commentary: string,
  visibility: string,
) {
  return {
    author,
    commentary,
    visibility: visibility === "CONNECTIONS" ? "CONNECTIONS" : "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
  };
}

export function registerPostTools(
  server: McpServer,
  client: LinkedInClient,
) {
  server.tool(
    "create_text_post",
    "Create a text-only post on LinkedIn",
    CreateTextPostSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const body = buildPostBody(p.author, p.commentary, p.visibility);
        const result = await client.post("/rest/posts", body);
        return toolResult(result);
      }),
  );

  server.tool(
    "create_article_post",
    "Share an article link on LinkedIn with optional commentary",
    CreateArticlePostSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const body = {
          ...buildPostBody(p.author, p.commentary, p.visibility),
          content: {
            article: {
              source: p.articleUrl,
              ...(p.articleTitle && { title: p.articleTitle }),
              ...(p.articleDescription && {
                description: p.articleDescription,
              }),
            },
          },
        };
        const result = await client.post("/rest/posts", body);
        return toolResult(result);
      }),
  );

  server.tool(
    "initialize_image_upload",
    "Initialize an image upload to LinkedIn (step 1 of image posting)",
    InitializeImageUploadSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const result = await client.post(
          "/rest/images?action=initializeUpload",
          { initializeUploadRequest: { owner: p.owner } },
        );
        return toolResult(result);
      }),
  );

  server.tool(
    "create_image_post",
    "Create a post with an uploaded image on LinkedIn (step 3, after upload)",
    CreateImagePostSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const body = {
          ...buildPostBody(p.author, p.commentary, p.visibility),
          content: {
            media: {
              id: p.imageUrn,
              ...(p.altText && { altText: p.altText }),
            },
          },
        };
        const result = await client.post("/rest/posts", body);
        return toolResult(result);
      }),
  );

  server.tool(
    "delete_post",
    "Delete a LinkedIn post by its URN",
    DeletePostSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const encoded = encodeURIComponent(p.postUrn);
        await client.del(`/rest/posts/${encoded}`);
        return toolResult(undefined);
      }),
  );
}
