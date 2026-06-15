-- ============================================================
-- 031_randomize_passage_pool.sql
-- Passages were cycling through the pool in idx order, causing
-- theme clusters (e.g. 10 love passages in a row).
-- Fix: add display_order column (one-time random shuffle) and
-- update extend_passages() to use it instead of idx.
-- ============================================================

-- Step 1: Add display_order column
ALTER TABLE passage_pool ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Step 2: Assign a stable random permutation (0-based)
WITH ranked AS (
  SELECT idx,
         ROW_NUMBER() OVER (ORDER BY random()) - 1 AS new_order
  FROM passage_pool
)
UPDATE passage_pool pp
SET display_order = ranked.new_order
FROM ranked
WHERE pp.idx = ranked.idx;

-- Step 3: Unique index for O(1) lookup by display_order
CREATE UNIQUE INDEX IF NOT EXISTS passage_pool_display_order_idx
  ON passage_pool (display_order);

-- Step 4: Replace extend_passages() to cycle by display_order
CREATE OR REPLACE FUNCTION extend_passages(days_to_add INTEGER DEFAULT 90)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_days_remaining  INTEGER;
  v_last_date       DATE;
  v_start_date      DATE;
  v_pool_count      INTEGER;
  v_existing_count  INTEGER;
  v_pool_offset     INTEGER;
  v_pool_idx        INTEGER;
  v_pool_entry      RECORD;
  v_verse_text      TEXT;
  v_reference       TEXT;
  v_new_date        DATE;
  v_inserted        INTEGER := 0;
  v_i               INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_days_remaining
  FROM passages
  WHERE date >= CURRENT_DATE;

  IF v_days_remaining >= 120 THEN
    RETURN 'OK: ' || v_days_remaining || ' days remaining, no extension needed';
  END IF;

  SELECT MAX(date) INTO v_last_date FROM passages;
  v_start_date := COALESCE(v_last_date + 1, CURRENT_DATE);

  SELECT COUNT(*) INTO v_pool_count FROM passage_pool;
  IF v_pool_count = 0 THEN
    RETURN 'ERROR: passage_pool is empty';
  END IF;

  SELECT COUNT(*) INTO v_existing_count FROM passages;
  v_pool_offset := v_existing_count % v_pool_count;

  FOR v_i IN 0..(days_to_add - 1) LOOP
    v_pool_idx := (v_pool_offset + v_i) % v_pool_count;

    -- Lookup by shuffled position, not insertion order
    SELECT * INTO v_pool_entry
    FROM passage_pool
    WHERE display_order = v_pool_idx;

    SELECT string_agg(text, ' ' ORDER BY verse) INTO v_verse_text
    FROM bible_verses
    WHERE translation = 'NIV'
      AND book        = v_pool_entry.book
      AND chapter     = v_pool_entry.chapter
      AND verse      >= v_pool_entry.verse_start
      AND verse      <= v_pool_entry.verse_end;

    CONTINUE WHEN v_verse_text IS NULL;

    IF v_pool_entry.verse_start = v_pool_entry.verse_end THEN
      v_reference := v_pool_entry.book || ' ' || v_pool_entry.chapter
                     || ':' || v_pool_entry.verse_start;
    ELSE
      v_reference := v_pool_entry.book || ' ' || v_pool_entry.chapter
                     || ':' || v_pool_entry.verse_start
                     || '-' || v_pool_entry.verse_end;
    END IF;

    v_new_date := v_start_date + v_i;

    INSERT INTO passages (date, reference, title, text, prompt, theme, plan_ref)
    VALUES (
      v_new_date,
      v_reference,
      v_pool_entry.title,
      v_verse_text,
      v_pool_entry.prompt,
      v_pool_entry.theme,
      NULL
    )
    ON CONFLICT (date) DO NOTHING;

    v_inserted := v_inserted + 1;
  END LOOP;

  RETURN 'Extended: ' || v_inserted || ' passages added through '
         || (v_start_date + days_to_add - 1)::TEXT;
END;
$$;
