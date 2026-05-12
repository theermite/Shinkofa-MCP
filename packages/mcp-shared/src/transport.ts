import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import type http from "node:http";

interface Connectable {
	connect(transport: Transport): Promise<void>;
}

export type ConnectableFactory = () => Connectable | Promise<Connectable>;

export interface TransportResult {
	transport: "stdio" | "http";
	port?: number;
	httpServer?: http.Server;
}

/**
 * Connect a server (or factory) to a transport based on MCP_TRANSPORT env.
 *
 * Accepts EITHER a Connectable instance OR a factory function.
 *
 * - stdio: single transport, server connected once.
 * - http stateless (MCP_HTTP_STATELESS=true): single transport, server connected once.
 *   Each request is independent, no session tracking.
 * - http stateful (default): per-session transport tracked in a Map.
 *   * If a factory is provided, a new Connectable is built per session (canonical pattern).
 *   * If a Connectable instance is provided, it is shared across sessions and reconnected
 *     to each new transport. This works for stateless tool-routing servers (the common case)
 *     and preserves backward compatibility with the previous API.
 */
export async function connectTransport(
	serverOrFactory: Connectable | ConnectableFactory,
): Promise<TransportResult> {
	const mode = process.env.MCP_TRANSPORT ?? "stdio";

	const buildServer = async (): Promise<Connectable> => {
		if (typeof serverOrFactory === "function") {
			return await serverOrFactory();
		}
		return serverOrFactory;
	};

	if (mode === "stdio") {
		const { StdioServerTransport } = await import(
			"@modelcontextprotocol/sdk/server/stdio.js"
		);
		const transport = new StdioServerTransport();
		const server = await buildServer();
		await server.connect(transport);
		return { transport: "stdio" };
	}

	if (mode === "http") {
		const token = process.env.MCP_AUTH_TOKEN;
		if (!token) {
			throw new Error(
				"MCP_AUTH_TOKEN is required when MCP_TRANSPORT=http",
			);
		}

		const { StreamableHTTPServerTransport } = await import(
			"@modelcontextprotocol/sdk/server/streamableHttp.js"
		);
		const { createServer } = await import("node:http");

		const { randomUUID } = await import("node:crypto");
		const stateless = process.env.MCP_HTTP_STATELESS === "true";

		type SHST = InstanceType<typeof StreamableHTTPServerTransport>;
		const transports = new Map<string, SHST>();

		// Stateless mode: single transport, server connected once, no session tracking.
		let statelessTransport: SHST | null = null;
		if (stateless) {
			statelessTransport = new StreamableHTTPServerTransport({
				sessionIdGenerator: undefined,
			});
			const server = await buildServer();
			await server.connect(statelessTransport);
		}

		const readBody = async (req: http.IncomingMessage): Promise<unknown> => {
			const chunks: Buffer[] = [];
			for await (const chunk of req) {
				chunks.push(chunk as Buffer);
			}
			if (chunks.length === 0) return undefined;
			return JSON.parse(Buffer.concat(chunks).toString());
		};

		const sendJson = (
			res: http.ServerResponse,
			status: number,
			payload: unknown,
		) => {
			res.writeHead(status, { "Content-Type": "application/json" });
			res.end(JSON.stringify(payload));
		};

		const httpServer = createServer(async (req, res) => {
			if (req.url !== "/mcp") {
				sendJson(res, 404, { error: "Not found" });
				return;
			}

			const auth = req.headers.authorization;
			if (auth !== `Bearer ${token}`) {
				sendJson(res, 401, { error: "Unauthorized" });
				return;
			}

			try {
				// Stateless: every request routed through the single transport.
				if (stateless && statelessTransport) {
					if (req.method === "POST") {
						const body = await readBody(req);
						await statelessTransport.handleRequest(req, res, body);
					} else {
						await statelessTransport.handleRequest(req, res);
					}
					return;
				}

				// Stateful: per-session transport.
				const sessionId = req.headers["mcp-session-id"] as
					| string
					| undefined;

				if (req.method === "POST") {
					const body = await readBody(req);

					// Existing session → route to that transport.
					if (sessionId && transports.has(sessionId)) {
						const transport = transports.get(sessionId);
						if (transport) {
							await transport.handleRequest(req, res, body);
						}
						return;
					}

					// New session must start with an initialize request.
					if (isInitializeRequest(body)) {
						const transport = new StreamableHTTPServerTransport({
							sessionIdGenerator: () => randomUUID(),
							onsessioninitialized: (id) => {
								transports.set(id, transport);
							},
						});
						transport.onclose = () => {
							if (transport.sessionId) {
								transports.delete(transport.sessionId);
							}
						};
						const server = await buildServer();
						await server.connect(transport);
						await transport.handleRequest(req, res, body);
						return;
					}

					sendJson(res, 400, {
						jsonrpc: "2.0",
						error: {
							code: -32600,
							message:
								"Bad Request: missing or unknown mcp-session-id, and request is not initialize",
						},
						id: null,
					});
					return;
				}

				// GET/DELETE/etc. for SSE streams or session termination — require session.
				if (sessionId && transports.has(sessionId)) {
					const transport = transports.get(sessionId);
					if (transport) {
						await transport.handleRequest(req, res);
					}
					return;
				}

				sendJson(res, 400, {
					jsonrpc: "2.0",
					error: {
						code: -32600,
						message: "Bad Request: missing or unknown mcp-session-id",
					},
					id: null,
				});
			} catch (err) {
				console.error("[mcp] request handling failed:", err);
				if (!res.headersSent) {
					sendJson(res, 500, {
						jsonrpc: "2.0",
						error: {
							code: -32603,
							message: "Internal server error",
						},
						id: null,
					});
				}
			}
		});

		const port = Number.parseInt(process.env.MCP_HTTP_PORT ?? "0", 10);

		await new Promise<void>((resolve) => {
			httpServer.listen(port, () => resolve());
		});

		const actualPort = (httpServer.address() as { port: number }).port;

		console.error(
			`[mcp] Streamable HTTP transport listening on port ${actualPort} (${stateless ? "stateless" : "stateful per-session"})`,
		);

		return { transport: "http", port: actualPort, httpServer };
	}

	throw new Error(`Unknown MCP_TRANSPORT value: ${mode}`);
}
