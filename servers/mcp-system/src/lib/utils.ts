import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";

export { toolResult, toolError };

export class SystemError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SystemError";
  }
}

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof SystemError) {
    return `System error [${error.code}]: ${error.message}`;
  }
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
});

const SECRET_KEY_PATTERN = /TOKEN|SECRET|KEY|PASSWORD|PASSWD|AUTH|CREDENTIAL|API_?KEY/i;

export function maskSecretValue(key: string, value: string): string {
  if (!SECRET_KEY_PATTERN.test(key)) return value;
  if (value.length <= 4) return "***";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

export function isExecAllowed(): boolean {
  return process.env["MCP_SYSTEM_ALLOW_EXEC"] === "true";
}
