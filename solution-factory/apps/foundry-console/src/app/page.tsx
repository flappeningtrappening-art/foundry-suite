import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LobbyDashboard from "./lobby-page";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter italic text-zinc-900">COMMAND CONSOLE</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Authorized: {user.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-red-600 transition-colors">
              Lock Node
            </button>
          </form>
        </div>
      </div>
      <LobbyDashboard user={user} />
    </div>
  );
}
