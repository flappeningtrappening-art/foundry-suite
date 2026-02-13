import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>
            There was a problem with your login link. It may be invalid or may
            have expired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            Please return to the login page to request a new magic link.
          </p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
