import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contentType: "deck" | "quiz";
  contentId: string;
}

export function AssignDialog({ open, onOpenChange, contentType, contentId }: Props) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const classes = useQuery({
    queryKey: ["my-classes"],
    queryFn: async () => (await supabase.from("classes").select("id,name")).data ?? [],
  });

  const existing = useQuery({
    queryKey: ["assignments", contentType, contentId],
    queryFn: async () => (await supabase.from("assignments").select("*").eq("content_type", contentType).eq("content_id", contentId)).data ?? [],
    enabled: open,
  });

  useEffect(() => {
    if (existing.data) setSelected(new Set(existing.data.filter((a) => a.class_id).map((a) => a.class_id as string)));
  }, [existing.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("assignments").delete().eq("content_type", contentType).eq("content_id", contentId).eq("teacher_id", user!.id);
      if (selected.size) {
        await supabase.from("assignments").insert(
          [...selected].map((class_id) => ({ teacher_id: user!.id, content_type: contentType, content_id: contentId, class_id }))
        );
      }
    },
    onSuccess: () => { toast.success("Asignación actualizada"); qc.invalidateQueries({ queryKey: ["assignments"] }); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Asignar a clases</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {(classes.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Crea una clase primero desde el panel de Clases.</p>
          )}
          {(classes.data ?? []).map((c) => (
            <label key={c.id} className="flex items-center gap-2 rounded-md border border-border p-2">
              <Checkbox checked={selected.has(c.id)} onCheckedChange={(v) => {
                const next = new Set(selected);
                if (v) next.add(c.id); else next.delete(c.id);
                setSelected(next);
              }} />
              <Label className="cursor-pointer">{c.name}</Label>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
