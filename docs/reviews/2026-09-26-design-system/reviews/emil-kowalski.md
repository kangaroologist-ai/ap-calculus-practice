# 评审 B：Emil Kowalski 视角（emil-design-eng + apple-design）

> 来源：Sonnet 只读子代理，2026-09-26。方法：读取 `emilkowalski/skills` 仓库公开的两份 SKILL.md 作为评审方法；Playwright 实测（WebKit iPhone 13 仿真、Chromium `reducedMotion: 'reduce'`），测量脚本保存在会话 scratchpad，未进仓库。下文为子代理报告原文（英文），未改动内容。“measured”表示 Playwright 实测，不等同于 iPhone 真机结果。

## Headline fact

`src/style.css` has **zero `:active` rules** and only three `:hover` rules, none media-gated (only `.text-button:hover` L446, `.button.subtle:hover` L484, `.button.primary:hover` L487, plus the streak keyframes). Every other stateful UI change in the app — feedback appearing, a dialog opening, `<details>` expanding, the keyboard-open action bar repositioning — happens with a computed `transition-duration` of **0s** (measured on `#submit`, `#feedback`, `.auto-next i`, a probe `<dialog>`, `.path-chevron`/`.path-level`, and `.keyboard-open .actions`). MathLive's own virtual keyboard, by contrast, already does press-feedback and material motion correctly. The app is the visually "flat" layer; MathLive is the "alive" layer.

## 1. Before/After/Why

| Before | After | Why |
| --- | --- | --- |
| `.button`, `.text-button`, `.icon-button` have no `:active` rule; measured: holding mouse-down on `#submit` leaves `transform === 'none'` | `transition: transform 100ms ease-out, background 100ms ease; &:active { transform: scale(0.97) }` (on `.icon-button` under 32px use a background-only pressed state) | Response is the foundation (apple-design §1): feedback must start on pointer-down. |
| `.ML__keyboard [data-tooltip]::after` fires on bare `:hover`, no `(hover:hover)` gate (mathlive.mjs L14092-14119); measured `content:"Type +"`, `opacity:1`, `transition-delay:1s`, **still `opacity:1` 50ms after the pointer moved away** (the same 1s delay gates hide as well as show) | `@media not (hover: hover) { .ML__keyboard [data-tooltip]::after { display: none !important } }` — remove on touch rather than retune | Keycaps are the 100+/session tier → no animation, ever. The tooltip adds nothing for touch users and can outlive the tap by up to a second. |
| `#feedback` swaps class/innerHTML synchronously (src/main.ts L315); `transition: 0s` | `.feedback { transition: background-color 150ms ease, color 150ms ease }` | An instant flat colour swap under `aria-live` reads as a glitch; colour-only transitions survive reduced motion. |
| `dialog`/`::backdrop` have no transition (src/style.css L939-955) | `transition: transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms ease-out; @starting-style { transform: scale(0.95); opacity: 0 }`; backdrop opacity 200ms | Modals are the "occasional" tier; start from 0.95, never 0; modals keep centre origin. |
| `.keyboard-open .actions` snaps to `bottom: var(--practice-keyboard-height)` on every `geometrychange` (src/main.ts L81-90) while MathLive's panel animates in over `280ms cubic-bezier(0,0,0.2,1)` (mathlive.mjs L13712-13715) | `transition: bottom 220ms cubic-bezier(0.23,1,0.32,1)` (skip under reduced motion) | Chrome sharing a boundary with an animating surface should move with it, not chase it in jumps. |
| Full-screen confetti on **every** correct answer once `streak >= 10` (src/main.ts L304) | U-R12 option 1: confetti only at 10/25/50/100, inline pulse otherwise | "Tens of times per session → remove or drastically reduce." |
| Reduced motion is a blanket kill: `* { animation: none !important; transition: none !important }` (src/style.css L1260-1265) | Keep opacity/colour transitions; zero out only transform-bearing transitions/keyframes | Reduced motion means gentler feedback, not zero; the wildcard would silently delete future fixes. |
| `:hover` rules at L446/484/487 apply on touch | Wrap in `@media (hover: hover) and (pointer: fine)` | Standard touch-hover guard. |
| `.auto-next i` width set every 50 ms, linear | Leave as-is | Constant motion → linear is correct. |

## 2. Motion tokens + policy

```css
:root {
  --dur-press: 100ms;   /* :active feedback on buttons */
  --dur-fast:  150ms;   /* feedback colour swap, small popovers */
  --dur-base:  200ms;   /* dialog/backdrop enter+exit */
  --dur-chrome: 220ms;  /* keyboard-synced action bar */
  --ease-out:    cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-standard: ease;
  --ease-linear: linear;
}
```

1. Math-keyboard keycap taps: no transition beyond MathLive's own `is-pressed` swap (pointerdown, mathlive.mjs L28713); never a tooltip on touch.
2. Once-per-question UI (feedback colour, action buttons, auto-next bar): `--dur-fast` or linear bar; ease-out entering, `ease` for colour swaps; no bounce.
3. Occasional UI (dialogs, keyboard-synced action bar): `--dur-base`/`--dur-chrome`, ease-out in, exit equal or faster.
4. Celebration only at milestones.
5. `prefers-reduced-motion: reduce` removes transform and scale, keeps opacity/colour.

## 3. What should NOT animate

- Every keycap press (MathLive already keeps it instant; do not wrap keycaps or the math-field in scale/transition).
- The keycap tooltip on touch — remove it.
- The auto-next countdown number and bar (already correct).
- The streak number itself (no odometer count-up).
- `<details>` expand/collapse on the path (instant native toggle is acceptable).
- Confetti frequency: reduce, don't remove.

## 4. Keyboard feel

- App buttons: add the `:active` pattern; keep it out of MathLive keycaps, which already have `is-pressed` (mathlive.mjs L28701-28790).
- Keycaps: interaction model already correct; the defect is the tooltip.
- Haptics: `navigator.vibrate()` is not implemented in iOS Safari (in-browser or home-screen PWA); there is no documented web path to the Taptic Engine. Do not budget time for iOS haptics. Optional: a short, quiet sound on correct/incorrect behind a user setting.

## Priorities

- **P0 · mechanical**: hide the keycap tooltip on touch.
- **P0 · mechanical**: `:active` press feedback on `.button` / `.text-button` / `.icon-button`.
- **P1 · judgement**: sync the action bar with the keyboard's 280 ms entrance (check on a device).
- **P1 · judgement**: resolve U-R12 confetti frequency.
- **P2 · mechanical**: dialog `@starting-style`; feedback colour crossfade; hover media-query gates.
- **P3 · mechanical**: narrow the reduced-motion rule (becomes P1 once any motion above ships).
