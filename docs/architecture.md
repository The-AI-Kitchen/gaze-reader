# Architecture (C4 diagrams)

## C4 context

```mermaid
C4Context
title GazeReader - System Context

Person(Researcher, "Student/Researcher", "Reads academic papers; asks contextual questions")

System(GazeReader, "GazeReader", "Gaze-aware AI reading assistant that keeps readers anchored in the paper")

System_Ext(AnthropicAPI, "Anthropic API (Claude)", "LLM answering grounded questions")
System_Ext(PaperSource, "Paper source", "Local sample paper or imported HTML/PDF")
System_Ext(BrowserWebcam, "Browser + Webcam", "Provides camera stream (and mic, optional)")

Rel(Researcher, GazeReader, "Reads paper; asks questions; receives answers")
Rel(GazeReader, BrowserWebcam, "Uses webcam stream for gaze tracking", "Web APIs")
Rel(GazeReader, PaperSource, "Loads paper content", "HTTP/File")
Rel(GazeReader, AnthropicAPI, "Sends question + passage + full paper; receives answer", "HTTPS")
```

## C4 container

```mermaid
C4Container
title GazeReader - Containers

Person(Researcher, "Student/Researcher", "Reads papers; asks contextual questions")

System_Ext(AnthropicAPI, "Anthropic API (Claude)", "LLM answering grounded questions")

System_Boundary(GazeReaderBoundary, "GazeReader") {
  Container(WebFrontend, "Web app (Next.js/React)", "TypeScript", "UI: PaperViewer + Searchlight + QueryPanel + Calibration")
  Container(GazeTracking, "Gaze tracking module", "WebGazer + MediaPipe Face Mesh (WASM)", "Calibration + gaze smoothing + gaze→paragraph inference")
  Container(ApiRouteAsk, "Backend API route (/api/ask)", "Next.js Route Handler", "Builds grounded prompt; calls Anthropic; returns answer text")
  Container(PaperContent, "Paper content store", "Static files (MVP)", "Sample paper HTML/metadata served from public/")
}

Rel(Researcher, WebFrontend, "Uses", "HTTPS")
Rel(WebFrontend, PaperContent, "Fetches paper HTML/metadata", "HTTP")
Rel(WebFrontend, GazeTracking, "Streams gaze coords; receives active paragraph/chunk", "In-process")
Rel(WebFrontend, ApiRouteAsk, "POST /api/ask (question + passage + paper context)", "HTTPS/JSON")
Rel(ApiRouteAsk, AnthropicAPI, "LLM inference (grounded Q&A)", "HTTPS")
```
