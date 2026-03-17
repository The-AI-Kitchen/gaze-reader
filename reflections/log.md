# Reflection Log

Entries are reverse chronological (newest first). Each entry has a date, a short title, 2-6 sentences, and a commit reference when possible.

---

*Example entry (delete this when you add your first real entry):*

## 2026-04-15 — Fixed notification timing after user complaints

Users were dismissing the nudge because it fired during active tasks. We assumed interruption was acceptable if the content was relevant. Turns out timing matters more than relevance. Moved to a pause-detection trigger.

Commit: a1b2c3d
