import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const ip =
    req.ip ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"

  return new Response(JSON.stringify({ ip }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  })
}
