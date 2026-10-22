import { normalizeTeacherCode, sha256Hex } from "../../src/account-code";
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

interface ClassRow {
  prefix: string;
  name: string;
}

interface StudentRow {
  id: number;
  classPrefix: string;
  name: string;
  revision: number;
  progress: string | null;
  updatedAt: number | null;
  savedAt: number | null;
}

export async function handleTeacher(
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

    const code = normalizeTeacherCode(input);
    if (code === null) {
      if (!(await recordFailure(context.env.DB, guard.attempt)))
        return tooManyAttemptsResponse(guard.attempt);
      return errorResponse("unknown-code", 401);
    }

    const teacher = await context.env.DB.prepare(
      "SELECT code_hash AS codeHash FROM teacher WHERE id = 1",
    ).first<{ codeHash: string }>();
    if (teacher === null || teacher.codeHash !== (await sha256Hex(code))) {
      if (!(await recordFailure(context.env.DB, guard.attempt)))
        return tooManyAttemptsResponse(guard.attempt);
      return errorResponse("unknown-code", 401);
    }

    const classes = await context.env.DB.prepare(
      "SELECT prefix, name FROM classes ORDER BY prefix",
    ).all<ClassRow>();
    const students = await context.env.DB.prepare(
      "SELECT id, class_prefix AS classPrefix, name, revision, progress, " +
        "updated_at AS updatedAt, saved_at AS savedAt " +
        "FROM students ORDER BY class_prefix, name",
    ).all<StudentRow>();

    return jsonResponse({
      classes: classes.results,
      students: students.results.map((row) => ({
        id: row.id,
        classPrefix: row.classPrefix,
        name: row.name,
        revision: row.revision,
        progress: row.progress ?? null,
        updatedAt: row.updatedAt ?? null,
        savedAt: row.savedAt ?? null,
      })),
    });
  } catch {
    return errorResponse("unavailable", 503);
  }
}

export async function onRequest(context: PagesContext): Promise<Response> {
  if (context.request.method !== "POST")
    return errorResponse("method-not-allowed", 405, { Allow: "POST" });
  return handleTeacher(context);
}
