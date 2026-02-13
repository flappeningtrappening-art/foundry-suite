import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const signOut = async () => {
    "use server";
    const supabase = createClient();
    await supabase.auth.signOut();
    return redirect("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to the Solution Factory
        </h1>

        {user ? (
          <div className="flex items-center gap-4">
            <p>Welcome, {user.email}</p>
            <form action={signOut}>
              <Button>Log Out</Button>
            </form>
          </div>
        ) : (
          <Button asChild>
            <Link href="/login">Log In</Link>
          </Button>
        )}
      </main>
    </div>
  );
}
