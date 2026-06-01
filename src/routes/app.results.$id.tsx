import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/app/results/$id")({
  head: () => ({ meta: [{ title: "Resultados · Estudio360" }] }),
  component: Results,
});

function Results() {
  const { id } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["attempt", id],
    queryFn: async () => {
      const a = await supabase.from("quiz_attempts").select("*, quiz:quizzes(title)").eq("id", id).single();
      const ans = await supabase.from("attempt_answers").select("*, question:questions(prompt), answer:answers(text)").eq("attempt_id", id);
      return { attempt: a.data, answers: ans.data ?? [] };
    },
  });

  if (!data?.attempt) return <p>Cargando…</p>;
  const pct = data.attempt.total ? Math.round((data.attempt.score / data.attempt.total) * 100) : 0;
  type R = { id: string; is_correct: boolean; question: { prompt: string } | null; answer: { text: string } | null };
  const rows = data.answers as unknown as R[];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardContent className="p-8 text-center">
          <Trophy className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 font-display text-3xl font-semibold">{pct}% de aciertos</h1>
          <p className="text-muted-foreground">{data.attempt.score} de {data.attempt.total} correctas · {(data.attempt as { quiz?: { title: string } | null }).quiz?.title}</p>
          <div className="mt-5 flex justify-center gap-2">
            <Button asChild><Link to="/app">Al panel</Link></Button>
            <Button variant="outline" asChild><Link to="/app/history">Historial</Link></Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <p className="font-medium">{r.question?.prompt}</p>
              <p className={`mt-1 text-sm ${r.is_correct ? "text-success" : "text-destructive"}`}>Tu respuesta: {r.answer?.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
