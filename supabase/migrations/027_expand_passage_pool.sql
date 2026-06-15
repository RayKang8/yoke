-- ============================================================
-- 027_expand_passage_pool.sql
-- Adds passage_pool entries idx 306–330 (25 entries).
-- All verse ranges pre-verified against bible_verses for NIV.
-- ============================================================

INSERT INTO passage_pool (idx, book, chapter, verse_start, verse_end, title, prompt, theme) VALUES
-- IDENTITY
  (306, 'Colossians',       1,  13,  14, 'Rescued from Darkness',            'How does knowing God has already transferred you into His kingdom change the way you see your identity today?',  'identity'),
  (307, '2 Peter',          1,   3,   4, 'Partakers of the Divine Nature',   'What would it look like to live in light of everything God''s power has already given you for a godly life?',    'identity'),
-- FAITH
  (308, 'Habakkuk',         2,   4,   4, 'The Righteous Will Live by Faith', 'Where in your life are you being called to live by faithfulness rather than by what you can see or control?',     'faith'),
  (309, 'John',            20,  29,  29, 'Blessed Are Those Who Have Not Seen','How does Jesus''s blessing on those who believe without seeing speak to your own faith right now?',              'faith'),
-- GRACE
  (310, 'Hosea',            2,  19,  20, 'Betrothed in Faithfulness',        'How does the image of God committing Himself to you in love and faithfulness change how you experience His grace?', 'grace'),
  (311, 'Hebrews',          8,  12,  12, 'I Will Remember Their Sins No More','What sin or failure are you still carrying that God says He will remember no more?',                              'grace'),
-- COMMUNITY
  (312, '1 Peter',          3,   8,   9, 'Live in Harmony, Repay with Blessing','Where is God calling you to respond with blessing instead of retaliation in a difficult relationship?',        'community'),
  (313, 'Hebrews',         13,   1,   3, 'Keep on Loving as Brothers and Sisters','What stranger or prisoner — someone easily overlooked — is God calling you to remember and care for?',       'community'),
-- SUFFERING
  (314, 'Psalms',          13,   1,   5, 'How Long, O Lord?',                'What does it look like to bring your "how long?" cry honestly to God while still choosing to trust in His love?', 'suffering'),
  (315, '1 Corinthians',   10,  13,  13, 'He Will Provide a Way Through',    'What temptation or trial feels unbearable right now, and how does the promise of a way through change your response?','suffering'),
-- PRAYER
  (316, 'Psalms',          27,   7,   9, 'Your Face, Lord, I Will Seek',     'What does it look like to seek God''s face with your whole heart, especially when you feel He may be turning away?','prayer'),
  (317, 'Matthew',          6,   5,   8, 'Pray in Secret',                   'How does the contrast between praying to be seen and praying to your Father in secret challenge how you pray?',    'prayer'),
  (318, 'Psalms',         116,   1,   2, 'I Love the Lord, for He Heard Me', 'What answered prayer has deepened your love for God, and how does that history fuel your call on Him today?',     'prayer'),
-- PURPOSE
  (319, 'Psalms',          37,  23,  24, 'The Lord Makes Firm Your Steps',   'How does knowing God delights in your way and upholds you when you stumble change how you pursue His calling?',    'purpose'),
  (320, '2 Corinthians',    5,  14,  15, 'Christ''s Love Compels Us',        'How does the reality that Christ died for you compel you to no longer live for yourself but for Him?',            'purpose'),
-- TRUST
  (321, 'Isaiah',          46,  10,  11, 'I Make Known the End from the Beginning','Where do you need to trust that God already knows the outcome of what feels most uncertain in your life?',   'trust'),
  (322, 'Psalms',         112,   1,   4, 'Light Dawns for the Upright',      'How does the promise that light breaks through even in darkness shape how you trust God in a dim season?',         'trust'),
-- OBEDIENCE
  (323, 'Joshua',          24,  14,  15, 'As for Me and My Household',       'What would a deliberate, declared commitment to serve the Lord look like in your home and daily life?',            'obedience'),
  (324, 'Psalms',         119,  57,  60, 'I Will Hasten to Obey',            'What is a call from God you have been delaying, and what would "hasten and not delay" look like today?',           'obedience'),
  (325, 'Titus',            2,  11,  14, 'The Grace of God Teaches Us',      'How does grace — rather than mere rule-following — become the teacher that shapes your pursuit of a godly life?',  'obedience'),
-- LOVE
  (326, '1 John',           3,  11,  12, 'We Should Love One Another',       'Where do you see self-interest, envy, or resentment threatening your love for a brother or sister right now?',     'love'),
  (327, 'Luke',             7,  47,  48, 'Forgiven Much, Loves Much',        'How does the depth of your own forgiveness shape the depth of your love toward God and others?',                   'love'),
-- PRAISE
  (328, 'Psalms',          98,   4,   6, 'Burst into Jubilant Song',         'What would it look like to bring your full self — voice, music, energy — into praise to God today?',               'praise'),
  (329, 'Isaiah',          25,   1,   1, 'You Have Done Wonderful Things',   'What "thing planned long ago" has God faithfully accomplished that fills you with gratitude and praise today?',     'praise'),
  (330, 'Psalms',         113,   1,   4, 'From Rising to Setting Sun',       'What would it look like to let praise bookend your day — from the moment you wake to the moment you sleep?',        'praise')
ON CONFLICT (idx) DO NOTHING;
