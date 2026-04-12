/**
 * seed-kjv-clean.js
 * Reseeds KJV using thiagobodruk/bible en_kjv.json — clean text, no Strong's numbers, no footnotes.
 *
 * Usage: node scripts/seed-kjv-clean.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

const URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json';

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

async function main() {
  console.log('Reseeding KJV from thiagobodruk (clean text)...');

  const res = await fetch(URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const bibleData = await res.json();

  // thiagobodruk format: array of books, each with chapters array, each chapter is array of verse strings
  const rows = [];
  for (let bookIdx = 0; bookIdx < bibleData.length; bookIdx++) {
    const bookName = BOOK_NAMES[bookIdx];
    const chapters = bibleData[bookIdx].chapters;
    for (let chIdx = 0; chIdx < chapters.length; chIdx++) {
      const verses = chapters[chIdx];
      for (let vIdx = 0; vIdx < verses.length; vIdx++) {
        rows.push({
          translation: 'KJV',
          book: bookName,
          chapter: chIdx + 1,
          verse: vIdx + 1,
          text: verses[vIdx],
        });
      }
    }
  }

  console.log(`Prepared ${rows.length.toLocaleString()} verses. Inserting...`);

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase
      .from('bible_verses')
      .upsert(rows.slice(i, i + BATCH), { onConflict: 'translation,book,chapter,verse' });
    if (error) { console.error('Insert error:', error.message); return; }
    inserted += Math.min(BATCH, rows.length - i);
    process.stdout.write(`  ${inserted.toLocaleString()} / ${rows.length.toLocaleString()}\r`);
  }

  console.log(`\n✓ KJV reseeded cleanly — ${rows.length.toLocaleString()} verses`);
}

main().catch(console.error);
