// PM2 ecosystem config for Streamable HTTP deployment
// Usage: pm2 start ecosystem.config.cjs
// Requires: MCP_AUTH_TOKEN in env or .env.prod
// API credentials loaded from ~/apps/Shinkofa-Infra/.env.prod

const { readFileSync } = require("node:fs");
const { homedir } = require("node:os");
const path = require("node:path");

// Load .env.prod into a dict
const envProd = {};
try {
	const content = readFileSync(
		path.join(homedir(), "apps/Shinkofa-Infra/.env.prod"),
		"utf-8",
	);
	for (const line of content.split("\n")) {
		const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
		if (match) envProd[match[1]] = match[2];
	}
} catch {}

const TOKEN = envProd.MCP_AUTH_TOKEN || process.env.MCP_AUTH_TOKEN || "CHANGE_ME";

const servers = [
	{ name: "mcp-stripe", port: 9001 },
	{ name: "mcp-ffmpeg", port: 9002 },
	{ name: "mcp-playwright", port: 9003 },
	{ name: "mcp-system", port: 9004 },
	{ name: "mcp-obsidian", port: 9005 },
	{ name: "mcp-tailscale", port: 9006 },
	{ name: "mcp-docker", port: 9007 },
	{ name: "mcp-discord", port: 9008 },
	{ name: "mcp-telegram", port: 9009 },
	{ name: "mcp-gmail", port: 9010 },
	{ name: "mcp-obs", port: 9011 },
	{ name: "mcp-youtube", port: 9012 },
	{ name: "mcp-twitch", port: 9013 },
	{ name: "mcp-n8n", port: 9014 },
	{ name: "mcp-ollama", port: 9015 },
	{ name: "mcp-google-calendar", port: 9016 },
	{ name: "mcp-google-drive", port: 9017 },
	{ name: "mcp-linkedin", port: 9018 },
	{ name: "mcp-devto", port: 9019 },
	{ name: "mcp-hashnode", port: 9020 },
	{ name: "mcp-imagemagick", port: 9021 },
	{ name: "mcp-home-assistant", port: 9022 },
	{ name: "mcp-streamerbot", port: 9023 },
];

module.exports = {
	apps: servers.map((srv) => ({
		name: srv.name,
		cwd: `./servers/${srv.name}`,
		script: "npx",
		args: "tsx src/index.ts",
		env: {
			...envProd,
			MCP_TRANSPORT: "http",
			MCP_HTTP_PORT: String(srv.port),
			MCP_AUTH_TOKEN: TOKEN,
			NODE_ENV: "production",
		},
		max_memory_restart: "256M",
		autorestart: true,
		watch: false,
		instances: 1,
	})),
};
