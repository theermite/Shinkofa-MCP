import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ImageMagickRunner } from "../lib/runner.js";
import { IdentifySchema, ConvertSchema, ResizeSchema, CropSchema, RotateSchema, FlipSchema, ThumbnailSchema, StripMetadataSchema, OptimizeSchema } from "../lib/schemas.js";
import { toolResult, toolError } from "../lib/utils.js";

export function registerBasicTools(server: McpServer, runner: ImageMagickRunner): void {
  server.tool("identify", "Get image info (dimensions, format, colorspace, metadata)", IdentifySchema.shape, async (p) => {
    const args: string[] = [];
    if (p.verbose) args.push("-verbose");
    if (p.format) args.push("-format", p.format);
    args.push(p.input);
    const r = await runner.identify(args);
    return r.exitCode === 0 ? toolResult({ info: r.stdout.trim() }) : toolError(r.stderr);
  });

  server.tool("convert", "Convert an image (format, resize, quality)", ConvertSchema.shape, async (p) => {
    const args: string[] = [p.input];
    if (p.resize) args.push("-resize", p.resize);
    if (p.quality) args.push("-quality", String(p.quality));
    args.push(p.output);
    const r = await runner.convert(args);
    return r.exitCode === 0 ? toolResult({ output: p.output, message: "Conversion complete" }) : toolError(r.stderr);
  });

  server.tool("resize_image", "Resize an image with fit options", ResizeSchema.shape, async (p) => {
    const args: string[] = [p.input];
    let geom = "";
    if (p.width) geom += p.width;
    geom += "x";
    if (p.height) geom += p.height;
    if (p.fit === "fill") geom += "!";
    else if (p.fit === "cover") geom += "^";
    else if (p.fit === "outside") geom += "^";
    args.push("-resize", geom);
    if (p.fit === "cover" || p.fit === "outside") args.push("-gravity", "Center", "-extent", `${p.width || ""}x${p.height || ""}`);
    if (p.quality) args.push("-quality", String(p.quality));
    args.push(p.output);
    const r = await runner.convert(args);
    return r.exitCode === 0 ? toolResult({ output: p.output }) : toolError(r.stderr);
  });

  server.tool("crop_image", "Crop an image to a region", CropSchema.shape, async (p) => {
    const args: string[] = [p.input];
    if (p.gravity) args.push("-gravity", p.gravity);
    const offset = `+${p.x ?? 0}+${p.y ?? 0}`;
    args.push("-crop", `${p.width}x${p.height}${offset}`, "+repage", p.output);
    const r = await runner.convert(args);
    return r.exitCode === 0 ? toolResult({ output: p.output }) : toolError(r.stderr);
  });

  server.tool("rotate_image", "Rotate an image by degrees", RotateSchema.shape, async (p) => {
    const args: string[] = [p.input];
    if (p.background) args.push("-background", p.background);
    args.push("-rotate", String(p.degrees), p.output);
    const r = await runner.convert(args);
    return r.exitCode === 0 ? toolResult({ output: p.output }) : toolError(r.stderr);
  });

  server.tool("flip_image", "Flip an image vertically, horizontally, or both", FlipSchema.shape, async (p) => {
    const args: string[] = [p.input];
    if (p.direction === "vertical" || p.direction === "both") args.push("-flip");
    if (p.direction === "horizontal" || p.direction === "both") args.push("-flop");
    args.push(p.output);
    const r = await runner.convert(args);
    return r.exitCode === 0 ? toolResult({ output: p.output }) : toolError(r.stderr);
  });

  server.tool("create_thumbnail", "Create a square thumbnail with center crop", ThumbnailSchema.shape, async (p) => {
    const args = [p.input, "-thumbnail", `${p.size}x${p.size}^`, "-gravity", "Center", "-extent", `${p.size}x${p.size}`];
    if (p.quality) args.push("-quality", String(p.quality));
    args.push(p.output);
    const r = await runner.convert(args);
    return r.exitCode === 0 ? toolResult({ output: p.output }) : toolError(r.stderr);
  });

  server.tool("strip_metadata", "Remove all EXIF/metadata from an image", StripMetadataSchema.shape, async (p) => {
    const r = await runner.convert([p.input, "-strip", p.output]);
    return r.exitCode === 0 ? toolResult({ output: p.output }) : toolError(r.stderr);
  });

  server.tool("optimize_image", "Optimize image (quality, strip, interlace)", OptimizeSchema.shape, async (p) => {
    const args: string[] = [p.input];
    if (p.strip) args.push("-strip");
    if (p.quality) args.push("-quality", String(p.quality));
    if (p.interlace) args.push("-interlace", p.interlace);
    args.push(p.output);
    const r = await runner.convert(args);
    return r.exitCode === 0 ? toolResult({ output: p.output }) : toolError(r.stderr);
  });
}
