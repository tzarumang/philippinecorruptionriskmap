/**
 * The standing disclaimer (FR-15).
 *
 * Required on the map, every LGU profile, every clan view, every export file
 * header and every API response envelope. It is deliberately a plain block:
 * not dismissible, not a modal, not small grey footer text.
 *
 * The wording is subject to review by Philippine counsel before launch and
 * should not be edited casually — the risk-not-allegation framing is the
 * platform's main legal protection, not a formality.
 */
export function Disclaimer() {
  return (
    <aside className="disclaimer" role="note" aria-label="How to read this data">
      <strong>Risk is not an allegation.</strong>
      These are public procurement records, presented as published. Nothing here
      is a finding, an accusation, or evidence of wrongdoing by any person,
      office or company. Every figure links to the record it came from, and
      every entity named has a right of reply.
    </aside>
  );
}
