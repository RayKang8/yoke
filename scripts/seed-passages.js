/**
 * seed-passages.js
 * Populates the passages table with a curated year-long devotional plan.
 * Fetches verse text from bible_verses (NIV) already in the DB.
 *
 * Usage:
 *   node scripts/seed-passages.js          # schedules from today for 365 days
 *   node scripts/seed-passages.js 60       # schedules 60 days ahead
 *
 * Run again any time to extend the schedule further.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// ─── Passage pool ───────────────────────────────────────────────────────────
// Each entry: [book, chapter, verseStart, verseEnd, title, prompt, theme]
// 182 unique passages → repeat cycle every ~6 months
const POOL = [
  // ── IDENTITY ──
  ['Genesis',      1, 26, 28, 'Made in His Image',           'How does knowing you are made in God\'s image shape how you see yourself today?',                          'identity'],
  ['Genesis',      2, 15, 17, 'The First Calling',           'What has God entrusted to your care right now?',                                                            'purpose'],
  ['Psalms',      139, 13, 16, 'Fearfully and Wonderfully Made', 'What does it mean that God knew you before you were born?',                                             'identity'],
  ['Psalms',      139,  1,  6, 'Fully Known',                'How does being completely known by God make you feel?',                                                      'identity'],
  ['Isaiah',       43,  1,  4, 'Called by Name',             'How does hearing God say "you are mine" speak to something you\'re facing?',                                'identity'],
  ['John',          1, 12, 13, 'Children of God',            'What does it look like to live as a child of God today?',                                                   'identity'],
  ['Romans',        8, 14, 17, 'Heirs with Christ',          'How does your identity as an adopted child of God change how you face today?',                              'identity'],
  ['Galatians',     2, 20, 20, 'Crucified with Christ',      'What would it look like for Christ\'s life to be more visible through you today?',                         'identity'],
  ['2 Corinthians', 5, 17, 17, 'New Creation',               'Where in your life do you most need to embrace being a new creation?',                                      'identity'],
  ['Colossians',    3,  1,  4, 'Raised with Christ',         'What would it look like to set your mind on things above today?',                                           'identity'],
  ['Ephesians',     2, 10, 10, 'God\'s Masterpiece',         'What good works do you think God has prepared for you to walk in?',                                         'purpose'],
  ['1 Peter',       2,  9, 10, 'A Royal Priesthood',         'How does being chosen and called by God shape your sense of purpose?',                                      'identity'],

  // ── FAITH ──
  ['Genesis',      12,  1,  4, 'The Call of Abram',          'What is God asking you to leave behind to step into something new?',                                        'faith'],
  ['Genesis',      15,  1,  6, 'Counted as Righteous',       'Where do you need to trust God\'s promises even when circumstances look impossible?',                       'faith'],
  ['Habakkuk',      3, 17, 19, 'Yet I Will Rejoice',         'Can you praise God right now even before you see the answer? What would that look like?',                   'faith'],
  ['Matthew',      14, 28, 31, 'Walking on Water',           'Where in your life are you looking at the waves instead of at Jesus?',                                      'faith'],
  ['Matthew',      17, 20, 20, 'Faith Like a Mustard Seed',  'What "mountain" are you asking God to move right now?',                                                     'faith'],
  ['Hebrews',      11,  1,  3, 'What Faith Is',              'How does this definition of faith reshape how you think about what you\'re trusting God for?',             'faith'],
  ['Hebrews',      11,  6,  6, 'Without Faith',              'In what area of your life do you need to bring more faith-filled expectation to God?',                     'faith'],
  ['Romans',        4, 20, 22, 'Strengthened in Faith',      'What promise of God are you choosing to believe despite circumstances?',                                    'faith'],
  ['James',         1,  2,  4, 'Testing of Your Faith',      'How is a current trial potentially working perseverance and maturity in you?',                             'faith'],
  ['Psalms',        27,  1,  5, 'The Lord is My Light',       'What are you afraid of, and how does God\'s presence address that fear?',                                  'faith'],
  ['Joshua',        1,  7,  9, 'Be Strong and Courageous',   'What step of obedience requires courage from you right now?',                                               'faith'],
  ['Deuteronomy',  31,  6,  8, 'He Will Never Leave You',    'In what situation do you most need the reminder that God will never leave you?',                            'trust'],

  // ── TRUST ──
  ['Proverbs',      3,  5,  6, 'Trust in the Lord',          'Where are you leaning on your own understanding rather than God\'s direction?',                            'trust'],
  ['Psalms',        46,  1,  3, 'God is Our Refuge',          'What "storm" in your life is calling you to say "God is my refuge"?',                                      'trust'],
  ['Psalms',        37,  3,  7, 'Delight in the Lord',        'What are your deepest desires right now, and how are you bringing them to God?',                           'trust'],
  ['Isaiah',       40, 28, 31, 'Soar on Wings like Eagles',  'Where are you weary and in need of renewed strength from God?',                                             'trust'],
  ['Jeremiah',     17,  7,  8, 'Blessed is the One Who Trusts', 'What would it look like to be like a tree planted by water, unshaken by heat?',                        'trust'],
  ['Psalms',        91,  1,  6, 'Under His Wings',            'What does resting in God\'s protection look like for you practically today?',                              'trust'],
  ['Romans',        8, 28, 28, 'All Things Work Together',   'How does believing God works all things for good change your perspective on a hard situation?',            'trust'],
  ['Philippians',   4,  6,  7, 'Do Not Be Anxious',          'What are you anxious about that you can bring to God with thanksgiving today?',                            'trust'],
  ['1 Peter',       5,  7,  7, 'Cast Your Anxiety',          'What burden are you carrying that you need to cast onto God?',                                              'trust'],
  ['Psalms',        16,  8, 11, 'I Have Set the Lord Before Me', 'What would it look like to keep God at the center of every part of your day?',                         'trust'],
  ['Nahum',         1,  7,  7, 'The Lord is Good',           'How have you experienced God as a stronghold in times of trouble?',                                         'trust'],
  ['Psalms',        23,  1,  6, 'The Lord is My Shepherd',    'In what area of your life do you most need to trust the Shepherd\'s care?',                               'trust'],

  // ── GRACE ──
  ['Ephesians',     2,  8, 10, 'Saved by Grace',             'How does understanding grace as a gift (not earned) change how you approach God?',                         'grace'],
  ['Romans',        5,  1,  5, 'Justified by Faith',         'How does being at peace with God shape the way you face suffering?',                                        'grace'],
  ['Romans',        8,  1,  2, 'No Condemnation',            'Is there an area where you\'ve been living as though you\'re still condemned?',                            'grace'],
  ['Titus',         3,  4,  7, 'His Mercy Saved Us',         'How does knowing salvation is by mercy — not works — affect your relationship with God?',                  'grace'],
  ['2 Corinthians', 12,  9, 10, 'My Grace is Sufficient',   'Where in your weakness are you experiencing God\'s power right now?',                                       'grace'],
  ['Psalms',        103,  8, 14, 'Slow to Anger',             'How does God\'s compassion and slowness to anger change how you come to Him?',                             'grace'],
  ['Psalms',         51, 10, 13, 'Create in Me a Clean Heart', 'What do you need God to renew or restore in you today?',                                                  'grace'],
  ['Luke',          15, 20, 24, 'The Father Runs',           'How does the image of the father running to embrace the son speak to your own story with God?',            'grace'],
  ['Micah',          7, 18, 19, 'Who is a God Like You',     'How does God\'s willingness to hurl our sins into the sea affect how you see yourself?',                  'grace'],
  ['Lamentations',   3, 22, 24, 'Great is Your Faithfulness','What new mercy do you need from God today?',                                                               'grace'],
  ['1 John',         1,  9,  9, 'He is Faithful to Forgive', 'Is there something you\'ve been slow to confess? What holds you back?',                                   'grace'],
  ['Romans',         3, 23, 25, 'All Have Sinned',           'How does the cross level the ground between you and others?',                                               'grace'],

  // ── PRAYER ──
  ['Matthew',        6,  9, 13, 'The Lord\'s Prayer',        'Which part of this prayer is most challenging for you to pray sincerely right now?',                      'prayer'],
  ['Luke',          18,  1,  8, 'Pray and Not Give Up',      'What prayer are you tempted to give up on? What would it look like to persist?',                           'prayer'],
  ['Jeremiah',      29, 12, 14, 'Seek Me and Find Me',       'What would it look like to seek God with all your heart today?',                                            'prayer'],
  ['1 Kings',       19, 11, 13, 'The Still Small Voice',     'How do you create space to hear God\'s quiet voice in your life?',                                          'prayer'],
  ['Psalms',         42,  1,  5, 'As the Deer Pants',         'What makes your soul thirst for God, and what does that longing look like in your life?',                 'prayer'],
  ['Psalms',         63,  1,  5, 'Earnestly I Seek You',      'How would you describe your hunger for God right now?',                                                    'prayer'],
  ['Philippians',    4,  4,  7, 'Rejoice Always',            'What does it look like to practice gratitude even in difficult circumstances?',                             'prayer'],
  ['1 Thessalonians',5, 16, 18, 'Pray Continually',          'How can prayer become more woven into the fabric of your ordinary day?',                                   'prayer'],
  ['James',          5, 16, 18, 'The Prayer of the Righteous','Who in your life needs fervent, faithful prayer from you right now?',                                    'prayer'],
  ['Romans',         8, 26, 27, 'The Spirit Intercedes',     'How does knowing the Spirit prays for you when you don\'t know what to say bring you comfort?',           'prayer'],
  ['Daniel',         6, 10, 11, 'Daniel Prays',              'What rhythms of prayer anchor your day, even when it\'s hard?',                                             'prayer'],
  ['Exodus',          3,  1,  6, 'Holy Ground',              'Where do you sense God\'s presence most strongly right now?',                                               'prayer'],

  // ── LOVE ──
  ['1 Corinthians',  13,  4,  8, 'Love is Patient',          'Which characteristic of love in this passage do you find hardest to practice?',                           'love'],
  ['John',            3, 16, 17, 'God So Loved',             'How does the scale of God\'s love in this verse speak to something you\'re facing?',                      'love'],
  ['Romans',          8, 38, 39, 'Nothing Can Separate',     'What tries to make you feel separated from God\'s love? How does this passage respond?',                  'love'],
  ['1 John',          4,  7, 12, 'God is Love',              'How does receiving God\'s love make you more able to love others?',                                         'love'],
  ['John',           15, 12, 17, 'Love One Another',         'Who is God calling you to love in a sacrificial way right now?',                                            'love'],
  ['Deuteronomy',     6,  4,  9, 'Love the Lord Your God',   'How are you weaving love for God into the fabric of your daily life?',                                    'love'],
  ['Matthew',        22, 37, 40, 'The Greatest Commandment', 'If love is the heart of all God asks, what shifts for you when you see every command through that lens?', 'love'],
  ['Song of Solomon', 2,  3,  5, 'Under His Banner',         'How have you experienced God\'s affection and delight over you?',                                          'love'],
  ['Zephaniah',       3, 17, 17, 'He Delights in You',       'What does it mean to you that God rejoices over you with singing?',                                        'love'],
  ['Ephesians',       3, 17, 19, 'Rooted and Grounded',      'How does grasping the width, length, height, and depth of Christ\'s love change you?',                   'love'],
  ['John',           13, 34, 35, 'A New Command',            'How does the way you love others reflect the love Jesus has shown you?',                                   'love'],
  ['Romans',         12,  9, 13, 'Love Must Be Sincere',     'What does genuine, unhypocritical love look like in your closest relationships?',                          'love'],

  // ── PURPOSE ──
  ['Jeremiah',       29, 11, 11, 'Plans to Prosper You',     'How does knowing God has a future and hope for you change how you face uncertainty?',                      'purpose'],
  ['Romans',         12,  1,  2, 'Living Sacrifice',         'What would it look like to offer yourself to God today — not conformed but transformed?',                  'purpose'],
  ['Matthew',         5, 13, 16, 'Salt and Light',           'How are you being salt and light in your specific context this week?',                                      'purpose'],
  ['Matthew',        28, 19, 20, 'The Great Commission',     'How does the Great Commission shape the way you live your everyday life?',                                  'purpose'],
  ['Acts',            1,  8,  8, 'You Will Be My Witnesses', 'What would it look like to be a witness for Jesus in your Jerusalem — your immediate world?',             'purpose'],
  ['Micah',           6,  8,  8, 'Act Justly',               'Which of these three — justice, mercy, humility — do you most need to grow in?',                          'obedience'],
  ['Isaiah',          6,  8,  8, 'Here Am I',                'What is God asking you to say "Here am I, send me" to?',                                                   'purpose'],
  ['Colossians',      3, 23, 24, 'Work for the Lord',        'How would it change your work today if you did it heartily for the Lord rather than people?',              'purpose'],
  ['1 Peter',         4, 10, 11, 'Use Your Gifts',           'What gifts has God given you, and are you using them to serve others?',                                    'purpose'],
  ['Ephesians',       4, 11, 13, 'Equipping the Saints',     'How is God equipping you to build up others in your community?',                                            'community'],
  ['2 Timothy',       1,  9,  9, 'A Holy Calling',           'What does it look like to live out the holy calling God has placed on your life?',                         'purpose'],
  ['Romans',         15,  5,  7, 'Glorify God Together',     'How are you contributing to a community that glorifies God with one voice?',                                'community'],

  // ── COMMUNITY ──
  ['Acts',            2, 42, 47, 'The Early Church',         'Which of these early church practices is most missing from your life right now?',                           'community'],
  ['Hebrews',        10, 24, 25, 'Spur One Another On',      'Who is someone you can intentionally encourage in their faith this week?',                                  'community'],
  ['Galatians',       6,  2,  5, 'Bear One Another\'s Burdens','Whose burden are you called to help carry right now?',                                                   'community'],
  ['Psalms',          133,  1,  3, 'How Good and Pleasant',   'What does unity in your community or church look like, and where is it most fragile?',                    'community'],
  ['1 Corinthians',  12, 12, 20, 'One Body, Many Parts',     'How does your unique part in the body of Christ connect to others\' parts?',                              'community'],
  ['Ephesians',       4,  1,  6, 'One Body, One Spirit',     'How are you working to maintain the unity of the Spirit in your relationships?',                           'community'],
  ['Proverbs',       27, 17, 17, 'Iron Sharpens Iron',       'Who sharpens you spiritually, and how intentional are you about that relationship?',                       'community'],
  ['Ruth',            1, 16, 18, 'Where You Go I Will Go',   'Who in your life are you committed to walking alongside through difficulty?',                               'community'],
  ['Colossians',      3, 12, 15, 'Clothed in Compassion',    'What would it look like to put on these qualities as your daily clothing?',                                'love'],
  ['1 John',          4,  7,  8, 'Let Us Love One Another',  'Is there a relationship where you\'ve held back love? What would it take to change that?',                'love'],
  ['Acts',            4, 32, 35, 'One in Heart and Mind',    'What does radical generosity look like in your community right now?',                                       'community'],
  ['Philippians',     2,  1,  5, 'United in Spirit',         'Where do you need to lay down your own interests to serve your community?',                                'community'],

  // ── OBEDIENCE ──
  ['John',           14, 15, 17, 'If You Love Me, Obey',     'How does love for Jesus motivate your obedience differently than duty or fear?',                           'obedience'],
  ['James',           1, 22, 25, 'Doers of the Word',        'What is a truth you know but are slow to act on? What would doing it look like?',                         'obedience'],
  ['Matthew',         7, 24, 27, 'Build on the Rock',        'What is the foundation you\'re building your life on right now?',                                           'obedience'],
  ['1 Samuel',       15, 22, 23, 'Obedience over Sacrifice', 'Is there an area where you\'re substituting religious activity for direct obedience?',                     'obedience'],
  ['Psalms',           1,  1,  3, 'The Blessed Life',         'What are you meditating on most, and how is it shaping you?',                                               'obedience'],
  ['Psalms',          119, 9, 11, 'Hidden in My Heart',       'How does storing God\'s Word in your heart guard you against compromise?',                                  'obedience'],
  ['Romans',         12,  9, 21, 'Hate What is Evil',        'Which of these practical commands is God most highlighting to you right now?',                              'obedience'],
  ['Luke',            9, 23, 25, 'Take Up Your Cross',       'What does daily cross-carrying look like in your specific life situation?',                                 'obedience'],
  ['Acts',            5, 29, 29, 'Obey God Rather Than Men', 'Is there an area where you\'re tempted to obey people\'s expectations over God\'s?',                      'obedience'],
  ['Ezekiel',        36, 26, 27, 'A New Heart',              'How have you seen God transform your desires to align more with His?',                                      'grace'],
  ['Isaiah',          1, 17, 17, 'Learn to Do Good',         'What is one concrete step of obedience God is calling you to take today?',                                  'obedience'],
  ['Psalms',           86, 11, 12, 'An Undivided Heart',      'What would it look like to live today with a heart completely devoted to God?',                             'obedience'],

  // ── SUFFERING & HOPE ──
  ['Romans',          5,  3,  5, 'Suffering Produces Hope',  'How has a past hardship produced perseverance or character in you?',                                        'suffering'],
  ['2 Corinthians',   4, 16, 18, 'Light and Momentary Troubles','How does an eternal perspective change how you view what you\'re going through?',                      'suffering'],
  ['Isaiah',          43,  2,  3, 'When You Pass Through Waters','What fire or flood are you walking through, and how is God present in it?',                            'suffering'],
  ['Revelation',      21,  3,  5, 'No More Tears',           'How does the promise of a day with no more pain and tears give you hope today?',                           'suffering'],
  ['Romans',          8, 18, 25, 'Present Sufferings',       'How does the hope of glory help you endure what you\'re facing?',                                           'suffering'],
  ['Psalms',          130,  1,  6, 'Out of the Depths',       'What does waiting on the Lord look like in your current situation?',                                        'suffering'],
  ['Job',            19, 25, 27, 'My Redeemer Lives',        'How does Job\'s confidence in a living Redeemer speak to your own pain?',                                  'suffering'],
  ['Psalms',          147,  1,  6, 'He Heals the Brokenhearted','Where do you need God\'s healing and restoration right now?',                                            'suffering'],
  ['Isaiah',         53,  4,  6, 'He Took Our Pain',         'How does knowing Jesus carried your grief and sorrows change how you bring your pain to Him?',            'grace'],
  ['John',           11, 35, 36, 'Jesus Wept',               'How does it comfort you to know that Jesus weeps with those who weep?',                                    'suffering'],
  ['Psalms',           34,  4,  8, 'He Delivered Me',         'Share a time you cried out to God and He answered. How does that memory fuel your faith now?',             'trust'],
  ['2 Corinthians',   1,  3,  5, 'The God of All Comfort',   'How has God comforted you in a trial so that you could comfort others?',                                   'suffering'],

  // ── PRAISE & WORSHIP ──
  ['Psalms',          100,  1,  5, 'Shout for Joy',           'What would it look like to enter God\'s presence today with even more thankfulness?',                     'praise'],
  ['Psalms',          150,  1,  6, 'Let Everything Praise',   'How would your day look different if you approached it as an act of praise?',                               'praise'],
  ['Psalms',            8,  1,  9, 'How Majestic is Your Name','When do you feel most aware of both God\'s greatness and your significance to Him?',                     'praise'],
  ['Psalms',           19,  1,  4, 'The Heavens Declare',     'Where do you see God\'s fingerprints in creation around you?',                                              'praise'],
  ['Colossians',       3, 15, 17, 'Sing with Gratitude',     'What song or phrase of worship captures where your heart is today?',                                        'praise'],
  ['Revelation',       4, 11, 11, 'Worthy is the Lord',      'How does recognizing God as Creator shape how you worship Him?',                                             'praise'],
  ['Psalms',           95,  1,  7, 'Come, Let Us Sing',       'What does it look like to bow down and kneel before the God who made you?',                                 'praise'],
  ['Psalms',           29,  1,  4, 'Ascribe to the Lord',     'How does the power and majesty of God make you want to respond?',                                            'praise'],
  ['Habakkuk',         3, 17, 19, 'Yet I Will Praise',       'What would it look like to praise God even before your situation changes?',                                  'praise'],
  ['Isaiah',           6,  1,  7, 'Holy, Holy, Holy',        'How does a fresh vision of God\'s holiness change how you see yourself and your sin?',                    'praise'],
  ['Psalms',           34,  1,  3, 'I Will Extol the Lord',   'How can you boast in the Lord with someone else today?',                                                    'praise'],
  ['Nehemiah',         8, 10, 10, 'The Joy of the Lord',     'What would it look like to let God\'s joy be your strength today?',                                        'praise'],

  // ── WISDOM ──
  ['Proverbs',         3, 13, 18, 'Wisdom is Precious',      'What is one area of your life where you need to actively seek God\'s wisdom?',                             'trust'],
  ['Proverbs',         4, 23, 27, 'Guard Your Heart',        'What are you allowing into your heart and mind that is shaping you negatively?',                           'obedience'],
  ['James',            1,  5,  8, 'Ask God for Wisdom',      'What decision do you need to bring to God and trust His wisdom on?',                                        'prayer'],
  ['Proverbs',        11, 14, 14, 'Many Advisers',           'Who are the wise voices you\'re inviting to speak into your major decisions?',                              'community'],
  ['Proverbs',        16,  9,  9, 'The Heart Plans',         'How do you hold your plans loosely before God, trusting His direction?',                                    'trust'],
  ['Matthew',          7,  7, 12, 'Ask, Seek, Knock',        'What are you boldly and persistently asking God for right now?',                                             'prayer'],
  ['Psalms',          119,105,108, 'Your Word is a Lamp',     'What does it look like to let Scripture light your next step?',                                              'faith'],
  ['Ecclesiastes',     3,  1,  8, 'A Time for Everything',   'How are you making sense of the season you\'re currently in?',                                               'trust'],
  ['Proverbs',        17, 22, 22, 'A Cheerful Heart',        'How is your emotional state affecting your physical and spiritual health?',                                 'purpose'],
  ['Proverbs',        18, 10, 10, 'A Strong Tower',          'How does turning to God as your refuge change your response to trouble?',                                   'trust'],
  ['Proverbs',        22,  6,  6, 'Train Up a Child',        'How are the values you were raised with shaping your faith today?',                                         'community'],
  ['James',            3, 17, 18, 'Wisdom from Above',       'How does heavenly wisdom — pure, peaceable, gentle — look different from earthly wisdom?',                 'trust'],

  // ── HOLY SPIRIT ──
  ['John',            14, 26, 27, 'The Helper is Coming',    'How are you relying on the Holy Spirit\'s teaching and peace today?',                                       'faith'],
  ['Acts',             2,  1,  4, 'The Spirit Comes',        'How does the outpouring of the Spirit empower you for the life God calls you to?',                         'purpose'],
  ['Galatians',        5, 22, 25, 'Fruit of the Spirit',     'Which fruit of the Spirit do you most need to cultivate right now?',                                        'grace'],
  ['Romans',           8, 26, 27, 'The Spirit Helps',        'How does knowing the Spirit intercedes for you when you don\'t know what to pray bring you peace?',        'prayer'],
  ['1 Corinthians',    6, 19, 20, 'A Temple of the Spirit',  'How does being a temple of the Holy Spirit shape the choices you make with your body and mind?',           'identity'],
  ['Ephesians',        5, 18, 21, 'Filled with the Spirit',  'What would it look like to be continually filled with the Spirit in your everyday life?',                  'obedience'],
  ['John',            16, 13, 15, 'The Spirit of Truth',     'How does the Spirit\'s role in guiding you into truth shape how you seek God\'s will?',                   'prayer'],
  ['Ezekiel',         37,  1,  6, 'The Valley of Dry Bones', 'What in your life or community feels lifeless and in need of the Spirit\'s breath?',                       'faith'],
  ['Acts',             4, 31, 31, 'They Were Filled',        'How does the Spirit\'s boldness differ from your natural boldness, and where do you need it?',              'purpose'],
  ['Romans',          15, 13, 13, 'May the God of Hope',     'How does the Spirit\'s role in filling you with hope speak to where you are right now?',                  'suffering'],
  ['1 Corinthians',    2,  9, 12, 'What God Has Prepared',   'How does the Spirit revealing deep things of God shape how you read Scripture?',                            'faith'],
  ['Micah',            3,  8,  8, 'Filled with Power',       'What would it look like to be filled with power, justice, and courage like Micah?',                         'purpose'],
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function dateStr(d) {
  return d.toISOString().split('T')[0];
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

async function getVerseText(book, chapter, verseStart, verseEnd) {
  const { data } = await supabase
    .from('bible_verses')
    .select('verse, text')
    .eq('translation', 'NIV')
    .eq('book', book)
    .eq('chapter', chapter)
    .gte('verse', verseStart)
    .lte('verse', verseEnd)
    .order('verse');

  if (!data || data.length === 0) return null;
  return data.map(v => v.text).join(' ');
}

function buildReference(book, chapter, verseStart, verseEnd) {
  if (verseStart === verseEnd) return `${book} ${chapter}:${verseStart}`;
  return `${book} ${chapter}:${verseStart}-${verseEnd}`;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('Yoke Passage Seeder');
  console.log('===================');

  const daysAhead = parseInt(process.argv[2] || '365');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the last scheduled date so we don't overwrite existing passages
  const { data: last } = await supabase
    .from('passages')
    .select('date')
    .order('date', { ascending: false })
    .limit(1);

  const startDate = last?.[0]?.date
    ? addDays(new Date(last[0].date), 1)
    : today;

  console.log(`Scheduling from ${dateStr(startDate)} for ${daysAhead} days...`);
  console.log(`Pool size: ${POOL.length} passages (cycles every ${POOL.length} days)\n`);

  // Figure out which pool index to start at
  const dayOffset = Math.floor((startDate - today) / 86400000);
  let poolOffset = 0;
  if (last?.[0]?.date) {
    // Count existing passages to determine pool position
    const { count } = await supabase
      .from('passages')
      .select('*', { count: 'exact', head: true });
    poolOffset = (count ?? 0) % POOL.length;
  }

  const rows = [];
  let skipped = 0;

  for (let i = 0; i < daysAhead; i++) {
    const date = addDays(startDate, i);
    const poolIdx = (poolOffset + i) % POOL.length;
    const [book, chapter, verseStart, verseEnd, title, prompt, theme] = POOL[poolIdx];

    const text = await getVerseText(book, chapter, verseStart, verseEnd);
    if (!text) {
      console.warn(`  ⚠ No text found for ${buildReference(book, chapter, verseStart, verseEnd)} — skipping`);
      skipped++;
      continue;
    }

    rows.push({
      date: dateStr(date),
      reference: buildReference(book, chapter, verseStart, verseEnd),
      title,
      text,
      prompt,
      theme,
      plan_ref: null,
    });

    process.stdout.write(`  Prepared ${i + 1}/${daysAhead}\r`);
  }

  console.log(`\n  Inserting ${rows.length} passages (${skipped} skipped)...`);

  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase
      .from('passages')
      .upsert(rows.slice(i, i + BATCH), { onConflict: 'date' });
    if (error) {
      console.error('Insert error:', error.message);
      return;
    }
  }

  console.log(`✓ Done! Passages scheduled through ${dateStr(addDays(startDate, rows.length - 1))}`);
}

main().catch(console.error);
