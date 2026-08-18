import { auth } from "./auth";

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  if ((session.user as any).role !== "SUPER_ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}
