-- ============================================================
-- 025_expand_passage_pool.sql
-- Adds passage_pool entries idx 256–280 (25 entries).
-- All verse ranges pre-verified against bible_verses for NIV.
-- ============================================================

INSERT INTO passage_pool (idx, book, chapter, verse_start, verse_end, title, prompt, theme) VALUES
-- IDENTITY
  (256, 'Ephesians',        1,  13,  14, 'Sealed with the Holy Spirit',       'How does knowing the Spirit is God''s seal and deposit on your life change how you see your security in Him?',  'identity'),
  (257, '2 Corinthians',    5,  20,  20, 'Christ''s Ambassadors',             'What would it look like to represent Christ as His ambassador in your conversations and relationships today?',    'identity'),
-- FAITH
  (258, '1 Peter',          1,   7,   9, 'Faith of Greater Worth Than Gold',  'How does the image of faith being refined like gold in fire speak to a trial you are currently walking through?', 'faith'),
  (259, 'Matthew',          9,  28,  29, 'According to Your Faith',           'Where do you need to honestly answer Jesus''s question "Do you believe I am able to do this?" right now?',        'faith'),
-- GRACE
  (260, 'Psalms',          36,   7,   9, 'Fountain of Life',                  'How does the image of feasting in God''s house and drinking from the river of His delights speak to you today?',  'grace'),
  (261, 'Romans',           6,  23,  23, 'The Gift of God is Eternal Life',   'How does understanding salvation as a free gift — not earned — shape how you relate to God today?',             'grace'),
-- COMMUNITY
  (262, 'Ecclesiastes',     4,   9,  10, 'Two Are Better Than One',           'Who in your life helps you back up when you fall, and how are you being that person for someone else?',            'community'),
  (263, 'John',            13,  14,  15, 'Wash One Another''s Feet',          'What act of humble service toward someone in your community is God putting on your heart today?',                 'community'),
-- SUFFERING
  (264, '1 Peter',          5,  10,  10, 'After You Have Suffered a Little While','How does the promise that God will restore and strengthen you after suffering change how you view your trial?', 'suffering'),
  (265, 'Psalms',          71,  20,  21, 'You Will Restore My Life Again',    'Where do you need to trust God to bring you up from the depths and restore you once more?',                        'suffering'),
-- PRAYER
  (266, 'Jeremiah',        33,   3,   3, 'Call to Me',                        'What great and unsearchable thing do you need to ask God to reveal to you right now?',                             'prayer'),
  (267, '2 Chronicles',     7,  14,  14, 'If My People Will Humble Themselves','What would it look like to humble yourself, pray, and seek God''s face in a specific area of your life?',        'prayer'),
  (268, 'Psalms',         141,   1,   2, 'My Prayer Like Incense',            'How does the image of prayer rising like incense before God shape how you approach your times with Him?',          'prayer'),
-- PURPOSE
  (269, 'Esther',           4,  14,  14, 'For Such a Time as This',           'What position, relationship, or moment in your life might God have placed you in "for such a time as this"?',     'purpose'),
  (270, '2 Timothy',        2,  21,  21, 'An Instrument for Special Purposes', 'What would it look like to cleanse yourself so that God can use you as an instrument prepared for His work?',    'purpose'),
-- TRUST
  (271, 'Psalms',          20,   7,   8, 'We Trust in the Name of the LORD',  'What "chariots and horses" — earthly sources of security — are you trusting in place of God right now?',          'trust'),
  (272, 'Philippians',      4,  19,  19, 'My God Will Meet All Your Needs',   'What need are you carrying that you need to trust God to meet according to His riches in glory?',                 'trust'),
  (273, 'Psalms',          84,  11,  12, 'No Good Thing Does He Withhold',    'How does believing God withholds no good thing from those who walk with Him change how you face a current lack?',  'trust'),
-- OBEDIENCE
  (274, 'Luke',            11,  28,  28, 'Blessed Are Those Who Obey',        'What word from God are you hearing but not yet acting on, and what would obedience look like?',                    'obedience'),
  (275, 'Matthew',          7,  21,  21, 'Not Everyone Who Says Lord Lord',   'How does this verse challenge the gap between what you profess and how you actually live day to day?',             'obedience'),
-- LOVE
  (276, 'Galatians',        5,  13,  14, 'Serve One Another in Love',         'How are you using your freedom in Christ to serve others rather than to please yourself?',                         'love'),
  (277, 'Luke',             6,  27,  28, 'Love Your Enemies, Do Good',        'Who in your life is difficult to love right now, and what does blessing or praying for them look like?',           'love'),
-- PRAISE
  (278, 'Daniel',           2,  20,  21, 'Praise Be to the Name of God',      'How does recognizing that God controls times, seasons, and rulers shape your worship in an uncertain world?',       'praise'),
  (279, 'Psalms',          66,   1,   4, 'Shout for Joy to God, All the Earth','What awesome deed of God in your life deserves fresh, public praise today?',                                      'praise'),
  (280, 'Psalms',         111,   1,   4, 'Great Are the Works of the LORD',   'What work of God — in creation, Scripture, or your own story — fills you with wonder when you ponder it?',        'praise')
ON CONFLICT (idx) DO NOTHING;
