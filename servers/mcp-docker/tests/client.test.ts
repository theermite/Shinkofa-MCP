import { describe, it, expect } from "vitest";
import { DockerClient, DockerError } from "../src/lib/client.js";

describe("DockerClient", () => {
  it("should construct with defaults", () => {
    const client = new DockerClient();
    expect(client).toBeDefined();
  });

  it("should construct with custom socket path", () => {
    const client = new DockerClient({ socketPath: "/custom/docker.sock" });
    expect(client).toBeDefined();
  });

  it("should construct with custom host", () => {
    const client = new DockerClient({ host: "http://localhost:2375" });
    expect(client).toBeDefined();
  });

  it("should construct with custom timeout", () => {
    const client = new DockerClient({ timeoutMs: 5000 });
    expect(client).toBeDefined();
  });
});

describe("DockerError", () => {
  it("should create with status and description", () => {
    const error = new DockerError(404, "No such container");
    expect(error.status).toBe(404);
    expect(error.description).toBe("No such container");
    expect(error.name).toBe("DockerError");
    expect(error.message).toContain("404");
    expect(error.message).toContain("No such container");
  });

  it("should be instanceof Error", () => {
    const error = new DockerError(500, "Internal server error");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DockerError);
  });
});
