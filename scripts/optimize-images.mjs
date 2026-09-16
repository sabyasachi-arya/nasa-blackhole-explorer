/**
 * Downloads each record's `imageUrl` once and writes small, self-hosted WebP
 * renditions to public/images, then sets `localImage` on the record.
 *
 * Why: hotlinked Wikimedia thumbnails are rate-limited (HTTP 429), which hits
 * phones hardest — a card grid fires dozens of requests at once, often from a
 * shared carrier IP. Some originals are also 1.5 MB PNG/GIFs. Serving our own
 * 480px / 960px WebP files fixes both.
 *
 * Run after `npm run enrich:images`:  npm run optimize:images
 *   --force   regenerate files that already exist
 */
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, '..', 'src', 'data', 'blackholes.json');
const OUT = join(HERE, '..', 'public', 'images');
const UA = 'NASA-BlackHole-Explorer/1.0 (educational project)';
const FORCE = process.argv.includes('--force');

/** Rendition widths; keep in sync with IMAGE_WIDTHS in src/components/SmartImage.tsx. */
const WIDTHS = [480, 720, 960];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (path) => access(path).then(() => true, () => false);

const slugify = (record) =>
  `${record.id}-${record.name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Wikimedia rate-limits aggressively, so honour Retry-After and back off. */
async function download(url, attempt = 0) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (res.status === 429 && attempt < 6) {
    const retryAfter = Number(res.headers.get('retry-after')) || 0;
    await sleep(Math.max(retryAfter * 1000, 3000 * 2 ** attempt));
    return download(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

await mkdir(OUT, { recursive: true });
const records = JSON.parse(await readFile(DATA, 'utf8'));
let done = 0;

for (const record of records) {
  if (!record.imageUrl) {
    delete record.localImage;
    continue;
  }

  const slug = slugify(record);
  const files = WIDTHS.map((w) => join(OUT, `${slug}-${w}.webp`));
  if (!FORCE && (await Promise.all(files.map(exists))).every(Boolean)) {
    record.localImage = slug;
    done += 1;
    console.log(`  have  ${record.name}`);
    continue;
  }

  try {
    const source = await download(record.imageUrl);
    for (const [i, width] of WIDTHS.entries()) {
      // First frame only for animated GIFs; never upscale small originals.
      await sharp(source, { animated: false })
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 74, effort: 5 })
        .toFile(files[i]);
    }
    record.localImage = slug;
    done += 1;
    console.log(`   ok   ${record.name}  ->  ${slug}`);
  } catch (err) {
    console.log(`  fail  ${record.name}: ${err.message}`);
  }
  await sleep(1200);
}

await writeFile(DATA, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
console.log(`\nSelf-hosted ${done}/${records.filter((r) => r.imageUrl).length} images -> ${OUT}`);
