import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ImageMagickRunner } from "../lib/runner.js";
import { TextOverlaySchema, CompositeSchema, BatchConvertSchema, CreateGifSchema, CreateSpriteSheetSchema, RawMagickSchema, RawIdentifySchema } from "../lib/schemas.js";
import { toolResult, toolError, withErrorHandler } from "../lib/utils.js";

export function registerAdvancedTools(server: McpServer, runner: ImageMagickRunner): void {
  server.tool("text_overlay", "Add text overlay to an image", TextOverlaySchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const args: string[] = [p.input];
      if (p.gravity) args.push("-gravity", p.gravity);
      if (p.font) args.push("-font", p.font);
      if (p.pointsize) args.push("-pointsize", String(p.pointsize));
      if (p.fill) args.push("-fill", p.fill);
      if (p.stroke) args.push("-stroke", p.stroke);
      if (p.strokewidth) args.push("-strokewidth", String(p.strokewidth));
      args.push("-annotate", "+0+0", p.text, p.output);
      const r = await runner.convert(args);
      return r.exitCode === 0 ? toolResult({ output: p.output }) : toolError(r.stderr);
    });
  });

  server.tool("composite_images", "Overlay one image on another (watermark, logo, etc.)", CompositeSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const args: string[] = ["composite"];
      if (p.compose) args.push("-compose", p.compose);
      if (p.gravity) args.push("-gravity", p.gravity);
      if (p.geometry) args.push("-geometry", p.geometry);
      if (p.opacity !== undefined) args.push("-dissolve", String(p.opacity));
      args.push(p.overlay, p.base, p.output);
      const r = await runner.run(args);
      return r.exitCode === 0 ? toolResult({ output: p.output }) : toolError(r.stderr);
    });
  });

  server.tool("batch_convert", "Convert multiple images (glob pattern) to another format", BatchConvertSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const args = ["mogrify", "-path", p.output_dir, "-format", p.output_format];
      if (p.resize) args.push("-resize", p.resize);
      if (p.quality) args.push("-quality", String(p.quality));
      args.push(p.input_pattern);
      const r = await runner.run(args);
      return r.exitCode === 0 ? toolResult({ output_dir: p.output_dir, format: p.output_format }) : toolError(r.stderr);
    });
  });

  server.tool("create_gif", "Create an animated GIF from image frames", CreateGifSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const args = ["convert", "-delay", String(p.delay)];
      if (p.loop !== undefined) args.push("-loop", String(p.loop));
      if (p.resize) args.push("-resize", p.resize);
      args.push(p.input_pattern, p.output);
      const r = await runner.run(args);
      return r.exitCode === 0 ? toolResult({ output: p.output }) : toolError(r.stderr);
    });
  });

  server.tool("create_sprite_sheet", "Create a sprite sheet from multiple images", CreateSpriteSheetSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const args = ["montage", p.input_pattern, "-tile", p.tile];
      if (p.geometry) args.push("-geometry", p.geometry);
      args.push(p.output);
      const r = await runner.run(args);
      return r.exitCode === 0 ? toolResult({ output: p.output }) : toolError(r.stderr);
    });
  });

  server.tool("raw_magick", "Run any ImageMagick command directly", RawMagickSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const r = await runner.run(p.args);
      return r.exitCode === 0 ? toolResult({ stdout: r.stdout.trim(), stderr: r.stderr.trim() }) : toolError(`Exit ${r.exitCode}: ${r.stderr}`);
    });
  });

  server.tool("raw_identify", "Run any identify command directly", RawIdentifySchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const r = await runner.identify(p.args);
      return r.exitCode === 0 ? toolResult({ stdout: r.stdout.trim() }) : toolError(`Exit ${r.exitCode}: ${r.stderr}`);
    });
  });
}
