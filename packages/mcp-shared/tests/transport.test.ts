import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import http from "node:http";

describe("connectTransport", () => {
	const mockServer = {
		connect: vi.fn().mockResolvedValue(undefined),
	};

	beforeEach(() => {
		vi.resetAllMocks();
		// Clear env vars
		delete process.env.MCP_TRANSPORT;
		delete process.env.MCP_HTTP_PORT;
		delete process.env.MCP_AUTH_TOKEN;
	});

	afterEach(() => {
		delete process.env.MCP_TRANSPORT;
		delete process.env.MCP_HTTP_PORT;
		delete process.env.MCP_AUTH_TOKEN;
	});

	it("should_use_stdio_transport_when_no_env_set", async () => {
		const { connectTransport } = await import("../src/transport.js");
		const result = await connectTransport(mockServer as any);
		expect(mockServer.connect).toHaveBeenCalledOnce();
		expect(result.transport).toBe("stdio");
	});

	it("should_use_stdio_transport_when_MCP_TRANSPORT_is_stdio", async () => {
		process.env.MCP_TRANSPORT = "stdio";
		const { connectTransport } = await import("../src/transport.js");
		const result = await connectTransport(mockServer as any);
		expect(result.transport).toBe("stdio");
	});

	it("should_throw_when_http_transport_without_MCP_AUTH_TOKEN", async () => {
		process.env.MCP_TRANSPORT = "http";
		const { connectTransport } = await import("../src/transport.js");
		await expect(connectTransport(mockServer as any)).rejects.toThrow(
			"MCP_AUTH_TOKEN",
		);
	});

	it("should_start_http_server_when_MCP_TRANSPORT_is_http", async () => {
		process.env.MCP_TRANSPORT = "http";
		process.env.MCP_AUTH_TOKEN = "test-secret-token";
		process.env.MCP_HTTP_PORT = "0"; // auto-assign

		const { connectTransport } = await import("../src/transport.js");
		const result = await connectTransport(mockServer as any);

		expect(result.transport).toBe("http");
		expect(result.port).toBeGreaterThan(0);
		// Stateful per-session mode: server.connect() is only invoked on the first
		// initialize request, not at HTTP startup. Just verify the server is listening.

		// Cleanup
		if (result.httpServer) {
			result.httpServer.close();
		}
	});

	it("should_connect_server_eagerly_in_stateless_http_mode", async () => {
		process.env.MCP_TRANSPORT = "http";
		process.env.MCP_AUTH_TOKEN = "test-secret-token";
		process.env.MCP_HTTP_PORT = "0";
		process.env.MCP_HTTP_STATELESS = "true";

		try {
			const { connectTransport } = await import("../src/transport.js");
			const result = await connectTransport(mockServer as any);
			expect(mockServer.connect).toHaveBeenCalledOnce();
			result.httpServer?.close();
		} finally {
			delete process.env.MCP_HTTP_STATELESS;
		}
	});

	it("should_accept_a_factory_function_as_argument", async () => {
		process.env.MCP_TRANSPORT = "stdio";
		const factory = vi.fn().mockResolvedValue(mockServer);
		const { connectTransport } = await import("../src/transport.js");
		await connectTransport(factory);
		expect(factory).toHaveBeenCalledOnce();
		expect(mockServer.connect).toHaveBeenCalledOnce();
	});

	it("should_reject_requests_without_valid_bearer_token", async () => {
		process.env.MCP_TRANSPORT = "http";
		process.env.MCP_AUTH_TOKEN = "correct-token";
		process.env.MCP_HTTP_PORT = "0";

		const { connectTransport } = await import("../src/transport.js");
		const result = await connectTransport(mockServer as any);
		const port = result.port;

		try {
			// Request without auth
			const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});
			expect(res.status).toBe(401);

			// Request with wrong auth
			const res2 = await fetch(`http://127.0.0.1:${port}/mcp`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer wrong-token",
				},
				body: JSON.stringify({}),
			});
			expect(res2.status).toBe(401);
		} finally {
			result.httpServer?.close();
		}
	});

	it("should_return_404_for_non_mcp_paths", async () => {
		process.env.MCP_TRANSPORT = "http";
		process.env.MCP_AUTH_TOKEN = "test-token";
		process.env.MCP_HTTP_PORT = "0";

		const { connectTransport } = await import("../src/transport.js");
		const result = await connectTransport(mockServer as any);
		const port = result.port;

		try {
			const res = await fetch(`http://127.0.0.1:${port}/other`, {
				method: "GET",
			});
			expect(res.status).toBe(404);
		} finally {
			result.httpServer?.close();
		}
	});

	it("should_use_specified_port_when_MCP_HTTP_PORT_is_set", async () => {
		process.env.MCP_TRANSPORT = "http";
		process.env.MCP_AUTH_TOKEN = "test-token";
		// Find a free port by briefly listening
		const tmpServer = http.createServer();
		await new Promise<void>((resolve) => {
			tmpServer.listen(0, () => resolve());
		});
		const freePort = (tmpServer.address() as any).port;
		tmpServer.close();

		process.env.MCP_HTTP_PORT = String(freePort);

		const { connectTransport } = await import("../src/transport.js");
		const result = await connectTransport(mockServer as any);

		expect(result.port).toBe(freePort);
		result.httpServer?.close();
	});
});
