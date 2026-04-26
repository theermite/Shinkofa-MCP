import { z } from "zod";

export const IdentifySchema = z.object({
  input: z.string().describe("Input image path"),
  verbose: z.boolean().optional().describe("Verbose output with all metadata"),
  format: z.string().optional().describe("Custom format string (e.g. '%w %h %m')"),
});

export const ConvertSchema = z.object({
  input: z.string().describe("Input image path"),
  output: z.string().describe("Output image path"),
  resize: z.string().optional().describe("Resize geometry (e.g. '800x600', '50%', '800x600!')"),
  quality: z.number().min(1).max(100).optional().describe("Output quality (1-100)"),
  format: z.string().optional().describe("Force output format (png, jpg, webp, avif, etc.)"),
});

export const ResizeSchema = z.object({
  input: z.string(),
  output: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  fit: z.enum(["contain", "cover", "fill", "inside", "outside"]).optional().describe("Resize fit mode"),
  quality: z.number().min(1).max(100).optional(),
});

export const CropSchema = z.object({
  input: z.string(),
  output: z.string(),
  width: z.number(),
  height: z.number(),
  x: z.number().optional().describe("X offset"),
  y: z.number().optional().describe("Y offset"),
  gravity: z
    .enum(["NorthWest", "North", "NorthEast", "West", "Center", "East", "SouthWest", "South", "SouthEast"])
    .optional(),
});

export const RotateSchema = z.object({
  input: z.string(),
  output: z.string(),
  degrees: z.number().describe("Rotation angle in degrees"),
  background: z
    .string()
    .optional()
    .describe("Background color for uncovered areas (e.g. 'white', '#FF0000', 'transparent')"),
});

export const FlipSchema = z.object({
  input: z.string(),
  output: z.string(),
  direction: z.enum(["vertical", "horizontal", "both"]),
});

export const BlurSchema = z.object({
  input: z.string(),
  output: z.string(),
  radius: z.number().min(0).describe("Blur radius"),
  sigma: z.number().min(0).describe("Blur sigma (standard deviation)"),
});

export const SharpenSchema = z.object({
  input: z.string(),
  output: z.string(),
  radius: z.number().min(0),
  sigma: z.number().min(0),
});

export const TextOverlaySchema = z.object({
  input: z.string(),
  output: z.string(),
  text: z.string(),
  gravity: z
    .enum(["NorthWest", "North", "NorthEast", "West", "Center", "East", "SouthWest", "South", "SouthEast"])
    .optional(),
  font: z.string().optional(),
  pointsize: z.number().optional(),
  fill: z.string().optional().describe("Text color"),
  stroke: z.string().optional(),
  strokewidth: z.number().optional(),
});

export const CompositeSchema = z.object({
  base: z.string().describe("Base image path"),
  overlay: z.string().describe("Overlay image path"),
  output: z.string(),
  gravity: z
    .enum(["NorthWest", "North", "NorthEast", "West", "Center", "East", "SouthWest", "South", "SouthEast"])
    .optional(),
  geometry: z.string().optional().describe("Offset (e.g. '+10+20')"),
  compose: z.enum(["Over", "Multiply", "Screen", "Overlay", "Dissolve", "Difference", "Add"]).optional(),
  opacity: z.number().min(0).max(100).optional(),
});

export const ThumbnailSchema = z.object({
  input: z.string(),
  output: z.string(),
  size: z.number().describe("Square thumbnail size in pixels"),
  quality: z.number().min(1).max(100).optional(),
});

export const StripMetadataSchema = z.object({
  input: z.string(),
  output: z.string(),
});

export const OptimizeSchema = z.object({
  input: z.string(),
  output: z.string(),
  quality: z.number().min(1).max(100).optional(),
  strip: z.boolean().optional().describe("Remove metadata"),
  interlace: z.enum(["None", "Line", "Plane", "Partition"]).optional(),
});

export const BatchConvertSchema = z.object({
  input_pattern: z.string().describe("Glob pattern (e.g. '*.png')"),
  output_dir: z.string(),
  output_format: z.string().describe("Target format (webp, avif, jpg, etc.)"),
  resize: z.string().optional(),
  quality: z.number().min(1).max(100).optional(),
});

export const CreateGifSchema = z.object({
  input_pattern: z.string().describe("Input frames pattern (e.g. 'frame_*.png')"),
  output: z.string(),
  delay: z.number().describe("Delay between frames in centiseconds"),
  loop: z.number().optional().describe("Loop count (0 = infinite)"),
  resize: z.string().optional(),
});

export const CreateSpriteSheetSchema = z.object({
  input_pattern: z.string(),
  output: z.string(),
  tile: z.string().describe("Tile layout (e.g. '4x4', '8x')"),
  geometry: z.string().optional().describe("Each tile geometry (e.g. '64x64+0+0')"),
});

export const ColorAdjustSchema = z.object({
  input: z.string(),
  output: z.string(),
  brightness: z.number().optional().describe("Brightness adjustment (-100 to 100)"),
  contrast: z.number().optional().describe("Contrast adjustment (-100 to 100)"),
  saturation: z.number().optional().describe("Saturation adjustment (-100 to 100)"),
  modulate: z.string().optional().describe("Modulate brightness,saturation,hue (e.g. '110,120,100')"),
  colorspace: z.enum(["sRGB", "RGB", "CMYK", "Gray", "HSL", "HSB", "Lab"]).optional(),
});

export const BorderSchema = z.object({
  input: z.string(),
  output: z.string(),
  width: z.number(),
  color: z.string().optional().describe("Border color (default: black)"),
});

export const ShadowSchema = z.object({
  input: z.string(),
  output: z.string(),
  opacity: z.number().min(0).max(100).optional(),
  sigma: z.number().optional(),
  x_offset: z.number().optional(),
  y_offset: z.number().optional(),
  color: z.string().optional(),
});

export const RawMagickSchema = z.object({
  args: z.array(z.string()).describe("Raw ImageMagick arguments (passed directly to `magick`)"),
});

export const RawIdentifySchema = z.object({
  args: z.array(z.string()).describe("Raw identify arguments"),
});
