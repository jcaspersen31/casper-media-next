import { NextResponse } from "next/server";
import { getSessionUser } from "./auth";

// Route-handler helper: returns { user } on success or { response } to return immediately.
export async function requireUserOrResponse() {
  const user = await getSessionUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Not authenticated." }, { status: 401 }) };
  }
  return { user };
}

export async function requireAdminOrResponse() {
  const result = await requireUserOrResponse();
  if (result.response) return result;
  if (result.user.role !== "admin") {
    return { response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  }
  return { user: result.user };
}
