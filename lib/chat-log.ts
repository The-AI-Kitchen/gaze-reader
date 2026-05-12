import fs from 'fs';
import path from 'path';

// Lightweight server-side chat logger so we can review what people
// are asking during the pilot. Writes one JSON object per line to
// /tmp/gaze-reader-chat.log and also echoes to stdout so it shows up
// in `next dev` output.

export interface ChatLogEntry {
  ts: string;
  userEmail?: string;
  userId?: string;
  paperTitle?: string;
  question: string;
  systemPrompt: string;
  response: string;
}

export function logChat(entry: ChatLogEntry): void {
  const line = JSON.stringify(entry);

  try {
    const logPath = path.join('/tmp', 'gaze-reader-chat.log');
    fs.appendFileSync(logPath, line + '\n', 'utf8');
  } catch (err) {
    console.warn('Could not write chat log file:', err);
  }

  console.log('[chat]', line);
}
