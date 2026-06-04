
-- Fix broken RLS on assignments: cm.class_id = cm.class_id was always true
DROP POLICY IF EXISTS "student sees own assignments" ON public.assignments;
CREATE POLICY "student sees own assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  student_id = auth.uid()
  OR (
    class_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.class_members cm
      WHERE cm.class_id = assignments.class_id
        AND cm.student_id = auth.uid()
    )
  )
);

-- Prevent privilege escalation: users can only self-assign 'alumno' role
DROP POLICY IF EXISTS "self assign role on signup" ON public.user_roles;
CREATE POLICY "self assign role on signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND role = 'alumno');
