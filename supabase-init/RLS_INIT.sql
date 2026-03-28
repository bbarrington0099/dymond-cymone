-- ============================================
-- RLS Policies for ArtistProfile, ArtistEvent
-- Storage Policies for artist-covers, artist-event-thumbs, artist-favicons
-- ============================================

-- Enable RLS on tables
ALTER TABLE IF EXISTS "ArtistProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ArtistEvent" ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Helper functions (idempotent, now use text parameters and cast auth.uid() to text)
-- ----------------------------------------------------------------------------

-- Returns true if the authenticated user owns the given profile
CREATE OR REPLACE FUNCTION is_owner_of_profile(profile_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "ArtistProfile"
    WHERE id = profile_id AND "ownerUserId" = auth.uid()::text
  );
END;
$$;

-- Returns true if the authenticated user owns the event (via its profile)
CREATE OR REPLACE FUNCTION can_modify_event(event_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "ArtistEvent" e
    JOIN "ArtistProfile" p ON e."artistProfileId" = p.id
    WHERE e.id = event_id AND p."ownerUserId" = auth.uid()::text
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- ArtistProfile policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "ArtistProfile_select_public" ON "ArtistProfile";
CREATE POLICY "ArtistProfile_select_public" ON "ArtistProfile"
  FOR SELECT USING (true);  -- public read

DROP POLICY IF EXISTS "ArtistProfile_write_authenticated" ON "ArtistProfile";
CREATE POLICY "ArtistProfile_write_authenticated" ON "ArtistProfile"
  FOR ALL USING (auth.uid()::text = "ownerUserId")
  WITH CHECK (auth.uid()::text = "ownerUserId");  -- authenticated owner only

-- ----------------------------------------------------------------------------
-- ArtistEvent policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "ArtistEvent_select_public" ON "ArtistEvent";
CREATE POLICY "ArtistEvent_select_public" ON "ArtistEvent"
  FOR SELECT USING (true);  -- public read

DROP POLICY IF EXISTS "ArtistEvent_write_authenticated" ON "ArtistEvent";
CREATE POLICY "ArtistEvent_write_authenticated" ON "ArtistEvent"
  FOR ALL USING (can_modify_event(id))
  WITH CHECK (can_modify_event(id));  -- owner via profile

-- ----------------------------------------------------------------------------
-- Storage buckets (public, with size limits)
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('artist-covers', 'artist-covers', true, 12582912, ARRAY['image/*']::text[]),
  ('artist-event-thumbs', 'artist-event-thumbs', true, 12582912, ARRAY['image/*']::text[]),
  ('artist-favicons', 'artist-favicons', true, 12582912, ARRAY['image/*']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- Storage policies — one set per bucket
-- Path format: {ownerUserId}/{fileName}
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  b TEXT;
BEGIN
  FOREACH b IN ARRAY ARRAY['artist-covers', 'artist-event-thumbs', 'artist-favicons']
  LOOP

    EXECUTE 'DROP POLICY IF EXISTS "storage_' || b || '_select" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "storage_' || b || '_insert" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "storage_' || b || '_update" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "storage_' || b || '_delete" ON storage.objects';

    -- Also clean up the old shared policies (safe to repeat)
    EXECUTE 'DROP POLICY IF EXISTS "Storage_public_select" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Storage_authenticated_insert" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Storage_authenticated_update" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Storage_authenticated_delete" ON storage.objects';

    EXECUTE format(
      'CREATE POLICY "storage_%s_select" ON storage.objects
         FOR SELECT USING (bucket_id = %L)',
      b, b
    );

    EXECUTE format(
      'CREATE POLICY "storage_%s_insert" ON storage.objects
         FOR INSERT TO authenticated
         WITH CHECK (
           bucket_id = %L
           AND (storage.foldername(name))[1] = auth.uid()::text
         )',
      b, b
    );

    EXECUTE format(
      'CREATE POLICY "storage_%s_update" ON storage.objects
         FOR UPDATE TO authenticated
         USING (
           bucket_id = %L
           AND (storage.foldername(name))[1] = auth.uid()::text
         )
         WITH CHECK (
           bucket_id = %L
           AND (storage.foldername(name))[1] = auth.uid()::text
         )',
      b, b, b
    );

    EXECUTE format(
      'CREATE POLICY "storage_%s_delete" ON storage.objects
         FOR DELETE TO authenticated
         USING (
           bucket_id = %L
           AND (storage.foldername(name))[1] = auth.uid()::text
         )',
      b, b
    );

  END LOOP;
END;
$$;