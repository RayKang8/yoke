-- ============================================================
-- 028_expand_passage_pool.sql
-- Adds passage_pool entries idx 331–355 (25 entries).
-- All verse ranges pre-verified against bible_verses for NIV.
-- ============================================================

INSERT INTO passage_pool (idx, book, chapter, verse_start, verse_end, title, prompt, theme) VALUES
-- IDENTITY
  (331, 'Galatians',        2,  20,  20, 'I No Longer Live, But Christ Lives in Me', 'What would it look like for Christ to live through you today — in your conversations, decisions, and responses?',          'identity'),
  (332, 'Deuteronomy',      7,   6,   6, 'A People Holy to the LORD',            'How does being called God''s treasured possession — chosen out of all peoples — shape how you carry yourself today?',           'identity'),
-- FAITH
  (333, 'Hebrews',         11,   6,   6, 'Without Faith It Is Impossible to Please God', 'Where do you need to believe not just that God exists, but that He rewards those who earnestly seek Him?',              'faith'),
  (334, 'Romans',           4,  20,  21, 'Abraham Did Not Waver',                'Where are you tempted to waver in unbelief rather than grow strong in faith, trusting God has the power to do what He promised?', 'faith'),
-- GRACE
  (335, 'Titus',            3,   4,   5, 'He Saved Us Because of His Mercy',     'How does remembering that God saved you not because of righteous things you did, but because of His mercy, shape you today?',    'grace'),
  (336, 'Lamentations',     3,  22,  23, 'Great Is Your Faithfulness',           'What does it mean to you that God''s mercies are new every morning — that today is a fresh start, not a repeat of yesterday?',   'grace'),
-- COMMUNITY
  (337, 'Colossians',       3,  14,  15, 'Let Peace Rule Your Heart',            'Where is there discord in your community, and what would letting the peace of Christ rule there look like?',                     'community'),
  (338, 'Acts',             2,  44,  45, 'Believers Had Everything in Common',   'What would a more generous, mutually accountable Christian community look like in your specific context today?',                  'community'),
-- SUFFERING
  (339, 'Job',              1,  21,  21, 'The LORD Gives and Takes Away',        'What loss are you carrying right now, and what does Job''s response — worship in the midst of it — invite you to do?',           'suffering'),
  (340, 'Romans',           5,   3,   5, 'Suffering Produces Perseverance',      'What suffering is God using to build perseverance, character, and hope in you — and how does that change how you hold it?',       'suffering'),
-- PRAYER
  (341, 'Psalms',          55,  16,  17, 'Evening, Morning, and Noon I Cry Out', 'What weight could you bring to God in the morning, at noon, and in the evening — and what does that rhythm of prayer look like?', 'prayer'),
  (342, 'Daniel',           6,  10,  10, 'Daniel Knelt and Prayed Three Times a Day', 'What pressures are pushing you away from consistent prayer, and what would faithful prayer look like in the face of them?', 'prayer'),
-- PURPOSE
  (343, '1 Corinthians',    6,  19,  20, 'You Were Bought at a Price',           'How does knowing your body is a temple of the Holy Spirit — and that you were bought at a price — shape how you live today?',   'purpose'),
  (344, 'Isaiah',          61,   1,   2, 'The Spirit of the Lord Is on Me',      'Which of the callings in this passage — to the poor, the brokenhearted, the captives — is God placing on your heart right now?', 'purpose'),
-- TRUST
  (345, 'Psalms',          56,   3,   4, 'When I Am Afraid, I Put My Trust in You', 'What fear are you facing right now, and what does choosing to trust God''s word — rather than that fear — look like today?',  'trust'),
  (346, '2 Timothy',        1,  12,  12, 'I Know Whom I Have Believed',          'How does Paul''s settled confidence — knowing whom he has believed — compare to where you are in trusting God right now?',        'trust'),
-- OBEDIENCE
  (347, 'Matthew',          4,  19,  20, 'Come, Follow Me',                      'What nets — comfort, security, familiarity — are you being asked to leave behind in order to follow Jesus more fully?',           'obedience'),
  (348, 'Acts',             5,  29,  29, 'We Must Obey God Rather Than Human Beings', 'Where are human expectations or social pressure competing with what God has clearly called you to do?',                     'obedience'),
-- LOVE
  (349, 'Romans',           8,  38,  39, 'Nothing Can Separate Us from the Love of God', 'What circumstance or failure are you most tempted to believe has separated you from God''s love — and what does this passage say to that?', 'love'),
  (350, 'Ephesians',        3,  17,  19, 'Know the Love of Christ That Surpasses Knowledge', 'How wide, long, high, and deep does the love of Christ feel to you right now — and where do you most need to experience it?', 'love'),
  (351, '1 Corinthians',   16,  14,  14, 'Do Everything in Love',               'What is one thing you are doing this week that would be transformed if you did it entirely from a motive of love?',               'love'),
-- PRAISE
  (352, 'Psalms',          150,   1,   6, 'Let Everything That Has Breath Praise the LORD', 'What would it look like to let your entire life — not just a song or a prayer — become a sustained act of praise?',    'praise'),
  (353, 'Revelation',        7,  12,  12, 'Blessing and Glory and Wisdom',       'As you meditate on the sevenfold praise offered to God in this vision, which attribute do you most want to exalt Him for today?',  'praise'),
  (354, 'Psalms',           68,   4,   5, 'Father to the Fatherless, Defender of Widows', 'How does knowing God defends the vulnerable shape the way you praise Him and care for others in His name?',              'praise'),
  (355, 'Isaiah',           12,   4,   5, 'Make Known His Deeds Among the Nations', 'What deed of God in your life fills you with such wonder that you can''t help but want to proclaim it to those around you?',  'praise')
ON CONFLICT (idx) DO NOTHING;
