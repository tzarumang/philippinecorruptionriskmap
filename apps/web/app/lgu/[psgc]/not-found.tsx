import Link from 'next/link';

export default function LguNotFound() {
  return (
    <>
      <h1>No such locality</h1>
      <p className="lede">
        That PSGC code is not in the geographic spine. Codes are 10 digits, e.g.{' '}
        <code>0102800000</code> for Ilocos Norte.
      </p>
      <p>
        A code that used to be valid may have been superseded — the PSA
        reassigns codes when localities split, merge or are renamed.
      </p>
      <p>
        <Link href="/">Back to all localities</Link>
      </p>
    </>
  );
}
