"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { BlockType } from "@/types";

const SECTION_OPTIONS: { type: BlockType; defaultName: string; description: string }[] = [
  { type: "work_experience", defaultName: "Work Experience", description: "Jobs, internships, and roles" },
  { type: "education", defaultName: "Education", description: "Degrees, certifications, courses" },
  { type: "project", defaultName: "Projects", description: "Side projects and portfolio work" },
  { type: "skills", defaultName: "Technical Skills", description: "Languages, tools, frameworks" },
  { type: "summary", defaultName: "Summary", description: "Professional summary or objective" },
  { type: "custom", defaultName: "Custom Section", description: "Any other content" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sectionType: BlockType, displayName: string) => void;
}

export function AddSectionModal({ open, onOpenChange, onConfirm }: Props) {
  const [selected, setSelected] = useState<BlockType | null>(null);
  const [displayName, setDisplayName] = useState("");

  function handleSelect(type: BlockType, defaultName: string) {
    setSelected(type);
    setDisplayName(defaultName);
  }

  function handleConfirm() {
    if (!selected || !displayName.trim()) return;
    onConfirm(selected, displayName.trim());
    setSelected(null);
    setDisplayName("");
    onOpenChange(false);
  }

  function handleClose() {
    setSelected(null);
    setDisplayName("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 py-2">
          {SECTION_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => handleSelect(opt.type, opt.defaultName)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selected === opt.type
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <p className="text-sm font-medium">{opt.defaultName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>

        {selected && (
          <div className="pt-1">
            <Label htmlFor="section-name" className="text-sm">
              Section heading
            </Label>
            <Input
              id="section-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1"
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              autoFocus
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selected || !displayName.trim()}>
            Add Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
