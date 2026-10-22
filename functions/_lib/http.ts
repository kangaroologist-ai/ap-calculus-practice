import { MAX_BODY_CHARS } from "../../src/account-code";

export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export function errorResponse(
  error: string,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return jsonResponse({ error }, status, headers);
}

export type JsonBody =
  | { ok: true; value: unknown }
  | { ok: false; response: Response };

export async function readJsonBody(request: Request): Promise<JsonBody> {
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_BODY_CHARS)
    return { ok: false, response: errorResponse("too-large", 413) };
  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { ok: false, response: errorResponse("bad-request", 400) };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
