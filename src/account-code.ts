export const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const LOGIN_RANDOM_LENGTH = 10;
export const TEACHER_CODE_LENGTH = 16;
export const MAX_BODY_CHARS = 16384;
export const PROGRESS_CODE_PATTERN = /^DSP2\.[a-f0-9]{8}\.[A-Za-z0-9_-]+$/;

const PREFIX_PATTERN = /^[A-Z]{2,8}$/;

function compact(input: string): string {
  return input.toUpperCase().replace(/[\s-]+/g, "");
}

function mapAmbiguous(text: string): string {
  return text.replace(/[OIL]/g, (char) => (char === "O" ? "0" : "1"));
}

function isAlphabet(text: string): boolean {
  for (const char of text) if (!CODE_ALPHABET.includes(char)) return false;
  return true;
}

export function isValidPrefix(prefix: string): boolean {
  return PREFIX_PATTERN.test(prefix);
}

export function normalizeLoginCode(input: string): string | null {
  const text = compact(input);
  if (text.length <= LOGIN_RANDOM_LENGTH) return null;
  const prefix = text.slice(0, -LOGIN_RANDOM_LENGTH);
  const random = mapAmbiguous(text.slice(-LOGIN_RANDOM_LENGTH));
  if (!isValidPrefix(prefix) || !isAlphabet(random)) return null;
  return prefix + random;
}

export function normalizeTeacherCode(input: string): string | null {
  const text = compact(input);
  if (text.length !== TEACHER_CODE_LENGTH) return null;
  const mapped = mapAmbiguous(text);
  return isAlphabet(mapped) ? mapped : null;
}

// 256 is a multiple of 32, so byte & 31 is uniform.
export function randomCodePart(
  length: number,
  fill: (bytes: Uint8Array<ArrayBuffer>) => void = (bytes) =>
    crypto.getRandomValues(bytes),
): string {
  const bytes = new Uint8Array(length);
  fill(bytes);
  let result = "";
  for (const byte of bytes) result += CODE_ALPHABET[byte & 31];
  return result;
}

export function newLoginCode(prefix: string): string {
  if (!isValidPrefix(prefix)) throw Error("Invalid class prefix.");
  return prefix + randomCodePart(LOGIN_RANDOM_LENGTH);
}

export function newTeacherCode(): string {
  return randomCodePart(TEACHER_CODE_LENGTH);
}

export function formatLoginCode(code: string): string {
  const prefix = code.slice(0, -LOGIN_RANDOM_LENGTH);
  const random = code.slice(-LOGIN_RANDOM_LENGTH);
  return `${prefix}-${random.slice(0, 4)}-${random.slice(4, 8)}-${random.slice(8, 10)}`;
}

export function formatTeacherCode(code: string): string {
  return [code.slice(0, 4), code.slice(4, 8), code.slice(8, 12), code.slice(12, 16)].join("-");
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
