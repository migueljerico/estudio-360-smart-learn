import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/classes")({
  head: () => ({ meta: [{ title: "Clases · Estudio360" }] }),
  component: Classes,
});

function Classes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");

  const classes = useQuery({
    queryKey: ["classes"],
    queryFn: async () => (await supabase.from("classes").select("id,name,description,class_members(student_id)").order("created_at", { ascending: false })).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!newName.trim()) throw new Error("Pon un nombre");
      const { error } = await supabase.from("classes").insert({ name: newName, teacher_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Clase creada"); setNewName(""); qc.invalidateQueries({ queryKey: ["classes"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("classes").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Clase eliminada"); qc.invalidateQueries({ queryKey: ["classes"] }); },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Clases y alumnos</h1>
          <p className="text-muted-foreground">Organiza tu enseñanza por grupos.</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Crear nueva clase</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px] space-y-2">
            <Label>Nombre</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="3º ESO B - Matemáticas" />
          </div>
          <Button onClick={() => create.mutate()} disabled={create.isPending}><Plus className="h-4 w-4" /> Crear</Button>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {(classes.data ?? []).map((c) => {
          type Member = { student_id: string };
          const members = ((c as unknown as { class_members?: Member[] }).class_members) ?? [];
          return (
            <Card key={c.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold">{c.name}</h3>
                    <p className="text-sm text-muted-foreground">{members.length} alumno{members.length === 1 ? "" : "s"}</p>
                  </div>
                  <div className="flex gap-2">
                    <AddStudentDialog classId={c.id} />
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("¿Eliminar clase?")) remove.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                {members.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {members.map((m) => (
                      <span key={m.student_id} className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground font-mono">
                        {m.student_id.slice(0, 8)}…
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {classes.data?.length === 0 && <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aún no tienes clases.</p>}
      </div>
    </div>
  );
}

function AddStudentDialog({ classId }: { classId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      if (!studentId.trim()) throw new Error("Pega el ID del alumno");
      const { error } = await supabase.from("class_members").insert({ class_id: classId, student_id: studentId.trim() });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Alumno añadido"); setStudentId(""); setOpen(false); qc.invalidateQueries({ queryKey: ["classes"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><UserPlus className="h-4 w-4" /> Añadir alumno</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Añadir alumno a la clase</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">El alumno debe haberse registrado. Pega su ID de usuario (lo encuentra en su panel).</p>
          <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="uuid del alumno" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => add.mutate()} disabled={add.isPending}>Añadir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
