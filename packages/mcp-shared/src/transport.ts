import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type http from "node:http";

interface Connectable {
	connect(transport: Transport): Promise<void>;
}

export interface TransportResult {
	transport: "stdio" | "http";
	port?: number;
	httpServer?: http.Server;
}

export async function connectTransport(
	server: Connectable,
): Promise<TransportResult> {
	const mode = process.env.MCP_TRANSPORT ?? "stdio";

	if (mode === "stdio") {
		const { StdioServerTransport } = await import(
			"@modelcontextprotocol/sdk/server/stdio.js"
		);
		const transport = new StdioServerTransport();
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

		const mcpTransport = new StreamableHTTPServerTransport({
			sessionIdGenerator: undefined,
		});

		const httpServer = createServer(async (req, res) => {
			if (req.url !== "/mcp") {
				res.writeHead(404, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ error: "Not found" }));
				return;
			}

			const auth = req.headers.authorization;
			if (auth !== `Bearer ${token}`) {
				res.writeHead(401, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ error: "Unauthorized" }));
				return;
			}

			// Parse body for POST requests
			if (req.method === "POST") {
				const chunks: Buffer[] = [];
				for await (const chunk of req) {
					chunks.push(chunk as Buffer);
				}
				const body = JSON.parse(Buffer.concat(chunks).toString());
				await mcpTransport.handleRequest(req, res, body);
			} else {
				await mcpTransport.handleRequest(req, res);
			}
		});

		const port = Number.parseInt(process.env.MCP_HTTP_PORT ?? "0", 10);

		await new Promise<void>((resolve) => {
			httpServer.listen(port, () => resolve());
		});

		const actualPort = (httpServer.address() as { port: number }).port;

		await server.connect(mcpTransport);

		console.error(
			`[mcp] Streamable HTTP transport listening on port ${actualPort}`,
		);

		return { transport: "http", port: actualPort, httpServer };
	}

	throw new Error(`Unknown MCP_TRANSPORT value: ${mode}`);
}
