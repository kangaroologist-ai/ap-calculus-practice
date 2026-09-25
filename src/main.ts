import { layoutsFor } from "./math-keyboard";
import { celebrateFullScreen, stopCelebration } from "./celebration";
import {
  MathfieldElement,
  convertLatexToMarkup,
  convertLatexToSpeakableText,
} from "mathlive";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { SKILLS, validateConfig } from "./catalog";
import type { Config, Question, Verdict } from "./types";
import { incorrectFeedbackText } from "./feedback";
import {
  freshProgress,
  chooseNext,
  recordOutcome,
  recordHint,
  finishQuestion,
  isReady,
  todayCount,
  type AppState,
} from "./progress";
import {
  loadState,
  saveState,
  replaceState,
  restoreBackup,
  resetState,
  validateLocalState,
  commitMigration,
} from "./storage";
import { LATEST_FORMAT } from "./migrate";
import {
  makePortableProgress,
  encodeProgress,
  decodeProgress,
  splitIntoQrFrames,
  qrErrorCorrection,
  QrCollector,
  type PortableProgress,
} from "./transfer";
import { Grader } from "./grader-client";
import { ddx, dydx } from "./notation";
import "./style.css";
MathfieldElement.fontsDirectory = "/fonts";
MathfieldElement.soundsDirectory = null;
const app = document.querySelector<HTMLDivElement>("#app")!;
let config: Config,
  state: AppState,
  busy = false,
  temporary = false,
  replacing = false,
  saveTimer: ReturnType<typeof setTimeout> | undefined;
let modalCleanup: () => void = () => {};
const grader = new Grader();
let activeMathfield: MathfieldElement | undefined;
function keepAnswerVisible() {
  if (
    !window.mathVirtualKeyboard.visible ||
    !matchMedia("(max-width: 700px)").matches
  )
    return;
  const field = activeMathfield?.isConnected
    ? activeMathfield
    : document.querySelector<MathfieldElement>("math-field");
  const actions = document.querySelector(".actions");
  if (!field || !actions) return;
  const bounds = field.getBoundingClientRect();
  const bottom = actions.getBoundingClientRect().top - 16;
  if (bounds.bottom > bottom)
    window.scrollBy({ top: bounds.bottom - bottom, behavior: "instant" });
  else if (bounds.top < 16)
    window.scrollBy({ top: bounds.top - 16, behavior: "instant" });
}
window.mathVirtualKeyboard.addEventListener("geometrychange", () => {
  const keyboard = window.mathVirtualKeyboard;
  const visible = keyboard.visible && keyboard.boundingRect.height > 0;
  document.documentElement.style.setProperty(
    "--practice-keyboard-height",
    `${visible ? keyboard.boundingRect.height : 0}px`,
  );
  document.body.classList.toggle("keyboard-open", visible);
  if (visible) requestAnimationFrame(keepAnswerVisible);
});
let autoNextTimer: ReturnType<typeof setInterval> | undefined;
function cancelAutoNext() {
  clearInterval(autoNextTimer);
  autoNextTimer = undefined;
  const panel = document.getElementById("auto-next");
  if (panel) panel.hidden = true;
}
function focusAnswer(keepKeyboard = false, retry = false) {
  const field =
    retry && activeMathfield?.isConnected
      ? activeMathfield
      : document.querySelector<MathfieldElement>("math-field");
  if (state.session?.finished || !field) {
    window.mathVirtualKeyboard.hide();
    document.getElementById("again")?.focus();
    return;
  }
  activeMathfield = field;
  field.focus();
  if (keepKeyboard) window.mathVirtualKeyboard.show();
  requestAnimationFrame(keepAnswerVisible);
}
function startAutoNext() {
  cancelAutoNext();
  const current = state.session?.current;
  if (current?.verdict?.status !== "correct" || document.hidden) return;
  const panel = document.getElementById("auto-next");
  if (!panel) return;
  panel.hidden = false;
  const started = performance.now();
  const tick = () => {
    if (
      state.session?.current !== current ||
      document.querySelector("dialog[open]") ||
      document.hidden
    ) {
      cancelAutoNext();
      return;
    }
    const remaining = Math.max(0, 3000 - (performance.now() - started));
    panel.querySelector("span")!.textContent =
      `Next in ${Math.ceil(remaining / 1000)}s`;
    (panel.querySelector("i") as HTMLElement).style.width =
      `${remaining / 30}%`;
    if (remaining === 0) {
      cancelAutoNext();
      void next();
    }
  };
  tick();
  autoNextTimer = setInterval(tick, 50);
}
document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Enter" && event.repeat) event.preventDefault();
  },
  true,
);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { cancelAutoNext(); stopCelebration(); }
  else if (state) updateActivity();
});
const esc = (s: unknown) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const math = (s: string) =>
  `<div class="formula-wrap"><div class="formula" tabindex="0" role="math" aria-label="${esc(convertLatexToSpeakableText(s))}">${convertLatexToMarkup(s)}</div><span class="formula-scroll" hidden>Scroll to see the full formula →</span></div>`;
function refreshFormulaCues() {
  document.querySelectorAll<HTMLElement>(".formula").forEach((el) => {
    const cue = el.nextElementSibling as HTMLElement | null;
    if (cue) cue.hidden = el.scrollWidth <= el.clientWidth + 1;
  });
}
const formulaObserver = new ResizeObserver(refreshFormulaCues);
function observeFormulas() {
  formulaObserver.disconnect();
  document
    .querySelectorAll(".formula")
    .forEach((el) => formulaObserver.observe(el));
  requestAnimationFrame(refreshFormulaCues);
  void document.fonts.ready.then(refreshFormulaCues);
}
const icon = '<span class="brand-mark" aria-hidden="true">ƒ′</span>';
function button(id: string, label: string, cls = "button") {
  return `<button id="${id}" class="${cls}">${label}</button>`;
}
function on(id: string, fn: () => unknown) {
  document.getElementById(id)?.addEventListener("click", () => {
    Promise.resolve(fn()).catch(showError);
  });
}
function showError(error: unknown) {
  const el = document.getElementById("notice");
  if (el) {
    el.textContent = (error as Error).message || String(error);
    el.hidden = false;
  } else alert((error as Error).message);
}
async function persist() {
  if (temporary || replacing || !state) return;
  try {
    await saveState(state);
  } catch {
    temporary = true;
    showError(
      Error(
        "Storage is unavailable. You can keep practicing, but export your progress before leaving.",
      ),
    );
  }
}
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void persist(), 150);
}
function readyCount() {
  return SKILLS.filter(
    (s) =>
      !config.disabledFamilies.includes(s.id) &&
      isReady(state.progress.skills[s.id]),
  ).length;
}
function render() {
  const journeyOpen = document.querySelector<HTMLDetailsElement>(".journey")?.open ?? false;
  const expandedLevels = new Set(Array.from(document.querySelectorAll<HTMLDetailsElement>(".path-level[open]"), el => Number(el.dataset.level)));
  cancelAutoNext();
  stopCelebration();
  const p = state.progress,
    ses = state.session,
    cur = ses?.current;
  app.innerHTML = `<header class="site-header"><a class="brand" href="/">${icon}<span>AP Calculus<span class="brand-light"> Practice</span></span></a><span class="private-label"><span class="status-dot"></span> On your device</span>${button("transfer", "Move progress", "button subtle")}</header>
 <main>${location.hostname === "ap-derivative-practice.pages.dev" ? '<p class="notice">We’ve moved to <a href="https://ap-calculus-practice.pages.dev/">AP Calculus Practice</a>. Use Move progress to export here, then import at the new address.</p>' : ""}<div id="notice" class="notice" role="status" ${temporary ? "" : "hidden"}>${temporary ? "Temporary session: export progress before leaving." : ""}</div>
 <div class="workspace"><section class="practice-card" aria-label="Practice">${!ses ? welcome() : ses.finished ? summary() : questionView()}</section>
 <details class="journey" ${journeyOpen ? "open" : ""}><summary class="progress-summary">Progress <span>Level ${p.unlockedLevel} · ${readyCount()} skills ready</span></summary><div class="aside-heading"><span class="eyebrow">YOUR LEARNING PATH</span><span class="count">${readyCount()} / ${SKILLS.filter((s) => !config.disabledFamilies.includes(s.id)).length}</span></div><div class="level-list">${Array.from({ length: 6 }, (_, i) => levelView(i + 1, expandedLevels.has(i + 1))).join("")}</div></details></div>
 <footer><span>No account. No uploaded answers.</span><div><a class="text-button" href="/help.html">How to use</a>${button("input-help", "Input guide", "text-button")}${button("restore", "Restore backup", "text-button")}${button("reset", "Reset progress", "text-button")}</div></footer></main><div id="modal-root"></div>`;
  on("transfer", openTransfer);
  on("start", startSession);
  on("again", startSession);
  on("submit", submit);
  on("hint", hint);
  on("next", next);
  on("input-help", inputHelp);
  on("restore", confirmRestore);
  on("reset", confirmReset);
  if (cur && !ses?.finished) mountInputs();
  observeFormulas();
}
function levelView(level: number, expanded = false) {
  const skills = SKILLS.filter(s => s.level === level && !config.disabledFamilies.includes(s.id));
  const ready = skills.filter(s => isReady(state.progress.skills[s.id])).length;
  const unlocked = state.progress.unlockedLevel >= level;
  const currentId = state.session?.current?.question.primarySkill;
  return `<details class="path-level ${unlocked ? "unlocked" : ""}" data-level="${level}" ${expanded ? "open" : ""}>
    <summary class="level ${unlocked ? "unlocked" : ""} ${skills.some(s => s.id === currentId) ? "active" : ""}"><span class="level-number">${String(level).padStart(2, "0")}</span><span class="level-copy"><strong>${["", "The foundations", "Essential functions", "Rules in combination", "Deeper compositions", "Beyond the first derivative", "Curves & coordinates"][level]}</strong><small>${!skills.length ? "Not included" : unlocked ? `${ready} of ${skills.length} skills ready` : "Locked · preview skills"}</small></span><span class="path-chevron" aria-hidden="true"></span></summary>
    <div class="path-skills">${skills.map(s => {
      const t = state.progress.skills[s.id];
      const status = !unlocked ? "Locked" : isReady(t) ? "Ready" : t?.needsRemediation ? "Rebuilding" : t?.recent.length ? "Learning" : "Not started";
      return `<div class="path-skill ${currentId === s.id ? "current" : ""}" ${currentId === s.id ? 'aria-current="step"' : ""}><div><strong>${esc(s.label)}</strong><span class="skill-status">${status}</span></div>${t?.card.reps ? `<small>Review ${esc(new Date(t.card.due).toLocaleString("en-US", {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}))}</small>` : ""}</div>`;
    }).join("") || '<p class="fine">No enabled skills in this level.</p>'}</div></details>`;
}
function welcome() {
  const hasProgress = Object.keys(state.progress.skills).length > 0;
  const nextSkill = hasProgress
    ? SKILLS.find(
        (skill) =>
          skill.level <= state.progress.unlockedLevel &&
          !config.disabledFamilies.includes(skill.id) &&
          !isReady(state.progress.skills[skill.id]),
      )
    : undefined;
  const nextSkillLine = nextSkill
    ? `<p class="fine">Level ${nextSkill.level} · ${esc(nextSkill.label)}</p>`
    : "";
  return `<div class="card-top"><span class="tag">ADAPTIVE PRACTICE</span><span class="muted">At your own pace</span></div><div class="welcome"><div class="welcome-equation">${math(`${ddx()}\\left[\\sin(x^2)\\right]`)}</div><h2>Differentiation</h2><p>Practice the rules. Review what needs work.</p>${button("start", `${hasProgress ? "Continue practicing" : "Start practicing"} <span aria-hidden="true">→</span>`, "button primary large")}${nextSkillLine}<p class="fine">Your work is saved automatically in this browser.</p></div>`;
}
function summary() {
  const s = state.session!;
  return `<div class="card-top"><span class="tag">ALL CAUGHT UP</span><span class="muted">${s.completed} questions</span></div><div class="welcome"><span class="summary-symbol">✓</span><h2>All caught up</h2><p>Your progress is saved. Review dates are under Progress.</p><div class="stats"><div><strong>${s.independent}</strong><span>Independent</span></div><div><strong>${s.assisted}</strong><span>With practice</span></div><div><strong>${s.skipped}</strong><span>Skipped</span></div></div>${button("again", "Start another session", "button primary large")}</div>`;
}
function answerLabel(label: string, index: number): string {
  let tex = label;
  if (label === "dy/dx") tex = dydx();
  else if (label === "d²y/dx²") tex = dydx(2);
  else if (label.includes("component")) tex = `r_{${index + 1}}'(t)`;
  else tex = tex.replace("f⁻¹", "f^{-1}");
  return convertLatexToMarkup(`${tex}=`);
}
function updateActivity(celebrate = false) {
  const streak = state.progress.streak ?? 0;
  const badge = document.getElementById("streak");
  if (badge) {
    badge.innerHTML = `<strong>${streak}</strong> in a row`;
    badge.classList.remove("milestone", "celebrate");
    if (celebrate && streak >= 5) {
      void badge.offsetWidth;
      badge.classList.add("celebrate");
      badge.innerHTML += `<span class="sparks" aria-hidden="true">${Array.from({ length: 8 }, (_, i) => `<i style="--angle:${i * 45}deg"></i>`).join("")}</span>`;
      if (streak >= 10) celebrateFullScreen();
    }
  }
  const daily = document.getElementById("today-count");
  if (daily)
    daily.textContent = `${todayCount(state.progress)} practiced today`;
}
function questionView() {
  const s = state.session!,
    c = s.current!,
    q = c.question;
  return `<div class="card-top practice-status" aria-label="Practice activity"><span class="streak" id="streak" aria-live="polite"><strong>${state.progress.streak ?? 0}</strong> in a row</span><span id="today-count" class="muted">${todayCount(state.progress)} practiced today</span></div><div class="question-body"><h2>${esc(q.title)}</h2>${math(q.prompt)}${q.domainText.startsWith("Use radians.") ? "" : `<p class="domain">${esc(q.domainText)}</p>`}<div id="answer-fields">${q.labels.map((label, i) => `<label class="answer-label" for="answer-${i}"><span class="answer-equation">${answerLabel(label, i)}</span><math-field id="answer-${i}" aria-label="${esc(label)}"></math-field></label>`).join("")}</div><div class="input-caption"><span>Equivalent forms are welcome.</span>${button("keyboard", "⌨ Math keyboard", "text-button")}</div><div id="feedback" class="feedback${c.verdict ? ` ${c.verdict.status}` : ""}" aria-live="polite" ${c.verdict ? "" : "hidden"}>${c.verdict ? feedback(c.verdict, q) : ""}</div><div id="auto-next" class="auto-next" hidden><span>Next in 3s</span><div><i></i></div></div><div class="actions">${button("submit", "Check answer", "button primary")}${button("hint", c.hintsUsed >= 3 ? "Solution shown" : c.hintsUsed === 2 ? "Show solution" : c.hintsUsed === 1 ? "Show next hint" : "Need a hint?", "button subtle")}${button("next", c.verdict?.status === "correct" || c.hintsUsed >= 3 ? "Next question →" : "Skip", "text-button next")}</div><div id="hints">${hintContent()}</div>${state.progress.skills[q.primarySkill]?.failureStreak >= 3 ? '<p class="notice">Let’s rebuild the idea. Review the rule, then try the prerequisite checks in your queue.</p>' : ""}</div>`;
}
function feedback(v: Verdict, q: Question) {
  switch (v.status) {
    case "correct":
      return "<strong>✓ Correct.</strong>";
    case "incorrect":
      return v.feedbackCode === "domain"
        ? "<strong>Check the domain.</strong> Your expression is undefined at a point where the derivative exists."
        : `<strong>Not quite.</strong> ${incorrectFeedbackText(q)}`;
    default:
      return esc(v.message);
  }
}
function hintContent() {
  const c = state.session?.current;
  if (!c?.hintsUsed) return "";
  const q = c.question;
  return `<section class="hint-panel"><p class="eyebrow">${c.hintsUsed >= 3 ? "WORKED SOLUTION" : "HINT"}</p><p>${esc(q.hints[0])}</p>${c.hintsUsed >= 2 ? math(q.hintMath) : ""}${c.hintsUsed >= 3 ? q.steps.map((s) => `<p>${esc(s.text)}</p>${math(s.math)}`).join("") : ""}</section>`;
}
function mountInputs() {
  const c = state.session!.current!;
  document.querySelectorAll<MathfieldElement>("math-field").forEach((mf, i) => {
    mf.mathVirtualKeyboardPolicy = "manual";
    mf.setAttribute("inputmode", "none");
    mf.value = c.draft[i] ?? "";
    mf.addEventListener("input", () => {
      if (c.verdict?.status === "correct") cancelAutoNext();
      activeMathfield = mf;
      c.draft[i] = mf.value;
      scheduleSave();
    });
    mf.addEventListener("beforeinput", (e) => {
      if ((e as InputEvent).inputType === "insertLineBreak") {
        e.preventDefault();
        if (c.verdict?.status === "correct") void next();
        else void submit();
      }
    });
    mf.addEventListener("focus", () => {
      if (c.verdict?.status === "correct") cancelAutoNext();
      activeMathfield = mf;
      requestAnimationFrame(keepAnswerVisible);
      if (matchMedia("(pointer:coarse)").matches)
        window.mathVirtualKeyboard.show();
    });
  });
  const vars = c.question.domain.curve
    ? ["x", "y"]
    : [c.question.domain.variable];
  window.mathVirtualKeyboard.layouts = layoutsFor(vars);
  on("keyboard", () => {
    if (window.mathVirtualKeyboard.visible) window.mathVirtualKeyboard.hide();
    else {
      focusAnswer(false, true);
      window.mathVirtualKeyboard.show();
    }
  });
  updateControls();
}
function updateControls() {
  const c = state.session?.current;
  document
    .querySelectorAll<MathfieldElement>("math-field")
    .forEach((mf) => (mf.readonly = busy || replacing));
  const s = document.querySelector<HTMLButtonElement>("#submit");
  if (s) {
    s.disabled = busy || replacing || c?.verdict?.status === "correct";
    s.textContent = busy ? "Checking…" : "Check answer";
  }
  for (const id of [
    "start",
    "again",
    "next",
    "hint",
    "transfer",
    "restore",
    "reset",
  ]) {
    const b = document.querySelector<HTMLButtonElement>(`#${id}`);
    if (b)
      b.disabled =
        busy || replacing || (id === "hint" && !!c && c.hintsUsed >= 3);
  }
}
async function startSession() {
  if (busy || replacing) return;
  cancelAutoNext();
  busy = true;
  updateControls();
  try {
    window.mathVirtualKeyboard.hide();
    const response = await fetch("/practice-config.json", {
      cache: "no-store",
    });
    if (!response.ok) throw Error("Configuration is unavailable.");
    config = validateConfig(await response.json());
    state.session = {
      config: structuredClone(config),
      completed: 0,
      independent: 0,
      assisted: 0,
      skipped: 0,
      finished: false,
    };
    setNext();
    await persist();
    render();
  } finally {
    busy = false;
    updateControls();
    focusAnswer();
  }
}

function setNext() {
  const s = state.session!;
  try {
    const picked = chooseNext(state.progress, s.config);
    s.current = {
      ...picked,
      draft: picked.question.answers.map(() => ""),
      hintsUsed: 0,
      recorded: false,
      closed: false,
    };
  } catch (e) {
    if ((e as Error).message !== "PRACTICE_PAUSE") throw e;
    s.finished = true;
    s.current = undefined;
  }
}
async function submit() {
  const s = state.session,
    c = s?.current;
  if (!s || !c || busy || replacing || c.verdict?.status === "correct") return;
  // MathLive may deliver its input event after an immediate Enter key.
  // Grade the visible value, rather than a potentially one-event-old draft.
  c.draft = Array.from(
    document.querySelectorAll<MathfieldElement>("math-field"),
    (field) => field.value,
  );
  const keepKeyboard = window.mathVirtualKeyboard.visible;
  const checkedState = state;
  busy = true;
  updateControls();
  try {
    const v = await grader.check(c.question, [...c.draft]);
    if (state !== checkedState || state.session?.current !== c) return;
    c.verdict = v;
    const recorded = recordOutcome(state.progress, c, s.config, v);
    updateActivity(recorded && v.status === "correct" && c.hintsUsed === 0);
    await persist();
    const f = document.getElementById("feedback")!;
    f.hidden = false;
    f.className = `feedback ${v.status}`;
    f.innerHTML = feedback(v, c.question);
    const n = document.getElementById("next");
    if (n && v.status === "correct") n.textContent = "Next question →";
  } finally {
    busy = false;
    updateControls();
    if (state === checkedState && state.session?.current === c) {
      if (c.verdict?.status === "correct") {
        document.getElementById("next")?.focus({ preventScroll: true });
        if (keepKeyboard) window.mathVirtualKeyboard.show();
        startAutoNext();
      } else focusAnswer(keepKeyboard, true);
    }
  }
}
async function hint() {
  const s = state.session!,
    c = s.current!;
  if (busy || replacing || c.hintsUsed >= 3) return;
  cancelAutoNext();
  busy = true;
  updateControls();
  try {
    recordHint(state.progress, c, s.config);
    updateActivity();
    await persist();
    document.getElementById("hints")!.innerHTML = hintContent();
    observeFormulas();
    const h = document.getElementById("hint")!;
    h.textContent =
      c.hintsUsed === 3
        ? "Solution shown"
        : c.hintsUsed === 2
          ? "Show solution"
          : "Show next hint";
    if (c.hintsUsed === 3)
      document.getElementById("next")!.textContent = "Next question →";
  } finally {
    busy = false;
    updateControls();
  }
}
async function next() {
  if (busy || replacing || !state.session?.current || state.session.finished)
    return;
  cancelAutoNext();
  const keepKeyboard = window.mathVirtualKeyboard.visible;
  busy = true;
  updateControls();
  try {
    finishQuestion(state, true);
    if (!state.session!.finished) setNext();
    await persist();
    render();
    document
      .querySelector(".practice-card")
      ?.scrollIntoView({ behavior: "instant", block: "start" });
  } finally {
    busy = false;
    updateControls();
    focusAnswer(keepKeyboard);
  }
}

function modal(title: string, body: string) {
  cancelAutoNext();
  window.mathVirtualKeyboard.hide();
  modalCleanup();
  document.getElementById("modal-root")!.innerHTML =
    `<dialog id="dialog"><div class="modal-heading"><h2>${esc(title)}</h2>${button("close-modal", "✕", "icon-button")}</div><div class="modal-body">${body}<p id="modal-error" class="notice" role="status" hidden></p></div></dialog>`;
  const d = document.querySelector<HTMLDialogElement>("#dialog")!;
  d.showModal();
  const close = () => {
    modalCleanup();
    modalCleanup = () => {};
    d.close();
    d.remove();
  };
  on("close-modal", close);
  d.addEventListener("cancel", close);
  return d;
}
function modalError(e: unknown) {
  const el = document.getElementById("modal-error");
  if (el) {
    el.hidden = false;
    el.textContent = (e as Error).message;
  }
}
function inputHelp() {
  modal(
    "A quick input guide",
    `<p>Type formulas with your keyboard, or use the math keyboard on your phone.</p><ul><li>Use <strong>x^2</strong> for powers and <strong>/</strong> for fractions.</li><li>Use parentheses to group: <strong>sin(x^2)</strong>.</li><li><strong>ln</strong> is natural logarithm; <strong>log</strong> uses base 10.</li><li>Use <strong>arcsin</strong>, <strong>arccos</strong> and <strong>arctan</strong> for inverse trig.</li><li>All angles are in radians. Enter only the requested expression, without “y =”.</li><li>Use the keyboard arrows to move out of a fraction or exponent.</li></ul><p>Input help does not count as a hint.</p>`,
  );
}
function openTransfer() {
  if (busy || replacing) return;
  modal(
    "Take your progress with you",
    `<p>No account needed. Move a snapshot of your learning and review schedule to another device.</p><div class="transfer-options">${button("export", "Export progress", "button primary")}${button("import", "Import progress", "button subtle")}</div><p class="fine">Your current question and draft stay on this device. Imported progress starts with a new question.</p>`,
  );
  on("export", exportView);
  on("import", importView);
}
async function exportView() {
  try {
    await persist();
    const code = encodeProgress(makePortableProgress(state.progress)),
      frames = splitIntoQrFrames(code);
    modal(
      "Export progress",
      `<p>Copy the code, or scan ${frames.length === 1 ? "the QR code" : "each numbered QR code"} on your other device.</p><label class="answer-label">Progress code<textarea id="export-code" readonly rows="3">${code}</textarea></label>${button("copy-code", "Copy code", "button primary")}<p id="copy-status" role="status"></p><div class="qr-wrap"><canvas id="qr"></canvas><p id="qr-label"></p><a id="save-qr" class="text-button" download="ap-calculus-progress.png">Save QR image</a><div class="qr-controls">${button("qr-prev", "← Previous", "button subtle")}${button("qr-next", "Next →", "button subtle")}</div></div><p class="fine">This is a snapshot, not a live sync. Export again after practicing. Anyone with the code can read this learning progress.</p>`,
    );
    on("copy-code", async () => {
      try {
        await navigator.clipboard.writeText(code);
        document.getElementById("copy-status")!.textContent = "Copied.";
      } catch {
        (
          document.getElementById("export-code") as HTMLTextAreaElement
        ).select();
        document.getElementById("copy-status")!.textContent =
          "Select and copy the code above.";
      }
    });
    let index = 0;
    const draw = async () => {
      await QRCode.toCanvas(document.getElementById("qr"), frames[index], {
        scale: 5,
        margin: 4,
        errorCorrectionLevel: qrErrorCorrection(frames[index]),
      });
      const canvas = document.getElementById("qr") as HTMLCanvasElement;
      canvas.style.removeProperty("width");
      canvas.style.removeProperty("height");
      const download = document.getElementById("save-qr") as HTMLAnchorElement;
      download.href = (
        document.getElementById("qr") as HTMLCanvasElement
      ).toDataURL("image/png");
      download.download = `ap-calculus-progress-${index + 1}.png`;
      document.getElementById("qr-label")!.textContent =
        frames.length === 1
          ? "Scan to move your progress"
          : `QR ${index + 1} of ${frames.length}`;
    };
    on("qr-prev", async () => {
      index = (index + frames.length - 1) % frames.length;
      await draw();
    });
    on("qr-next", async () => {
      index = (index + 1) % frames.length;
      await draw();
    });
    document.querySelector<HTMLElement>(".qr-controls")!.hidden =
      frames.length === 1;
    await draw();
  } catch (e) {
    modalError(e);
  }
}
function importView() {
  modal(
    "Import progress",
    `<p>Paste a progress code, scan QR codes, or choose QR images. You can review the snapshot before replacing anything.</p><label class="answer-label">Progress code<textarea id="import-code" rows="4" placeholder="DSP2.…"></textarea></label>${button("preview-import", "Review import", "button primary")}<div class="scan-actions">${button("scan", "Scan with camera", "button subtle")}<label class="button subtle file-label">Choose QR images<input id="qr-file" type="file" accept="image/*" multiple></label></div><video id="video" playsinline muted hidden></video><p id="scan-status" role="status"></p><div id="import-preview"></div>`,
  );
  let collector = new QrCollector();
  let stream: MediaStream | undefined,
    raf = 0,
    active = false,
    closed = false,
    revision = 0;
  const stopScan = () => {
    active = false;
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach((t) => t.stop());
    stream = undefined;
    const video = document.getElementById("video");
    if (video) video.hidden = true;
  };
  modalCleanup = () => {
    closed = true;
    revision++;
    stopScan();
  };
  const clearPreview = () => {
    document.getElementById("import-preview")!.innerHTML = "";
  };
  document.getElementById("import-code")!.addEventListener("input", () => {
    revision++;
    stopScan();
    collector = new QrCollector();
    clearPreview();
  });
  const preview = (code: string) => {
    clearPreview();
    try {
      const canonicalCode = code.trim();
      const p = decodeProgress(canonicalCode);
      showImportPreview(p, canonicalCode);
    } catch (e) {
      modalError(e);
    }
  };
  const frame = (data: string, inputRevision: number) => {
    if (closed || inputRevision !== revision) return;
    clearPreview();
    try {
      const result = collector.add(data);
      document.getElementById("scan-status")!.textContent =
        `Collected ${result.received} of ${result.total} QR codes.`;
      if (result.code) {
        stopScan();
        preview(result.code);
      }
    } catch (e) {
      modalError(e);
    }
  };
  on("preview-import", () => {
    revision++;
    stopScan();
    preview(
      (document.getElementById("import-code") as HTMLTextAreaElement).value,
    );
  });
  document
    .getElementById("qr-file")!
    .addEventListener("change", async (event) => {
      const inputRevision = ++revision;
      stopScan();
      clearPreview();
      for (const file of Array.from(
        (event.target as HTMLInputElement).files ?? [],
      )) {
        try {
          if (file.size > 10 * 1024 * 1024)
            throw Error("Choose an image smaller than 10 MB.");
          const bitmap = await createImageBitmap(file);
          if (closed || inputRevision !== revision) {
            bitmap.close();
            return;
          }
          const canvas = document.createElement("canvas"),
            scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
          canvas.width = Math.round(bitmap.width * scale);
          canvas.height = Math.round(bitmap.height * scale);
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          bitmap.close();
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height),
            qr = jsQR(pixels.data, pixels.width, pixels.height);
          if (qr) frame(qr.data, inputRevision);
          else throw Error("No QR code found in this image.");
        } catch (e) {
          if (!closed && inputRevision === revision) modalError(e);
        }
      }
    });
  on("scan", async () => {
    const inputRevision = ++revision;
    stopScan();
    clearPreview();
    active = true;
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw Error(
          "Camera scanning needs HTTPS. Paste your code or choose QR images instead.",
        );
      const acquired = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (closed || inputRevision !== revision) {
        acquired.getTracks().forEach((t) => t.stop());
        return;
      }
      stream = acquired;
      const video = document.getElementById("video") as HTMLVideoElement;
      video.hidden = false;
      video.srcObject = stream;
      await video.play();
      if (closed || inputRevision !== revision) {
        acquired.getTracks().forEach((t) => t.stop());
        return;
      }
      const canvas = document.createElement("canvas"),
        ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      let last = 0;
      const scan = (time: number) => {
        if (!active || closed || inputRevision !== revision) return;
        if (time - last > 250 && video.videoWidth) {
          last = time;
          canvas.width = 640;
          canvas.height = Math.round(
            (640 * video.videoHeight) / video.videoWidth,
          );
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height),
            qr = jsQR(pixels.data, pixels.width, pixels.height);
          if (qr) frame(qr.data, inputRevision);
        }
        if (active) raf = requestAnimationFrame(scan);
      };
      raf = requestAnimationFrame(scan);
    } catch {
      if (closed || inputRevision !== revision) return;
      stopScan();
      modalError(
        Error(
          "Camera access is unavailable. Paste your code or choose QR images instead.",
        ),
      );
    }
  });
}
function showImportPreview(p: PortableProgress, id: string, resume = false) {
  const existing = state.progress.updatedAt;
  document.getElementById("import-preview")!.innerHTML =
    `<section class="hint-panel"><h3>Review this snapshot</h3><p>Exported: ${esc(new Date(p.exportedAt).toLocaleString())}</p><p>Unlocked through Level ${p.unlockedLevel} · ${Object.keys(p.skills).length} skills started</p><p>${p.streak ?? 0} in a row · ${todayCount(p)} practiced today</p>${p.updatedAt < existing ? '<p class="notice">This snapshot has older learning activity than this device. Importing will replace your current progress.</p>' : ""}<p>Your current progress will be saved as a local backup. The two histories will not be merged.</p>${button("confirm-import", "Replace with this progress", "button primary")}</section>`;
  on("confirm-import", async () => {
    if (replacing) return;
    replacing = true;
    updateControls();
    try {
      clearTimeout(saveTimer);
      if (temporary)
        throw Error(
          "Local storage is unavailable. Import cannot safely replace progress.",
        );
      await saveState(state);
      state = await replaceState(p, id);
      modalCleanup();
      render();
    } catch (e) {
      modalError(e);
    } finally {
      replacing = false;
      updateControls();
    }
    if (resume && state.lastImportedId === id) await startSession();
  });
}
function confirmRestore() {
  if (busy || replacing) return;
  modal(
    "Restore your local backup?",
    `<p>This replaces the current learning state with the last local backup. You can restore again to switch back.</p>${button("confirm-restore", "Restore backup", "button primary")}`,
  );
  on("confirm-restore", async () => {
    if (replacing) return;
    replacing = true;
    updateControls();
    try {
      clearTimeout(saveTimer);
      await saveState(state);
      state = await restoreBackup();
      render();
    } catch (e) {
      modalError(e);
    } finally {
      replacing = false;
      updateControls();
    }
  });
}
function confirmReset() {
  if (busy || replacing) return;
  modal(
    "Start fresh?",
    `<p>This resets learning progress on this device. A local backup will be kept. You can export a progress code first.</p>${button("confirm-reset", "Reset this device", "button danger")}`,
  );
  on("confirm-reset", async () => {
    if (replacing) return;
    replacing = true;
    updateControls();
    try {
      clearTimeout(saveTimer);
      const fresh: AppState = { version: 1, progress: freshProgress(config) };
      await saveState(state);
      await resetState(fresh);
      state = fresh;
      render();
    } catch (e) {
      modalError(e);
    } finally {
      replacing = false;
      updateControls();
    }
  });
}
window.addEventListener("pagehide", () => {
  clearTimeout(saveTimer);
  void persist();
});
async function boot() {
  const progressLink = location.hash.startsWith("#progress=")
    ? location.href
    : undefined;
  if (progressLink)
    history.replaceState(null, "", location.pathname + location.search);
  try {
    const response = await fetch("/practice-config.json", {
      cache: "no-store",
    });
    if (!response.ok) throw Error("Practice configuration is unavailable.");
    config = validateConfig(await response.json());
    let saved: AppState | undefined;
    try {
      saved = await loadState();
    } catch {
      temporary = true;
    }
    if (saved) {
      if (saved.version !== 1)
        throw Error(
          "This saved progress uses an unsupported version. It has not been changed.",
        );
      const result = validateLocalState(saved);
      state = result.state;
      if (result.migrated && !temporary)
        await commitMigration(saved, state, result.from < LATEST_FORMAT);
    } else state = { version: 1, progress: freshProgress(config) };
    render();
    if (progressLink) {
      try {
        const code = new QrCollector().add(progressLink).code;
        if (!code) throw Error("This progress link is incomplete.");
        const snapshot = decodeProgress(code);
        // Any existing local state gets explicit replacement confirmation.
        if (saved || temporary) {
          importView();
          showImportPreview(snapshot, code, true);
        } else {
          state = await replaceState(snapshot, code);
          await startSession();
        }
      } catch (error) {
        importView();
        modalError(error);
      }
    }
  } catch (e) {
    app.innerHTML = `<main class="boot-error"><h1>We couldn’t open practice.</h1><p>${esc((e as Error).message)}</p><p>Your saved progress has not been changed.</p><button onclick="location.reload()">Try again</button></main>`;
  }
}
window.addEventListener("hashchange", () => {
  if (location.hash.startsWith("#progress=")) location.reload();
});
void boot();
