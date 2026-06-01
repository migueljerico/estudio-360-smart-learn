import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/study/quiz/$id")({
  head: () => ({ meta: [{ title: "Quiz · Estudio360" }] }),
  component: StudyQuiz,
});

function StudyQuiz() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["study-quiz", id],
    queryFn: async () => {
      const q = await supabase.from("quizzes").select("title").eq("id", id).single();
      const qs = await supabase.from("questions").select("*, answers(*)").eq("quiz_id", id).order("position");
      return { quiz: q.data, questions: qs.data ?? [] };
    },
  });

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (data?.questions.length && !attemptId && user) {
      (async () => {
        const { data: a } = await supabase.from("quiz_attempts").insert({ student_id: user.id, quiz_id: id, total: data.questions.length }).select().single();
        if (a) setAttemptId(a.id);
      })();
    }
  }, [data, attemptId, user, id]);

  if (!data) return <p className="text-center text-muted-foreground">Cargando…</p>;
  if (!data.questions.length) return <p className="text-center text-muted-foreground">Quiz vacío.</p>;

  const q = data.questions[idx] as unknown as { id: string; prompt: string; answers: { id: string; text: string; is_correct: boolean; position: number }[] };
  const total = data.questions.length;
  const done = idx >= total;

  const submit = async () => {
    if (!chosen || !attemptId) return;
    const ans = q.answers.find((a) => a.id === chosen)!;
    await supabase.from("attempt_answers").insert({ attempt_id: attemptId, question_id: q.id, answer_id: ans.id, is_correct: ans.is_correct });
    if (ans.is_correct) setScore(score + 1);
    setRevealed(true);
  };

  const next = async () => {
    if (idx + 1 >= total) {
      if (attemptId) await supabase.from("quiz_attempts").update({ score: score, finished_at: new Date().toISOString() }).eq("id", attemptId);
      navigate({ to: "/app/results/$id", params: { id: attemptId! } });
      return;
    }
    setIdx(idx + 1);
    setChosen(null);
    setRevealed(false);
  };

  if (done) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <Button variant="ghost" size="sm" asChild><Link to="/app/assigned"><ArrowLeft className="h-4 w-4" /> Salir</Link></Button>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-display text-lg">{data.quiz?.title}</span>
        <span className="text-sm text-muted-foreground">{idx + 1} / {total}</span>
      </div>

      <Card className="mt-4">
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-xl">{q.prompt}</h2>
          <div className="space-y-2">
            {[...q.answers].sort((a, b) => a.position - b.position).map((a) => {
              const isChosen = chosen === a.id;
              const showRight = revealed && a.is_correct;
              const showWrong = revealed && isChosen && !a.is_correct;
              return (
                <button
                  key={a.id}
                  disabled={revealed}
                  onClick={() => setChosen(a.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition",
                    !revealed && isChosen && "border-primary bg-accent",
                    showRight && "border-success bg-success/10",
                    showWrong && "border-destructive bg-destructive/10",
                  )}
                >
                  <span>{a.text}</span>
                  {showRight && <Check className="h-4 w-4 text-success" />}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end">
            {!revealed
              ? <Button onClick={submit} disabled={!chosen}>Responder</Button>
              : <Button onClick={next}>{idx + 1 >= total ? "Ver resultados" : "Siguiente"}</Button>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
