import { describe, expect, it } from "vitest";
import {
  BatchConvertSchema,
  BlurSchema,
  BorderSchema,
  ColorAdjustSchema,
  CompositeSchema,
  ConvertSchema,
  CreateGifSchema,
  CreateSpriteSheetSchema,
  CropSchema,
  FlipSchema,
  IdentifySchema,
  RawMagickSchema,
  ResizeSchema,
  RotateSchema,
  ShadowSchema,
  TextOverlaySchema,
  ThumbnailSchema,
} from "../src/lib/schemas.js";

describe("Basic schemas", () => {
  it("identify", () => {
    expect(IdentifySchema.safeParse({ input: "test.png" }).success).toBe(true);
  });
  it("convert", () => {
    expect(ConvertSchema.safeParse({ input: "test.png", output: "test.webp", quality: 85 }).success).toBe(true);
  });
  it("resize", () => {
    expect(
      ResizeSchema.safeParse({ input: "a.png", output: "b.png", width: 800, height: 600, fit: "cover" }).success,
    ).toBe(true);
  });
  it("crop", () => {
    expect(
      CropSchema.safeParse({ input: "a.png", output: "b.png", width: 200, height: 200, gravity: "Center" }).success,
    ).toBe(true);
  });
  it("rotate", () => {
    expect(RotateSchema.safeParse({ input: "a.png", output: "b.png", degrees: 90 }).success).toBe(true);
  });
  it("flip", () => {
    expect(FlipSchema.safeParse({ input: "a.png", output: "b.png", direction: "horizontal" }).success).toBe(true);
  });
  it("thumbnail", () => {
    expect(ThumbnailSchema.safeParse({ input: "a.png", output: "b.png", size: 150 }).success).toBe(true);
  });
});

describe("Effect schemas", () => {
  it("blur", () => {
    expect(BlurSchema.safeParse({ input: "a.png", output: "b.png", radius: 0, sigma: 5 }).success).toBe(true);
  });
  it("color adjust", () => {
    expect(
      ColorAdjustSchema.safeParse({ input: "a.png", output: "b.png", brightness: 10, saturation: -20 }).success,
    ).toBe(true);
  });
  it("border", () => {
    expect(BorderSchema.safeParse({ input: "a.png", output: "b.png", width: 5, color: "red" }).success).toBe(true);
  });
  it("shadow", () => {
    expect(ShadowSchema.safeParse({ input: "a.png", output: "b.png", opacity: 50 }).success).toBe(true);
  });
});

describe("Advanced schemas", () => {
  it("text overlay", () => {
    expect(
      TextOverlaySchema.safeParse({
        input: "a.png",
        output: "b.png",
        text: "Hello",
        gravity: "SouthEast",
        pointsize: 24,
        fill: "white",
      }).success,
    ).toBe(true);
  });
  it("composite", () => {
    expect(
      CompositeSchema.safeParse({ base: "bg.png", overlay: "logo.png", output: "out.png", gravity: "SouthEast" })
        .success,
    ).toBe(true);
  });
  it("batch convert", () => {
    expect(
      BatchConvertSchema.safeParse({ input_pattern: "*.png", output_dir: "./webp", output_format: "webp" }).success,
    ).toBe(true);
  });
  it("create gif", () => {
    expect(
      CreateGifSchema.safeParse({ input_pattern: "frame_*.png", output: "anim.gif", delay: 10, loop: 0 }).success,
    ).toBe(true);
  });
  it("sprite sheet", () => {
    expect(
      CreateSpriteSheetSchema.safeParse({ input_pattern: "icon_*.png", output: "sprites.png", tile: "8x" }).success,
    ).toBe(true);
  });
  it("raw magick", () => {
    expect(RawMagickSchema.safeParse({ args: ["convert", "a.png", "-negate", "b.png"] }).success).toBe(true);
  });
});
