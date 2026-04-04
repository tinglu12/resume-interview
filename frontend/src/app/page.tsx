import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-2xl text-center space-y-6">
        <div className="space-y-3">
          <Badge variant="secondary" className="text-xs">
            AI-Powered Interview Practice
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Ace your next interview
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Upload your resume and a job description. Get tailored interview
            questions, practice your answers with voice or text, and receive
            instant AI feedback.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          {userId ? (
            <Link href="/dashboard">Go to dashboard</Link>
          ) : (
            <>
              <Link href="/sign-up">Get started free</Link>
              <Link href="/sign-in">Sign in</Link>
            </>
          )}
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-3 text-left">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add your resume and the job description you&apos;re applying to.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Practice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Answer AI-generated questions tailored to your experience and
                the role.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Improve</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get instant feedback with scores, strengths, and example
                answers.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
