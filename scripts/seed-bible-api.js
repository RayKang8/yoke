/**
 * seed-bible-api.js
 * Seeds all 9 Bible translations from the bolls.life free API.
 * No API key required.
 *
 * Translations: NIV, ESV, KJV, NLT, NKJV, BSB, ASV, WEB, YLT
 *
 * Usage:
 *   node scripts/seed-bible-api.js           # seeds all 9
 *   node scripts/seed-bible-api.js NIV ESV   # seeds specific translations
 *
 * Requires .env.local with EXPO_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_KEY (preferred) or EXPO_PUBLIC_SUPABASE_ANON_KEY.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// bolls.life translation slugs
const TRANSLATIONS = ['NIV', 'ESV', 'KJV', 'NLT', 'NKJV', 'BSB', 'ASV', 'WEB', 'YLT'];

// Book names in order (index+1 = bolls.life book number)
const BOOK_NAMES = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
  '1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra',
  'Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon',
  'Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos',
  'Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah',
  'Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians',
  '2 Corinthians','Galatians','Ephesians','Philippians','Colossians',
  '1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon',
  'Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation',
];

// Chapter counts per book (standard Protestant canon)
const CHAPTER_COUNTS = [
  50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,
  48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,
  1,13,5,5,3,5,1,1,1,22,
];

// Section headings in bolls.life are prepended to verse text separated by <br/>.
// A heading is title-cased (all words ≥4 chars start uppercase) and has no trailing punctuation.
// We strip all leading heading segments before extracting the actual verse text.
function isHeading(segment) {
  const s = segment.trim();
  if (!s) return false;
  // If it ends with sentence punctuation it's likely verse content, not a heading
  if (/[.,;?!]$/.test(s)) return false;
  // All words with 4+ characters must start with an uppercase letter (title case)
  const significantWords = s.replace(/[^a-zA-Z ]/g, ' ').split(/\s+/).filter(w => w.length >= 4);
  if (significantWords.length === 0) return false;
  return significantWords.every(w => /^[A-Z]/.test(w));
}

// Returns { heading: string|null, text: string }
function parseVerse(rawText) {
  const parts = rawText.split('<br/>');
  let heading = null;

  if (parts.length > 1) {
    const headingParts = [];
    let i = 0;
    while (i < parts.length - 1 && isHeading(parts[i])) {
      headingParts.push(parts[i].trim());
      i++;
    }
    if (headingParts.length > 0) {
      heading = headingParts.join(' · ');
      rawText = parts.slice(i).join('<br/>');
    }
  }

  const text = rawText
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  return { heading, text };
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchChapter(translation, bookNum, chapter, retries = 3) {
  const url = `https://bolls.life/get-chapter/${translation}/${bookNum}/${chapter}/`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        // Rate limited — wait longer and retry
        await sleep(3000 * attempt);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt === retries) throw e;
      await sleep(1000 * attempt);
    }
  }
}

async function seedTranslation(translation) {
  console.log(`\n── ${translation} ──────────────────────`);
  const rows = [];
  let chaptersDone = 0;
  const totalChapters = CHAPTER_COUNTS.reduce((a, b) => a + b, 0);

  for (let bookIdx = 0; bookIdx < BOOK_NAMES.length; bookIdx++) {
    const bookNum = bookIdx + 1;
    const bookName = BOOK_NAMES[bookIdx];
    const numChapters = CHAPTER_COUNTS[bookIdx];

    for (let chapter = 1; chapter <= numChapters; chapter++) {
      const verses = await fetchChapter(translation, bookNum, chapter);
      for (const v of verses) {
        const { heading, text } = parseVerse(v.text);
        rows.push({
          translation,
          book: bookName,
          chapter,
          verse: v.verse,
          heading,
          text,
        });
      }
      chaptersDone++;
      process.stdout.write(`  ${bookName} ${chapter} — ${chaptersDone}/${totalChapters} chapters\r`);
      await sleep(80); // ~12 req/sec — polite rate
    }
  }

  console.log(`\n  Fetched ${rows.length.toLocaleString()} verses. Inserting...`);

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase
      .from('bible_verses')
      .upsert(rows.slice(i, i + BATCH), { onConflict: 'translation,book,chapter,verse' });
    if (error) {
      console.error(`\n  ✗ Insert error at row ${i}:`, error.message);
      return;
    }
    inserted += Math.min(BATCH, rows.length - i);
    process.stdout.write(`  Inserted ${inserted.toLocaleString()} / ${rows.length.toLocaleString()}\r`);
  }

  console.log(`  ✓ ${translation} done — ${rows.length.toLocaleString()} verses          `);
}

async function main() {
  console.log('Yoke Bible Seeder (bolls.life API)');
  console.log('===================================');

  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
    console.error('✗ Missing EXPO_PUBLIC_SUPABASE_URL in .env.local');
    process.exit(1);
  }

  const args = process.argv.slice(2).map(a => a.toUpperCase());
  const toSeed = args.length > 0
    ? TRANSLATIONS.filter(t => args.includes(t))
    : TRANSLATIONS;

  if (toSeed.length === 0) {
    console.error(`✗ Unknown: ${args.join(', ')}. Valid: ${TRANSLATIONS.join(', ')}`);
    process.exit(1);
  }

  console.log(`Seeding: ${toSeed.join(', ')}`);
  console.log('Each translation takes ~3-4 minutes.\n');

  for (const t of toSeed) {
    await seedTranslation(t);
  }

  console.log('\nAll done!');
}

main().catch(console.error);
