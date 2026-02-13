import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GeneratorPage } from "./generator-page";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect("/login");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
        <h1 className="text-lg font-semibold">Solution Factory</h1>
        {user && (
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground hidden md:block">
              {user.email}
            </p>
            <form action={signOut}>
              <Button variant="outline" size="sm">
                Log Out
              </Button>
            </form>
          </div>
        )}
      </header>
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <GeneratorPage user={user} />
      </main>
    </div>
  );
}
