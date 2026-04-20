/**
 * Seed loader — Sprint 1 parser STUB for the first 10 rows (E2-T2 stub).
 *
 * Scope: parse the first 10 activity blocks from
 * `docs/Business Agility Standard Work.txt` into `CatalogEntry` drafts with:
 *
 *   - id                        (stable: `cat_${activityNumber}_<slug>`)
 *   - activityNumber            (integer from the source row heading)
 *   - name                      (activity name line)
 *   - focusArea                 (source column; "Continuous Improvement" rows map to 'CONTINUOUS_IMPROVEMENT')
 *   - defaultDurationMinutes    (source hours × 60, integer)
 *   - procedure                 (the ordered `a./b./c./...` steps captured in order)
 *   - sourceRef                 ('<file-path>:<lineNumber>')
 *
 * All other CatalogEntry fields (cadence, trigger, inputs, outputArtifact,
 * participants, bucket, isNonOptional, dependsOn, projectTypeBinding,
 * phaseBinding, appliesToRoles) ship in Sprint 2 as part of E2-T4/T5/T6.
 * We leave those fields **null** (or the empty array for list-valued fields
 * that must be iterable) so downstream services can read them without
 * special-casing `undefined`. DELIVERY_PLAN Sprint-1 acceptance: "Leave as
 * `null`" — kept verbatim.
 *
 * Node-only read path: uses `node:fs` to load the source file. The repo is
 * browser-portable at runtime because this parser only runs at build/seed
 * time (the seeded output later lands as a static JSON bundle).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/** Number of rows this Sprint-1 stub produces. */
export const STUB_ROW_LIMIT = 10;

/** Location of the source file relative to this module. */
function defaultSourcePath() {
  const here = dirname(fileURLToPath(import.meta.url));
  // /js/catalog/seed/source50.js → ../../../docs/Business Agility Standard Work.txt
  return resolve(here, '..', '..', '..', 'docs', 'Business Agility Standard Work.txt');
}

/**
 * Map a source focus-area column string to the typed FocusArea enum.
 * First 10 source rows are all 'Continuous Improvement'; we keep the
 * match table tiny and explicit so parser failures stay loud.
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
      return 'COMMUNICATION';
    case 'deep work':
      return 'DEEP_WORK';
    case 'dmaic':
      return 'DMAIC';
    case 'kaizen':
      return 'KAIZEN';
    case 'innovation':
      return 'INNOVATION';
    case 'ceremony':
      return 'CEREMONY';
    default:
      // Unknown focus-area values in the source file — fail loud rather than
      // silently defaulting. Sprint 2 will extend mapping.
      throw Object.assign(
        new Error(`source50: unrecognized focusArea '${raw}'`),
        { name: 'UNKNOWN_FOCUS_AREA', raw }
      );
  }
}

/**
 * Deterministic kebab-case slug for the id, stripping non-ascii-word chars.
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
 * Is `line` a procedure-step line? We accept:
 *   - a. …  b. …  c. …  (lowercase Latin letters, followed by . or ) )
 *   - A. …                (uppercase — source rows 12+ use mixed case)
 *   - i. …  ii. …        (lowercase Roman numerals, some sub-steps)
 *   - 1. …  2. …         (numbered preamble step — kept as-is)
 *   - §  or bullet lines (kept as continuation of the prior step's prose)
 *
 * Returns true for anything we consider a "step line worth keeping" in the
 * Sprint-1 stub. Sprint 2 will normalize sub-step indentation.
 *
 * @param {string} line
 * @returns {boolean}
 */
function looksLikeProcedureLine(line) {
  const t = line.trimStart();
  if (t.length === 0) return false;
  // a. / a) / A. / A)
  if (/^[A-Za-z][.)]\s/.test(t)) return true;
  // 1. / 2.
  if (/^\d+[.)]\s/.test(t)) return true;
  // i. / ii. / iv. — lowercase Roman numeral shorthand
  if (/^(i|ii|iii|iv|v|vi|vii|viii|ix|x)[.)]\s/i.test(t)) return true;
  return false;
}

/**
 * A blank-ish line we treat as a block separator. The source uses
 * lines that are " " (a single non-breaking/ASCII space) plus true empty
 * lines as record separators.
 *
 * @param {string} line
 * @returns {boolean}
 */
function isBlankLine(line) {
  return line.trim().length === 0;
}

/**
 * @typedef {object} ParsedBlock
 * @property {number} activityNumber
 * @property {number} headerLineNumber    // 1-indexed line of the activityNumber heading
 * @property {string} focusAreaRaw
 * @property {string} name
 * @property {number} hours               // source hours-per-sprint number
 * @property {string[]} procedure
 */

/**
 * Walk `lines` and collect up to `limit` activity blocks. Each block begins
 * with a pure-numeric line (the activity number), followed on the next three
 * non-blank lines by focusArea, name, and hours. Any subsequent non-blank
 * lines up to the next numeric-heading line are treated as procedure / prose.
 *
 * @param {string[]} lines
 * @param {number} limit
 * @returns {ParsedBlock[]}
 */
function extractBlocks(lines, limit) {
  /** @type {ParsedBlock[]} */
  const blocks = [];

  for (let i = 0; i < lines.length && blocks.length < limit; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    // Activity header: a pure-numeric line whose value is a small positive integer.
    if (!/^\d+$/.test(trimmed)) continue;

    const activityNumber = Number.parseInt(trimmed, 10);
    // The source file opens with the column-header row (no "1" line) and the first
    // activity number "1" appears partway through. The first 10 rows we care about
    // are 1..10 — reject obvious non-activity numbers early.
    if (activityNumber < 1 || activityNumber > 99) continue;

    // Expect the next three non-blank lines to be focusArea, name, hours.
    const nextNonBlank = [];
    let scan = i + 1;
    while (scan < lines.length && nextNonBlank.length < 3) {
      if (!isBlankLine(lines[scan])) nextNonBlank.push({ idx: scan, text: lines[scan] });
      scan++;
    }
    if (nextNonBlank.length < 3) break;

    const [focusAreaLine, nameLine, hoursLine] = nextNonBlank;
    const hours = Number.parseFloat(hoursLine.text.trim());
    if (!Number.isFinite(hours)) {
      // Malformed record — skip this candidate and keep scanning.
      continue;
    }

    // Procedure lines: every line from `hoursLine.idx + 1` up to the line
    // before the NEXT pure-numeric heading. We keep only lines that look
    // like procedure steps per `looksLikeProcedureLine`; prose / preamble
    // that doesn't match the step-letter pattern is dropped at this stub
    // stage — Sprint 2 does the richer fill in E2-T4.
    /** @type {string[]} */
    const procedure = [];
    let p = hoursLine.idx + 1;
    while (p < lines.length) {
      const pt = lines[p].trim();
      if (/^\d+$/.test(pt)) {
        const cand = Number.parseInt(pt, 10);
        if (cand >= 1 && cand <= 99 && cand !== activityNumber) break;
      }
      if (looksLikeProcedureLine(lines[p])) {
        procedure.push(lines[p].trim());
      }
      p++;
    }

    blocks.push({
      activityNumber,
      headerLineNumber: i + 1, // 1-indexed
      focusAreaRaw: focusAreaLine.text.trim(),
      name: nameLine.text.trim(),
      hours,
      procedure
    });

    // Resume scanning from the next potential header.
    i = p - 1;
  }

  return blocks;
}

/**
 * Parse a source-file string into up to `limit` CatalogEntry drafts.
 * Exposed for unit tests that want to inject custom source text.
 *
 * @param {string} sourceText
 * @param {string} sourceFilePath
 * @param {number} [limit=STUB_ROW_LIMIT]
 * @returns {import('../../domain/types.js').CatalogEntry[]}
 */
export function parseSourceText(sourceText, sourceFilePath, limit = STUB_ROW_LIMIT) {
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
      defaultDurationMinutes: Math.round(b.hours * 60),
      procedure: b.procedure,
      sourceRef: `${sourceFilePath}:${b.headerLineNumber}`,

      // ---- Fields deferred to Sprint 2 (E2-T4/T5/T6/T7/T8) ----
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

      // Seeded defaults that are stable across sprints:
      enabledByUser: true,
      version: 1
    };
    return draft;
  });
}

/**
 * Sprint-1 entry point. Reads the real source file and returns 10 drafts.
 *
 * @param {{sourceFilePath?: string}} [opts]
 * @returns {import('../../domain/types.js').CatalogEntry[]}
 */
export function parseSource10({ sourceFilePath } = {}) {
  const path = sourceFilePath ?? defaultSourcePath();
  const text = readFileSync(path, 'utf8');
  return parseSourceText(text, path, STUB_ROW_LIMIT);
}

export default parseSource10;
