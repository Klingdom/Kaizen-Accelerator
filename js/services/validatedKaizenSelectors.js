/**
 * validatedKaizenSelectors.js — pure analytics selectors for the Validated
 * Kaizen Portfolio page (E14 / C-PM-2).
 *
 * All exports are pure functions: no DOM access, no clock calls (except where
 * a `todayIso` is injected), no side effects.
 *
 * TODO(E15): tighten `isValidatedKaizen` to also require
 *   `remeasurement.statisticallySignificant === true` once E15 ships.
 */

// ---------------------------------------------------------------------------
// §2.1 Validated-Kaizen predicate
// ---------------------------------------------------------------------------

/**
 * Returns true when a Kaizen meets the MVP validated-delta criteria:
 *   - state === 'CLOSED'
 *   - closeKind is 'SUCCESS' or 'PARTIAL'
 *   - not abandoned
 *   - has a non-null Remeasurement
 *
 * @param {object|null|undefined} kaizen
 * @param {object|null|undefined} remeasurement
 * @returns {boolean}
 */
export function isValidatedKaizen(kaizen, remeasurement) {
  if (!kaizen || typeof kaizen !== 'object') return false;
  if (kaizen.state !== 'CLOSED') return false;
  if (kaizen.closeKind !== 'SUCCESS' && kaizen.closeKind !== 'PARTIAL') return false;
  if (kaizen.abandoned === true) return false;
  if (remeasurement == null) return false;
  return true;
}

// ---------------------------------------------------------------------------
// §6 — summarizeValidated
// ---------------------------------------------------------------------------

/**
 * Summarise the Validated Kaizen universe (pre-filter).
 *
 * @param {object[]} kaizens
 * @param {Record<string, object>} remeasurementsByKaizenId
 * @returns {{count: number, totalBenefitsDollars: number, byCloseKind: {SUCCESS: number, PARTIAL: number}}}
 */
export function summarizeValidated(kaizens, remeasurementsByKaizenId) {
  const byCloseKind = { SUCCESS: 0, PARTIAL: 0 };
  let count = 0;
  let totalBenefitsDollars = 0;

  if (!Array.isArray(kaizens)) {
    return { count, totalBenefitsDollars, byCloseKind };
  }

  const rmMap =
    remeasurementsByKaizenId && typeof remeasurementsByKaizenId === 'object'
      ? remeasurementsByKaizenId
      : {};

  for (const k of kaizens) {
    if (!k) continue;
    const rm = rmMap[k.id] ?? null;
    if (!isValidatedKaizen(k, rm)) continue;
    count++;
    const benefit = k.annualBenefitsDollars;
    if (typeof benefit === 'number' && Number.isFinite(benefit)) {
      totalBenefitsDollars += benefit;
    }
    if (k.closeKind === 'SUCCESS') byCloseKind.SUCCESS++;
    if (k.closeKind === 'PARTIAL') byCloseKind.PARTIAL++;
  }

  return { count, totalBenefitsDollars, byCloseKind };
}

// ---------------------------------------------------------------------------
// §6 — filterValidated
// ---------------------------------------------------------------------------

/**
 * Return the subset of kaizens that are Validated AND match all active
 * filter slots. Sorted by closedAt descending.
 *
 * @param {object[]} kaizens
 * @param {Record<string, object>} remeasurementsByKaizenId
 * @param {{closeKinds?: Set<string>, projectTypes?: Set<string>, leadUserId?: string|null}} filterSet
 * @returns {object[]}
 */
export function filterValidated(kaizens, remeasurementsByKaizenId, filterSet) {
  if (!Array.isArray(kaizens)) return [];

  const rmMap =
    remeasurementsByKaizenId && typeof remeasurementsByKaizenId === 'object'
      ? remeasurementsByKaizenId
      : {};

  const closeKinds =
    filterSet && filterSet.closeKinds instanceof Set
      ? filterSet.closeKinds
      : null;
  const projectTypes =
    filterSet && filterSet.projectTypes instanceof Set
      ? filterSet.projectTypes
      : null;
  const leadUserId =
    filterSet && typeof filterSet.leadUserId === 'string'
      ? filterSet.leadUserId
      : null;

  const out = [];
  for (const k of kaizens) {
    if (!k) continue;
    const rm = rmMap[k.id] ?? null;
    if (!isValidatedKaizen(k, rm)) continue;
    if (closeKinds && closeKinds.size > 0 && !closeKinds.has(k.closeKind)) continue;
    if (projectTypes && projectTypes.size > 0 && !projectTypes.has(k.projectType ?? 'AD_HOC')) continue;
    if (leadUserId !== null && k.implementationLeadUserId !== leadUserId) continue;
    out.push(k);
  }

  // Sort by closedAt desc (most recent first)
  return out.sort((a, b) => {
    const ax = a.closedAt ?? '';
    const bx = b.closedAt ?? '';
    if (ax < bx) return 1;
    if (ax > bx) return -1;
    return 0;
  });
}

// ---------------------------------------------------------------------------
// §2.5 / §6 — kaizensToCsv (RFC 4180)
// ---------------------------------------------------------------------------

/**
 * Serialize an ordered array of Validated Kaizens to RFC 4180 CSV.
 * Header row is always included. Field order matches §2.5.
 *
 * @param {object[]} rows — pre-filtered, pre-sorted kaizens
 * @param {Record<string, object>} baselinesByKaizenId
 * @param {Record<string, object>} remeasurementsByKaizenId
 * @returns {string} — CRLF-terminated CSV
 */
export function kaizensToCsv(rows, baselinesByKaizenId, remeasurementsByKaizenId) {
  const HEADER = [
    'closedAt',
    'id',
    'title',
    'projectType',
    'closeKind',
    'baselineValue',
    'remeasurementValue',
    'deltaAbsolute',
    'deltaPercent',
    'implementationCostDollars',
    'annualBenefitsDollars',
    'financePartnerUserId'
  ];

  const rmMap =
    remeasurementsByKaizenId && typeof remeasurementsByKaizenId === 'object'
      ? remeasurementsByKaizenId
      : {};
  const blMap =
    baselinesByKaizenId && typeof baselinesByKaizenId === 'object'
      ? baselinesByKaizenId
      : {};

  const lines = [HEADER.map(csvCell).join(',')];

  for (const k of (Array.isArray(rows) ? rows : [])) {
    const rm = rmMap[k.id] ?? null;
    const bl = blMap[k.id] ?? null;
    // Finance-signed: DMAIC only — last roiProjections entry's financePartnerUserId
    let financePartnerId = '';
    if (
      k.projectType === 'DMAIC' &&
      Array.isArray(k.roiProjections) &&
      k.roiProjections.length > 0
    ) {
      const last = k.roiProjections[k.roiProjections.length - 1];
      if (last && last.financePartnerUserId != null) {
        financePartnerId = String(last.financePartnerUserId);
      }
    }
    const record = [
      k.closedAt ?? null,
      k.id ?? null,
      k.title ?? null,
      k.projectType ?? null,
      k.closeKind ?? null,
      bl ? (bl.value ?? null) : null,
      rm ? (rm.remeasurementValue ?? null) : null,
      rm ? (rm.deltaAbsolute ?? null) : null,
      rm ? (rm.deltaPercent ?? null) : null,
      k.implementationCostDollars ?? null,
      k.annualBenefitsDollars ?? null,
      financePartnerId || null
    ];
    lines.push(record.map(csvCell).join(','));
  }

  return lines.join('\r\n') + '\r\n';
}

/**
 * RFC 4180 minimal cell serializer.
 * null/undefined → empty string.
 * Numbers → String(n).
 * Strings containing `,`, `"`, `\r`, or `\n` → wrapped in quotes with internal quotes doubled.
 *
 * @param {*} value
 * @returns {string}
 */
function csvCell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\r') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// ---------------------------------------------------------------------------
// §6 — Filter query helpers (private helpers exported for tests)
// ---------------------------------------------------------------------------

const ALL_CLOSE_KINDS = ['SUCCESS', 'PARTIAL'];
const ALL_PROJECT_TYPES = [
  'KAIZEN_ACCELERATOR_30D',
  'KAIZEN_EVENT_90D',
  'DMAIC',
  'AD_HOC'
];

/**
 * Parse the filter query string portion of the hash into a filterSet.
 * Input: the raw hash string, e.g. `#insights/portfolio?closeKind=SUCCESS,PARTIAL&projectType=DMAIC&lead=user_42`
 *
 * @param {string} hash
 * @returns {{closeKinds: Set<string>, projectTypes: Set<string>, leadUserId: string|null}}
 */
export function parseFilterQuery(hash) {
  const defaultCloseKinds = new Set(ALL_CLOSE_KINDS);
  const defaultProjectTypes = new Set(ALL_PROJECT_TYPES);

  if (typeof hash !== 'string' || !hash.includes('?')) {
    return { closeKinds: defaultCloseKinds, projectTypes: defaultProjectTypes, leadUserId: null };
  }

  const qIndex = hash.indexOf('?');
  const qs = hash.slice(qIndex + 1);
  const params = new URLSearchParams(qs);

  // closeKind
  let closeKinds;
  if (params.has('closeKind')) {
    const vals = params.get('closeKind').split(',').map((s) => s.trim()).filter(Boolean);
    const valid = vals.filter((v) => ALL_CLOSE_KINDS.includes(v));
    closeKinds = valid.length > 0 ? new Set(valid) : defaultCloseKinds;
  } else {
    closeKinds = defaultCloseKinds;
  }

  // projectType
  let projectTypes;
  if (params.has('projectType')) {
    const vals = params.get('projectType').split(',').map((s) => s.trim()).filter(Boolean);
    const valid = vals.filter((v) => ALL_PROJECT_TYPES.includes(v));
    projectTypes = valid.length > 0 ? new Set(valid) : defaultProjectTypes;
  } else {
    projectTypes = defaultProjectTypes;
  }

  // lead
  const leadUserId = params.has('lead') ? (params.get('lead') || null) : null;

  return { closeKinds, projectTypes, leadUserId };
}

/**
 * Serialize a filterSet back to a query string (without the leading `?`).
 * Omits keys that match the defaults (to keep URLs clean).
 *
 * @param {{closeKinds: Set<string>, projectTypes: Set<string>, leadUserId: string|null}} filterSet
 * @returns {string}
 */
export function serializeFilterQuery(filterSet) {
  const parts = [];

  const ckArr = [...filterSet.closeKinds].sort();
  const ckDefault = [...ALL_CLOSE_KINDS].sort();
  if (ckArr.join(',') !== ckDefault.join(',')) {
    parts.push('closeKind=' + ckArr.join(','));
  }

  const ptArr = [...filterSet.projectTypes].sort();
  const ptDefault = [...ALL_PROJECT_TYPES].sort();
  if (ptArr.join(',') !== ptDefault.join(',')) {
    parts.push('projectType=' + ptArr.join(','));
  }

  if (filterSet.leadUserId) {
    parts.push('lead=' + filterSet.leadUserId);
  }

  return parts.join('&');
}
