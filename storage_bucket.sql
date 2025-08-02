-- Create policies for existing deliverymedia bucket
-- Create policy to allow public read access
CREATE POLICY "Public read access for deliverymedia" ON storage.objects
FOR SELECT USING (bucket_id = 'deliverymedia');

-- Create policy to allow public upload (for delivery drivers)
CREATE POLICY "Public upload to deliverymedia" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'deliverymedia');

-- Create policy to allow public update
CREATE POLICY "Public update deliverymedia" ON storage.objects
FOR UPDATE USING (bucket_id = 'deliverymedia');

-- Create policy to allow public delete
CREATE POLICY "Public delete deliverymedia" ON storage.objects
FOR DELETE USING (bucket_id = 'deliverymedia'); 