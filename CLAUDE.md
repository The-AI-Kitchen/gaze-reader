<!--
This file is a copy of ANNOTATED-REPO.md for Claude Code.
If you need to edit the instructions, edit ANNOTATED-REPO.md
and re-copy to the tool-specific files.

ANNOTATED-REPO.md
Annotated Repository: Reflective Practice for Research through Building

Drop this file into any project repository to enable structured reflection
during AI-assisted development. It works with Claude (CLAUDE.md), Cursor
(.cursorrules), Windsurf, Copilot, or any LLM coding tool that reads
project-level instruction files.

To adopt for your tool, copy this file's contents into the appropriate
location:
  - Claude Code / Claude Projects: CLAUDE.md (root of repo)
  - Cursor: .cursorrules (root of repo)
  - Windsurf: .windsurfrules (root of repo)
  - GitHub Copilot: .github/copilot-instructions.md
  - Other tools: consult your tool's docs for project-level instructions

Version: 0.1.0
License: CC BY 4.0
Source: https://github.com/[TBD]/annotated-repo
Citation: Lukoff, K. (2026). Research through Building: [TBD]
-->

# Annotated Repository: Instructions for the AI Coding Assistant

You are assisting with a project that uses the **Annotated Repository**
method, a reflective research practice in which the development history
of a software system serves as a site of knowledge production. Your role
is to help the builder not only write good code but also capture what
they are learning along the way.

## Your responsibilities

1. **Write good code first.** Reflection is secondary to the work.
   Never slow down or obstruct the builder.

2. **Default to silence.** Most working sessions should have zero
   reflection prompts from you. When in doubt, do not prompt.

3. **Maintain the repo structure** described below when creating
   reflection files. Be consistent with file naming and formatting.

4. **Never fabricate reflections.** If the builder declines, do not
   ask again that session.


## When to prompt (rarely)

The AI should almost never initiate a reflection prompt. There are
only two situations where you should:

**1. The builder asks.** The builder can type `/reflect` at any time.
This is always welcome. See Voluntary Reflections below.

**2. A milestone is tagged.** When the builder tags a release or is
preparing a demo/handoff, offer one brief reflection prompt. This
should happen a handful of times across the entire life of a project.

**That's it.** Do not prompt during routine development, after bug
fixes, after refactors, or after feature completions. Do not prompt
when the builder is in flow. Do not prompt more than once per session.
If the builder wanted to reflect, they would type `/reflect`.


## Voluntary reflections

Voluntary reflection is the primary way entries get captured. The
builder types `/reflect` whenever something feels worth noting:

- `/reflect` — the AI asks one brief question (see below)
- `/reflect [topic]` — the builder names what they want to reflect
  on, e.g., `/reflect pilot test feedback` or `/reflect why I
  scrapped the caching layer`

The builder can also write a reflection directly without AI
prompting. To do this, type `/log` followed by the reflection text:

- `/log Users are treating the notification as a todo list. We
  never designed for that. Rethinking the whole interaction model.`

When the builder uses `/log`, do not ask follow-up questions. Just
format the entry, append it to reflections/log.md with the date and
a commit reference, and confirm it was saved. One sentence of
acknowledgment, then move on.

When the builder uses `/reflect`:

1. Acknowledge in one sentence
2. Ask one question (see below)
3. Format their response as a log entry in reflections/log.md
4. Move on. Do not follow up unless the builder continues.

The method works best when builders develop their own rhythm of
reflecting when something strikes them as interesting, surprising,
or worth remembering. The habit is theirs, not the AI's to impose.


## What to ask (when you do)

One question. Never more than one, except at milestones.

### Fixed questions

These are consistent across all annotated repository projects to
enable comparison across teams and project types:

- "What did you expect to happen, and what actually happened?"
- "What do you know now that you didn't know before building this?"

Pick whichever fits. The first is better when something surprised
the builder. The second is better at milestones.

### Context-generated questions

If you have enough context, you may substitute a question specific
to what just happened. Good generated questions reference concrete
details and ask about implications, not implementation:

- "You just replaced the rules-based classifier with an LLM call.
  Were there cases where the old approach was actually better?"
- "This is the third time you've worked around a rate limit from
  the [X] API. Is that constraint shaping the design?"
- "The user feedback said they stopped using reminders after week
  2. Does that change your assumptions?"

Guidelines: reference the specific change or feedback, connect to
something the builder said earlier if possible, ask about the
implication rather than the technical detail.

### At milestones only

When prompting at a milestone (release tag, demo prep), you may ask
two questions: one fixed and one contextual. Frame it as: "Two quick
questions before we move on." This is the only context where more
than one question is acceptable.


## Repo structure

Maintain the following structure within the repository. The reflections
directory is top-level and visible by design. These reflections are
central to the purpose of an annotated repository, not secondary
metadata. They should be immediately discoverable by anyone browsing
the project, including novice developers and collaborators unfamiliar
with the method.

```
project-root/
├── ANNOTATED-REPO.md          ← This file (instructions for the AI)
├── RESEARCH.md                ← Synthesis narrative (updated at milestones)
├── reflections/
│   ├── log.md                 ← Running log of brief reflections
│   └── milestones/
│       ├── v0.1.md            ← Milestone reflection for v0.1
│       ├── v0.2.md            ← Milestone reflection for v0.2
│       └── ...
└── (rest of project files)
```

### reflections/log.md (running log)

This is a lightweight, append-only log. Each entry is short. The goal
is low-friction capture, not polished writing. Format:

```markdown
## 2026-04-15 — Fixed notification timing after user complaints

Users were dismissing the nudge because it fired during active tasks.
We assumed interruption was acceptable if the content was relevant.
Turns out timing matters more than relevance. Moved to a pause-
detection trigger. This is a general insight about friction-based
interventions: *when* you interrupt is a design decision as important
as *what* you say.

Commit: a1b2c3d
```

Rules for log entries:
- Date and a short descriptive title on the header line
- 2-6 sentences. Can be longer if the builder wants, but never require it.
- Link to the relevant commit hash, issue, or PR when possible
- The builder's own language is fine. Do not polish into academic prose.
- Append new entries at the top (reverse chronological)

### reflections/milestones/vX.X.md (milestone reflections)

Created when the builder tags a release, reaches a significant
milestone, or prepares for a demo/presentation. More structured than
log entries. Use this template:

```markdown
# Milestone Reflection: vX.X

**Date:** YYYY-MM-DD
**What this version does:** (1-2 sentence summary of functionality)

## What we expected
(What was the plan or hypothesis going into this phase of work?)

## What actually happened
(How did implementation, deployment, or user behavior differ from
expectations? Be specific about surprises.)

## What we learned
(What knowledge emerged that would not have been apparent from a
design mockup, wireframe, or prototype alone? What do we know now
that we did not know before building this?)

## Builder-AI interaction notes (optional)
(Were there moments where the AI assistant shaped the direction
of the project in interesting ways? Suggestions accepted, rejected,
or that reframed the problem?)

## Open questions
(What are we still uncertain about? What should we watch for in
the next phase?)

## Key commits or issues
- [commit hash] — brief description
- [issue #] — brief description
```

### RESEARCH.md (synthesis narrative)

This is the top-level document a reader would look at to understand
the research story of the project. It synthesizes across milestones
and log entries. Think of it as the equivalent of Gaver and Bowers'
(2012) annotations that identify patterns across a portfolio of
design artifacts, except here the "portfolio" is the evolution of
a single system over time.

Update RESEARCH.md at major milestones (not every commit). When the
builder asks to update it, or when a new milestone reflection is
written, offer to draft or revise the synthesis.

Structure:

```markdown
# [Project Name]: Research Narrative

## Project overview
(What is this system? Who uses it? What problem does it address?)

## Research through Building context
(What is the research question or area of inquiry? What kind of
knowledge is this project trying to generate through building,
deploying, and maintaining a real system?)

## Timeline and evolution
(Brief chronological narrative of how the system evolved, organized
by version/milestone. Link to milestone reflections for detail.)

## Emergent themes
(What patterns or insights have surfaced across multiple iterations?
These are the "annotations" in the annotated portfolio sense:
observations that connect specific implementation moments to broader
design or research knowledge.)

## What building revealed that design alone could not
(The key RtB argument: specific examples of knowledge that emerged
from deployment, maintenance, real user behavior, or infrastructure
entanglement. This section is the core intellectual contribution.)

## Methods and tools
(How was the system built? What AI tools were used? How were
reflections captured?)
```

When helping draft or update RESEARCH.md, draw on the log entries
and milestone reflections as source material. Quote or paraphrase
the builder's own words. Do not invent insights the builder did
not express.


## Practices for the builder (not the AI)

These notes are for the human, not instructions for the AI assistant.

**Build the habit on your own terms.** The AI will not nag you.
Reflection happens when you type `/reflect` or `/log`. Find a rhythm
that works for you. Some builders reflect at the end of each session.
Some reflect only when something surprises them. Either is fine.

**`/log` for quick capture, `/reflect` for guided reflection.** If
you already know what you want to say, `/log` is faster. If you want
help articulating a vague insight, `/reflect` gives you a question
to respond to.

**Reflection does not need to be profound.** "We thought X, it turned
out Y" is a perfectly good entry. The profundity emerges when you look
across many small reflections at synthesis time.

**Negative results are valuable.** "We built this and nobody used it"
or "the AI-generated code broke in production in a way we couldn't
debug" are important findings, not failures to hide.

**Write in your own voice.** These are field notes, not polished
prose. First person is fine. Informal is fine. Honest is more
important than articulate.

**Review your log periodically.** Skim reflections/log.md at regular
intervals (every few weeks, or at mid-project and end-of-project) and
notice if themes are emerging that you haven't articulated yet. If so,
update RESEARCH.md or note them in the next milestone reflection.

**Invite collaborators to reflect too.** If multiple people work on
the project, anyone can use `/reflect` or `/log`. Include the
author's name or initials in the entry.


## On this method

### Background: Research through Design

In 2007, Zimmerman, Forlizzi, and Evenson proposed **Research through
Design (RtD)** as a method for interaction design research in HCI.
Their core argument was that the act of designing, not just the act of
studying users or engineering systems, produces knowledge. Designers
address wicked problems by envisioning a "preferred state" of the
world and embodying that vision in an artifact. The artifact itself is
the research contribution.

RtD was influential. It gave design-oriented HCI researchers a way to
frame their work as knowledge production rather than just practice.
Gaver (2012) argued that RtD theories are inherently "provisional,
contingent, and aspirational." Koskinen, Zimmerman, et al. (2011)
mapped constructive design research across three settings: Lab, Field,
and Showroom. Gaver and Bowers (2012) proposed **annotated portfolios**
as a way to communicate design research: collections of designed
artifacts, presented together with brief annotations that highlight
patterns and family resemblances across the work. Annotated portfolios
keep the reflection attached to the artifact, rather than abstracting
away into theory that loses touch with the designed thing.

### The gap: from design artifact to deployed system

Despite its influence, RtD has operated primarily at the level of
concept designs, prototypes, and provocations. Artifacts tend to be
relatively low-fidelity, short-lived, and disconnected from the
engineering realities of building and maintaining real software. This
means certain kinds of knowledge remain out of reach: how users
behave over weeks and months with a real tool, how engineering
constraints reshape the design space in ways mockups cannot reveal,
how maintenance and infrastructure entanglement generate insights
that no prototype ever encounters.

This gap has long been recognized. Hudson and Mankoff (2014) noted
that proof-of-concept implementations are fundamental to technical
HCI, but the gulf between a proof-of-concept and a system robust
enough for real-world use is substantial. The cost of crossing that
gulf historically limited who could do it and how often.

### Research through Building

AI-assisted software development has changed this equation. Tools
like Claude Code, Cursor, Copilot, Replit, and V0 now enable
researchers (including those without professional software engineering
backgrounds) to build deployable interactive systems in hours or days
rather than months. The cost of creating real, functional software
has dropped dramatically.

**Research through Building (RtB)** is a research approach that takes
advantage of this shift. It argues that the full lifecycle of software
creation, deployment, use, and iterative evolution serves as a mode of
knowledge production in HCI. Where RtD asks "what should we make?",
RtB asks "what do we learn by actually making it real, deploying it,
and living with the consequences?"

RtB extends rather than replaces RtD. It preserves the designerly
values of RtD (addressing wicked problems, envisioning preferred
states, treating artifacts as carriers of knowledge) while insisting
that these visions be tested against the friction of real
implementation, real users, and real infrastructure over time. The
knowledge that emerges from building, deploying, and maintaining a
system is distinct from, and complementary to, the knowledge that
emerges from designing one.

### Annotated Repositories

The **Annotated Repository** adapts Gaver and Bowers' annotated
portfolios for the medium of version-controlled software. Where an
annotated portfolio is a collection of designed artifacts with textual
annotations highlighting patterns across the work, an annotated
repository is a codebase whose version history is enriched with
structured reflections at the log entry and milestone level, making
the evolution of the system and the builder's evolving understanding
inspectable, forkable, and citable.

The key insight is the same: keep the reflection attached to the
artifact. Do not separate the research narrative from the thing that
was built. The repo is both the artifact and the annotation. Another
researcher can fork the project, trace the decision history, see
where the pivots happened, and build on it.

### Origin

Research through Building and the Annotated Repository method were
developed at the **HCI Lab at Santa Clara University** by Prof. Kai
Lukoff and his students, in the context of the AI Kitchen program,
an interdisciplinary initiative where students across all majors
build real interactive systems using AI tools. The method emerged
from the lab's experience building and maintaining projects including
augmented reality experiences, browser extensions for digital
wellbeing, and AI bias auditing tools, where the most important
research insights consistently came not from design exercises but
from the sustained process of building, deploying, and iterating on
real systems with real users.

### References

- Zimmerman, J., Forlizzi, J., & Evenson, S. (2007). Research
  through Design as a Method for Interaction Design Research in HCI.
  CHI '07, 493-502.
- Gaver, W. (2012). What Should We Expect from Research through
  Design? CHI '12, 937-946.
- Gaver, B. & Bowers, J. (2012). Annotated Portfolios. Interactions
  19(4), 40-49.
- Koskinen, I., Zimmerman, J., Binder, T., Redstrom, J., &
  Wensveen, S. (2011). Design Research Through Practice: From the
  Lab, Field, and Showroom. Morgan Kaufmann.
- Hudson, S.E. & Mankoff, J. (2014). Concepts, Values, and Methods
  for Technical HCI Research. In Ways of Knowing in HCI, 69-93.
- Lukoff, K. (2026). Research through Building. [TBD]

For more on Research through Building, see: [TBD link to paper]
For questions or contributions to this method, see: [TBD link to repo]
