import { questionFingerprint } from "./question-identity";
import { packProgress, unpackProgress } from "./compact-progress";
import { strToU8, strFromU8, zlibSync, Unzlib } from "fflate";
import { localPracticeDay, type Progress } from "./progress";
import { migrateProgress, validateCurrent } from "./migrate";
export type PortableProgress = Progress & { exportedAt: number };
export function makePortableProgress(
  p: Progress,
  now = Date.now(),
): PortableProgress {
  const copy = structuredClone(p);
  for (const skill of Object.values(copy.skills)) {
    skill.recent = skill.recent
      .slice(-2)
      .map((e) => ({ ...e, q: questionFingerprint(e.q) }));
  }
  copy.recentQuestionSignatures =
    copy.recentQuestionSignatures.map(questionFingerprint);
  return {
    ...copy,
    streak: p.streak ?? 0,
    practiceDays: { ...p.practiceDays },
    exportedAt: now,
  };
}
const finite = (v: unknown, min = 0, max = 1e15) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const integer = (v: unknown, min = 0, max = 1e9) =>
  finite(v, min, max) && Number.isInteger(v);
export function validateSnapshot(v: unknown): PortableProgress {
  const p = v as PortableProgress;
  if (!p || !finite(p.exportedAt, 946684800000, Date.now() + 86400000))
    throw Error("Invalid progress data.");
  const { progress } = migrateProgress(p);
  return { ...progress, exportedAt: p.exportedAt } as PortableProgress;
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
  if (!finite(p.exportedAt, 946684800000, Date.now() + 86400000))
    throw Error("Invalid progress data.");
  validateCurrent(p);
  const body = base64(
    zlibSync(strToU8(JSON.stringify(packProgress(p))), { level: 9 }),
  );
  const result = `DSP2.${checksum(body)}.${body}`;
  if (result.length > 131072) throw Error("Progress is too large to export.");
  return result;
}
export function decodeProgress(code: string): PortableProgress {
  const text = code.trim();
  if (text.length > 131072) throw Error("The progress code is too large.");
  const m = /^DSP([12])\.([a-f0-9]{8})\.([A-Za-z0-9_-]+)$/.exec(text);
  if (!m || checksum(m[3]) !== m[2])
    throw Error("This code is incomplete or damaged. Copy it again.");
  const input = bytes(m[3]);
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
  const data = JSON.parse(strFromU8(out));
  const raw = m[1] === "2" ? unpackProgress(data) : data;
  const exportedAt = (raw as { exportedAt?: unknown })?.exportedAt;
  if (!finite(exportedAt, 946684800000, Date.now() + 86400000))
    throw Error("Invalid progress data.");
  const { progress } = migrateProgress(raw);
  return { ...progress, exportedAt } as PortableProgress;
}
// Base45 uses QR's denser alphanumeric mode; the copyable code stays Base64URL.
const QR_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
function qrEncode(input: Uint8Array): string {
  let result = "";
  for (let i = 0; i < input.length; i += 2) {
    let n = i + 1 < input.length ? input[i] * 256 + input[i + 1] : input[i];
    result += QR_ALPHABET[n % 45];
    n = Math.floor(n / 45);
    result += QR_ALPHABET[n % 45];
    if (i + 1 < input.length) result += QR_ALPHABET[Math.floor(n / 45)];
  }
  return result;
}
function qrDecode(text: string): Uint8Array {
  if (text.length > 4200 || text.length % 3 === 1)
    throw Error("Invalid QR payload.");
  const output: number[] = [];
  for (let i = 0; i < text.length; i += 3) {
    const digits = [...text.slice(i, i + 3)].map((c) => QR_ALPHABET.indexOf(c));
    if (digits.some((n) => n < 0)) throw Error("Invalid QR characters.");
    const n = digits[0] + digits[1] * 45 + (digits[2] ?? 0) * 2025;
    if (n > (digits.length === 3 ? 65535 : 255))
      throw Error("Invalid QR value.");
    if (digits.length === 3) output.push(Math.floor(n / 256));
    output.push(n % 256);
  }
  return Uint8Array.from(output);
}
const QR_PAGE = "https://ap-calculus-practice.pages.dev/";
function qrLink(payload: string): string {
  return `${QR_PAGE}#progress=${encodeURIComponent(payload)}`;
}
function linkPayload(frame: string): string {
  if (!/^https?:\/\//.test(frame)) return frame;
  if (frame.length > 16384) throw Error("Progress link is too large.");
  const url = new URL(frame);
  if (!url.hash.startsWith("#progress="))
    throw Error("This link has no progress.");
  return decodeURIComponent(url.hash.slice(10));
}
export function qrErrorCorrection(frame: string): "M" | "L" {
  const payload = linkPayload(frame);
  if (payload.startsWith("DSA2.")) return frame.length > 3150 ? "L" : "M";
  return frame.length > 2250 ? "L" : "M";
}
export function splitIntoQrFrames(code: string): string[] {
  const direct = qrLink(code);
  if (direct.length <= 2250) return [direct];
  const match = /^DSP2\.([a-f0-9]{8})\.([A-Za-z0-9_-]+)$/.exec(code);
  if (match) {
    const dense = qrLink(
      `DSA2.${match[1].toUpperCase()}.${qrEncode(bytes(match[2]))}`,
    );
    // The URL prefix uses byte mode; its uppercase escaped payload uses the
    // denser alphanumeric mode. Leave margin below version 40-L capacity.
    if (dense.length <= 4000) return [dense];
  }
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
    frame = linkPayload(frame);
    if (frame.startsWith("DSA2.")) {
      const match = /^DSA2\.([A-F0-9]{8})\.([\s\S]+)$/.exec(frame);
      if (!match) throw Error("Invalid QR payload.");
      frame = `DSP2.${match[1].toLowerCase()}.${base64(qrDecode(match[2]))}`;
    }
    if (frame.startsWith("DSP")) {
      decodeProgress(frame);
      const id = checksum(frame);
      if (this.id && this.id !== id)
        throw Error("These QR codes belong to different snapshots.");
      this.id = id;
      this.total = 1;
      this.parts.set(1, frame);
      return { received: 1, total: 1, code: frame };
    }
    const m =
      /^DSQ1\.([a-f0-9]{8})\.(\d+)\.(\d+)\.([a-f0-9]{8})\.(.{1,700})$/.exec(
        frame,
      );
    if (!m)
      throw Error("This is not an AP Calculus Practice progress QR code.");
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
