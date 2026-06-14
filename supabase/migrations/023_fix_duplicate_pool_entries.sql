-- ============================================================
-- 023_fix_duplicate_pool_entries.sql
-- idx 128 was a duplicate of idx 14  (Habakkuk 3:17-19, praise/faith).
-- idx 147 was a duplicate of idx 57  (Romans 8:26-27, prayer).
-- Replace only the verse range, title, and prompt; theme is unchanged.
-- ============================================================

-- idx 128: replace Habakkuk 3:17-19 → Revelation 5:11-13 (praise)
UPDATE passage_pool SET
  book        = 'Revelation',
  chapter     = 5,
  verse_start = 11,
  verse_end   = 13,
  title       = 'Worthy is the Lamb Who Was Slain',
  prompt      = 'How does the vision of every creature worshipping the Lamb inspire the way you approach praise today?'
WHERE idx = 128;

-- idx 147: replace Romans 8:26-27 → Colossians 4:2-4 (prayer)
UPDATE passage_pool SET
  book        = 'Colossians',
  chapter     = 4,
  verse_start = 2,
  verse_end   = 4,
  title       = 'Devote Yourselves to Prayer',
  prompt      = 'What does it look like to be devoted to prayer — watchful, thankful, and interceding for others — in your daily life?'
WHERE idx = 147;
