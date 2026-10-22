import { normalizeLoginCode, sha256Hex } from "../../src/account-code";
import {
  guardAttempt,
  recordFailure,
  tooManyAttemptsResponse,
} from "../_lib/attempts";
import type { PagesContext } from "../_lib/d1";
import {
  errorResponse,
  isRecord,
  jsonResponse,
  readJsonBody,
} from "../_lib/http";

interface SessionRow {
  name: string;
  className: string;
  classPrefix: string;
  revision: number;
  progress: string | null;
  updatedAt: number | null;
}

export async function handleSession(
  context: PagesContext,
  now = Date.now(),
): Promise<Response> {
  try {
    const body = await readJsonBody(context.request);
    if (!body.ok) return body.response;
    if (!isRecord(body.value)) return errorResponse("bad-request", 400);
    const input = body.value.code;
    if (typeof input !== "string") return errorResponse("bad-request", 400);

    const guard = await guardAttempt(context.env.DB, context.request, now);
    if (!guard.ok) return guard.response;

    const code = normalizeLoginCode(input);
    if (code === null) {
      if (!(await recordFailure(context.env.DB, guard.attempt)))
        return tooManyAttemptsResponse(guard.attempt);
      return errorResponse("unknown-code", 401);
    }

    const row = await context.env.DB.prepare(
      `SELECT s.name AS name, c.name AS className, s.class_prefix AS classPrefix,
              s.revision AS revision, s.progress AS progress, s.updated_at AS updatedAt
         FROM students s
         JOIN classes c ON c.prefix = s.class_prefix
        WHERE s.code_hash = ?`,
    )
      .bind(await sha256Hex(code))
      .first<SessionRow>();

    if (row === null) {
      if (!(await recordFailure(context.env.DB, guard.attempt)))
        return tooManyAttemptsResponse(guard.attempt);
      return errorResponse("unknown-code", 401);
    }

    const empty = row.progress === null;
    return jsonResponse({
      name: row.name,
      className: row.className,
      classPrefix: row.classPrefix,
      revision: row.revision,
      progress: empty ? null : row.progress,
      updatedAt: empty ? null : row.updatedAt,
    });
  } catch {
    return errorResponse("unavailable", 503);
  }
}

export async function onRequest(context: PagesContext): Promise<Response> {
  if (context.request.method !== "POST")
    return errorResponse("method-not-allowed", 405, { Allow: "POST" });
  return handleSession(context);
}
