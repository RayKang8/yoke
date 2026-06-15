-- ============================================================
-- 030_fix_duplicate_pool_entries_v3.sql
-- Zephaniah 3:17, Mark 9:23-24, and Colossians 3:23-24 set in
-- migration 029 were themselves duplicates of earlier pool entries.
-- Replaced with verified, non-duplicate passages.
-- ============================================================

-- idx 331: Zephaniah 3:17 was a dup → Psalms 8:4-6 (identity)
UPDATE passage_pool SET
  book        = 'Psalms',
  chapter     = 8,
  verse_start = 4,
  verse_end   = 6,
  title       = 'What Is Mankind That You Are Mindful of Them?',
  prompt      = 'How does the reality that the God who hung the stars would be mindful of you and crown you with glory change how you see yourself?'
WHERE idx = 331;

-- idx 333: Mark 9:23-24 was a dup → 1 John 5:4-5 (faith)
UPDATE passage_pool SET
  book        = '1 John',
  chapter     = 5,
  verse_start = 4,
  verse_end   = 5,
  title       = 'This Is the Victory That Overcomes the World',
  prompt      = 'How does understanding faith itself as the victory over the world — not the outcome you''re hoping for — change how you press forward right now?'
WHERE idx = 333;

-- idx 343: Colossians 3:23-24 was a dup → Acts 13:36 (purpose)
UPDATE passage_pool SET
  book        = 'Acts',
  chapter     = 13,
  verse_start = 36,
  verse_end   = 36,
  title       = 'David Served God''s Purpose in His Own Generation',
  prompt      = 'What does it look like to faithfully serve God''s purpose in your specific generation — in the time and place He has put you?'
WHERE idx = 343;
