import { DashboardOverview } from "@/features/dashboard/components/DashboardOverview";
import { auth } from "@/auth"; // Import server-side auth

export default async function DashboardPage() {
  const session = await auth();
  const token = session?.accessToken; // Or session?.id_token based on your auth.ts

  return <DashboardOverview token={token} />;
}
