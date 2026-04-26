import { describe, expect, it } from "vitest";
import { createConfig, getWsUrl, StreamerbotClient, StreamerbotError } from "../src/lib/client.js";

describe("createConfig", () => {
  it("should_use_defaults_when_env_is_empty", () => {
    const config = createConfig({});
    expect(config.host).toBe("127.0.0.1");
    expect(config.port).toBe("8080");
    expect(config.connectTimeoutMs).toBe(5000);
    expect(config.requestTimeoutMs).toBe(10000);
  });

  it("should_override_from_env", () => {
    const config = createConfig({
      STREAMERBOT_HOST: "192.168.1.10",
      STREAMERBOT_PORT: "9090",
      STREAMERBOT_CONNECT_TIMEOUT_MS: "3000",
      STREAMERBOT_REQUEST_TIMEOUT_MS: "15000",
    });
    expect(config.host).toBe("192.168.1.10");
    expect(config.port).toBe("9090");
    expect(config.connectTimeoutMs).toBe(3000);
    expect(config.requestTimeoutMs).toBe(15000);
  });

  it("should_fallback_to_default_timeout_on_invalid_number", () => {
    const config = createConfig({ STREAMERBOT_CONNECT_TIMEOUT_MS: "not-a-number" });
    expect(config.connectTimeoutMs).toBe(5000);
  });
});

describe("getWsUrl", () => {
  it("should_build_ws_url_from_config", () => {
    const config = createConfig({});
    expect(getWsUrl(config)).toBe("ws://127.0.0.1:8080/");
  });

  it("should_build_url_with_custom_host_and_port", () => {
    const config = createConfig({ STREAMERBOT_HOST: "10.0.0.1", STREAMERBOT_PORT: "9999" });
    expect(getWsUrl(config)).toBe("ws://10.0.0.1:9999/");
  });
});

describe("StreamerbotError", () => {
  it("should_be_instance_of_Error", () => {
    const err = new StreamerbotError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(StreamerbotError);
  });

  it("should_have_correct_name", () => {
    const err = new StreamerbotError("test");
    expect(err.name).toBe("StreamerbotError");
  });

  it("should_preserve_message", () => {
    const err = new StreamerbotError("connection lost");
    expect(err.message).toBe("connection lost");
  });
});

describe("StreamerbotClient", () => {
  it("should_instantiate_without_error", () => {
    const config = createConfig({});
    const client = new StreamerbotClient(config);
    expect(client).toBeDefined();
  });

  it("should_disconnect_without_error_when_not_connected", () => {
    const config = createConfig({});
    const client = new StreamerbotClient(config);
    expect(() => client.disconnect()).not.toThrow();
  });
});
