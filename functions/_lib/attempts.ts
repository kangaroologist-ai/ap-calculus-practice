import { sha256Hex } from "../../src/account-code";
import type { D1Like } from "./d1";
import { errorResponse } from "./http";

export const FAILURE_WINDOW_MS = 10 * 60 * 1000;
export const MAX_WINDOW_FAILURES = 60;

export interface Attempt {
  ipHash: string;
  windowStart: number;
  retryAfter: number;
}

export type AttemptGuard =
  | { ok: true; attempt: Attempt }
  | { ok: false; response: Response };

// One IPv6 client can use a whole /64, so count failures per /64 there.
export function limitKey(ip: string): string {
  if (!ip.includes(":")) return ip;
  const [head, tail = ""] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = ip.includes("::")
    ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right]
    : left;
  return `${groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, "")).join(":")}::/64`;
}

function clientIp(request: Request): string {
  return limitKey(request.headers.get("CF-Connecting-IP") ?? "unknown");
}

export function tooManyAttemptsResponse(attempt: Attempt): Response {
  return errorResponse("too-many-attempts", 429, {
    "Retry-After": String(attempt.retryAfter),
  });
}

export async function guardAttempt(
  db: D1Like,
  request: Request,
  now: number,
): Promise<AttemptGuard> {
  const ipHash = await sha256Hex(`ip:${clientIp(request)}`);
  const windowStart = Math.floor(now / FAILURE_WINDOW_MS) * FAILURE_WINDOW_MS;
  const attempt: Attempt = {
    ipHash,
    windowStart,
    retryAfter: Math.max(
      1,
      Math.ceil((windowStart + FAILURE_WINDOW_MS - now) / 1000),
    ),
  };
  const row = await db
    .prepare(
      "SELECT count FROM login_failures WHERE ip_hash = ? AND window_start = ?",
    )
    .bind(ipHash, windowStart)
    .first<{ count: number }>();
  if (row !== null && Number(row.count) >= MAX_WINDOW_FAILURES)
    return { ok: false, response: tooManyAttemptsResponse(attempt) };
  return { ok: true, attempt };
}

export async function recordFailure(
  db: D1Like,
  attempt: Attempt,
): Promise<boolean> {
  const results = await db.batch([
    db
      .prepare(
        "INSERT INTO login_failures (ip_hash, window_start, count) VALUES (?, ?, 1) " +
          "ON CONFLICT (ip_hash, window_start) DO UPDATE SET count = count + 1 " +
          "WHERE login_failures.count < ?",
      )
      .bind(attempt.ipHash, attempt.windowStart, MAX_WINDOW_FAILURES),
    db
      .prepare("DELETE FROM login_failures WHERE window_start < ?")
      .bind(attempt.windowStart - FAILURE_WINDOW_MS),
  ]);
  return (results[0]?.meta.changes ?? 0) > 0;
}
