# UI review (Phase U)

Date: 2026-09-26 · Build: branch `claude/loving-mendel-g7jzz6` after U7 · Screens: welcome, learning path, question with feedback; 390 px and 1280 px; light and dark (Chromium).

## Accessibility audit (WCAG 2.1 AA)

Method: programmatic probes in Playwright (target sizes, focus style, landmarks, computed colours), token contrast in `tests/contrast.test.ts`, the 12 px text floor in `tests/visual-tokens.spec.ts`, and screenshot review. Screen-reader and 200 % zoom checks on real devices are still outstanding.

| # | Finding | Criterion | Severity | Status |
|---|---|---|---|---|
| 1 | Answer-field and secondary-button borders were 1.38:1 (light) and 1.79:1 (dark). | 1.4.11 Non-text contrast | Major | Fixed: new `--control-border` token (≥ 3:1 on surface and page background, tested). |
| 2 | Skip button was 32 px wide. | 2.5.5 Target size (AAA; AA 2.5.8 needs 24 px) | Minor | Fixed: `min-width: 44px`. |
| 3 | Structural import failures surfaced internal messages ("Invalid compact card."). | 3.3.1 Error identification | Major | Fixed: plain-language message with the next step. |
| 4 | Dialog close button was announced as "✕". | 4.1.2 Name, role, value | Major | Fixed: `aria-label="Close"`. |
| 5 | Formula `aria-label` held raw LaTeX. | 1.1.1 / 4.1.2 | Major | Fixed in U2: MathLive speakable text, `role="math"`. |
| 6 | Feedback state relied on colour alone. | 1.4.1 Use of colour | Major | Fixed in U3: ✓ / ! / i icons plus tint. |
| 7 | Text below 11 pt (8–10 px). | 1.4.4 Resize text (and HIG) | Major | Fixed in U3: rem type scale, 12 px floor. |
| 8 | The practice page has no `h1`; headings start at `h2`. | 1.3.1 Info and relationships | Minor | Open. Suggest making the site title an `h1`, or a visually hidden `h1`. |
| 9 | "How to use" sits a few pixels above the other footer links. | — (visual polish) | Minor | Open (pre-existing). |

Verified passing: `lang="en"`; `header`/`main`/`footer` landmarks; visible 2 px focus outline on the answer field; all text/background token pairs ≥ 4.5:1 in both themes; touch targets ≥ 44 px except the brand link (31 px tall, above the 24 px AA minimum).

## Design critique (summary)

- **Hierarchy**: one primary action per screen (Start/Continue practicing, Check answer); the welcome equation now uses an upright d. Good.
- **Consistency**: one token set drives both themes; the leftover green theme is gone; the stylesheet has one rule per selector per breakpoint.
- **Progress language**: "Basic n/2" and "Basic ✓ · Mixed n/2" read clearly on the path. After the v1 → v2 migration, previously Ready students see "0 of N skills ready" until they finish two mixed questions per skill. This follows the approved conservative-migration decision, but the first impression may feel like lost progress. Option: show "Basic passed N" next to "Ready" in each level header.
- **Density at 390 px**: the footer's links wrap to a second row; the gap is now one touch-target row.

## Pending product decision: celebration frequency (U-R12)

Today every correct answer from a 10-streak onward plays full-screen confetti. HIG asks motion to be purposeful and not repetitive. Options:

1. Milestones only: full-screen confetti at 10, 25, 50, 100 in a row; a small inline ✓ pulse otherwise.
2. Every 10th in a row (10, 20, 30, …).
3. Keep current behaviour, but always honour `prefers-reduced-motion` (already respected) and add a setting to turn it off.

Recommendation: option 1. Not implemented until the owner decides.

## Remaining manual checks

- Safe-area insets (notch / home indicator) on a real iPhone in landscape and on Android Chrome.
- VoiceOver (iOS/macOS) reading of formulas and feedback; 200 % browser zoom at 1280 px.
