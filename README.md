# GazeReader

A gaze-aware AI reading assistant that tracks where you look on an academic paper and lets you ask contextual questions about the passage you're reading.

## Research Concept

Reading academic papers is cognitively demanding. Readers frequently encounter unfamiliar terminology, dense arguments, or methodological details they want to interrogate. GazeReader uses webcam-based eye tracking to detect which passage a reader is focused on, then provides an AI assistant (Claude) pre-loaded with the full paper text and focused on that specific passage.

The core interaction loop:

1. The system tracks your gaze in real time using your laptop's webcam
2. A "searchlight" highlights the paragraph you're currently reading
3. You can ask a question (typed or spoken) about the highlighted passage
4. Claude answers with awareness of both the specific passage and the full paper context

This combines two ideas: (a) gaze as an implicit signal of reading attention, eliminating the need to manually select text, and (b) grounded Q&A where the AI knows exactly what you're looking at.

## Current Status

**MVP / research prototype.** Gaze tracking works (verified with WebGazer + MediaPipe face mesh), and the Q&A pipeline connects to Claude's API. Accuracy of webcam-based eye tracking is inherently approximate, so the interface uses paragraph-level granularity with dwell-time thresholds and smoothing to compensate.

A mouse/hover fallback mode is available for environments where gaze tracking is impractical.

## Architecture

```
Browser (Next.js React app)
  |
  +-- WebGazer.js        Webcam-based eye tracking (ridge regression model)
  |     +-- MediaPipe     Face mesh detection (WASM, served locally)
  |
  +-- Searchlight         Maps gaze coordinates to DOM paragraphs, highlights active passage
  |
  +-- QueryPanel          Text/voice input, quick-action buttons, conversation history
  |
  +-- PaperViewer         Renders parsed academic paper HTML with semantic chunk IDs
  |
  +-- CalibrationOverlay  9-dot click calibration to train the gaze model
  |
  Server (Next.js API route)
    +-- /api/ask           Sends passage context + full paper text to Claude API
```

### Key Technical Decisions

- **WebGazer.js for eye tracking.** Browser-based, no hardware required. Uses ridge regression trained on the 9-point calibration. Accuracy is lower than dedicated eye trackers but sufficient for paragraph-level detection.

- **MediaPipe face mesh (WASM).** WebGazer's face detection backend. The WASM binaries must be served locally from `/mediapipe/face_mesh/` because the browser loads them relative to the page origin.

- **Paragraph-level, not word-level.** Webcam gaze tracking has ~100-200px error. Paragraph-level highlighting is the right granularity for this input precision.

- **Dwell detection (300ms).** The system waits for sustained gaze on a paragraph before highlighting it, reducing noise from saccades and brief glances.

- **5-sample moving average.** Smooths raw gaze coordinates to reduce jitter.

- **Full paper pre-loading.** Claude receives both the full paper text (~12k chars) and the specific highlighted passage, so it can answer both targeted and general questions ("What is the core argument of this paper?").

- **Next.js 13.5 / Node 18.** Pinned to these versions for compatibility with the development environment. Tailwind CSS v3.

### File Structure

```
app/
  page.tsx               Main layout: paper viewer (65%) + query panel (35%)
  layout.tsx             Root layout with Inter font
  globals.css            Paper typography, searchlight transitions, scrollbar styling
  api/ask/route.ts       Server-side Claude API endpoint

components/
  GazeTracker.tsx        WebGazer lifecycle, calibration flow, gaze listener
  CalibrationOverlay.tsx 9-dot calibration grid (viewport units)
  Searchlight.tsx        Maps gaze coords to DOM chunks, manages highlight styles
  QueryPanel.tsx         Question input (text + voice), quick actions, history
  PaperViewer.tsx        Loads and renders the parsed paper

lib/
  paper-parser.ts        Parses arXiv HTML into semantic chunks with IDs
  gaze-utils.ts          Smoothing, dwell detection, gaze-to-DOM mapping
  context-builder.ts     Builds Claude prompt payload with passage + paper context

public/
  mediapipe/face_mesh/   MediaPipe WASM binaries (required for face detection)
  webgazer.js            WebGazer library (served as static file)
  papers/                Sample paper HTML + metadata JSON
```

## Setup

```bash
git clone https://github.com/The-AI-Kitchen/gaze-reader.git
cd gaze-reader
npm install
```

Create `.env.local` with your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`. Grant webcam permission when prompted, complete the 9-dot calibration, and start reading.

## Cursor agent skills (team)

Shared [Cursor agent skills](https://cursor.com/docs/skills) for this repo live under `.cursor/skills/<name>/` (each skill is a `SKILL.md` plus optional reference files). They are committed so every collaborator gets the same workflows after `git clone`.

`skills-lock.json` at the repo root records pinned versions of skills installed from the upstream [`pbakaus/impeccable`](https://github.com/pbakaus/impeccable) collection. Use it when upgrading or auditing what changed.

## Requirements

- Node.js 18+
- A laptop/desktop with a front-facing webcam
- Chrome or Edge recommended (WebGazer performs best in Chromium browsers)
- Anthropic API key for the Q&A feature

## Known Limitations

- Webcam-based gaze tracking is approximate. Accuracy varies with lighting, head position, and webcam quality. Re-calibrate if tracking drifts.
- WebGazer's `begin()` initialization can take 10-15 seconds. The app uses a timeout and proceeds once face detection starts.
- Currently loads a single hardcoded paper. Future work: PDF upload, URL import, multi-paper support.
- Voice input uses the Web Speech API, which has varying browser support.

## License

MIT
