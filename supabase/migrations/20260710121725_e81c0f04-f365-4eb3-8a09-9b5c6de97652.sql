CREATE TABLE public.snippets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position INT NOT NULL DEFAULT 0,
  label TEXT NOT NULL DEFAULT 'New',
  html TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.snippets TO anon, authenticated;
GRANT ALL ON public.snippets TO service_role;
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read snippets" ON public.snippets FOR SELECT USING (true);
CREATE POLICY "Anyone can insert snippets" ON public.snippets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update snippets" ON public.snippets FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete snippets" ON public.snippets FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.snippets;
ALTER TABLE public.snippets REPLICA IDENTITY FULL;