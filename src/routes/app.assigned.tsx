import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/app/assigned")({
  head: () => ({ meta: [{ title: "Mi contenido · Estudio360" }] }),
  component: Assigned,
});

function Assigned() {
  const { data } = useQuery({
    queryKey: ["assigned-all"],
    queryFn: async () => {
      const [d, q] = await Promise.all([
        supabase.from("decks").select("id,title,subject,topic"),
        supabase.from("quizzes").select("id,title,subject,topic"),
      ]);
      return { decks: d.data ?? [], quizzes: q.data ?? [] };
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Tu contenido asignado</h1>
        <p className="text-muted-foreground">Estudia y autoevalúate a tu ritmo.</p>
      </div>

      <Section title="Flashcards" icon={BookOpen}>
        {(data?.decks ?? []).map((d) => (
          <Link key={d.id} to="/app/study/deck/$id" params={{ id: d.id }}>
            <Card className="transition hover:shadow-[var(--shadow-soft)]">
              <CardContent className="p-5">
                <h3 className="font-display text-lg font-semibold">{d.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{[d.subject, d.topic].filter(Boolean).join(" · ") || "Sin tema"}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {data?.decks.length === 0 && <Empty />}
      </Section>

      <Section title="Quizzes" icon={GraduationCap}>
        {(data?.quizzes ?? []).map((q) => (
          <Link key={q.id} to="/app/study/quiz/$id" params={{ id: q.id }}>
            <Card className="transition hover:shadow-[var(--shadow-soft)]">
              <CardContent className="p-5">
                <h3 className="font-display text-lg font-semibold">{q.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{[q.subject, q.topic].filter(Boolean).join(" · ") || "Sin tema"}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {data?.quizzes.length === 0 && <Empty />}
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof BookOpen; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold"><Icon className="h-5 w-5 text-primary" />{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}
function Empty() { return <p className="col-span-full rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nada por aquí todavía.</p>; }
