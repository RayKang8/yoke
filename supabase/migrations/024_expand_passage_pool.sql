-- ============================================================
-- 024_expand_passage_pool.sql
-- Adds passage_pool entries idx 231–255 (25 entries).
-- All verse ranges pre-verified against bible_verses for NIV.
-- ============================================================

INSERT INTO passage_pool (idx, book, chapter, verse_start, verse_end, title, prompt, theme) VALUES
-- IDENTITY
  (231, 'Ephesians',        1,   4,   6, 'Chosen Before the Foundation',      'How does knowing God chose you in Christ before the world began change how you see your worth and calling?',   'identity'),
  (232, 'Isaiah',          43,   7,   7, 'Created for His Glory',             'What would it look like to live today as someone created specifically to display God''s glory?',                'identity'),
-- FAITH
  (233, 'Romans',          10,  17,  17, 'Faith Comes from Hearing',          'How intentional are you about hearing God''s Word, and how is that shaping your faith right now?',             'faith'),
  (234, 'Luke',             1,  37,  38, 'Nothing is Impossible with God',    'Where are you facing something that seems impossible, and how does Mary''s response invite you to trust?',      'faith'),
-- GRACE
  (235, 'Psalms',         103,   1,   5, 'Forget Not All His Benefits',       'Which of God''s gifts — forgiveness, healing, redemption, love — do you most need to remember today?',         'grace'),
  (236, '1 John',           2,   1,   2, 'We Have an Advocate',               'How does knowing Jesus is your advocate before the Father change how you come to God after you fail?',          'grace'),
-- COMMUNITY
  (237, 'Romans',          15,   1,   3, 'Bear with the Failings of the Weak','Who in your life are you being called to bear with rather than please yourself, and what would that look like?', 'community'),
  (238, '1 Corinthians',   12,  25,  27, 'Each One of You is Part of It',     'Who in your community is suffering right now, and what would it look like to carry that with them?',           'community'),
-- SUFFERING
  (239, 'Psalms',          34,  18,  19, 'Close to the Brokenhearted',        'Where are you brokenhearted or crushed in spirit, and how does knowing God is close to you there change things?','suffering'),
  (240, '2 Corinthians',    4,   8,  10, 'Hard Pressed but Not Crushed',      'Which of these four — crushed, in despair, abandoned, destroyed — are you most tempted to feel right now?',    'suffering'),
-- PRAYER
  (241, 'Ephesians',        6,  18,  20, 'Pray in the Spirit on All Occasions','What kinds of prayer are you neglecting, and what would it look like to be alert and persistent in all of them?','prayer'),
  (242, '1 Chronicles',     4,  10,  10, 'The Prayer of Jabez',               'What is one bold, specific request you could bring to God today — a prayer for blessing, territory, or protection?','prayer'),
-- PURPOSE
  (243, 'Psalms',         138,   8,   8, 'The LORD Will Fulfill His Purpose',  'Where are you tempted to think God has abandoned the work He started in you, and what does this verse say to that?','purpose'),
  (244, 'Acts',            20,  24,  24, 'Finish the Race',                   'What is the specific task God has given you, and what would finishing it faithfully look like from here?',       'purpose'),
-- TRUST
  (245, 'Proverbs',        19,  21,  21, 'God''s Purpose Prevails',           'How does knowing God''s purpose will prevail change how you hold your own plans with open hands?',              'trust'),
  (246, 'Isaiah',          30,  15,  15, 'In Quietness and Trust is Strength', 'Where are you striving in your own strength when God is inviting you into quietness and trust?',               'trust'),
  (247, 'Psalms',          31,  14,  15, 'My Times Are in Your Hands',        'What timeline or outcome are you gripping tightly that you need to place in God''s hands today?',               'trust'),
-- OBEDIENCE
  (248, 'John',            14,  21,  21, 'Whoever Keeps My Commands',         'How does obedience as an expression of love — rather than duty or fear — change your motivation to follow God?', 'obedience'),
  (249, 'Psalms',          40,   8,   8, 'I Desire to Do Your Will',          'What would it look like for God''s law to move from something you follow externally to something you desire inwardly?','obedience'),
-- LOVE
  (250, '1 John',           3,  16,  18, 'Lay Down Your Life',                'What would laying down your life for a brother or sister look like in a concrete, practical way this week?',     'love'),
  (251, 'Song of Solomon',  8,   6,   7, 'Love as Strong as Death',           'How does the image of love''s fierce, unquenchable nature shape how you love those around you?',                'love'),
  (252, '1 Corinthians',   13,   1,   3, 'Without Love, I Am Nothing',        'What gift, achievement, or sacrifice in your life is God asking you to examine through the lens of love?',       'love'),
-- PRAISE
  (253, 'Psalms',         104,   1,   4, 'You Are Very Great',                'How does meditating on God''s majesty and creative power move you toward worship right now?',                    'praise'),
  (254, 'Revelation',      19,   6,   7, 'Hallelujah, the Lord God Reigns',   'How does the reality that God reigns over all things shape how you approach what feels out of control?',         'praise'),
  (255, 'Acts',            16,  25,  26, 'Singing Hymns at Midnight',         'What would it look like to praise God in the middle of your own "prison" — before you see the walls fall?',      'praise')
ON CONFLICT (idx) DO NOTHING;
