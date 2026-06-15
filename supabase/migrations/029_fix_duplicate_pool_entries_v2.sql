-- ============================================================
-- 029_fix_duplicate_pool_entries_v2.sql
-- 9 duplicate verse ranges found in idx 331–355 vs earlier pool.
-- For each pair the earlier idx is kept; the later is replaced.
-- All replacement verse ranges verified in bible_verses for NIV.
-- ============================================================

-- idx 331: was Galatians 2:20 (dup of idx 7) → Zephaniah 3:17 (identity)
UPDATE passage_pool SET
  book        = 'Zephaniah',
  chapter     = 3,
  verse_start = 17,
  verse_end   = 17,
  title       = 'The LORD Rejoices Over You with Singing',
  prompt      = 'How does the image of God quieting you with His love and rejoicing over you with singing change how you see yourself today?'
WHERE idx = 331;

-- idx 333: was Hebrews 11:6 (dup of idx 18) → Mark 9:23-24 (faith)
UPDATE passage_pool SET
  book        = 'Mark',
  chapter     = 9,
  verse_start = 23,
  verse_end   = 24,
  title       = 'I Believe; Help Me Overcome My Unbelief',
  prompt      = 'Where do you find yourself praying both "I believe" and "help me in my unbelief" — and what does honest faith look like there?'
WHERE idx = 333;

-- idx 340: was Romans 5:3-5 (dup of idx 108) → 1 Peter 4:12-13 (suffering)
UPDATE passage_pool SET
  book        = '1 Peter',
  chapter     = 4,
  verse_start = 12,
  verse_end   = 13,
  title       = 'Do Not Be Surprised at the Fiery Ordeal',
  prompt      = 'What trial are you facing that feels surprising or unfair — and how does Peter''s invitation to rejoice in sharing Christ''s sufferings reframe it?'
WHERE idx = 340;

-- idx 343: was 1 Corinthians 6:19-20 (dup of idx 148) → Colossians 3:23-24 (purpose)
UPDATE passage_pool SET
  book        = 'Colossians',
  chapter     = 3,
  verse_start = 23,
  verse_end   = 24,
  title       = 'Work at It with All Your Heart for the Lord',
  prompt      = 'What ordinary task in your life would change if you did it wholeheartedly as for the Lord rather than for human eyes?'
WHERE idx = 343;

-- idx 345: was Psalms 56:3-4 (dup of idx 160) → Psalms 62:5-7 (trust)
UPDATE passage_pool SET
  book        = 'Psalms',
  chapter     = 62,
  verse_start = 5,
  verse_end   = 7,
  title       = 'My Hope Comes from Him',
  prompt      = 'What would it look like for your soul to find rest in God alone — making Him your rock, salvation, and fortress rather than any lesser security?'
WHERE idx = 345;

-- idx 348: was Acts 5:29 (dup of idx 104) → Luke 6:46-47 (obedience)
UPDATE passage_pool SET
  book        = 'Luke',
  chapter     = 6,
  verse_start = 46,
  verse_end   = 47,
  title       = 'Why Do You Call Me Lord and Not Obey?',
  prompt      = 'Where is there a gap between what you call Jesus and how you actually live — and what would building your life on His words look like today?'
WHERE idx = 348;

-- idx 349: was Romans 8:38-39 (dup of idx 62) → 1 John 4:11-12 (love)
UPDATE passage_pool SET
  book        = '1 John',
  chapter     = 4,
  verse_start = 11,
  verse_end   = 12,
  title       = 'Since God So Loved Us',
  prompt      = 'How does the logic of this verse — that God''s love for us is the reason we must love one another — change how you approach a difficult relationship?'
WHERE idx = 349;

-- idx 350: was Ephesians 3:17-19 (dup of idx 69) → 1 John 4:18-19 (love)
UPDATE passage_pool SET
  book        = '1 John',
  chapter     = 4,
  verse_start = 18,
  verse_end   = 19,
  title       = 'Perfect Love Drives Out Fear',
  prompt      = 'What fear in your life is being confronted by God''s perfect love — and what would it look like to let that love cast it out?'
WHERE idx = 350;

-- idx 352: was Psalms 150:1-6 (dup of idx 121) → Psalms 148:1-4 (praise)
UPDATE passage_pool SET
  book        = 'Psalms',
  chapter     = 148,
  verse_start = 1,
  verse_end   = 4,
  title       = 'Praise the LORD from the Heavens',
  prompt      = 'How does the vision of all creation — angels, sun, moon, stars — joining in praise expand your own sense of what worship is meant to be?'
WHERE idx = 352;
