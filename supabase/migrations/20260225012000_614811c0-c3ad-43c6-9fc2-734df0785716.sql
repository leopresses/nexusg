
-- Create client_evidences table
CREATE TABLE public.client_evidences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'outros',
  title TEXT NOT NULL,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.client_evidences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evidences" ON public.client_evidences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evidences" ON public.client_evidences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own evidences" ON public.client_evidences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own evidences" ON public.client_evidences
  FOR DELETE USING (auth.uid() = user_id);

-- Create evidences storage bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('evidences', 'evidences', false, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Users can upload own evidences" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'evidences' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own evidences" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evidences' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own evidences" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'evidences' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
