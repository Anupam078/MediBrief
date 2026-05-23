# Style Guide & Component Library Map

MediBrief AI follows a **Premium Clinical Aesthetic**, prioritizing high legibility, professional trust, and modern UI patterns (Glassmorphism, subtle micro-animations).

## 1. Design Tokens (CSS Variables)

Defined in `index.css` for global consumption.

### Color Palette

| Token | Hex/HSL | Usage |
|---|---|---|
| `--color-bg` | `#F8FAFC` | App Background (Light Gray/Blue) |
| `--color-surface` | `rgba(255, 255, 255, 0.8)` | Cards / Panels (Glassmorphism base) |
| `--color-primary` | `#0EA5E9` | Primary Buttons, Links, Branding |
| `--color-secondary` | `#64748B` | Secondary Text, Borders |
| `--severity-high` | `#EF4444` | High Severity Flags (Red) |
| `--severity-medium` | `#F59E0B` | Medium Severity Flags (Amber) |
| `--severity-low` | `#3B82F6` | Low Severity / Info Flags (Blue) |
| `--color-text` | `#1E293B` | Primary Typography |

### Typography

- **Primary Font**: `Inter` or `System Sans-Serif`.
- **Scale**:
    - `h1`: 2.25rem (36px), Bold
    - `h2`: 1.5rem (24px), Semibold
    - `h3`: 1.125rem (18px), Medium
    - `body`: 1rem (16px), Regular
    - `caption`: 0.875rem (14px), Regular

---

## 2. Component Library Map

### Layout Primitives

| Component | Description | Properties |
|---|---|---|
| `Container` | Centers content and applies responsive padding. | `max-width: 1440px` |
| `Card` | Glassmorphic container for results. | `backdrop-filter: blur(10px); border: 1px solid white;` |
| `Button` | Interactive trigger for analysis/clear actions. | Variants: `primary`, `outline`, `ghost` |

### Feature Components

1. **`InputPanel`**:
    - `TextArea`: Large, auto-expanding text input for raw records.
    - `ActionButton`: The "Analyze" trigger with loading state animation.
    - `SampleLoader`: Toggle to load mock medical text.

2. **`SummaryCard`**:
    - Clinical-style header with "Executive Summary" label.
    - Text block with line-height optimized for readability (1.6).

3. **`Timeline`**:
    - Vertically stacked events with a subtle connecting line.
    - `TimeMarker`: Pill-shaped date display.

4. **`FlagsPanel`**:
    - Grouped by severity (`High` first).
    - `FlagItem`: Clickable cards that trigger source highlighting.
    - `Icon`: Distinct icons per severity (Red ❌, Amber ⚠️, Blue ℹ️).

5. **`SourceHighlight`**:
    - Uses `<mark>` or `<span>` with a subtle background transition.
    - `AutoScroll`: Smooth scrolling to active highlight.

---

## 3. UI Motion & Interactions

- **Transitions**: `0.2s ease-in-out` for all hover states.
- **Loading State**: Pulse animation on the `SummaryCard` placeholder while waiting for AI.
- **Hover**: Subtle lift/shadow increase on `FlagItem`.
- **Highlight**: `background-color` fade-in animation for source sentences.
