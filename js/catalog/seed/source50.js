/**
 * Seed loader — E2-T2 full 50-row BAM parser.
 *
 * Scope (v2 Sprint 2): parse EVERY numbered activity block from
 * `docs/Business Agility Standard Work.txt` into `CatalogEntry` drafts.
 *
 * The source file numbers rows 1..50 but:
 *   - Row 17 is absent (RESERVED per CATALOG_GAPS §F.1).
 *   - Rows 19 and 20 have focus+name but no `hours per sprint` line and no
 *     `procedure` block — they are completed by CATALOG_GAPS §A.2 / §A.4.
 *
 * We therefore return 47 numbered drafts with full hours+procedure data
 * (rows 1..16, 18, 21..50) AND 2 skeleton drafts (rows 19 and 20) where
 * `defaultDurationMinutes` and `procedure` are left null for §A fill-in.
 * Row 17 is intentionally NOT produced (no record in source).
 *
 * Parsed-row fields:
 *   - id                        (stable: `cat_${activityNumber}_<slug>`)
 *   - activityNumber            (integer from the source row heading)
 *   - name                      (activity name line)
 *   - focusArea                 (mapped from the focus-area column)
 *   - defaultDurationMinutes    (source hours × 60, integer; null on skeletons)
 *   - procedure                 (the ordered `a./b./c./…` steps; null on skeleton)
 *   - sourceRef                 ('<file-path>:<lineNumber>')
 *
 * All cross-cutting metadata (cadence, trigger, inputs, outputArtifact,
 * participants, bucket, isNonOptional, dependsOn, projectTypeBinding,
 * phaseBinding, appliesToRoles) is left `null` here — populated by later
 * seed-pipeline steps: fillGaps (§A–§D), bulkFill (§E), bucketMap (§H.1),
 * markNonOptional (§3.4), dmaicDag (§J).
 *
 * Node-only read path (node:fs); runs at build/seed time only.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/** Number of rows the Sprint-1 stub produced. Kept for back-compat. */
export const STUB_ROW_LIMIT = 10;

/**
 * Full-source numbered rows we expect to produce drafts for. Excludes #17
 * (reserved — see CATALOG_GAPS §F.1). Includes #19 and #20 as skeletons.
 */
export const EXPECTED_NUMBERED_ROWS = Object.freeze(
  [
    ...Array.from({ length: 16 }, (_, i) => i + 1), // 1..16
    18,
    19,
    20,
    ...Array.from({ length: 30 }, (_, i) => i + 21) // 21..50
  ]
);
export const EXPECTED_ROW_COUNT = EXPECTED_NUMBERED_ROWS.length; // 49

/** Location of the source file relative to this module. */
function defaultSourcePath() {
  const here = dirname(fileURLToPath(import.meta.url));
  // /js/catalog/seed/source50.js → ../../../docs/Business Agility Standard Work.txt
  return resolve(here, '..', '..', '..', 'docs', 'Business Agility Standard Work.txt');
}

/**
 * Map a source focus-area column string to the typed FocusArea enum. The
 * §2.2 type set includes CONTINUOUS_IMPROVEMENT, COMMUNICATION, DMAIC,
 * KAIZEN, INNOVATION, CEREMONY, DEEP_WORK. DMAIC/Kaizen columns in the
 * source read "DMAIC Project Work" / "Kaizen Project Work" — normalized
 * to their enum values here.
 *
 * @param {string} raw
 * @returns {string}
 */
function mapFocusArea(raw) {
  const normalized = raw.trim().toLowerCase();
  switch (normalized) {
    case 'continuous improvement':
      return 'CONTINUOUS_IMPROVEMENT';
    case 'communication':
    case 'communications':
      return 'COMMUNICATION';
    case 'deep work':
      return 'DEEP_WORK';
    case 'dmaic':
    case 'dmaic project work':
      return 'DMAIC';
    case 'kaizen':
    case 'kaizen project work':
      return 'KAIZEN';
    case 'innovation':
      return 'INNOVATION';
    case 'ceremony':
      return 'CEREMONY';
    default:
      throw Object.assign(new Error(`source50: unrecognized focusArea '${raw}'`), {
        name: 'UNKNOWN_FOCUS_AREA',
        raw
      });
  }
}

/** Accepted set of raw focus-area strings — used to detect block boundaries. */
const KNOWN_FOCUS_AREAS = new Set([
  'continuous improvement',
  'communication',
  'communications',
  'deep work',
  'dmaic',
  'dmaic project work',
  'kaizen',
  'kaizen project work',
  'innovation',
  'ceremony'
]);

/**
 * Deterministic kebab/snake-case slug for the id.
 *
 * @param {string} name
 * @returns {string}
 */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

/**
 * A procedure-step line? Lowercase/uppercase letters, Roman numerals, or
 * 1./2. numbered preambles all accepted. Sub-step indentation is not
 * normalized here; Sprint-3 composer renderers can re-indent.
 *
 * @param {string} line
 * @returns {boolean}
 */
function looksLikeProcedureLine(line) {
  const t = line.trimStart();
  if (t.length === 0) return false;
  if (/^[A-Za-z][.)]\s/.test(t)) return true;
  if (/^\d+[.)]\s/.test(t)) return true;
  if (/^(i|ii|iii|iv|v|vi|vii|viii|ix|x)[.)]\s/i.test(t)) return true;
  return false;
}

/**
 * @param {string} line
 */
function isBlankLine(line) {
  return line.trim().length === 0;
}

/**
 * True iff `line` is a pure positive integer in [1, 99]. Used as the
 * block-heading detector.
 *
 * @param {string} line
 * @returns {boolean}
 */
function isActivityHeader(line) {
  const t = line.trim();
  if (!/^\d+$/.test(t)) return false;
  const n = Number.parseInt(t, 10);
  return n >= 1 && n <= 99;
}

/**
 * @typedef {object} ParsedBlock
 * @property {number} activityNumber
 * @property {number} headerLineNumber
 * @property {string} focusAreaRaw
 * @property {string} name
 * @property {number|null} hours
 * @property {string[]|null} procedure
 */

/**
 * Walk `lines` and collect every activity block. An activity block begins
 * with a pure-numeric header line, followed (on the next non-blank line)
 * by a known focus-area, the activity name, and optionally the hours +
 * procedure. Rows without hours or procedure are emitted as skeletons.
 *
 * @param {string[]} lines
 * @param {number} [limit=Infinity]
 * @returns {ParsedBlock[]}
 */
function extractBlocks(lines, limit = Infinity) {
  /** @type {ParsedBlock[]} */
  const blocks = [];

  let i = 0;
  while (i < lines.length && blocks.length < limit) {
    if (!isActivityHeader(lines[i])) {
      i++;
      continue;
    }

    const activityNumber = Number.parseInt(lines[i].trim(), 10);
    const headerLineNumber = i + 1; // 1-indexed

    // Find the next non-blank line. Must be a known focus area for this to
    // be a real activity block (guards against stray digits in the file).
    let scan = i + 1;
    while (scan < lines.length && isBlankLine(lines[scan])) scan++;
    if (scan >= lines.length) break;
    const focusAreaRaw = lines[scan].trim();
    if (!KNOWN_FOCUS_AREAS.has(focusAreaRaw.toLowerCase())) {
      // Defensive: throw on unknown focus-area (keeps strict-parse guarantee).
      // Row 17 is absent from the source (never produces a header line);
      // any real header line is always followed by a known focus area.
      mapFocusArea(focusAreaRaw); // throws UNKNOWN_FOCUS_AREA
    }

    // Next non-blank line is the name.
    let nameIdx = scan + 1;
    while (nameIdx < lines.length && isBlankLine(lines[nameIdx])) nameIdx++;
    if (nameIdx >= lines.length) break;
    const name = lines[nameIdx].trim();

    // Next non-blank line is either hours (numeric) OR the focus-area of
    // the next activity block (signals that THIS activity has no hours).
    let hoursIdx = nameIdx + 1;
    while (hoursIdx < lines.length && isBlankLine(lines[hoursIdx])) hoursIdx++;

    /** @type {number|null} */
    let hours = null;
    /** @type {string[]|null} */
    let procedure = null;
    /** End index used when advancing `i`. */
    let advanceTo = nameIdx + 1;

    if (hoursIdx < lines.length) {
      const hoursCandidate = lines[hoursIdx].trim();
      const parsed = Number.parseFloat(hoursCandidate);
      const isNumeric = /^\d+(\.\d+)?$/.test(hoursCandidate);

      // Defensive: a pure integer that is ALSO a valid activity-header
      // number AND whose following non-blank line is a known focus area is
      // actually the NEXT activity's header — the current row is a skeleton.
      let lookalikeHeader = false;
      if (isNumeric && /^\d+$/.test(hoursCandidate) && isActivityHeader(hoursCandidate)) {
        let k = hoursIdx + 1;
        while (k < lines.length && isBlankLine(lines[k])) k++;
        if (k < lines.length && KNOWN_FOCUS_AREAS.has(lines[k].trim().toLowerCase())) {
          lookalikeHeader = true;
        }
      }

      if (isNumeric && Number.isFinite(parsed) && !lookalikeHeader) {
        hours = parsed;

        // Collect procedure lines from hoursIdx+1 until the next activity
        // header (or until a line that is a known focus-area immediately
        // after an activity header — signaling the next block starts).
        procedure = [];
        let p = hoursIdx + 1;
        while (p < lines.length) {
          if (isActivityHeader(lines[p])) break;
          // An unnumbered ceremony is a known-focus-area line followed by
          // a name line followed by hours — if we detect a known focus
          // area at a blank-separated boundary, treat it as the start of
          // a new block and stop here.
          if (
            isBlankLine(lines[p - 1] ?? '') &&
            KNOWN_FOCUS_AREAS.has(lines[p].trim().toLowerCase())
          ) {
            break;
          }
          if (looksLikeProcedureLine(lines[p])) {
            procedure.push(lines[p].trim());
          }
          p++;
        }
        advanceTo = p;
      } else {
        // Skeleton row — no hours; don't consume the focus-area of the
        // next block, just advance past the name.
        advanceTo = nameIdx + 1;
      }
    }

    blocks.push({
      activityNumber,
      headerLineNumber,
      focusAreaRaw,
      name,
      hours,
      procedure
    });

    i = advanceTo;
  }

  return blocks;
}

/**
 * Parse `sourceText` into CatalogEntry drafts. Exposed for unit tests that
 * want to inject synthetic text.
 *
 * @param {string} sourceText
 * @param {string} sourceFilePath
 * @param {number} [limit=Infinity]
 * @returns {import('../../domain/types.js').CatalogEntry[]}
 */
export function parseSourceText(sourceText, sourceFilePath, limit = Infinity) {
  const lines = sourceText.split(/\r\n|\r|\n/);
  const blocks = extractBlocks(lines, limit);

  return blocks.map((b) => {
    const id = `cat_${b.activityNumber}_${slugify(b.name)}`;
    /** @type {any} */
    const draft = {
      id,
      activityNumber: b.activityNumber,
      name: b.name,
      focusArea: mapFocusArea(b.focusAreaRaw),
      defaultDurationMinutes: b.hours !== null ? Math.round(b.hours * 60) : null,
      procedure: b.procedure,
      sourceRef: `${sourceFilePath}:${b.headerLineNumber}`,

      // ---- Deferred to later seed steps (§A–§D / §E / §H.1 / §J) ----
      cadence: null,
      trigger: null,
      inputs: null,
      outputArtifact: null,
      participants: null,
      bucket: null,
      isNonOptional: null,
      dependsOn: null,
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: null,

      // Stable seed defaults:
      enabledByUser: true,
      version: 1
    };
    return draft;
  });
}

/**
 * Sprint-1 STUB entry point — parses only the first 10 rows. Retained for
 * back-compat with the Sprint-1 tests. New callers should use `parseSource50`.
 *
 * @param {{sourceFilePath?: string}} [opts]
 * @returns {import('../../domain/types.js').CatalogEntry[]}
 */
export function parseSource10({ sourceFilePath } = {}) {
  const path = sourceFilePath ?? defaultSourcePath();
  const text = readFileSync(path, 'utf8');
  return parseSourceText(text, path, STUB_ROW_LIMIT);
}

/**
 * E2-T2 entry point — parses every numbered activity row in the source
 * file (49 rows produced; #17 absent; #19 and #20 as skeletons).
 *
 * @param {{sourceFilePath?: string}} [opts]
 * @returns {import('../../domain/types.js').CatalogEntry[]}
 */
export function parseSource50({ sourceFilePath } = {}) {
  const path = sourceFilePath ?? defaultSourcePath();
  const text = readFileSync(path, 'utf8');
  return parseSourceText(text, path);
}

export default parseSource50;
