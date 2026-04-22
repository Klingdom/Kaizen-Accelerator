/**
 * OutputArtifactDialog — Sprint 5 P0-T6.
 *
 * Pure render. Returns an HTML string for a modal bound to a
 * CatalogEntry's `outputArtifact.schema`.
 *
 * Supported schemas (per ARCHITECTURE §2.2 ArtifactSchema enum):
 *   TEXT       → <textarea>
 *   TWO_LIST   → two side-by-side textareas ("left" / "right" lines)
 *   NUMERIC    → <input type=number> + unit label
 *   DOCUMENT   → URL + title fields
 *   CHART      → URL + title fields
 *
 * UI convenience only; the authoritative validation is in
 * `ActivityService.close()` which re-parses + validates the submitted
 * ref. Here we only render the form skeleton.
 *
 * All dialog submit / cancel / input events go through delegated
 * data-action attributes — no direct listeners.
 */

import { esc } from '../mount.js';

export const DIALOG_TITLES = Object.freeze({
  TEXT: 'Capture the output',
  TWO_LIST: 'Capture two lists',
  NUMERIC: 'Record the measurement',
  DOCUMENT: 'Attach a document',
  CHART: 'Attach a chart'
});

/**
 * Build the inner HTML for a given schema. Returns the field markup.
 *
 * @param {string} schema
 * @param {{name?: string, unit?: string}} artifactDef
 * @param {string} activityId
 * @returns {string}
 */
function renderFields(schema, artifactDef, activityId) {
  const name = artifactDef?.name ?? 'Output';
  switch (schema) {
    case 'TEXT':
      return `<label class="oad-label">${esc(name)}
        <textarea class="oad-text" name="value" rows="5" placeholder="${esc(name)}" required></textarea>
      </label>`;
    case 'TWO_LIST':
      return `<div class="oad-two-list">
        <label class="oad-label oad-left">What went well
          <textarea class="oad-text" name="left" rows="4" placeholder="One per line" required></textarea>
        </label>
        <label class="oad-label oad-right">To improve
          <textarea class="oad-text" name="right" rows="4" placeholder="One per line" required></textarea>
        </label>
      </div>`;
    case 'NUMERIC': {
      const unit = artifactDef?.unit ?? 'units';
      return `<label class="oad-label">${esc(name)}
        <input class="oad-number" type="number" name="amount" step="any" required />
        <span class="oad-unit">${esc(unit)}</span>
      </label>`;
    }
    case 'DOCUMENT':
    case 'CHART':
      return `<label class="oad-label">Title
        <input class="oad-input" type="text" name="title" required />
      </label>
      <label class="oad-label">URL
        <input class="oad-input" type="url" name="url" required />
      </label>`;
    default:
      return `<p class="oad-unknown">Unknown schema: ${esc(schema)}</p>`;
  }
}

/**
 * OutputArtifactDialog component.
 *
 * @param {{
 *   activityId: string,
 *   schema: string,
 *   artifactDef?: {name?: string, unit?: string, schema?: string}
 * }} props
 * @returns {string}
 */
export function OutputArtifactDialog(props = {}) {
  const activityId = props.activityId ?? '';
  const schema = props.schema ?? 'TEXT';
  const artifactDef = props.artifactDef ?? {};
  const title = DIALOG_TITLES[schema] ?? 'Close activity';
  const payload = esc(JSON.stringify({ activityId, schema }));

  return `<section class="oad-modal" role="dialog" aria-modal="true" data-dialog="close-artifact" data-activity-id="${esc(activityId)}" data-schema="${esc(schema)}">
  <form class="oad-form" data-action="SUBMIT_CLOSE_DIALOG" data-payload='${payload}'>
    <header class="oad-header"><h2 class="oad-title">${esc(title)}</h2></header>
    ${renderFields(schema, artifactDef, activityId)}
    <footer class="oad-footer">
      <button type="button" class="oad-cancel" data-action="CLOSE_CLOSE_DIALOG">Cancel</button>
      <button type="submit" class="oad-submit">Save &amp; Close</button>
    </footer>
  </form>
</section>`;
}

/**
 * Parse a FormData-like object (name → value) into an OutputArtifactRef
 * value shape that matches `ArtifactSchema`. Used by app.js to turn the
 * modal submission into the payload for `ActivityService.close()`.
 *
 * @param {string} schema
 * @param {Record<string, string>} fields
 * @returns {{schema: string, value: any}}
 */
export function parseArtifactFields(schema, fields = {}) {
  switch (schema) {
    case 'TEXT':
      return { schema, value: String(fields.value ?? '') };
    case 'TWO_LIST': {
      const left = String(fields.left ?? '')
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      const right = String(fields.right ?? '')
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      return { schema, value: { left, right } };
    }
    case 'NUMERIC': {
      const amount = Number(fields.amount);
      return { schema, value: { amount, unit: fields.unit ?? null } };
    }
    case 'DOCUMENT':
    case 'CHART':
      return {
        schema,
        value: {
          url: String(fields.url ?? ''),
          title: String(fields.title ?? '')
        }
      };
    default:
      return { schema, value: fields };
  }
}

export default OutputArtifactDialog;
