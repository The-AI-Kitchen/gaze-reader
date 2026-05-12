import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Simple feedback inbox: students/reviewers can send us notes about
// the app while we're in pilot. Appends to a JSONL file under /tmp so
// we can read it later from the server.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail, userId, message, paperTitle, rating } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    const entry = {
      ts: new Date().toISOString(),
      userEmail: userEmail || 'anonymous',
      userId: userId || null,
      paperTitle: paperTitle || null,
      rating: rating ?? null,
      message,
    };

    const logPath = path.join('/tmp', 'gaze-reader-feedback.jsonl');
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');

    return NextResponse.json({ ok: true, saved: true });
  } catch (err) {
    console.error('Feedback error:', err);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}

export async function GET() {
  // Quick debug helper so we can read recent feedback from the browser
  // during the pilot.
  try {
    const logPath = path.join('/tmp', 'gaze-reader-feedback.jsonl');
    if (!fs.existsSync(logPath)) {
      return NextResponse.json({ entries: [] });
    }
    const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
    const entries = lines
      .filter((l) => l)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    return NextResponse.json({ entries });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
