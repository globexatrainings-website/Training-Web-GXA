import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const configuredPassword = process.env.PORTAL_ACCESS_PASSWORD;
  const secret = process.env.PORTAL_SESSION_SECRET;
  if (!configuredPassword || !secret) {
    return NextResponse.json({ error: "Portal login is not configured. Contact the administrator." }, { status: 500 });
  }

  let body: { password?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supplied = String(body.password ?? "");
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(configuredPassword);
  const passwordMatches = suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer);

  if (!passwordMatches) {
    return NextResponse.json({ error: "Incorrect access password." }, { status: 401 });
  }

  const token = createHmac("sha256", secret).update("training-portal-access").digest("hex");
  const response = NextResponse.json({ success: true });
  response.cookies.set("training_portal_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return response;
}
