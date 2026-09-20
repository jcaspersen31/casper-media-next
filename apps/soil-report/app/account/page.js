import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AccountForm from "./AccountForm";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>My account</h1>
      <AccountForm user={user} />
    </div>
  );
}
