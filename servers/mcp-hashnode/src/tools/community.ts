import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HashnodeClient } from "../lib/client.js";
import {
  GetPublicationSchema,
  AddCommentSchema,
  LikePostSchema,
  CreateSeriesSchema,
  AddToSeriesSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerCommunityTools(
  server: McpServer,
  client: HashnodeClient,
): void {
  server.tool(
    "get_me",
    "Get the authenticated user profile",
    {},
    async () =>
      withErrorHandler(async () =>
        toolResult(
          await client.query(`query {
            me {
              id username name bio
              profilePicture
              publications(first: 10) {
                edges { node { id title url } }
              }
            }
          }`),
        ),
      ),
  );

  server.tool(
    "get_publication",
    "Get a publication by host domain",
    GetPublicationSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.query(
            `query($host: String!) {
              publication(host: $host) {
                id title url about { markdown }
                author { username name }
              }
            }`,
            { host: p.host },
          ),
        ),
      ),
  );

  server.tool(
    "add_comment",
    "Add a comment to a post",
    AddCommentSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.query(
            `mutation($input: AddCommentInput!) {
              addComment(input: $input) {
                comment { id content { markdown } }
              }
            }`,
            {
              input: {
                postId: p.postId,
                contentMarkdown: p.contentMarkdown,
              },
            },
          ),
        ),
      ),
  );

  server.tool(
    "like_post",
    "Like/react to a post",
    LikePostSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.query(
            `mutation($input: LikePostInput!) {
              likePost(input: $input) { post { id title } }
            }`,
            { input: { postId: p.postId } },
          ),
        ),
      ),
  );

  server.tool(
    "create_series",
    "Create a new series in a publication",
    CreateSeriesSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.query(
            `mutation($input: CreateSeriesInput!) {
              createSeries(input: $input) {
                series { id name slug }
              }
            }`,
            { input: p },
          ),
        ),
      ),
  );

  server.tool(
    "add_post_to_series",
    "Add a post to a series",
    AddToSeriesSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.query(
            `mutation($input: AddPostToSeriesInput!) {
              addPostToSeries(input: $input) {
                series { id name }
              }
            }`,
            { input: { postId: p.postId, seriesId: p.seriesId } },
          ),
        ),
      ),
  );
}
