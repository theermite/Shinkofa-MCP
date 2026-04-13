export class SystemError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SystemError";
  }
}

export function toolResult(data: unknown) {
  const text =
    data === undefined
      ? '{"status":"success"}'
      : JSON.stringify(data, null, 2);
  return { content: [{ type: "text" as const, text }] };
}

export function toolError(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export async function withErrorHandler<T>(
  fn: () => Promise<T>,
): Promise<T | ReturnType<typeof toolError>> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof SystemError) {
      return toolError(`System error [${error.code}]: ${error.message}`);
    }
    if (error instanceof Error) {
      return toolError(`${error.name}: ${error.message}`);
    }
    throw error;
  }
}

const SECRET_KEY_PATTERN = /TOKEN|SECRET|KEY|PASSWORD|PASSWD|AUTH|CREDENTIAL|API_?KEY/i;

export function maskSecretValue(key: string, value: string): string {
  if (!SECRET_KEY_PATTERN.test(key)) return value;
  if (value.length <= 4) return "***";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

export function isExecAllowed(): boolean {
  return process.env["MCP_SYSTEM_ALLOW_EXEC"] === "true";
}
