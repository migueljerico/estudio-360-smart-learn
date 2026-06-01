import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/app/students")({
  head: () => ({ meta: [{ title: "Progreso de alumnos · Estudio360" }] }),
  component: StudentsProgress,
});

function StudentsProgress() {
  const data = useQuery({
    queryKey: ["t-students-progress"],
    queryFn: async () => {
      const { data: members } = await supabase
        .from("class_members")
        .select("student_id, class_id, classes(name)");
      const studentIds = Array.from(new Set((members ?? []).map((m) => m.student_id)));
      if (studentIds.length === 0) return [];

      const [profilesRes, attemptsRes, reviewsRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", studentIds),
        supabase.from("quiz_attempts").select("student_id, score, total, finished_at").in("student_id", studentIds),
        supabase.from("card_reviews").select("student_id, result").in("student_id", studentIds),
      ]);

      const profiles = new Map((profilesRes.data ?? []).map((p) => [p.id, p.full_name]));
      const classesByStudent = new Map<string, string[]>();
      (members ?? []).forEach((m) => {
        type WithClass = { classes?: { name: string } | { name: string }[] | null };
        const cls = (m as unknown as WithClass).classes;
        const name = Array.isArray(cls) ? cls[0]?.name : cls?.name;
        if (!name) return;
        const arr = classesByStudent.get(m.student_id) ?? [];
        if (!arr.includes(name)) arr.push(name);
        classesByStudent.set(m.student_id, arr);
      });

      return studentIds.map((id) => {
        const attempts = (attemptsRes.data ?? []).filter((a) => a.student_id === id);
        const reviews = (reviewsRes.data ?? []).filter((r) => r.student_id === id);
        const score = attempts.reduce((s, a) => s + a.score, 0);
        const total = attempts.reduce((s, a) => s + a.total, 0);
        return {
          id,
          name: profiles.get(id) || "Alumno",
          classes: classesByStudent.get(id) ?? [],
          attempts: attempts.length,
          pct: total ? Math.round((score / total) * 100) : null,
          reviews: reviews.length,
          lastAttempt: attempts.map((a) => a.finished_at).filter(Boolean).sort().pop(),
        };
      });
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Progreso de alumnos</h1>
        <p className="text-muted-foreground">Resumen del rendimiento de tus alumnos.</p>
      </div>

      <div className="grid gap-3">
        {(data.data ?? []).map((s) => (
          <Card key={s.id}>
            <CardContent className="grid gap-4 p-5 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <h3 className="font-display font-semibold">{s.name}</h3>
                <p className="font-mono text-xs text-muted-foreground">{s.id.slice(0, 8)}…</p>
                {s.classes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.classes.map((c) => (
                      <span key={c} className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{c}</span>
                    ))}
                  </div>
                )}
              </div>
              <Stat label="Aciertos" value={s.pct === null ? "—" : `${s.pct}%`} />
              <Stat label="Intentos" value={s.attempts} sub={`${s.reviews} repasos`} />
            </CardContent>
          </Card>
        ))}
        {data.data?.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2 text-base">
                <Users className="h-4 w-4" /> Sin alumnos todavía
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Añade alumnos a tus clases desde la sección Clases. Ellos verán su ID al iniciar sesión y te lo compartirán.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <TrendingUp className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xl font-semibold leading-none">{value}</div>
        <div className="text-xs text-muted-foreground">{label}{sub ? ` · ${sub}` : ""}</div>
      </div>
    </div>
  );
}
