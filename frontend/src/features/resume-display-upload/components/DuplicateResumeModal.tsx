"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDuplicateResume } from "../hook/useDuplicateResume";
import type { Resume } from "@/types";

interface Props {
  resume: Resume | null;
  onClose: () => void;
}

export function DuplicateResumeModal({ resume, onClose }: Props) {
  const router = useRouter();
  const { duplicateResume, isDuplicating, error } = useDuplicateResume();
  const [name, setName] = useState("");

  const sourceName = resume ? (resume.display_name ?? resume.filename) : "";

  useEffect(() => {
    if (resume) setName(`${sourceName} copy`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume?.id]);

  async function handleDuplicate() {
    if (!resume) return;
    const created = await duplicateResume({
      sourceResumeId: resume.id,
      newDisplayName: name.trim() || `${sourceName} copy`,
    });
    onClose();
    router.push(`/resume-builder/resumes/${created.id}`);
  }

  return (
    <Dialog open={!!resume} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-bold">
            Duplicate &quot;{sourceName}&quot;?
          </DialogTitle>
        </DialogHeader>
        <p className="text-[13px] text-muted-foreground leading-[1.55]">
          The new resume shares the same blocks — nothing is copied. Editing a shared
          block later still updates both resumes.
        </p>
        <div className="flex flex-col gap-1">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            New name
          </Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={isDuplicating}>
            Cancel
          </Button>
          <Button onClick={handleDuplicate} disabled={isDuplicating}>
            {isDuplicating ? "Duplicating…" : "Duplicate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
