import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import SyncDashboard from "../components/SyncDashboard";
import LoginHero from "../components/LoginHero";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <LoginHero />;
  }

  return <SyncDashboard session={session} />;
}
