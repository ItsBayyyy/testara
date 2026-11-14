import { submitReport } from "@/lib/reports/submit";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const result = await submitReport(body, request.headers);
  switch (result.kind) {
    case "ok":
      return Response.json({ id: result.id, code: result.code }, { status: 201 });
    case "isian":
      return Response.json({ error: "isian", fields: result.fields }, { status: 400 });
    case "batas":
      return Response.json(
        { error: "batas", message: result.message },
        { status: 429, headers: { "Retry-After": String(result.retryAfterMinutes * 60) } },
      );
    case "server":
      return Response.json({ error: "server", message: result.message }, { status: 503 });
  }
}
