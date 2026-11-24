import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import Library from "./library";

export const runtime = "nodejs";

function expectedToken() {
  const secret = process.env.PORTAL_SESSION_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update("training-portal-access").digest("hex");
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const supplied = cookieStore.get("training_portal_session")?.value ?? "";
  const expected = expectedToken();
  const valid = Boolean(expected && supplied && supplied.length === expected.length &&
    timingSafeEqual(Buffer.from(supplied), Buffer.from(expected)));
  if (!valid) redirect("/login");
  return <Library />;
}
