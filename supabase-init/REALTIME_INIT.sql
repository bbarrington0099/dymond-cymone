-- ============================================
-- Enable Realtime for ArtistProfile and ArtistEvent
-- ============================================

DO $$
DECLARE
  tbl text;
  tables_to_add text[] := ARRAY['ArtistProfile', 'ArtistEvent'];
BEGIN
  FOREACH tbl IN ARRAY tables_to_add
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    END IF;
  END LOOP;
END;
$$;