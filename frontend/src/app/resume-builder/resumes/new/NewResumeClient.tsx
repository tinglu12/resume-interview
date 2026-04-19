"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createAssembledResume } from "@/features/resume-builder/api";

export function NewResumeClient() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const resume = await createAssembledResume(token, displayName.trim());
      router.push(`/resume-builder/resumes/${resume.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create resume");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold mb-1">Create a new resume</h1>
        <p className="text-sm text-muted-foreground">
          Give your resume a name, then add blocks from your library.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="display-name">Resume name</Label>
        <Input
          id="display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Backend SWE Resume"
          required
          autoFocus
        />
      </div>

      <Button type="submit" disabled={loading || !displayName.trim()}>
        {loading ? "Creating…" : "Create resume"}
      </Button>
    </form>
  );
}
