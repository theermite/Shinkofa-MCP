import { describe, it, expect } from "vitest";
import { createConfig, OBSError, OBSClient } from "../src/lib/client.js";

describe("createConfig", () => {
  it("should_use_defaults_when_env_is_empty", () => {
    const config = createConfig({});
    expect(config.url).toBe("ws://127.0.0.1:4455");
    expect(config.password).toBeUndefined();
  });

  it("should_override_from_env", () => {
    const config = createConfig({
      OBS_WEBSOCKET_URL: "ws://192.168.1.50:4460",
      OBS_WEBSOCKET_PASSWORD: "secret123",
    });
    expect(config.url).toBe("ws://192.168.1.50:4460");
    expect(config.password).toBe("secret123");
  });

  it("should_leave_password_undefined_when_not_set", () => {
    const config = createConfig({ OBS_WEBSOCKET_URL: "ws://localhost:4455" });
    expect(config.password).toBeUndefined();
  });
});

describe("OBSError", () => {
  it("should_be_instance_of_Error", () => {
    const err = new OBSError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(OBSError);
  });

  it("should_have_correct_name", () => {
    const err = new OBSError("test");
    expect(err.name).toBe("OBSError");
  });

  it("should_preserve_message", () => {
    const err = new OBSError("cannot connect");
    expect(err.message).toBe("cannot connect");
  });
});

describe("OBSClient", () => {
  it("should_instantiate_without_error", () => {
    const config = createConfig({});
    const client = new OBSClient(config);
    expect(client).toBeDefined();
  });

  it("should_disconnect_without_error_when_not_connected", () => {
    const config = createConfig({});
    const client = new OBSClient(config);
    expect(() => client.disconnect()).not.toThrow();
  });
});
