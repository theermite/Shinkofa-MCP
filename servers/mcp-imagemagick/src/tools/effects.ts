import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ImageMagickRunner } from "../lib/runner.js";
import { BlurSchema, SharpenSchema, ColorAdjustSchema, BorderSchema, ShadowSchema } from "../lib/schemas.js";
import { toolResult, toolError, withErrorHandler } from "../lib/utils.js";

export function registerEffectTools(server: McpServer, runner: ImageMagickRunner): void {
  server.tool("blur_image", "Apply Gaussian blur to an image", BlurSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const r = await runner.convert([p.input, "-blur", `${p.radius}x${p.sigma}`, p.output]);
      return r.exitCode === 0 ? toolResult({ output: p.output }) : toolError(r.stderr);
    });
  });

  server.tool("sharpen_image", "Sharpen an image", SharpenSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const r = await runner.convert([p.input, "-sharpen", `${p.radius}x${p.sigma}`, p.output]);
      return r.exitCode === 0 ? toolResult({ output: p.output }) : toolError(r.stderr);
    });
  });

  server.tool("adjust_colors", "Adjust brightness, contrast, saturation, or colorspace", ColorAdjustSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const args: string[] = [p.input];
      if (p.modulate) args.push("-modulate", p.modulate);
      else if (p.brightness !== undefined || p.saturation !== undefined) {
        const b = 100 + (p.brightness ?? 0);
        const s = 100 + (p.saturation ?? 0);
        args.push("-modulate", `${b},${s},100`);
      }
      if (p.contrast !== undefined) {
        if (p.contrast > 0) args.push("-contrast-stretch", `${p.contrast}%`);
        else args.push("+contrast");
      }
      if (p.colorspace) args.push("-colorspace", p.colorspace);
      args.push(p.output);
      const r = await runner.convert(args);
      return r.exitCode === 0 ? toolResult({ output: p.output }) : toolError(r.stderr);
    });
  });

  server.tool("add_border", "Add a border around an image", BorderSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const r = await runner.convert([p.input, "-bordercolor", p.color ?? "black", "-border", `${p.width}`, p.output]);
      return r.exitCode === 0 ? toolResult({ output: p.output }) : toolError(r.stderr);
    });
  });

  server.tool("add_shadow", "Add a drop shadow to an image", ShadowSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const opacity = p.opacity ?? 60;
      const sigma = p.sigma ?? 4;
      const x = p.x_offset ?? 4;
      const y = p.y_offset ?? 4;
      const r = await runner.run([
        "convert", p.input,
        "(", "+clone", "-background", p.color ?? "black", "-shadow", `${opacity}x${sigma}+${x}+${y}`, ")",
        "+swap", "-background", "none", "-layers", "merge", "+repage", p.output,
      ]);
      return r.exitCode === 0 ? toolResult({ output: p.output }) : toolError(r.stderr);
    });
  });
}
