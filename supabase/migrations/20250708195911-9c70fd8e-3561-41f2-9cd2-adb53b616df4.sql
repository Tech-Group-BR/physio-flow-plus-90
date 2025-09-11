
-- Criar bucket de storage para fotos das evoluções
INSERT INTO storage.buckets (id, name, public) VALUES ('evolution-photos', 'evolution-photos', true);

-- Políticas para o bucket de fotos
CREATE POLICY "Allow authenticated users to upload evolution photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'evolution-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to view evolution photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'evolution-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update evolution photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'evolution-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete evolution photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'evolution-photos' AND auth.uid() IS NOT NULL);
