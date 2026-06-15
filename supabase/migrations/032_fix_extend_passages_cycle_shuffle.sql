-- ============================================================
-- 032_fix_extend_passages_cycle_shuffle.sql
-- Bug: after a complete 356-passage cycle, extend_passages()
-- repeated the same fixed display_order sequence instead of
-- re-shuffling. Fix: derive ordering from a per-cycle hash seed
-- (md5 of cycle number + idx) so every cycle is a fresh shuffle.
-- The display_order column is retained but no longer used.
-- ============================================================

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
  v_position        INTEGER;
  v_cycle           INTEGER;
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

  -- Total passages ever inserted determines position in the cycle.
  SELECT COUNT(*) INTO v_existing_count FROM passages;

  FOR v_i IN 0..(days_to_add - 1) LOOP
    v_position := v_existing_count + v_i;
    v_cycle    := v_position / v_pool_count;   -- increments every 356 days
    v_pool_idx := v_position % v_pool_count;   -- 0–355 within each cycle

    -- Pick the v_pool_idx-th entry ordered by a cycle-specific hash.
    -- Different cycle number = different seed = different random order.
    SELECT * INTO v_pool_entry
    FROM passage_pool
    ORDER BY md5(v_cycle::text || '-' || idx::text)
    LIMIT 1 OFFSET v_pool_idx;

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
