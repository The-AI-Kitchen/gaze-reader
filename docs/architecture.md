# Architecture: Cloud-first MVP monolith

GazeReader is built as a single Next.js application that talks to a hosted LLM (Claude via the Anthropic API) for grounded question answering. This is the fastest path to a working demo and keeps ops minimal.

## C4 context

```mermaid
C4Context
title GazeReader - Cloud-first MVP - Context

Person(Researcher, "Student/Researcher", "Reads papers; asks contextual questions")

System(GazeReader, "GazeReader", "Gaze-aware reading assistant (web app)")

System_Ext(BrowserWebcam, "Browser + Webcam", "Camera stream; Web APIs")
System_Ext(PaperSource, "Paper source", "Bundled sample papers / simple import")
System_Ext(AnthropicAPI, "Anthropic API (Claude)", "Hosted LLM answers")

Rel(Researcher, GazeReader, "Reads paper; asks questions")
Rel(GazeReader, BrowserWebcam, "Gaze tracking", "Web APIs")
Rel(GazeReader, PaperSource, "Loads paper", "HTTP / file")
Rel(GazeReader, AnthropicAPI, "Grounded Q&A", "HTTPS")

UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

## C4 container

```mermaid
C4Container
title GazeReader - Cloud-first MVP - Containers

Person(Researcher, "Student/Researcher", "Reads papers; asks contextual questions")

System_Ext(AnthropicAPI, "Anthropic API (Claude)", "Hosted LLM answers")

System_Boundary(GazeReaderBoundary, "GazeReader") {
  Container(WebFrontend, "Web app", "Next.js / React", "Paper viewer, query panel, calibration")
  Container(GazeTracking, "Gaze tracking module", "WebGazer + MediaPipe (WASM)", "Calibration + gaze->paragraph inference")
  Container(PaperContent, "Paper content", "Static files in /public", "Sample paper HTML/metadata")
  Container(ApiAsk, "Backend API (/api/ask)", "Next.js Route Handler", "Builds prompt; calls Anthropic")
}

Rel(Researcher, WebFrontend, "Uses", "HTTPS")
Rel(WebFrontend, GazeTracking, "Gaze coords / active paragraph", "in-process")
Rel(WebFrontend, PaperContent, "Load paper", "HTTP")
Rel(WebFrontend, ApiAsk, "POST question + passage", "HTTPS / JSON")
Rel(ApiAsk, AnthropicAPI, "LLM inference", "HTTPS")

UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

## Assumptions

- Users are online and okay with passages + paper text being sent to a hosted LLM.
- Paper library stays small/static for the MVP; PDF ingestion is out of scope.
- One Next.js deployment (Vercel-class) is the whole backend.

## Trade-offs

- **Pros**: Shortest path to a working demo; best answer quality via hosted LLM; minimal ops.
- **Cons**: Sends paper content to a third party; ongoing API cost; no research/event data captured; privacy story is weakest.
