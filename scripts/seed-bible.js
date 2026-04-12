/**
 * seed-bible.js
 * Seeds Bible translations into the bible_verses table using
 * public-domain data from scrollmapper/bible_databases on GitHub.
 *
 * Translations seeded (stored under the app's internal names):
 *   KJV  → KJV (King James Version, 1769)
 *   NIV  → BSB (Berean Standard Bible — modern, freely licensed)
 *   ESV  → ASV (American Standard Version — accurate, public domain)
 *   NLT  → BBE (Bible in Basic English — readable, public domain)
 *   NKJV → AKJV (Authorized KJV update — public domain)
 *
 * Usage:
 *   node scripts/seed-bible.js          # seeds all 5
 *   node scripts/seed-bible.js KJV      # seeds one by name
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

const BASE = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json';

// Map app translation name → GitHub filename
const TRANSLATIONS = {
  KJV:  'KJV.json',
  NIV:  'BSB.json',
  ESV:  'ASV.json',
  NLT:  'BBE.json',
  NKJV: 'AKJV.json',
};

async function fetchJSON(filename) {
  const url = `${BASE}/${filename}`;
  process.stdout.write(`  Downloading ${filename}... `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  console.log('done');
  return data;
}

async function seedTranslation(appName, filename) {
  console.log(`\n── ${appName} (${filename}) ──────────────────────`);

  let bibleData;
  try {
    bibleData = await fetchJSON(filename);
  } catch (e) {
    console.error(`  ✗ Download failed: ${e.message}`);
    return;
  }

  // scrollmapper format: { translation: {...}, books: [{ name, chapters: [{ chapter, verses: [{ verse, text }] }] }] }
  const books = bibleData.books ?? bibleData;
  const rows = [];

  for (const book of books) {
    const bookName = book.name;
    for (const ch of book.chapters ?? []) {
      const chapter = ch.chapter;
      for (const v of ch.verses ?? []) {
        rows.push({
          translation: appName,
          book: bookName,
          chapter,
          verse: v.verse,
          text: v.text,
        });
      }
    }
  }

  console.log(`  Prepared ${rows.length.toLocaleString()} verses. Inserting in batches of 500...`);

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
    process.stdout.write(`  ${inserted.toLocaleString()} / ${rows.length.toLocaleString()}\r`);
  }

  console.log(`  ✓ ${appName} seeded — ${rows.length.toLocaleString()} verses          `);
}

async function main() {
  console.log('Yoke Bible Seeder');
  console.log('=================');

  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
    console.error('✗ Missing EXPO_PUBLIC_SUPABASE_URL in .env.local');
    process.exit(1);
  }

  // Optional: pass translation names as args (e.g. node seed-bible.js KJV NIV)
  const args = process.argv.slice(2).map(a => a.toUpperCase());
  const toSeed = args.length > 0
    ? Object.entries(TRANSLATIONS).filter(([name]) => args.includes(name))
    : Object.entries(TRANSLATIONS);

  if (toSeed.length === 0) {
    console.error(`✗ Unknown translation(s): ${args.join(', ')}`);
    console.error(`  Valid options: ${Object.keys(TRANSLATIONS).join(', ')}`);
    process.exit(1);
  }

  for (const [appName, filename] of toSeed) {
    await seedTranslation(appName, filename);
  }

  console.log('\nAll done!');
}

main().catch(console.error);
