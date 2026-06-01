import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Check, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/study/deck/$id")({
  head: () => ({ meta: [{ title: "Estudio · Estudio360" }] }),
  component: StudyDeck,
});

function StudyDeck() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["study-deck", id],
    queryFn: async () => {
      const [d, c] = await Promise.all([
        supabase.from("decks").select("title").eq("id", id).single(),
        supabase.from("flashcards").select("*").eq("deck_id", id).order("position"),
      ]);
      return { deck: d.data, cards: c.data ?? [] };
    },
  });

  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ known: 0, unknown: 0 });
  const [reviewFailed, setReviewFailed] = useState(false);
  const [failedIds, setFailedIds] = useState<string[]>([]);

  const cards = useMemo(() => {
    if (!data) return [];
    return reviewFailed ? data.cards.filter((c) => failedIds.includes(c.id)) : data.cards;
  }, [data, reviewFailed, failedIds]);

  if (isLoading) return <p className="text-center text-muted-foreground">Cargando…</p>;
  if (!data?.cards.length) return <Empty />;

  const card = cards[idx];
  if (!card) {
    const pct = stats.known + stats.unknown ? Math.round((stats.known / (stats.known + stats.unknown)) * 100) : 0;
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="font-display text-3xl font-semibold">¡Sesión terminada!</h1>
        <p className="mt-2 text-muted-foreground">Aciertos: {stats.known} · Fallos: {stats.unknown} · {pct}%</p>
        <div className="mt-6 flex justify-center gap-2">
          {failedIds.length > 0 && !reviewFailed && (
            <Button onClick={() => { setReviewFailed(true); setIdx(0); setFlipped(false); setStats({ known: 0, unknown: 0 }); }}>
              <RotateCcw className="h-4 w-4" /> Repasar fallos ({failedIds.length})
            </Button>
          )}
          <Button variant="outline" asChild><Link to="/app/assigned">Volver</Link></Button>
        </div>
      </div>
    );
  }

  const rate = async (result: "known" | "unknown") => {
    await supabase.from("card_reviews").insert({ student_id: user!.id, flashcard_id: card.id, result });
    if (result === "unknown") setFailedIds([...failedIds, card.id]);
    setStats((s) => ({ ...s, [result]: s[result] + 1 }));
    setFlipped(false);
    setIdx(idx + 1);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Button variant="ghost" size="sm" asChild><Link to="/app/assigned"><ArrowLeft className="h-4 w-4" /> Volver</Link></Button>
      <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
        <span className="font-display text-lg text-foreground">{data.deck?.title}</span>
        <span>{idx + 1} / {cards.length}</span>
      </div>

      <Card className="mt-4 cursor-pointer select-none transition hover:shadow-[var(--shadow-soft)]" onClick={() => setFlipped(!flipped)}>
        <CardContent className="flex min-h-[320px] items-center justify-center p-10 text-center">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{flipped ? "Reverso" : "Anverso"}</p>
            <p className="mt-4 font-display text-2xl leading-snug">{flipped ? card.back : card.front}</p>
            <p className="mt-6 text-xs text-muted-foreground">Toca para girar</p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-center gap-3">
        <Button size="lg" variant="outline" onClick={() => rate("unknown")}><X className="h-4 w-4" /> No la sabía</Button>
        <Button size="lg" onClick={() => rate("known")}><Check className="h-4 w-4" /> La sabía</Button>
      </div>
    </div>
  );
}

function Empty() {
  return <p className="text-center text-muted-foreground">Este deck no tiene tarjetas todavía.</p>;
}
