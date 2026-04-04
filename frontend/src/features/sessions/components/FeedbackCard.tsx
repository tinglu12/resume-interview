import type { Feedback } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface Props {
  feedback: Feedback;
}

export function FeedbackCard({ feedback }: Props) {
  const scoreVariant =
    feedback.score >= 8
      ? "default"
      : feedback.score >= 5
      ? "secondary"
      : "destructive";

  const scoreLabel =
    feedback.score >= 8 ? "Great" : feedback.score >= 5 ? "Good" : "Needs work";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge variant={scoreVariant} className="text-sm px-3 py-1">
              {feedback.score}/10
            </Badge>
            <span className="text-sm font-medium text-muted-foreground">
              AI Feedback &mdash; {scoreLabel}
            </span>
          </div>
          <Progress value={feedback.score * 10} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400 mb-1">
            Strengths
          </h4>
          <p className="text-sm text-muted-foreground">{feedback.strengths}</p>
        </div>

        <Separator />

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400 mb-1">
            Areas to improve
          </h4>
          <p className="text-sm text-muted-foreground">{feedback.improvements}</p>
        </div>

        <Separator />

        <details className="group">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-primary hover:opacity-80 transition-opacity">
            See example answer
          </summary>
          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
            {feedback.example_answer}
          </p>
        </details>
      </CardContent>
    </Card>
  );
}
