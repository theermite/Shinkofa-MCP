import { z } from "zod";
export const EntityId = z.string().describe("Entity ID (e.g. 'light.living_room', 'switch.tv')");
export const RawApiCallSchema = z.object({ method: z.enum(["GET", "POST", "PUT", "DELETE"]), path: z.string(), body: z.record(z.unknown()).optional() });
