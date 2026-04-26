/**
 * Zod schemas for Docker MCP tool inputs.
 * Docker Engine API v1.47 reference.
 */
import { z } from "zod";

// ── Common ──

export const ContainerId = z.string().describe("Container ID or name");
export const ImageId = z.string().describe("Image ID, name, or name:tag");
export const VolumeId = z.string().describe("Volume name");
export const NetworkId = z.string().describe("Network ID or name");

// ── Containers ──

export const ContainerListSchema = z.object({
  all: z.boolean().optional().describe("Show all containers (default shows only running)"),
  limit: z.number().optional().describe("Return this number of most recently created containers"),
  size: z.boolean().optional().describe("Return the size of container as fields SizeRw and SizeRootFs"),
  filters: z.string().optional().describe('JSON-encoded filters: {status:["running"]}, {name:["foo"]}, etc.'),
});

export const ContainerCreateSchema = z.object({
  name: z.string().optional().describe("Container name"),
  Image: z.string().describe("Image to use (e.g. 'nginx:latest')"),
  Cmd: z.array(z.string()).optional().describe("Command to run (overrides image CMD)"),
  Entrypoint: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe("Entrypoint (overrides image ENTRYPOINT)"),
  Env: z.array(z.string()).optional().describe('Environment variables as ["KEY=value", ...]'),
  ExposedPorts: z.record(z.object({})).optional().describe('Ports to expose: {"80/tcp": {}}'),
  WorkingDir: z.string().optional().describe("Working directory inside container"),
  User: z.string().optional().describe("User to run as (uid or uid:gid)"),
  Labels: z.record(z.string()).optional().describe("Labels to attach"),
  Volumes: z.record(z.object({})).optional().describe('Volume mount points: {"/data": {}}'),
  HostConfig: z
    .record(z.unknown())
    .optional()
    .describe("Host-level configuration (PortBindings, Binds, RestartPolicy, Memory, etc.)"),
  NetworkingConfig: z.record(z.unknown()).optional().describe("Network config (EndpointsConfig)"),
  StopSignal: z.string().optional().describe("Signal to stop container (default SIGTERM)"),
  StopTimeout: z.number().optional().describe("Timeout to stop container in seconds"),
  Tty: z.boolean().optional().describe("Attach standard streams to a TTY"),
  OpenStdin: z.boolean().optional().describe("Keep stdin open even if not attached"),
  AttachStdout: z.boolean().optional().describe("Attach to stdout"),
  AttachStderr: z.boolean().optional().describe("Attach to stderr"),
  Healthcheck: z.record(z.unknown()).optional().describe("Health check config"),
});

export const ContainerInspectSchema = z.object({
  id: ContainerId,
  size: z.boolean().optional().describe("Return the size of container as fields SizeRw and SizeRootFs"),
});

export const ContainerStartSchema = z.object({
  id: ContainerId,
  detachKeys: z.string().optional().describe("Override the key sequence for detaching a container"),
});

export const ContainerStopSchema = z.object({
  id: ContainerId,
  signal: z.string().optional().describe("Signal to send (default SIGTERM)"),
  t: z.number().optional().describe("Seconds to wait before killing the container"),
});

export const ContainerRestartSchema = z.object({
  id: ContainerId,
  signal: z.string().optional().describe("Signal to send (default SIGTERM)"),
  t: z.number().optional().describe("Seconds to wait before killing the container"),
});

export const ContainerKillSchema = z.object({
  id: ContainerId,
  signal: z.string().optional().describe("Signal to send (default SIGKILL)"),
});

export const ContainerRemoveSchema = z.object({
  id: ContainerId,
  v: z.boolean().optional().describe("Remove anonymous volumes attached to the container"),
  force: z.boolean().optional().describe("Force removal (kill if running)"),
  link: z.boolean().optional().describe("Remove specified link"),
});

export const ContainerLogsSchema = z.object({
  id: ContainerId,
  follow: z.boolean().optional().describe("Return stream (not supported in MCP — use false)"),
  stdout: z.boolean().optional().describe("Return logs from stdout"),
  stderr: z.boolean().optional().describe("Return logs from stderr"),
  since: z.number().optional().describe("UNIX timestamp: show logs since this time"),
  until: z.number().optional().describe("UNIX timestamp: show logs before this time"),
  timestamps: z.boolean().optional().describe("Add timestamps to log lines"),
  tail: z.string().optional().describe("Number of lines from the end (or 'all')"),
});

export const ContainerStatsSchema = z.object({
  id: ContainerId,
  stream: z.boolean().optional().describe("Stream the output (default false for MCP)"),
  "one-shot": z.boolean().optional().describe("Only get a single stat instead of a stream"),
});

export const ExecCreateSchema = z.object({
  id: ContainerId,
  AttachStdin: z.boolean().optional().describe("Attach to stdin of the exec command"),
  AttachStdout: z.boolean().optional().describe("Attach to stdout"),
  AttachStderr: z.boolean().optional().describe("Attach to stderr"),
  DetachKeys: z.string().optional().describe("Override key sequence for detaching"),
  Tty: z.boolean().optional().describe("Allocate a pseudo-TTY"),
  Cmd: z.array(z.string()).describe("Command and arguments to run"),
  Env: z.array(z.string()).optional().describe('Environment variables ["KEY=val"]'),
  WorkingDir: z.string().optional().describe("Working directory for the exec process"),
  User: z.string().optional().describe("User to run as"),
  Privileged: z.boolean().optional().describe("Run with elevated privileges"),
});

export const ContainerRenameSchema = z.object({
  id: ContainerId,
  name: z.string().describe("New name for the container"),
});

export const ContainerPauseSchema = z.object({
  id: ContainerId,
});

export const ContainerUnpauseSchema = z.object({
  id: ContainerId,
});

export const ContainerUpdateSchema = z.object({
  id: ContainerId,
  BlkioWeight: z.number().optional().describe("Block IO weight (relative weight), accepts 10–1000, or 0 to disable"),
  CpuShares: z.number().optional().describe("CPU shares (relative weight)"),
  CpuPeriod: z.number().optional().describe("CPU CFS period in microseconds"),
  CpuQuota: z.number().optional().describe("CPU CFS quota in microseconds"),
  CpusetCpus: z.string().optional().describe("CPUs allowed (e.g. '0-2', '0,1')"),
  CpusetMems: z.string().optional().describe("Memory nodes allowed"),
  Memory: z.number().optional().describe("Memory limit in bytes"),
  MemoryReservation: z.number().optional().describe("Memory soft limit in bytes"),
  MemorySwap: z.number().optional().describe("Total memory+swap limit (-1 to disable swap)"),
  RestartPolicy: z
    .object({
      Name: z.enum(["", "no", "always", "unless-stopped", "on-failure"]).optional(),
      MaximumRetryCount: z.number().optional(),
    })
    .optional()
    .describe("Restart policy"),
});

export const ContainerPruneSchema = z.object({
  filters: z.string().optional().describe('JSON-encoded filters e.g. {"until":["24h"]}'),
});

export const ContainerTopSchema = z.object({
  id: ContainerId,
  ps_args: z.string().optional().describe("ps arguments (default '-ef')"),
});

export const ContainerWaitSchema = z.object({
  id: ContainerId,
  condition: z.enum(["not-running", "next-exit", "removed"]).optional().describe("Wait until this condition is met"),
});

// ── Images ──

export const ImageListSchema = z.object({
  all: z.boolean().optional().describe("Show all images including intermediates"),
  filters: z.string().optional().describe('JSON-encoded filters: {dangling:["true"]}, {reference:["ubuntu:*"]}'),
  shared_size: z.boolean().optional().describe("Include shared size in response"),
  digests: z.boolean().optional().describe("Show digest information in response"),
});

export const ImageInspectSchema = z.object({
  name: ImageId,
});

export const ImagePullSchema = z.object({
  fromImage: z.string().describe("Image name to pull (e.g. 'nginx')"),
  tag: z.string().optional().describe("Tag to pull (default 'latest')"),
  platform: z.string().optional().describe("Platform in format os[/arch[/variant]] (e.g. 'linux/amd64')"),
});

export const ImageRemoveSchema = z.object({
  name: ImageId,
  force: z.boolean().optional().describe("Force removal (even if used by containers)"),
  noprune: z.boolean().optional().describe("Do not delete untagged parent images"),
});

export const ImageTagSchema = z.object({
  name: ImageId,
  repo: z.string().describe("Repository name (e.g. 'myimage')"),
  tag: z.string().optional().describe("Tag (e.g. 'v1.2.3')"),
});

export const ImageSearchSchema = z.object({
  term: z.string().describe("Term to search for"),
  limit: z.number().optional().describe("Maximum number of results"),
  filters: z.string().optional().describe('JSON-encoded filters: {is-official:["true"]}'),
});

export const ImagePruneSchema = z.object({
  filters: z.string().optional().describe('JSON-encoded filters: {dangling:["true"]}, {until:["24h"]}'),
});

export const ImageHistorySchema = z.object({
  name: ImageId,
});

export const ImageBuildSchema = z.object({
  t: z.string().optional().describe("Name and tag in 'name:tag' format"),
  dockerfile: z.string().optional().describe("Path within context to Dockerfile (default 'Dockerfile')"),
  buildargs: z.string().optional().describe('JSON-encoded build arguments {"KEY":"value"}'),
  labels: z.string().optional().describe("JSON-encoded labels to attach to image"),
  nocache: z.boolean().optional().describe("Do not use cache"),
  rm: z.boolean().optional().describe("Remove intermediate containers after successful build (default true)"),
  forcerm: z.boolean().optional().describe("Always remove intermediate containers"),
  pull: z.string().optional().describe("Attempt to pull newer version of base image"),
  platform: z.string().optional().describe("Platform in format os[/arch[/variant]]"),
  target: z.string().optional().describe("Target build stage"),
  remote: z.string().optional().describe("URL of Dockerfile to build from (git repo or tarball)"),
});

// ── Volumes ──

export const VolumeListSchema = z.object({
  filters: z.string().optional().describe('JSON-encoded filters: {dangling:["true"]}, {driver:["local"]}'),
});

export const VolumeCreateSchema = z.object({
  Name: z.string().optional().describe("Volume name (auto-generated if not specified)"),
  Driver: z.string().optional().describe("Volume driver (default 'local')"),
  DriverOpts: z.record(z.string()).optional().describe("Driver-specific options"),
  Labels: z.record(z.string()).optional().describe("Labels to attach"),
});

export const VolumeInspectSchema = z.object({
  name: VolumeId,
});

export const VolumeRemoveSchema = z.object({
  name: VolumeId,
  force: z.boolean().optional().describe("Force removal (even if in use)"),
});

export const VolumePruneSchema = z.object({
  filters: z.string().optional().describe('JSON-encoded filters: {label:["key=value"]}'),
  all: z.boolean().optional().describe("Remove all unused volumes, not just anonymous ones"),
});

// ── Networks ──

export const NetworkListSchema = z.object({
  filters: z.string().optional().describe('JSON-encoded filters: {driver:["bridge"]}, {name:["mynet"]}'),
});

export const NetworkCreateSchema = z.object({
  Name: z.string().describe("Network name"),
  Driver: z.string().optional().describe("Network driver (default 'bridge')"),
  Scope: z.string().optional().describe("Network scope ('local', 'swarm', 'global')"),
  Internal: z.boolean().optional().describe("Restrict external access"),
  Attachable: z.boolean().optional().describe("Allow manual container attachment (swarm)"),
  Ingress: z.boolean().optional().describe("Swarm routing-mesh network"),
  EnableIPv6: z.boolean().optional().describe("Enable IPv6 networking"),
  IPAM: z
    .object({
      Driver: z.string().optional(),
      Config: z
        .array(
          z.object({
            Subnet: z.string().optional(),
            Gateway: z.string().optional(),
            IPRange: z.string().optional(),
          }),
        )
        .optional(),
      Options: z.record(z.string()).optional(),
    })
    .optional()
    .describe("IP address management"),
  Options: z.record(z.string()).optional().describe("Network driver options"),
  Labels: z.record(z.string()).optional().describe("Labels to attach"),
  CheckDuplicate: z.boolean().optional().describe("Reject creation if name already exists"),
});

export const NetworkInspectSchema = z.object({
  id: NetworkId,
  verbose: z.boolean().optional().describe("Detailed information about services and tasks"),
  scope: z.string().optional().describe("Filter by network scope ('swarm', 'global', 'local')"),
});

export const NetworkRemoveSchema = z.object({
  id: NetworkId,
});

export const NetworkConnectSchema = z.object({
  id: NetworkId,
  Container: z.string().describe("Container ID or name"),
  EndpointConfig: z.record(z.unknown()).optional().describe("Endpoint configuration"),
});

export const NetworkDisconnectSchema = z.object({
  id: NetworkId,
  Container: z.string().describe("Container ID or name"),
  Force: z.boolean().optional().describe("Force disconnect"),
});

export const NetworkPruneSchema = z.object({
  filters: z.string().optional().describe('JSON-encoded filters: {until:["24h"]}, {label:["key=value"]}'),
});

// ── System ──

export const SystemEventsSchema = z.object({
  since: z.string().optional().describe("Show events created since this UNIX timestamp or relative time (e.g. '1h')"),
  until: z.string().optional().describe("Show events created until this UNIX timestamp or relative time"),
  filters: z.string().optional().describe('JSON-encoded filters: {type:["container"]}, {event:["start"]}'),
});

// ── Exec ──

export const ExecStartSchema = z.object({
  id: z.string().describe("Exec instance ID"),
  Detach: z.boolean().optional().describe("Detach from command"),
  Tty: z.boolean().optional().describe("Allocate a pseudo-TTY"),
});

export const ExecInspectSchema = z.object({
  id: z.string().describe("Exec instance ID"),
});

// ── Raw API Call ──

export const RawApiCallSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE"]).describe("HTTP method"),
  path: z.string().describe("Docker API path (e.g. '/v1.47/swarm/init')"),
  body: z.record(z.unknown()).optional().describe("JSON body"),
  query: z.record(z.string()).optional().describe("Query parameters"),
});
