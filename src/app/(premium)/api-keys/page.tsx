import { getSession } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { ApiKeyManager } from "@/components/api-keys/api-key-manager";

export default async function ApiKeysPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-8">
      <ApiKeyManager />
    </div>
  );
}
