ALTER TABLE public.personagens 
ALTER COLUMN altura TYPE text USING altura::text,
ALTER COLUMN peso TYPE text USING peso::text;
