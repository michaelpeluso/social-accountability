# UI / UX DESIGN SPECIFICATION

## Social Accountability & Self‑Improvement App

---

## 1. Product Overview

**Audience**
Disciplined young adults (male‑leaning) focused on self‑improvement, consistency, and performance.

**Design Goal**
Create a performance console — not a wellness app — that is data‑first, motivating, and trustworthy.

---

## 2. Core Design Philosophy

- Data over decoration
- Structure without rigidity
- Energy revealed through interaction
- Inviting but not soft
- Calm pressure, not guilt

The UI should feel like a serious tool that rewards discipline.

---

## 3. Color System

### Light Mode (Primary)

**Base Surfaces**

- Warm off‑white
- Light stone gray
- Minimal contrast between background and components

**Designated Accent Colors**

- Navy / blue‑gray → focus, discipline
- Forest / olive green → growth, consistency
- Muted amber / bronze → streaks, momentum
- Slate lavender → learning, reflection

**Rules**

- No random colors
- Max 2–3 accent colors per screen
- Accents highlight data, not containers
- Subtle gradients only (directional, low contrast)

---

### Dark Mode (Secondary)

**Base Surfaces**

- Deep charcoal
- Near‑black background layers

**Accent Translation**

- Navy → muted electric blue
- Forest green → cool neon green
- Amber → warm gold
- Lavender → cool violet

**Rules**

- Same hierarchy as light mode
- Slightly higher contrast
- Gradients become glow‑based
- No pure black or pure white

---

## 4. Shape & Layout System

- Rounded rectangles (10–12px radius)
- Mix of card sizes and aspect ratios
- Avoid uniform lists
- Pages feel assembled, not templated

Dashboards use varied geometry and dense layouts.
Content pages are calmer but still modular.

---

## 5. Typography & Hierarchy

**Hierarchy Order**

1. Numbers & metrics
2. Section headers
3. Labels
4. Descriptive text

**Rules**

- Numbers are bold and prominent
- Labels are quiet and compact
- Copy is factual, not emotional

Avoid soft language. Use terms like:
progress, consistency, output, streak, delta

---

## 6. Motion & Interaction

**Philosophy**
Motion reinforces state change.

**Approved Motion**

- Bubbling progress fills
- Number tick‑ups with spring easing
- Metric expansion on tap
- Slow gradient drift in backgrounds

**Rules**

- No constant animation
- Motion is earned
- Reduced‑motion supported

---

## 7. Page‑Level UI Specifications

### Dashboard

**Purpose**
Instant situational awareness.

**Characteristics**

- Dense, data‑heavy
- Mixed card sizes
- Minimal separation from background

**Content**

- Pillar scores
- Week‑over‑week deltas
- Habit completion clusters
- Productivity windows
- Trend charts

No actions — informational only.

---

### Social Feed

**Purpose**
Accountability through proof of work.

**Characteristics**

- Variable card heights
- Media + metrics
- Accomplishment‑first

**Interaction**

- Emoji reactions
- Nudges secondary
- No emotional clutter

---

### Habits

**Purpose**
Show habits as systems.

**Characteristics**

- Each habit is a mini‑dashboard
- Progress bars + numeric blocks
- Auto‑log indicators

Neutral presentation of misses.

---

### Growth Hub

**Purpose**
Learning and skill acquisition. This is where the user can access their library, gym workouts, journal, mood tracker, etc.

**Characteristics**

- Tile‑based layout
- Editorial + data hybrid

Breathable but still metric‑aware. Each tile opens to a personalized growth page for the respective activity.

---

## 8. Accessibility

- Large tap targets (48px+)
- High contrast pastels
- Clear focus states
- Reduced‑motion toggle
- No color‑only meaning

---

## 9. Summary

This UI is a disciplined performance interface:
data‑first, socially accountable, and quietly motivating.

---

---

Below is a **full-fledged input system specification** you can drop directly into your app spec. It’s structured, implementation-ready, and iOS-first.

---

# Input System Specification (iOS-Native, React Native)

## 1. Goals

- Match iOS native input behavior and mental models
- Ensure only one input surface is active at any time
- Prevent accidental commits
- Keep inputs modular, swappable, and scalable
- Support future platforms without refactoring screens

---

## 2. Core Principles

- **Single active input** (keyboard or modal)
- **Explicit commit rules** (live vs draft)
- **Predictable dismissal** (tap outside, navigation, background)
- **Canonical data model** (raw values, formatted at UI edge)
- **Platform-adaptive UI behind a stable API**

---

## 3. Input Types (v1)

### 3.1 Text Input

- Backed by native keyboard
- Variants:
  - default
  - email
  - password
  - numeric
  - multiline

- Features:
  - return key control (`next`, `done`)
  - clear button
  - helper + error text
  - content type hints (email, otp, name)

**Default behavior**

- mode: `live`
- tapping outside: dismiss keyboard
- return:
  - single-line → next or done
  - multiline → newline

---

### 3.2 Number Input

- Numeric or decimal keyboard
- Optional formatter (currency, units)
- Optional min/max validation

**Default behavior**

- mode: `live`
- formatting applied visually, raw number stored
- validation on blur

---

### 3.3 Date / Time Input

- Native date picker
- Display modes saw as implementation detail (inline / compact / spinner)

**Presentation**

- Always via modal or bottom sheet

**Default behavior**

- mode: `draft`
- requires explicit **Cancel / Done**
- backdrop tap = cancel

---

### 3.4 Select Input

- Single or multi-select
- Presentation strategies:
  - action sheet (short lists)
  - navigated list screen (long/searchable lists)

**Default behavior**

- action sheet → `live` commit
- list screen → commit on tap, auto-back

---

### 3.5 Slider / Rating Input

- Used for mood, intensity, confidence
- Immediate feedback

**Default behavior**

- mode: `live`
- no Done button

---

## 4. Input Overlay System

### 4.1 Single Active Input Rule

- Only one of the following can be active:
  - keyboard
  - modal picker
  - action sheet

**Enforced via**

- global `InputOverlayManager`

---

### 4.2 InputOverlayManager (global service)

**Responsibilities**

- Track active input
- Enforce exclusivity
- Handle dismissal reasons
- Resolve commit/cancel callbacks

**State**

```
activeId
activeType
mode (live | draft)
draftValue
```

**Dismiss reasons**

- commit
- cancel
- backdrop
- navigation
- app-background

---

## 5. Commit Model

### 5.1 Modes

- `live`
  - value updates immediately

- `draft`
  - local temp value
  - commits only on explicit action

### 5.2 Defaults

| Input Type          | Mode  |
| ------------------- | ----- |
| Text                | live  |
| Number              | live  |
| Date/Time           | draft |
| Action Sheet Select | live  |
| List Select         | live  |
| Slider              | live  |

---

## 6. Dismissal Rules

### 6.1 Tap Outside

| Input Type   | Behavior |
| ------------ | -------- |
| Keyboard     | dismiss  |
| Modal picker | cancel   |
| Action sheet | cancel   |

Configurable per input:

```
backdropAction: cancel | commit | none
```

---

### 6.2 Navigation / App Background

- Active input always closes
- draft mode → cancel
- live mode → keep value

---

## 7. Focus & Blur Policy

- Scroll views dismiss keyboard on drag
- Blur does NOT auto-commit draft inputs
- Focus chain supported for text fields (`next`, `prev`)

---

## 8. Validation Rules

- No error state while typing
- Validation triggered on:
  - blur
  - submit
  - done

- Helper text allowed live
- Error text only after validation trigger

---

## 9. Accessibility

- Minimum 44pt touch targets
- Keyboard-aware focus order
- Screen reader labels for:
  - input
  - error
  - helper
  - modal titles

- All modals must be dismissible without gestures

---

## 10. Component Architecture

### 10.1 Primitive Components

- `InputRow`
- `TextField`
- `NumberField`
- `DateField`
- `SelectField`
- `SliderField`

---

### 10.2 Shared Infrastructure

- `InputBackdrop`
- `InputHeader` (title + cancel/done)
- `FormScrollContainer`
- `FormFocusChain`
- `useInputController()`

---

## 11. Data Handling

- Raw values stored in canonical format
  - date → ISO string
  - number → float/int

- Formatting only at UI boundary
- No formatted values in global state

---

## 12. Form Integration

- All inputs compatible with form controller
- Inputs are **controlled**
- Screens never manage draft state manually

---

## 13. Platform Strategy

- iOS defines behavior baseline
- Android/Web adapt via adapter layer
- No platform logic inside screens

---

## 14. Non-Goals (v1)

- No custom keyboard
- No cross-input validation rules
- No inline calendar for complex ranges

---

If you want, next step options:

- convert this into **TypeScript interfaces**
- map this to **folder + file structure**
- write a **single reference input** (DateField) end-to-end

---

Yes — but it should be **explicitly specified**. Add this section to the spec.

---

## 15. Keyboard + Scroll Interaction (Chat & Feed Behavior)

### 15.1 Keyboard Avoidance

- All scrollable views containing text inputs **must** be keyboard-aware.
- Use:
  - keyboard avoidance container (padding/height strategy)
  - safe-area aware insets

**Rules**

- Input bar stays pinned above keyboard
- Content resizes, not overlaps
- No manual pixel offsets per screen

### 15.2 Chat Scroll While Keyboard Is Open

**Expected iOS behavior**

- Keyboard opening does **not** reset scroll position
- User can freely scroll message history with keyboard visible
- New messages do signal presence but do not auto-jump unless user is at bottom

**Required behavior**

- Scroll view remains scrollable while keyboard is open
- Keyboard dismissal **not** triggered by vertical scroll
- Optional gesture:
  - pull-down past threshold → dismiss keyboard

**Summary rule (easy to remember):**

> _Scrolling never fights the keyboard. Auto-scroll only when the user is already at the bottom._
