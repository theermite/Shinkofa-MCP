import { describe, it, expect } from "vitest";
import { ImageMagickRunner } from "../src/lib/runner.js";

describe("ImageMagickRunner", () => {
  it("should construct with defaults", () => { expect(new ImageMagickRunner()).toBeDefined(); });
  it("should construct with custom path", () => { expect(new ImageMagickRunner("/usr/bin/magick", 5000)).toBeDefined(); });
});
