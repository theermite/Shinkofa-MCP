import { describe, it, expect } from "vitest";
import {
  ContainerListSchema, ContainerCreateSchema, ContainerInspectSchema,
  ContainerStartSchema, ContainerStopSchema, ContainerRestartSchema,
  ContainerKillSchema, ContainerRemoveSchema, ContainerLogsSchema,
  ContainerStatsSchema, ContainerRenameSchema, ContainerPauseSchema,
  ContainerUpdateSchema, ContainerPruneSchema, ContainerTopSchema,
  ContainerWaitSchema, ExecCreateSchema, ExecStartSchema, ExecInspectSchema,
  ImageListSchema, ImageInspectSchema, ImagePullSchema, ImageRemoveSchema,
  ImageTagSchema, ImageSearchSchema, ImagePruneSchema, ImageHistorySchema,
  ImageBuildSchema,
  VolumeListSchema, VolumeCreateSchema, VolumeInspectSchema,
  VolumeRemoveSchema, VolumePruneSchema,
  NetworkListSchema, NetworkCreateSchema, NetworkInspectSchema,
  NetworkRemoveSchema, NetworkConnectSchema, NetworkDisconnectSchema,
  NetworkPruneSchema,
  SystemEventsSchema, RawApiCallSchema,
} from "../src/lib/schemas.js";

describe("Container schemas", () => {
  it("should validate list_containers with defaults", () => {
    expect(ContainerListSchema.safeParse({}).success).toBe(true);
  });
  it("should validate list_containers with all params", () => {
    expect(ContainerListSchema.safeParse({ all: true, limit: 10, size: true, filters: '{"status":["running"]}' }).success).toBe(true);
  });
  it("should validate create_container minimal", () => {
    expect(ContainerCreateSchema.safeParse({ Image: "nginx:latest" }).success).toBe(true);
  });
  it("should reject create_container without Image", () => {
    expect(ContainerCreateSchema.safeParse({}).success).toBe(false);
  });
  it("should validate create_container full", () => {
    expect(ContainerCreateSchema.safeParse({
      name: "my-nginx", Image: "nginx:latest", Cmd: ["nginx", "-g", "daemon off;"],
      Env: ["FOO=bar"], Labels: { app: "web" }, WorkingDir: "/app",
    }).success).toBe(true);
  });
  it("should validate inspect_container", () => {
    expect(ContainerInspectSchema.safeParse({ id: "abc123" }).success).toBe(true);
  });
  it("should reject inspect_container without id", () => {
    expect(ContainerInspectSchema.safeParse({}).success).toBe(false);
  });
  it("should validate start_container", () => {
    expect(ContainerStartSchema.safeParse({ id: "abc123" }).success).toBe(true);
  });
  it("should validate stop_container with timeout", () => {
    expect(ContainerStopSchema.safeParse({ id: "abc", t: 30 }).success).toBe(true);
  });
  it("should validate restart_container", () => {
    expect(ContainerRestartSchema.safeParse({ id: "abc" }).success).toBe(true);
  });
  it("should validate kill_container with signal", () => {
    expect(ContainerKillSchema.safeParse({ id: "abc", signal: "SIGTERM" }).success).toBe(true);
  });
  it("should validate remove_container with options", () => {
    expect(ContainerRemoveSchema.safeParse({ id: "abc", v: true, force: true }).success).toBe(true);
  });
  it("should validate container_logs", () => {
    expect(ContainerLogsSchema.safeParse({ id: "abc", stdout: true, tail: "100" }).success).toBe(true);
  });
  it("should validate container_stats", () => {
    expect(ContainerStatsSchema.safeParse({ id: "abc" }).success).toBe(true);
  });
  it("should validate rename_container", () => {
    expect(ContainerRenameSchema.safeParse({ id: "abc", name: "new-name" }).success).toBe(true);
  });
  it("should reject rename_container without name", () => {
    expect(ContainerRenameSchema.safeParse({ id: "abc" }).success).toBe(false);
  });
  it("should validate pause_container", () => {
    expect(ContainerPauseSchema.safeParse({ id: "abc" }).success).toBe(true);
  });
  it("should validate update_container with resources", () => {
    expect(ContainerUpdateSchema.safeParse({ id: "abc", Memory: 536870912, CpuShares: 512 }).success).toBe(true);
  });
  it("should validate prune_containers", () => {
    expect(ContainerPruneSchema.safeParse({}).success).toBe(true);
  });
  it("should validate container_top", () => {
    expect(ContainerTopSchema.safeParse({ id: "abc", ps_args: "-ef" }).success).toBe(true);
  });
  it("should validate wait_container", () => {
    expect(ContainerWaitSchema.safeParse({ id: "abc", condition: "not-running" }).success).toBe(true);
  });
  it("should reject wait_container invalid condition", () => {
    expect(ContainerWaitSchema.safeParse({ id: "abc", condition: "invalid" }).success).toBe(false);
  });
  it("should validate exec_create", () => {
    expect(ExecCreateSchema.safeParse({ id: "abc", Cmd: ["ls", "-la"] }).success).toBe(true);
  });
  it("should reject exec_create without Cmd", () => {
    expect(ExecCreateSchema.safeParse({ id: "abc" }).success).toBe(false);
  });
  it("should validate exec_start", () => {
    expect(ExecStartSchema.safeParse({ id: "exec123" }).success).toBe(true);
  });
  it("should validate exec_inspect", () => {
    expect(ExecInspectSchema.safeParse({ id: "exec123" }).success).toBe(true);
  });
});

describe("Image schemas", () => {
  it("should validate list_images defaults", () => {
    expect(ImageListSchema.safeParse({}).success).toBe(true);
  });
  it("should validate inspect_image", () => {
    expect(ImageInspectSchema.safeParse({ name: "nginx:latest" }).success).toBe(true);
  });
  it("should reject inspect_image without name", () => {
    expect(ImageInspectSchema.safeParse({}).success).toBe(false);
  });
  it("should validate pull_image", () => {
    expect(ImagePullSchema.safeParse({ fromImage: "nginx", tag: "1.25" }).success).toBe(true);
  });
  it("should reject pull_image without fromImage", () => {
    expect(ImagePullSchema.safeParse({}).success).toBe(false);
  });
  it("should validate remove_image with options", () => {
    expect(ImageRemoveSchema.safeParse({ name: "nginx", force: true }).success).toBe(true);
  });
  it("should validate tag_image", () => {
    expect(ImageTagSchema.safeParse({ name: "nginx", repo: "myrepo", tag: "v1" }).success).toBe(true);
  });
  it("should reject tag_image without repo", () => {
    expect(ImageTagSchema.safeParse({ name: "nginx" }).success).toBe(false);
  });
  it("should validate search_images", () => {
    expect(ImageSearchSchema.safeParse({ term: "nginx", limit: 25 }).success).toBe(true);
  });
  it("should validate prune_images", () => {
    expect(ImagePruneSchema.safeParse({}).success).toBe(true);
  });
  it("should validate image_history", () => {
    expect(ImageHistorySchema.safeParse({ name: "nginx" }).success).toBe(true);
  });
  it("should validate image_build", () => {
    expect(ImageBuildSchema.safeParse({ t: "myapp:latest", nocache: true }).success).toBe(true);
  });
});

describe("Volume schemas", () => {
  it("should validate list_volumes", () => {
    expect(VolumeListSchema.safeParse({}).success).toBe(true);
  });
  it("should validate create_volume", () => {
    expect(VolumeCreateSchema.safeParse({ Name: "my-vol", Driver: "local" }).success).toBe(true);
  });
  it("should validate inspect_volume", () => {
    expect(VolumeInspectSchema.safeParse({ name: "my-vol" }).success).toBe(true);
  });
  it("should reject inspect_volume without name", () => {
    expect(VolumeInspectSchema.safeParse({}).success).toBe(false);
  });
  it("should validate remove_volume", () => {
    expect(VolumeRemoveSchema.safeParse({ name: "my-vol", force: true }).success).toBe(true);
  });
  it("should validate prune_volumes", () => {
    expect(VolumePruneSchema.safeParse({}).success).toBe(true);
  });
});

describe("Network schemas", () => {
  it("should validate list_networks", () => {
    expect(NetworkListSchema.safeParse({}).success).toBe(true);
  });
  it("should validate create_network", () => {
    expect(NetworkCreateSchema.safeParse({ Name: "my-net" }).success).toBe(true);
  });
  it("should reject create_network without Name", () => {
    expect(NetworkCreateSchema.safeParse({}).success).toBe(false);
  });
  it("should validate create_network full", () => {
    expect(NetworkCreateSchema.safeParse({
      Name: "my-net", Driver: "bridge", Internal: true,
      Labels: { env: "prod" }, EnableIPv6: true,
    }).success).toBe(true);
  });
  it("should validate inspect_network", () => {
    expect(NetworkInspectSchema.safeParse({ id: "net123" }).success).toBe(true);
  });
  it("should validate remove_network", () => {
    expect(NetworkRemoveSchema.safeParse({ id: "net123" }).success).toBe(true);
  });
  it("should validate connect_network", () => {
    expect(NetworkConnectSchema.safeParse({ id: "net123", Container: "abc" }).success).toBe(true);
  });
  it("should reject connect_network without Container", () => {
    expect(NetworkConnectSchema.safeParse({ id: "net123" }).success).toBe(false);
  });
  it("should validate disconnect_network", () => {
    expect(NetworkDisconnectSchema.safeParse({ id: "net123", Container: "abc", Force: true }).success).toBe(true);
  });
  it("should validate prune_networks", () => {
    expect(NetworkPruneSchema.safeParse({}).success).toBe(true);
  });
});

describe("System schemas", () => {
  it("should validate system_events", () => {
    expect(SystemEventsSchema.safeParse({ since: "1h" }).success).toBe(true);
  });
  it("should validate raw_api_call", () => {
    expect(RawApiCallSchema.safeParse({ method: "GET", path: "/v1.47/_ping" }).success).toBe(true);
  });
  it("should reject raw_api_call invalid method", () => {
    expect(RawApiCallSchema.safeParse({ method: "PATCH", path: "/" }).success).toBe(false);
  });
  it("should validate raw_api_call with body and query", () => {
    expect(RawApiCallSchema.safeParse({
      method: "POST", path: "/swarm/init",
      body: { ListenAddr: "0.0.0.0:2377" },
      query: { force: "true" },
    }).success).toBe(true);
  });
});
