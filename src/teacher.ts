import "./style.css";
import "./teacher.css";
import { validateConfig } from "./catalog";
import {
  ALL_CLASSES,
  buildTeacherGridModel,
  renderTeacherGrid,
  type TeacherAnswer,
  type TeacherGridModel,
  type TeacherSort,
} from "./teacher-grid";

const SESSION_KEY = "teacher-code";
const UNAVAILABLE = "Class progress is unavailable. Try again later.";
const CODE_MESSAGE = "This teacher code doesn't work.";
const RATE_MESSAGE = "Too many attempts. Wait 10 minutes, then try again.";

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw Error(`Missing element #${id}`);
  return element as T;
};

const gate = byId<HTMLElement>("teacher-gate");
const view = byId<HTMLElement>("teacher-view");
const loading = byId<HTMLParagraphElement>("teacher-loading");
const errorMessage = byId<HTMLParagraphElement>("teacher-error");
const grid = byId<HTMLDivElement>("teacher-grid");
const form = byId<HTMLFormElement>("teacher-form");
const codeInput = byId<HTMLInputElement>("teacher-code");
const openButton = form.querySelector<HTMLButtonElement>(
  "button[type='submit']",
)!;
const refreshButton = byId<HTMLButtonElement>("teacher-refresh");
const closeButton = byId<HTMLButtonElement>("teacher-close");
const classSelect = byId<HTMLSelectElement>("teacher-class-filter");
const sortSelect = byId<HTMLSelectElement>("teacher-sort");
const countText = byId<HTMLSpanElement>("teacher-count");
const loadedText = byId<HTMLSpanElement>("teacher-loaded");

let model: TeacherGridModel | undefined;
let activeCode: string | undefined;
let busy = false;
let requestId = 0;
let classFilter = classSelect.value || ALL_CLASSES;
let sort: TeacherSort = "name";

class TeacherRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "TeacherRequestError";
  }
}

const responseError = (status: number): TeacherRequestError => {
  if (status === 400 || status === 401 || status === 413)
    return new TeacherRequestError(status, CODE_MESSAGE);
  if (status === 429) return new TeacherRequestError(status, RATE_MESSAGE);
  return new TeacherRequestError(status, UNAVAILABLE);
};

const readStoredCode = (): string | undefined => {
  try {
    return sessionStorage.getItem(SESSION_KEY) ?? undefined;
  } catch {
    return undefined;
  }
};
const storeCode = (code: string) => {
  try {
    sessionStorage.setItem(SESSION_KEY, code);
  } catch {
    /* The grid still works when this tab cannot keep storage. */
  }
};
const clearStoredCode = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* Nothing to clear when storage is unavailable. */
  }
};

const isTeacherAnswer = (value: unknown): value is TeacherAnswer => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const answer = value as Partial<TeacherAnswer>;
  return Array.isArray(answer.classes) && Array.isArray(answer.students);
};

const requestTeacher = async (code: string): Promise<TeacherAnswer> => {
  const response = await fetch("/api/teacher", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
    cache: "no-store",
  });
  if (!response.ok) throw responseError(response.status);
  let answer: unknown;
  try {
    answer = await response.json();
  } catch {
    throw new TeacherRequestError(0, UNAVAILABLE);
  }
  if (!isTeacherAnswer(answer))
    throw new TeacherRequestError(0, UNAVAILABLE);
  return answer;
};

const requestConfig = async () => {
  const response = await fetch("/practice-config.json", { cache: "no-store" });
  if (!response.ok) throw new TeacherRequestError(0, UNAVAILABLE);
  return validateConfig(await response.json());
};

const showError = (message?: string) => {
  errorMessage.textContent = message ?? "";
  errorMessage.hidden = !message;
};

const fillClassFilter = (
  classes: TeacherGridModel["classes"],
  previous: string,
) => {
  const options = classes.map(
    (entry) => new Option(entry.name || entry.prefix, entry.prefix),
  );
  classSelect.replaceChildren(
    new Option("All classes", ALL_CLASSES),
    ...options,
  );
  const keep =
    previous === ALL_CLASSES ||
    classes.some((entry) => entry.prefix === previous);
  classSelect.value = keep ? previous : ALL_CLASSES;
  classFilter = classSelect.value;
};

const formatLoaded = (time: number) =>
  `Loaded ${new Date(time).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;

const renderGrid = () => {
  if (!model) return;
  grid.innerHTML = renderTeacherGrid(model, {
    classFilter,
    sort,
    now: Date.now(),
  });
  const count = grid.querySelectorAll("tr.teacher-student-row").length;
  countText.textContent = `${count} ${count === 1 ? "student" : "students"}`;
};

const setBusy = (value: boolean) => {
  busy = value;
  openButton.disabled = value;
  refreshButton.disabled = value;
  refreshButton.textContent =
    value && model ? "Refreshing…" : "Refresh";
  grid.setAttribute("aria-busy", value ? "true" : "false");
};

const showGate = () => {
  gate.hidden = false;
  view.hidden = true;
  loading.hidden = true;
};

const load = async (code: string, refresh: boolean) => {
  if (busy) return;
  const id = ++requestId;
  setBusy(true);
  showError();
  if (refresh && model) {
    gate.hidden = true;
    view.hidden = false;
    loading.hidden = true;
  } else {
    gate.hidden = true;
    view.hidden = true;
    loading.hidden = false;
  }
  try {
    // Ask the teacher endpoint first so an invalid or rate-limited code gets
    // its own message even when the public config also fails.
    const answer = await requestTeacher(code);
    const config = await requestConfig();
    const next = buildTeacherGridModel(answer, config);
    if (id !== requestId) return;
    const previous = classSelect.value || ALL_CLASSES;
    model = next;
    fillClassFilter(model.classes, previous);
    sort = sortSelect.value === "last-practice" ? "last-practice" : "name";
    activeCode = code;
    storeCode(code);
    codeInput.value = "";
    loading.hidden = true;
    gate.hidden = true;
    view.hidden = false;
    loadedText.textContent = formatLoaded(Date.now());
    showError();
    renderGrid();
  } catch (error) {
    if (id !== requestId) return;
    const requestError =
      error instanceof TeacherRequestError ? error : undefined;
    const rejected =
      requestError !== undefined &&
      [400, 401, 413].includes(requestError.status);
    if (rejected) {
      clearStoredCode();
      activeCode = undefined;
      model = undefined;
      grid.innerHTML = "";
      countText.textContent = "";
      loadedText.textContent = "";
    }
    if (!model) showGate();
    else {
      gate.hidden = true;
      view.hidden = false;
      loading.hidden = true;
    }
    showError(requestError?.message ?? UNAVAILABLE);
  } finally {
    if (id === requestId) {
      setBusy(false);
      loading.hidden = true;
    }
  }
};

const close = () => {
  requestId++;
  busy = false;
  model = undefined;
  activeCode = undefined;
  clearStoredCode();
  grid.innerHTML = "";
  countText.textContent = "";
  loadedText.textContent = "";
  showError();
  showGate();
  setBusy(false);
  codeInput.value = "";
  codeInput.focus();
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (busy) return;
  void load(codeInput.value, false);
});
refreshButton.addEventListener("click", () => {
  if (!activeCode || busy) return;
  void load(activeCode, true);
});
closeButton.addEventListener("click", close);
classSelect.addEventListener("change", () => {
  classFilter = classSelect.value || ALL_CLASSES;
  renderGrid();
});
sortSelect.addEventListener("change", () => {
  sort = sortSelect.value === "last-practice" ? "last-practice" : "name";
  renderGrid();
});

const stored = readStoredCode();
if (stored) void load(stored, false);
