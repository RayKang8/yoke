-- ============================================================
-- 026_expand_passage_pool.sql
-- Adds passage_pool entries idx 281–305 (25 entries).
-- All verse ranges pre-verified against bible_verses for NIV.
-- ============================================================

INSERT INTO passage_pool (idx, book, chapter, verse_start, verse_end, title, prompt, theme) VALUES
-- IDENTITY
  (281, 'Psalms',         139,  17,  18, 'How Precious Are Your Thoughts',    'How does knowing God''s thoughts toward you outnumber the grains of sand change how you see your worth to Him?', 'identity'),
  (282, 'Romans',           8,  29,  30, 'Predestined to Be Like Christ',     'What does it mean to you that God foreknew you and has been shaping you toward the likeness of His Son?',        'identity'),
-- FAITH
  (283, 'Hebrews',         11,  24,  26, 'Moses''s Choice',                   'What fleeting pleasure or security are you being asked to lay aside in order to walk more faithfully with God?',   'faith'),
  (284, 'Isaiah',          50,  10,  10, 'Trust in the Name of the LORD',     'Where are you walking in darkness without a clear way forward, and what does trusting God''s name look like there?','faith'),
-- GRACE
  (285, 'Joel',             2,  12,  13, 'Return to Me with All Your Heart',  'What would genuine, whole-hearted return to God look like in a specific area of your life right now?',             'grace'),
  (286, 'Psalms',         145,   8,   9, 'Slow to Anger, Rich in Love',       'How does the reality of God''s compassion toward all He has made shape how you receive His grace today?',          'grace'),
-- COMMUNITY
  (287, '1 Thessalonians',  4,   9,  10, 'Taught by God to Love',             'How are you actively growing in your love for fellow believers, and where is God calling you to do so more?',      'community'),
  (288, 'Acts',             9,  31,  31, 'Strengthened and Encouraged',       'What does a community living in the fear of the Lord and encouragement of the Holy Spirit look like for you?',      'community'),
-- SUFFERING
  (289, 'Psalms',          31,   9,  10, 'Be Merciful to Me in My Distress',  'Where are you consumed by grief or anguish right now, and what does bringing that honestly before God look like?',  'suffering'),
  (290, 'Psalms',          88,   1,   3, 'My Soul is Full of Trouble',        'How does Psalm 88''s raw, unresolved cry of pain give you permission to be honest with God about your own darkness?','suffering'),
-- PRAYER
  (291, 'Acts',            12,   5,   5, 'The Church Prayed Earnestly',       'Who in your life is in a difficult situation that you could commit to praying earnestly for right now?',            'prayer'),
  (292, 'Luke',            22,  41,  42, 'Father, If You Are Willing',        'What does it look like to pray honestly about what you want while fully surrendering to God''s will?',              'prayer'),
  (293, 'Psalms',          17,   1,   3, 'Hear My Righteous Plea',            'How does the image of God examining your heart as you pray shape the honesty and integrity you bring to Him?',      'prayer'),
-- PURPOSE
  (294, '1 Corinthians',    9,  24,  25, 'Run to Get the Prize',              'What would it look like to run your spiritual life with the same discipline as an athlete training for a crown?',   'purpose'),
  (295, 'Revelation',      22,  12,  13, 'The Alpha and the Omega',           'How does knowing Jesus is coming and bringing His reward shape how you invest your time and energy today?',          'purpose'),
-- TRUST
  (296, 'Numbers',         23,  19,  19, 'God Does Not Lie',                  'What promise of God are you struggling to believe right now, and how does this verse speak to that doubt?',         'trust'),
  (297, 'Psalms',         121,   1,   4, 'My Help Comes from the LORD',       'Where are you looking for help right now, and how does lifting your eyes to the LORD change your perspective?',     'trust'),
-- OBEDIENCE
  (298, '1 Samuel',         3,  10,  10, 'Speak, Lord, Your Servant Is Listening','What posture of listening and readiness does Samuel''s response call you to in your own walk with God?',        'obedience'),
  (299, 'Romans',          13,  13,  14, 'Clothe Yourself with Christ',       'What would it look like to put on the Lord Jesus Christ today and make no provision for sinful desires?',           'obedience'),
-- LOVE
  (300, 'Romans',          13,   8,  10, 'Love Is the Fulfillment of the Law','How does seeing love as the fulfillment of everything God asks simplify how you approach obedience today?',          'love'),
  (301, 'John',            15,   9,  11, 'Remain in My Love',                 'What does it look like to remain in Jesus''s love today, and how does that love overflow into joy?',                'love'),
  (302, 'Ephesians',        5,   1,   2, 'Imitate God, Walk in Love',         'What would it look like to imitate God''s self-giving love in a specific relationship or situation today?',         'love'),
-- PRAISE
  (303, 'Psalms',         145,   1,   3, 'I Will Exalt You, My God the King', 'What would it look like to praise God every single day, making it a consistent and deliberate rhythm of your life?', 'praise'),
  (304, 'Psalms',          30,  11,  12, 'You Turned My Wailing into Dancing','Where has God turned mourning into joy in your life, and how does that story become an offering of praise?',         'praise'),
  (305, '2 Samuel',        22,  47,  50, 'The LORD Lives, Praise Be to My Rock','What victory or deliverance has God given you that moves you to praise Him openly among the people in your life?', 'praise')
ON CONFLICT (idx) DO NOTHING;
