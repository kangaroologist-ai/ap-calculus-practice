import { strToU8, strFromU8, zlibSync, Unzlib } from "fflate";
import { SKILLS, CURRICULUM_VERSION } from "./catalog";
import {
  PARAMETERS,
  SCHEDULER_VERSION,
  ALGORITHM_VERSION,
  type Progress,
} from "./progress";
export type PortableProgress = Progress & { exportedAt: number };
export function makePortableProgress(
  p: Progress,
  now = Date.now(),
): PortableProgress {
  return { ...structuredClone(p), exportedAt: now };
}
const finite = (v: unknown, min = 0, max = 1e15) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const integer = (v: unknown, min = 0, max = 1e9) =>
  finite(v, min, max) && Number.isInteger(v);
export function validateSnapshot(v: unknown): PortableProgress {
  const p = v as PortableProgress;
  if (
    !p ||
    p.formatVersion !== 1 ||
    p.curriculumVersion !== CURRICULUM_VERSION ||
    p.schedulerPackageVersion !== SCHEDULER_VERSION ||
    p.fsrsAlgorithmVersion !== ALGORITHM_VERSION
  )
    throw Error(
      "This progress version is not supported. Use the same app version on both devices.",
    );
  if (JSON.stringify(p.fsrsParameters) !== JSON.stringify(PARAMETERS))
    throw Error("Unsupported review settings. No progress was changed.");
  if (
    !finite(p.exportedAt, 946684800000, Date.now() + 86400000) ||
    !finite(p.updatedAt, 946684800000, Date.now() + 86400000) ||
    !integer(p.unlockedLevel, 1, 6) ||
    !integer(p.sequence) ||
    !p.skills ||
    typeof p.skills !== "object" ||
    Array.isArray(p.skills)
  )
    throw Error("Invalid progress data.");
  if (Object.keys(p.skills).length > SKILLS.length)
    throw Error("Too many skills.");
  for (const [id, s] of Object.entries(p.skills)) {
    if (
      !SKILLS.some((x) => x.id === id) ||
      !s ||
      typeof s !== "object" ||
      !s.card
    )
      throw Error("Unknown or invalid skill.");
    const c = s.card;
    for (const key of [
      "stability",
      "difficulty",
      "elapsed_days",
      "scheduled_days",
      "learning_steps",
      "reps",
      "lapses",
      "state",
      "due",
    ] as const)
      if (!finite(c[key])) throw Error("Invalid review state.");
    if (
      !integer(c.state, 0, 3) ||
      c.difficulty > 10 ||
      c.stability > 1e6 ||
      !finite(c.due, 946684800000, Date.now() + 366 * 86400000) ||
      (c.last_review !== undefined &&
        !finite(c.last_review, 946684800000, Date.now() + 86400000))
    )
      throw Error("Invalid review dates or values.");
    for (const k of ["reps", "lapses", "learning_steps"] as const)
      if (!integer(c[k])) throw Error("Invalid review count.");
    if (
      !Array.isArray(s.recent) ||
      s.recent.length > 5 ||
      s.recent.some(
        (e) =>
          !e ||
          typeof e.q !== "string" ||
          e.q.length > 4096 ||
          !integer(e.template, 0, 1) ||
          typeof e.correct !== "boolean",
      ) ||
      new Set(s.recent.map((x) => x.q)).size !== s.recent.length
    )
      throw Error("Invalid skill evidence.");
    if (
      typeof s.needsRemediation !== "boolean" ||
      typeof s.extraPracticeGiven !== "boolean" ||
      ![
        s.failureStreak,
        s.lastFailureAt,
        s.otherSinceFailure,
        s.lastSeen,
      ].every((x) => integer(x))
    )
      throw Error("Invalid practice state.");
  }
  if (
    !Array.isArray(p.pendingDiagnostics) ||
    p.pendingDiagnostics.length > SKILLS.length ||
    p.pendingDiagnostics.some((id) => !SKILLS.some((s) => s.id === id)) ||
    !Array.isArray(p.recentQuestionSignatures) ||
    p.recentQuestionSignatures.length > 10 ||
    p.recentQuestionSignatures.some(
      (s) => typeof s !== "string" || s.length > 4096,
    )
  )
    throw Error("Invalid practice queue.");
  return p;
}
function base64(a: Uint8Array) {
  let s = "";
  for (const n of a) s += String.fromCharCode(n);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function bytes(s: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(s)) throw Error("Invalid code characters.");
  return Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
    c.charCodeAt(0),
  );
}
export function checksum(text: string): string {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}
export function encodeProgress(p: PortableProgress): string {
  validateSnapshot(p);
  const body = base64(zlibSync(strToU8(JSON.stringify(p))));
  const result = `DSP1.${checksum(body)}.${body}`;
  if (result.length > 131072) throw Error("Progress is too large to export.");
  return result;
}
export function decodeProgress(code: string): PortableProgress {
  const text = code.trim();
  if (text.length > 131072) throw Error("The progress code is too large.");
  const m = /^DSP1\.([a-f0-9]{8})\.([A-Za-z0-9_-]+)$/.exec(text);
  if (!m || checksum(m[2]) !== m[1])
    throw Error("This code is incomplete or damaged. Copy it again.");
  const input = bytes(m[2]);
  let size = 0;
  const chunks: Uint8Array[] = [];
  const z = new Unzlib((chunk) => {
    size += chunk.length;
    if (size > 262144) throw Error("Expanded progress is too large.");
    chunks.push(chunk);
  });
  // Small compressed chunks bound expansion before allocating the full output.
  for (let i = 0; i < input.length; i += 128)
    z.push(input.subarray(i, i + 128), i + 128 >= input.length);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return validateSnapshot(JSON.parse(strFromU8(out)));
}
export function splitIntoQrFrames(code: string): string[] {
  const id = checksum(code),
    parts = code.match(/.{1,700}/g) ?? [];
  return parts.map(
    (part, i) =>
      `DSQ1.${id}.${i + 1}.${parts.length}.${checksum(part)}.${part}`,
  );
}
export class QrCollector {
  private id = "";
  private total = 0;
  private parts = new Map<number, string>();
  add(frame: string): { received: number; total: number; code?: string } {
    const m =
      /^DSQ1\.([a-f0-9]{8})\.(\d+)\.(\d+)\.([a-f0-9]{8})\.(.{1,700})$/.exec(
        frame,
      );
    if (!m) throw Error("This is not a Derivative Studio progress QR code.");
    const [, id, indexText, totalText, hash, body] = m,
      index = Number(indexText),
      total = Number(totalText);
    if (
      !integer(total, 1, 188) ||
      !integer(index, 1, total) ||
      checksum(body) !== hash
    )
      throw Error("Damaged QR frame.");
    if (this.id && (this.id !== id || this.total !== total))
      throw Error(
        "These QR codes belong to different snapshots. Close and reopen import to start again.",
      );
    if (this.parts.has(index) && this.parts.get(index) !== body)
      throw Error("Conflicting QR frame.");
    this.id = id;
    this.total = total;
    this.parts.set(index, body);
    if (this.parts.size !== total) return { received: this.parts.size, total };
    const code = Array.from({ length: total }, (_, i) =>
      this.parts.get(i + 1),
    ).join("");
    if (checksum(code) !== id) throw Error("The assembled code is damaged.");
    return { received: total, total, code };
  }
}
