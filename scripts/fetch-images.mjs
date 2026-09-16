/**
 * Populates `imageUrl` / `imageCredit` in src/data/blackholes.json by resolving
 * each record's Wikipedia imagery through the Wikimedia REST API.
 *
 * Wikimedia hashes the storage path of every file, so URLs cannot be guessed —
 * they have to be resolved. Run with:  npm run enrich:images
 *   --force   re-resolve records that already have an imageUrl
 *
 * Many articles lead with a constellation map or a data plot rather than a
 * picture of the object, so candidates are filtered and (where needed) steered
 * by an explicit override in OVERRIDES below. Records that still end up without
 * a usable image are left bare; the UI falls back to a procedurally rendered
 * accretion disc.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, '..', 'src', 'data', 'blackholes.json');
const UA = 'NASA-BlackHole-Explorer/1.0 (educational project)';
const FORCE = process.argv.includes('--force');

/** Record name -> substring of the preferred Commons file title. */
const OVERRIDES = {
  'Cygnus X-1': 'Chandra_image_of_Cygnus_X-1',
  GW150914: 'MergingBlackHoles',
};

/** Constellation maps, light curves, spectra and schematic diagrams. */
const REJECT = /_IAU|LightCurve|light_curve|spectrum|_chart|diagram|_map|Commons-logo|_seal|logo/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (url) => (url ? url.split('?')[0] : undefined);

/** Ask Wikimedia for a ~960px-wide rendition of a thumbnail URL. */
const widen = (url) => url.replace(/([/-])(\d+)px-/, '$1960px-');

/** The API rate-limits aggressively, so back off and retry rather than give up. */
async function getJson(endpoint, attempt = 0) {
  const res = await fetch(endpoint, { headers: { 'User-Agent': UA, accept: 'application/json' } });
  if (res.status === 429 && attempt < 5) {
    await sleep(2000 * 2 ** attempt);
    return getJson(endpoint, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const api = (route, title) =>
  `https://en.wikipedia.org/api/rest_v1/page/${route}/${encodeURIComponent(title)}`;

async function resolveImage(record) {
  const title = record.wikipediaTitle;
  const override = OVERRIDES[record.name];

  // 1. Gather every raster image used on the article.
  let candidates = [];
  try {
    const media = await getJson(api('media-list', title));
    candidates = (media.items ?? [])
      .filter((item) => item.type === 'image' && item.srcset?.[0]?.src)
      .map((item) => ({
        file: item.title ?? '',
        // srcset entries are protocol-relative.
        url: widen(clean(`https:${item.srcset[0].src}`.replace('https://https://', 'https://'))),
      }));
  } catch {
    /* fall through to the summary thumbnail */
  }

  const usable = candidates.filter((c) => !REJECT.test(c.file));

  // 2. An explicit override always wins.
  if (override) {
    const hit = usable.find((c) => c.file.includes(override)) ?? candidates.find((c) => c.file.includes(override));
    if (hit) return { url: hit.url, file: hit.file };
  }

  // 3. Otherwise prefer the article's lead image, if it isn't a diagram.
  try {
    const summary = await getJson(api('summary', title));
    const lead = clean(summary.thumbnail?.source);
    if (lead && !REJECT.test(lead)) return { url: widen(lead), file: title };
  } catch {
    /* fall through */
  }

  // 4. Last resort: the first non-diagram image on the page.
  return usable.length ? { url: usable[0].url, file: usable[0].file } : null;
}

const records = JSON.parse(await readFile(DATA, 'utf8'));
let resolved = 0;

for (const record of records) {
  if (!record.wikipediaTitle) {
    console.log(`  skip  ${record.name} (no wikipediaTitle)`);
    continue;
  }
  // Resumable: a previous run may have been cut short by rate limiting.
  if (record.imageUrl && !FORCE) {
    resolved += 1;
    console.log(`  have  ${record.name}`);
    continue;
  }

  try {
    const image = await resolveImage(record);
    if (image) {
      record.imageUrl = image.url;
      record.imageCredit = `Wikimedia Commons via English Wikipedia — ${image.file.replace(/^File:/, '').replace(/_/g, ' ')}`;
      resolved += 1;
      console.log(`   ok   ${record.name}  <-  ${image.url.split('/').pop()}`);
    } else {
      delete record.imageUrl;
      delete record.imageCredit;
      console.log(`  none  ${record.name} (no usable image)`);
    }
  } catch (err) {
    console.log(`  fail  ${record.name}: ${err.message}`);
  }
  // Be a good citizen with a shared, free API.
  await sleep(900);
}

await writeFile(DATA, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
console.log(`\nResolved ${resolved}/${records.length} images -> ${DATA}`);
