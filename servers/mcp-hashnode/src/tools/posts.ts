import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HashnodeClient } from "../lib/client.js";
import {
  GetPostSchema,
  ListPostsSchema,
  SearchPostsSchema,
  PublishPostSchema,
  UpdatePostSchema,
  RemovePostSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

const POST_FIELDS = `
  id title slug subtitle brief
  url canonicalUrl publishedAt updatedAt
  coverImage { url }
  tags { name slug }
  series { id name }
  author { username name }
`;

export function registerPostTools(
  server: McpServer,
  client: HashnodeClient,
): void {
  server.tool(
    "get_post",
    "Get a post by slug from a publication",
    GetPostSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.query(
            `query($host: String!, $slug: String!) {
              publication(host: $host) {
                post(slug: $slug) { ${POST_FIELDS} content { markdown } }
              }
            }`,
            { host: p.host, slug: p.slug },
          ),
        ),
      ),
  );

  server.tool(
    "list_posts",
    "List posts from a publication (paginated)",
    ListPostsSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.query(
            `query($host: String!, $first: Int!, $after: String) {
              publication(host: $host) {
                posts(first: $first, after: $after) {
                  edges { node { ${POST_FIELDS} } cursor }
                  pageInfo { hasNextPage endCursor }
                }
              }
            }`,
            { host: p.host, first: p.first ?? 10, after: p.after },
          ),
        ),
      ),
  );

  server.tool(
    "search_posts",
    "Search posts in a publication",
    SearchPostsSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.query(
            `query($filter: SearchPostsOfPublicationFilter!, $first: Int!, $after: String) {
              searchPostsOfPublication(filter: $filter, first: $first, after: $after) {
                edges { node { ${POST_FIELDS} } cursor }
                pageInfo { hasNextPage endCursor }
              }
            }`,
            {
              filter: {
                publicationId: p.publicationId,
                query: p.query,
              },
              first: p.first ?? 10,
              after: p.after,
            },
          ),
        ),
      ),
  );

  server.tool(
    "publish_post",
    "Publish a new post to a publication",
    PublishPostSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const { publicationId, coverImageURL, ...rest } = p;
        const input: Record<string, unknown> = {
          ...rest,
          publicationId,
        };
        if (coverImageURL) {
          input["coverImageOptions"] = { coverImageURL };
        }
        return toolResult(
          await client.query(
            `mutation($input: PublishPostInput!) {
              publishPost(input: $input) {
                post { ${POST_FIELDS} }
              }
            }`,
            { input },
          ),
        );
      }),
  );

  server.tool(
    "update_post",
    "Update an existing post",
    UpdatePostSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const { coverImageURL, ...rest } = p;
        const input: Record<string, unknown> = { ...rest };
        if (coverImageURL) {
          input["coverImageOptions"] = { coverImageURL };
        }
        return toolResult(
          await client.query(
            `mutation($input: UpdatePostInput!) {
              updatePost(input: $input) {
                post { ${POST_FIELDS} }
              }
            }`,
            { input },
          ),
        );
      }),
  );

  server.tool(
    "remove_post",
    "Remove/delete a post",
    RemovePostSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.query(
            `mutation($id: ID!) {
              removePost(input: { id: $id }) { post { id title } }
            }`,
            { id: p.id },
          ),
        ),
      ),
  );
}
