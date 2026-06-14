-- ============================================================
-- 022_expand_passage_pool.sql
-- Adds passage_pool entries idx 206–230 (25 entries).
-- Extends the cycle to ~231 passages (~7.5 months).
-- ============================================================

INSERT INTO passage_pool (idx, book, chapter, verse_start, verse_end, title, prompt, theme) VALUES
-- IDENTITY
  (206, '2 Corinthians',    3,  17,  18, 'Transformed into His Image',       'How does the promise of being changed from glory to glory shape how you view your spiritual growth?',        'identity'),
  (207, 'Galatians',        4,   6,   7, 'Abba, Father',                     'What does it mean to relate to God as Father rather than as a master or judge?',                              'identity'),
-- FAITH
  (208, 'Mark',             9,  23,  24, 'Help My Unbelief',                  'Where do you need to cry out "I believe; help me overcome my unbelief" right now?',                           'faith'),
  (209, 'Hebrews',         11,   8,  10, 'Abraham''s Journey',                'What is God calling you to step toward even without seeing the destination?',                                  'faith'),
-- GRACE
  (210, 'Psalms',          86,   5,   7, 'You Are Forgiving and Good',        'What are you hesitant to bring to a God who is "ready to forgive"?',                                          'grace'),
  (211, 'Numbers',          6,  24,  26, 'The Aaronic Blessing',              'How does receiving God''s blessing and peace change how you see your day ahead?',                             'grace'),
-- COMMUNITY
  (212, 'Matthew',         18,  19,  20, 'Where Two or Three Gather',         'Who could you agree with in prayer today, and what would you bring before God together?',                     'community'),
  (213, '1 Thessalonians',  5,  11,  11, 'Encourage One Another',             'Who could you build up today, and what specific encouragement could you offer them?',                         'community'),
-- SUFFERING
  (214, 'Psalms',          73,  26,  26, 'God is the Strength of My Heart',   'When your body and heart fail, what does it look like to make God your portion and strength?',               'suffering'),
  (215, 'Isaiah',          41,  10,  10, 'I Will Strengthen You',             'How does hearing God say "I will uphold you" speak to the fear or weakness you are carrying?',               'suffering'),
-- PRAYER
  (216, 'Psalms',           5,   1,   3, 'Morning Prayer',                    'What would intentionally laying your requests before God each morning look like in your daily life?',          'prayer'),
  (217, 'Habakkuk',         2,   1,   2, 'Watch for God''s Answer',           'What are you waiting to hear from God, and how are you positioning yourself to listen?',                      'prayer'),
  (218, 'Mark',            11,  24,  25, 'Believe You Have Received',         'What would it look like to pray with the confidence that God truly hears and answers you?',                   'prayer'),
-- PURPOSE
  (219, 'Genesis',         50,  20,  20, 'Meant for Good',                    'How has God used something painful in your past for a purpose greater than you could see at the time?',        'purpose'),
  (220, '1 Corinthians',   10,  31,  31, 'Do It All for God''s Glory',        'What ordinary activity today could become an act of worship if you offered it fully to God?',                'purpose'),
-- TRUST
  (221, 'Psalms',           9,   9,  10, 'A Stronghold in Times of Trouble',  'How have you experienced God as a refuge, and how does that history shape your trust now?',                   'trust'),
  (222, 'Isaiah',          55,  10,  11, 'My Word Will Not Return Empty',     'Where do you need to trust that God''s Word is at work even when you can''t yet see fruit?',                 'trust'),
  (223, 'Lamentations',     3,  25,  26, 'Wait Quietly for the Lord',         'What does waiting quietly and hopefully on God look like in your current situation?',                          'trust'),
-- OBEDIENCE
  (224, 'Romans',           6,  11,  14, 'Dead to Sin, Alive to God',         'What would it look like to count yourself dead to sin and fully alive to God in a specific area today?',       'obedience'),
  (225, 'Hebrews',          5,   8,   9, 'He Learned Obedience',              'How does knowing Jesus learned obedience through suffering change how you approach a hard season of submission?','obedience'),
  (226, 'Deuteronomy',     11,  18,  20, 'Fix These Words in Your Heart',     'How are you keeping God''s Word at the center of your daily rhythms and relationships?',                      'obedience'),
-- LOVE
  (227, 'Romans',           5,   6,   8, 'While We Were Still Sinners',       'How does the truth that God loved you at your worst affect how you face your worst moments now?',             'love'),
  (228, 'John',            21,  15,  17, 'Do You Love Me?',                   'How does Jesus''s three-part question to Peter speak to your own love for Him right now?',                    'love'),
-- PRAISE
  (229, 'Psalms',          57,   9,  11, 'Praise Among the Nations',          'What would it look like to give God glory not just privately but openly in front of others?',                 'praise'),
  (230, 'Isaiah',          12,   2,   6, 'A Song of Salvation',               'Where has God rescued you recently, and how would you put that into words of praise today?',                  'praise')
ON CONFLICT (idx) DO NOTHING;
