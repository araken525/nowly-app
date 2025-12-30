import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const durationMinutes = Number(body.durationMinutes ?? 60);

  const minutes = [30, 60, 180].includes(durationMinutes) ? durationMinutes : 60;

  const roomId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();

  return NextResponse.json({
    roomId,
    expiresAt,
    shareUrl: `/r/${roomId}`,
  });
}