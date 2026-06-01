import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/app/history")({
  head: () => ({ meta: [{ title: "Historial · Estudio360" }] }),
  component: History,
});

function History() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["history", user?.id],
    queryFn: async () => (await supabase.from("quiz_attempts").select("*, quiz:quizzes(title)").eq("student_id", user!.id).order("started_at", { ascending: false })).data ?? [],
    enabled: !!user,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-3xl font-semibold">Historial de intentos</h1>
      <div className="space-y-2">
        {(data ?? []).map((a) => {
          const pct = a.total ? Math.round((a.score / a.total) * 100) : 0;
          const quiz = (a as { quiz?: { title: string } | null }).quiz;
          return (
            <Link key={a.id} to="/app/results/$id" params={{ id: a.id }}>
              <Card className="transition hover:shadow-[var(--shadow-soft)]">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{quiz?.title ?? "Quiz"}</p>
                    <p className="text-xs text-muted-foreground">{a.finished_at ? new Date(a.finished_at).toLocaleString() : "En curso"}</p>
                  </div>
                  <span className="font-display text-lg">{pct}% <span className="text-sm text-muted-foreground">({a.score}/{a.total})</span></span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {data?.length === 0 && <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aún no has hecho ningún quiz.</p>}
      </div>
    </div>
  );
}
