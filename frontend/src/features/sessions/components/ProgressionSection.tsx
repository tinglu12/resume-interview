import { Badge } from "@/components/ui/badge";
import type { Job } from "@/types";

interface Props {
  answeredCount: number;
  totalCount: number;
}

export function ProgressionSection({ answeredCount, totalCount }: Props) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">Session progress</p>
      <Badge variant="outline">
        {answeredCount} / {totalCount} answered
      </Badge>
    </div>
  );
}
