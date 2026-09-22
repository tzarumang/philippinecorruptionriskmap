import type { Provenance as ProvenanceData } from '../../features/lgu/data';

/**
 * Provenance footer (FR-13, G2).
 *
 * Shows the exact snapshot the data on the page came from. The checksum is
 * displayed, not hidden: it is what makes "running the scorer against this
 * snapshot reproduces this result" a checkable claim rather than a promise.
 */
export function Provenance({ data }: { data: ProvenanceData | null }) {
  if (!data) return null;

  const retrieved = new Date(data.retrievedAt);

  return (
    <section className="provenance" aria-labelledby="provenance-heading">
      <strong id="provenance-heading">Where this data came from</strong>
      <dl>
        <dt>Source</dt>
        <dd>{data.sourceUrls[0] ?? data.sourceId}</dd>

        <dt>Retrieved</dt>
        <dd>
          <time dateTime={data.retrievedAt}>
            {retrieved.toLocaleString('en-PH', {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'Asia/Manila',
            })}{' '}
            (Asia/Manila)
          </time>
        </dd>

        {data.dataVintage ? (
          <>
            <dt>Data vintage</dt>
            <dd>{data.dataVintage}</dd>
          </>
        ) : null}

        <dt>Records</dt>
        <dd>{data.recordCount.toLocaleString('en-PH')}</dd>

        <dt>Checksum</dt>
        <dd>{data.checksum}</dd>
      </dl>
    </section>
  );
}
