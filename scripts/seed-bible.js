/**
 * seed-bible.js
 * Seeds all 5 Bible translations into the bible_verses table.
 *
 * Data source: https://github.com/thiagobodruk/bible (public domain JSON files)
 *
 * Usage:
 *   node scripts/seed-bible.js
 *
 * Requires:
 *   npm install @supabase/supabase-js node-fetch dotenv
 *   .env.local with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
 *   (or set SUPABASE_SERVICE_KEY for faster bulk inserts)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Map our translation names to the thiagobodruk/bible file names
// Download these JSON files from: https://github.com/thiagobodruk/bible/tree/master/json
const TRANSLATION_FILES = {
  NIV: 'en_niv.json',
  ESV: 'en_esv.json',
  KJV: 'en_kjv.json',
  NLT: 'en_nlt.json',
  NKJV: 'en_nkjv.json',
};

// Book names in canonical order matching the JSON files
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

async function seedTranslation(translation, filePath) {
  console.log(`\nSeeding ${translation} from ${filePath}...`);

  let bibleData;
  try {
    bibleData = require(filePath);
  } catch (e) {
    console.error(`  ✗ Could not load ${filePath}. Download from https://github.com/thiagobodruk/bible/tree/master/json`);
    return;
  }

  const rows = [];

  // thiagobodruk format: array of books, each book has array of chapters, each chapter is array of verse strings
  for (let bookIdx = 0; bookIdx < bibleData.length; bookIdx++) {
    const bookName = BOOK_NAMES[bookIdx];
    const bookData = bibleData[bookIdx];

    for (let chapterIdx = 0; chapterIdx < bookData.chapters.length; chapterIdx++) {
      const chapter = chapterIdx + 1;
      const chapterVerses = bookData.chapters[chapterIdx];

      for (let verseIdx = 0; verseIdx < chapterVerses.length; verseIdx++) {
        rows.push({
          translation,
          book: bookName,
          chapter,
          verse: verseIdx + 1,
          text: chapterVerses[verseIdx],
        });
      }
    }
  }

  console.log(`  Prepared ${rows.length} verses. Inserting in batches...`);

  const BATCH_SIZE = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('bible_verses').upsert(batch, { onConflict: 'translation,book,chapter,verse' });
    if (error) {
      console.error(`  ✗ Error at batch ${i}:`, error.message);
      return;
    }
    inserted += batch.length;
    process.stdout.write(`  ${inserted}/${rows.length}\r`);
  }

  console.log(`  ✓ ${translation} seeded (${rows.length} verses)`);
}

async function main() {
  console.log('Yoke Bible Seeder');
  console.log('=================');
  console.log('Place the JSON files from https://github.com/thiagobodruk/bible/tree/master/json');
  console.log('into the scripts/ directory before running.\n');

  for (const [translation, file] of Object.entries(TRANSLATION_FILES)) {
    await seedTranslation(translation, `./${file}`);
  }

  console.log('\nDone!');
}

main().catch(console.error);
