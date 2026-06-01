import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, Users, TrendingUp, Plus, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";

function StudentIdBadge({ userId }: { userId: string }) {
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(userId); toast.success("ID copiado"); }}
      className="group flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-left transition hover:border-primary"
      title="Comparte este ID con tu profesor para que te añada a su clase"
    >
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Tu ID de alumno</div>
        <div className="font-mono text-xs">{userId.slice(0, 8)}…{userId.slice(-4)}</div>
      </div>
      <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
    </button>
  );
}

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Panel · Estudio360" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { role, user } = useAuth();
  return role === "profesor" ? <TeacherDashboard /> : <StudentDashboard userId={user!.id} />;
}

function TeacherDashboard() {
  const decks = useQuery({
    queryKey: ["t-decks"],
    queryFn: async () => (await supabase.from("decks").select("id,title").order("created_at", { ascending: false })).data ?? [],
  });
  const quizzes = useQuery({
    queryKey: ["t-quizzes"],
    queryFn: async () => (await supabase.from("quizzes").select("id,title").order("created_at", { ascending: false })).data ?? [],
  });
  const classes = useQuery({
    queryKey: ["t-classes"],
    queryFn: async () => (await supabase.from("classes").select("id,name").order("created_at", { ascending: false })).data ?? [],
  });
  const attempts = useQuery({
    queryKey: ["t-attempts"],
    queryFn: async () => (await supabase.from("quiz_attempts").select("id,score,total,finished_at,quiz_id,student_id").order("started_at", { ascending: false }).limit(8)).data ?? [],
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Bienvenido, profesor</h1>
          <p className="text-muted-foreground">Gestiona tu contenido y el progreso de tu clase.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild><Link to="/app/decks/new"><Plus className="h-4 w-4" /> Nuevo deck</Link></Button>
          <Button variant="secondary" asChild><Link to="/app/quizzes/new"><Plus className="h-4 w-4" /> Nuevo quiz</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Decks" value={decks.data?.length ?? 0} />
        <StatCard icon={GraduationCap} label="Quizzes" value={quizzes.data?.length ?? 0} />
        <StatCard icon={Users} label="Clases" value={classes.data?.length ?? 0} />
        <StatCard icon={TrendingUp} label="Intentos recientes" value={attempts.data?.length ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="font-display">Tu contenido</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[...(decks.data ?? []).map((d) => ({ ...d, kind: "deck" as const })),
              ...(quizzes.data ?? []).map((q) => ({ ...q, kind: "quiz" as const }))]
              .slice(0, 8).map((item) => (
              <Link
                key={`${item.kind}-${item.id}`}
                to={item.kind === "deck" ? "/app/decks/$id" : "/app/quizzes/$id"}
                params={{ id: item.id }}
                className="flex items-center justify-between rounded-lg border border-border p-3 transition hover:bg-accent"
              >
                <span className="flex items-center gap-2 text-sm">
                  {item.kind === "deck" ? <BookOpen className="h-4 w-4 text-primary" /> : <GraduationCap className="h-4 w-4 text-primary" />}
                  {item.title}
                </span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{item.kind}</span>
              </Link>
            ))}
            {(decks.data?.length ?? 0) + (quizzes.data?.length ?? 0) === 0 && (
              <EmptyState text="Aún no tienes contenido. Crea tu primer deck o quiz." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display">Intentos recientes de tus alumnos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(attempts.data ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span className="text-muted-foreground">Quiz · {a.finished_at ? new Date(a.finished_at).toLocaleDateString() : "en curso"}</span>
                <span className="font-medium">{a.score}/{a.total}</span>
              </div>
            ))}
            {attempts.data?.length === 0 && <EmptyState text="Sin intentos todavía." />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StudentDashboard({ userId }: { userId: string }) {
  const assigned = useQuery({
    queryKey: ["s-assigned"],
    queryFn: async () => {
      const [decks, quizzes] = await Promise.all([
        supabase.from("decks").select("id,title,subject,topic"),
        supabase.from("quizzes").select("id,title,subject,topic"),
      ]);
      return { decks: decks.data ?? [], quizzes: quizzes.data ?? [] };
    },
  });
  const attempts = useQuery({
    queryKey: ["s-attempts", userId],
    queryFn: async () => (await supabase.from("quiz_attempts").select("id,score,total,finished_at").eq("student_id", userId).order("started_at", { ascending: false }).limit(10)).data ?? [],
  });

  const totalScore = (attempts.data ?? []).reduce((s, a) => s + a.score, 0);
  const totalQuestions = (attempts.data ?? []).reduce((s, a) => s + a.total, 0);
  const pct = totalQuestions ? Math.round((totalScore / totalQuestions) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Tu espacio de estudio</h1>
          <p className="text-muted-foreground">Sigue aprendiendo. Cada repaso cuenta.</p>
        </div>
        <StudentIdBadge userId={userId} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={BookOpen} label="Decks asignados" value={assigned.data?.decks.length ?? 0} />
        <StatCard icon={GraduationCap} label="Quizzes asignados" value={assigned.data?.quizzes.length ?? 0} />
        <StatCard icon={TrendingUp} label="Aciertos globales" value={`${pct}%`} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Tu contenido asignado</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link to="/app/assigned">Ver todo →</Link></Button>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[...(assigned.data?.decks ?? []).map((d) => ({ ...d, kind: "deck" as const })),
            ...(assigned.data?.quizzes ?? []).map((q) => ({ ...q, kind: "quiz" as const }))]
            .slice(0, 6).map((item) => (
            <Link
              key={`${item.kind}-${item.id}`}
              to={item.kind === "deck" ? "/app/study/deck/$id" : "/app/study/quiz/$id"}
              params={{ id: item.id }}
              className="group rounded-xl border border-border bg-card p-4 transition hover:shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                {item.kind === "deck" ? <BookOpen className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />}
                {item.kind}
              </div>
              <h3 className="mt-2 font-display font-semibold group-hover:text-primary">{item.title}</h3>
              {(item.subject || item.topic) && (
                <p className="mt-1 text-xs text-muted-foreground">{[item.subject, item.topic].filter(Boolean).join(" · ")}</p>
              )}
            </Link>
          ))}
          {!assigned.data || ((assigned.data.decks.length + assigned.data.quizzes.length) === 0) ? (
            <div className="sm:col-span-2"><EmptyState text="Tu profesor aún no te ha asignado contenido." /></div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Sparkles; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold leading-none">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{text}</p>;
}
