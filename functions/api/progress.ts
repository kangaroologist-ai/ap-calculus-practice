import {
  PROGRESS_CODE_PATTERN,
  normalizeLoginCode,
  sha256Hex,
} from "../../src/account-code";
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

interface OnlineCopyRow {
  revision: number;
  progress: string | null;
  updatedAt: number | null;
}

export async function handleProgress(
  context: PagesContext,
  now = Date.now(),
): Promise<Response> {
  try {
    const body = await readJsonBody(context.request);
    if (!body.ok) return body.response;
    if (!isRecord(body.value)) return errorResponse("bad-request", 400);

    const { code: input, baseRevision, progress, updatedAt } = body.value;
    if (
      typeof input !== "string" ||
      typeof progress !== "string" ||
      typeof baseRevision !== "number" ||
      !Number.isSafeInteger(baseRevision) ||
      baseRevision < 0 ||
      typeof updatedAt !== "number" ||
      !Number.isSafeInteger(updatedAt) ||
      !PROGRESS_CODE_PATTERN.test(progress)
    )
      return errorResponse("bad-request", 400);

    const guard = await guardAttempt(context.env.DB, context.request, now);
    if (!guard.ok) return guard.response;

    const code = normalizeLoginCode(input);
    if (code === null) {
      if (!(await recordFailure(context.env.DB, guard.attempt)))
        return tooManyAttemptsResponse(guard.attempt);
      return errorResponse("unknown-code", 401);
    }

    const codeHash = await sha256Hex(code);
    const result = await context.env.DB.prepare(
      "UPDATE students SET progress = ?, revision = revision + 1, updated_at = ?, saved_at = ? " +
        "WHERE code_hash = ? AND revision = ?",
    )
      .bind(progress, updatedAt, now, codeHash, baseRevision)
      .run();

    if (result.meta.changes === 0) {
      const current = await context.env.DB.prepare(
        "SELECT revision, progress, updated_at AS updatedAt FROM students WHERE code_hash = ?",
      )
        .bind(codeHash)
        .first<OnlineCopyRow>();
      if (current === null) {
        if (!(await recordFailure(context.env.DB, guard.attempt)))
          return tooManyAttemptsResponse(guard.attempt);
        return errorResponse("unknown-code", 401);
      }
      return jsonResponse(
        {
          error: "conflict",
          revision: current.revision,
          progress: current.progress,
          updatedAt: current.updatedAt,
        },
        409,
      );
    }

    return jsonResponse({ revision: baseRevision + 1 });
  } catch {
    return errorResponse("unavailable", 503);
  }
}

export async function onRequest(context: PagesContext): Promise<Response> {
  if (context.request.method !== "PUT")
    return errorResponse("method-not-allowed", 405, { Allow: "PUT" });
  return handleProgress(context);
}
