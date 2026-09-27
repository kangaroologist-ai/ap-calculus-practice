# R7 simulator frame capture (T12, Sonnet; reviewed by Claude in T13)

iPhone 17 Pro simulator, iOS 26.5, Safari 402×714, local dev server `?debug=viewport`.
Sequence each run: clear the answer → hide keyboard → reopen with Math keyboard → wait 1.5 s →
record (`xcrun simctl io recordVideo`, emits a frame only when pixels change) → press fraction.
Landmark: the answer field's blue border at x = 110 device px (3× scale).

| Run | Build | Panel log after the key | Frames |
|---|---|---|---|
| A1 | before T14 (T8 + T11) | `field h 66→84`, then four `scrollY 0→0 window.scrollTo` | field bottom +54 px at once, then field **and keyboard toolbar** move and glide back over ~250 ms (~19 frames); settles 19 px lower than before |
| A2-1 | with T14 | `field h 66→84`; no scrollY lines | field bottom +54 px in one frame; top and keyboard never move |
| A2-2 | with T14 | same | same |
| A2-3 | with T14 | same | same |

Frames kept here: `single_0055.png` (A1 before), `single_0068.png` (A1 mid-glide: the keyboard
toolbar sits lower than the red reference line), `single_0076.png` (A1 settled),
`single_A2_before_0023.png` / `single_A2_after_0024.png` (A2, one frame apart).
Videos and every extracted frame (124 MB) were moved out of the repo to the session scratchpad.

Claude's reading: in A1 the fixed keyboard moved together with the page, so the glide is Safari's
own scroll followed by T11 putting it back, not a CSS animation (the subagent's first guess).
With T14 nothing scrolls; the only change is the field growing downward, which is the new content.
Not captured: a power-key run with T14 (Safari's tab switcher got stuck after many `openurl` tabs),
and a re-run of `&mlscroll=1`.
