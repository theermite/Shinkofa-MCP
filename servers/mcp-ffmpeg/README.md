# @shinkofa/mcp-ffmpeg

MCP server for FFmpeg/FFprobe — video/audio processing, conversion, analysis, streaming.

## Installation

```bash
cd tools/mcp-ffmpeg && pnpm install && pnpm build
```

Requires FFmpeg and FFprobe installed on the system (`ffmpeg -version` must work).

## Configuration

### Claude Code

```json
{
  "mcpServers": {
    "ffmpeg": {
      "command": "node",
      "args": ["D:/30-Dev-Projects/Shinkofa-Ecosystem/tools/mcp-ffmpeg/dist/index.js"]
    }
  }
}
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FFMPEG_PATH` | No | `ffmpeg` | Path to ffmpeg binary |
| `FFPROBE_PATH` | No | `ffprobe` | Path to ffprobe binary |
| `FFMPEG_TIMEOUT_MS` | No | `300000` (5 min) | Process timeout in ms |

## Tools Reference

### Analysis (1 tool)

| Tool | Description |
|------|-------------|
| `probe` | Analyze a media file — duration, resolution, codecs, bitrate, streams, chapters (JSON) |

### Conversion (1 tool)

| Tool | Description |
|------|-------------|
| `convert` | Transcode between formats/codecs with quality control. GPU (NVENC) supported. |

Supported codecs: libx264, h264_nvenc, libx265, hevc_nvenc, av1_nvenc, libvpx-vp9, libaom-av1, copy.
Audio: aac, libmp3lame, libopus, flac, pcm_s16le, copy.

### Editing (8 tools)

| Tool | Description |
|------|-------------|
| `trim` | Cut a segment by start/end time or duration (stream copy or re-encode) |
| `resize` | Scale a video with optional letterboxing. GPU (scale_cuda) supported. |
| `speed` | Change playback speed 0.25x to 4x (video + audio sync) |
| `concat` | Concatenate files with optional crossfade transitions |
| `watermark` | Add image overlay (configurable position, opacity, scale) |
| `drawtext` | Overlay text (titles, timestamps, credits, timed appearance) |
| `chromakey` | Green/blue screen removal with background compositing |
| `compose` | Picture-in-picture, side-by-side (hstack), vertical (vstack), grid layout |

### Extraction (4 tools)

| Tool | Description |
|------|-------------|
| `extract_audio` | Extract audio track from video (any codec, specific track) |
| `extract_frames` | Extract frames at interval or specific timestamp |
| `thumbnail` | Generate thumbnail (timestamp or smart scene detection) |
| `burn_subtitles` | Hardcode subtitles into video (SRT, ASS, VTT, embedded MKV) |

### Audio (2 tools)

| Tool | Description |
|------|-------------|
| `normalize_audio` | EBU R128 loudness normalization (broadcast standard) |
| `create_gif` | Create high-quality GIF with palette optimization |

### Streaming (2 tools)

| Tool | Description |
|------|-------------|
| `stream_push` | Push to RTMP/SRT endpoint (Twitch, YouTube, custom). GPU supported. |
| `generate_hls` | Generate HLS segments + playlist for web streaming |

### Raw (2 tools — 100% coverage)

| Tool | Description |
|------|-------------|
| `raw_ffmpeg` | Execute any FFmpeg command with custom arguments |
| `raw_ffprobe` | Execute any FFprobe command with custom arguments |

Examples:
```
raw_ffmpeg({ args: ["-y", "-i", "in.mp4", "-vf", "vidstabdetect", "-f", "null", "-"] })
raw_ffmpeg({ args: ["-y", "-i", "in.mp4", "-vf", "hue=s=0", "bw.mp4"] })
raw_ffprobe({ args: ["-v", "quiet", "-print_format", "json", "-show_frames", "video.mp4"] })
```

## GPU Acceleration (NVIDIA RTX 4090)

Tools that support GPU acceleration via `gpu: true`:
- `convert` — NVENC encoding (h264_nvenc, hevc_nvenc, av1_nvenc)
- `resize` — CUDA scale filter (scale_cuda)
- `stream_push` — GPU encoding for live streaming
- `generate_hls` — GPU encoding for HLS segments

The RTX 4090 (Ada Lovelace) supports AV1 hardware encoding — use `video_codec: "av1_nvenc"`.

## Architecture

```
src/
├── index.ts              # MCP server entry point
├── lib/
│   ├── executor.ts       # Process spawner with timeout, output capture, arg builder
│   ├── schemas.ts        # Zod schemas for all 20 tools
│   └── utils.ts          # Response formatting
└── tools/
    ├── probe.ts          # Media analysis (ffprobe)
    ├── convert.ts        # Format/codec conversion
    ├── edit.ts           # trim, resize, speed, concat, watermark, drawtext, chromakey, compose
    ├── extract.ts        # Audio, frames, thumbnails, subtitles
    ├── audio.ts          # Normalize, GIF
    ├── streaming.ts      # RTMP/SRT push, HLS generation
    └── raw.ts            # raw_ffmpeg, raw_ffprobe
```

## Development

```bash
pnpm test           # Run tests (51 tests)
pnpm build          # Build to dist/
pnpm type-check     # TypeScript check
```

## Safety

- All input files are validated for existence before processing
- Process timeout prevents runaway jobs (default 5 min)
- Output size capped at 10MB to prevent memory issues
- No shell execution — arguments are passed directly to spawn (no injection risk)
- Overwrite mode (`-y`) enabled by default to prevent interactive prompts blocking
