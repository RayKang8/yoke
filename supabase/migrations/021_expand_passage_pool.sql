-- ============================================================
-- 021_expand_passage_pool.sql
-- Adds passage_pool entries idx 156–205 (50 entries).
-- Extends the cycle from ~6 months to ~13.5 months (206 passages).
-- ============================================================

INSERT INTO passage_pool (idx, book, chapter, verse_start, verse_end, title, prompt, theme) VALUES
-- IDENTITY
  (156, 'Jeremiah',         1,   5,   5, 'Before You Were Born',             'How does knowing God set you apart before birth shape your understanding of your calling?',                  'identity'),
  (157, 'Isaiah',          49,  15,  16, 'Engraved on His Palms',            'What does it mean that God has inscribed your name on His hands and will never forget you?',                  'identity'),
  (158, '1 John',           3,   1,   3, 'See What Great Love',              'How does being called a child of God shape who you are becoming?',                                             'identity'),
  (159, 'Romans',           8,  31,  32, 'God is For Us',                    'Where do you most need to believe that God is genuinely and completely for you?',                              'identity'),
-- FAITH
  (160, 'Psalms',          56,   3,   4, 'When I Am Afraid, I Trust',        'What fear are you choosing to meet with trust in God today?',                                                  'faith'),
  (161, 'Luke',            17,   5,   6, 'Increase Our Faith',               'What would you ask Jesus right now if you could make one request about your faith?',                           'faith'),
  (162, '2 Corinthians',    5,   7,   7, 'Walk by Faith, Not by Sight',      'Where are you being asked to trust God with what you cannot yet see?',                                         'faith'),
  (163, 'Hebrews',         12,   1,   3, 'A Cloud of Witnesses',             'How does the testimony of those who have gone before strengthen your faith today?',                             'faith'),
  (164, 'Genesis',         22,   9,  12, 'Abraham''s Test',                  'What is God asking you to trust Him with that feels impossible to surrender?',                                 'faith'),
-- GRACE
  (165, 'Hebrews',          4,  14,  16, 'Throne of Grace',                  'How does knowing you can approach God boldly with your needs change how you come to Him?',                     'grace'),
  (166, 'Psalms',          32,   1,   5, 'Blessed is the One Forgiven',      'Is there a weight of guilt you need to bring to God in confession today?',                                     'grace'),
  (167, 'John',             8,  10,  11, 'Neither Do I Condemn You',         'How does Christ''s freedom from condemnation invite you toward a new beginning?',                              'grace'),
  (168, '2 Corinthians',    9,   8,   8, 'Grace Abounds for Every Good Work','How is God''s abundant grace equipping you right now for what He has called you to do?',                      'grace'),
  (169, '1 Corinthians',   15,  10,  10, 'By the Grace of God',              'How has grace shaped who you are and who you are becoming?',                                                   'grace'),
-- COMMUNITY
  (170, 'John',            17,  20,  23, 'That They May Be One',             'What does unity look like in your Christian community, and what threatens it most?',                           'community'),
  (171, 'Romans',          12,  14,  18, 'Live at Peace with Everyone',      'With whom is God calling you to seek peace right now, and what would that require?',                           'community'),
  (172, 'Ephesians',        2,  19,  22, 'Built Together',                   'How are you actively contributing to building God''s household in your community?',                            'community'),
  (173, 'Psalms',          68,   5,   6, 'God Sets the Lonely in Families',  'How has God placed you in community when you felt most alone?',                                                'community'),
  (174, '1 Corinthians',    1,  10,  10, 'United in Mind and Thought',       'Where in your faith community is unity most needed, and what role can you play?',                              'community'),
-- SUFFERING
  (175, 'Psalms',          22,  24,  24, 'He Has Not Despised the Afflicted','How does knowing God does not hide from your suffering change how you cry out to Him?',                       'suffering'),
  (176, '1 Peter',          4,  12,  14, 'Do Not Be Surprised at Suffering', 'How does viewing your trial as fellowship with Christ change your response to it?',                            'suffering'),
  (177, 'Romans',           8,  35,  37, 'Conquerors in All These Things',   'What hardship in your life do you need to see through the lens of being more than a conqueror?',               'suffering'),
  (178, 'Psalms',          40,   1,   3, 'He Lifted Me Out',                 'What pit are you in, and what would it look like for God to set your feet on solid ground?',                   'suffering'),
  (179, 'James',            1,  12,  12, 'Blessed is the One Who Perseveres','What does enduring your current trial look like, and what promise does God attach to perseverance?',           'suffering'),
-- PRAYER
  (180, 'Matthew',         26,  39,  41, 'Not My Will, But Yours',           'What struggle in your life is hardest to surrender to God''s will right now?',                                'prayer'),
  (181, 'Nehemiah',         1,   4,   7, 'Nehemiah''s Prayer',               'What burden on your heart is calling you from grief to intercession?',                                         'prayer'),
  (182, 'Psalms',         145,  18,  19, 'The Lord is Near',                 'How does knowing God is near to all who call on Him shape how you come to Him in prayer?',                     'prayer'),
  (183, 'John',            15,   7,   7, 'Ask Whatever You Wish',            'What does remaining in Christ look like for you, and how does it transform what you ask for?',                 'prayer'),
  (184, '1 John',           5,  14,  15, 'Confidence in Prayer',             'How does praying "according to His will" deepen rather than limit what you bring to God?',                     'prayer'),
-- PURPOSE
  (185, 'Philippians',      1,   6,   6, 'He Who Began a Good Work',         'What unfinished work in your life do you need to trust God to complete?',                                      'purpose'),
  (186, 'Isaiah',          61,   1,   3, 'The Year of the Lord''s Favor',    'How is God calling you to bring comfort or good news to someone around you?',                                  'purpose'),
  (187, '2 Timothy',        3,  16,  17, 'Equipped for Every Good Work',     'How does Scripture equip you for the unique calling God has placed on your life?',                             'purpose'),
  (188, 'John',            10,  10,  10, 'Life to the Full',                 'What would abundant life look like for you in this specific season?',                                           'purpose'),
-- TRUST
  (189, 'Matthew',          6,  25,  27, 'Do Not Worry',                     'What worry is crowding out your trust in God today, and how will you release it to Him?',                      'trust'),
  (190, 'Isaiah',          26,   3,   4, 'Perfect Peace',                    'What would it look like to keep your mind fixed on God in the midst of your current anxieties?',               'trust'),
  (191, 'Psalms',          62,   5,   8, 'My Soul Finds Rest in God',        'Where are you searching for rest outside of God, and what would returning fully to Him look like?',            'trust'),
  (192, 'Proverbs',         3,  11,  12, 'The Lord Disciplines Those He Loves','How are you responding to a season of discipline or correction from God?',                                   'trust'),
  (193, '2 Chronicles',    20,  15,  17, 'The Battle is God''s',             'What battle in your life are you fighting in your own strength that belongs to God?',                          'trust'),
-- OBEDIENCE
  (194, 'Deuteronomy',      8,   3,   3, 'Man Does Not Live on Bread Alone', 'Where are you relying on earthly provision or comfort more than on God''s Word?',                             'obedience'),
  (195, 'Matthew',          4,  18,  20, 'Follow Me',                        'What is Jesus calling you to leave behind in order to follow Him more closely?',                               'obedience'),
  (196, 'Psalms',         119,  33,  35, 'Teach Me Your Ways',               'What would it look like to ask God for understanding that makes you delight in His commands?',                 'obedience'),
  (197, 'Philippians',      2,  12,  13, 'Work Out Your Salvation',          'How does knowing God is at work in you both to will and to act change how you pursue obedience?',              'obedience'),
-- LOVE
  (198, 'Jeremiah',        31,   3,   3, 'Everlasting Love',                 'How does knowing God has loved you with an everlasting love change how you see your worth?',                   'love'),
  (199, '1 John',           4,  19,  21, 'We Love Because He First Loved Us','How does receiving God''s love flow outward into how you treat those around you?',                             'love'),
  (200, 'Luke',            10,  33,  37, 'The Good Samaritan',               'Who is God calling you to be a neighbor to right now, and what would that cost you?',                          'love'),
  (201, 'Matthew',          5,  43,  45, 'Love Your Enemies',                'Who is difficult to love in your life, and how would loving them reflect God''s character?',                   'love'),
-- PRAISE
  (202, 'Psalms',          96,   1,   4, 'Sing to the Lord a New Song',      'What new thing God has done calls for fresh praise and worship from you today?',                               'praise'),
  (203, 'Psalms',          47,   1,   2, 'Clap Your Hands, All Nations',     'How does the vision of God as King over all the earth shape your own expression of worship?',                 'praise'),
  (204, 'Luke',            19,  37,  40, 'If the Stones Cry Out',            'What has God done that you have been holding back praise for, and what would it look like to let it out?',    'praise'),
  (205, 'Hebrews',         13,  15,  15, 'A Sacrifice of Praise',            'What does offering praise as a sacrifice look like when it doesn''t come naturally?',                         'praise')
ON CONFLICT (idx) DO NOTHING;
