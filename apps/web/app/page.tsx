import Link from 'next/link';
import { Disclaimer } from '../components/ui/Disclaimer';
import { Provenance } from '../components/ui/Provenance';
import { getLgusWithProjects, getProvenance } from '../features/lgu/data';

// Always render fresh while the data layer is still being stood up.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let lgus: Awaited<ReturnType<typeof getLgusWithProjects>> = [];
  let provenance = null;
  let failure: string | null = null;

  try {
    [lgus, provenance] = await Promise.all([
      getLgusWithProjects(),
      getProvenance('infrastructure'),
    ]);
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  }

  return (
    <>
      <h1>Infrastructure projects by locality</h1>
      <p className="lede">
        Every project below is a public DPWH contract record, joined to its
        locality through the Philippine Standard Geographic Code and shown with
        the snapshot it was read from.
      </p>

      <Disclaimer />

      {failure ? <SetupNotice detail={failure} /> : null}

      {!failure && lgus.length === 0 ? (
        <div className="empty">
          <p>
            No projects have been loaded yet. Run the ingestion, then load the
            snapshot into the database.
          </p>
        </div>
      ) : null}

      {lgus.length > 0 ? (
        <>
          <h2>Localities with attributed projects</h2>
          <div className="card-grid">
            {lgus.map((lgu) => (
              <Link key={lgu.code} href={`/lgu/${lgu.code}`} className="card">
                <span className="card-name">{lgu.name}</span>
                <span className="card-meta">
                  {lgu.level} · {lgu.projectCount.toLocaleString('en-PH')} project
                  {lgu.projectCount === 1 ? '' : 's'}
                </span>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      <Provenance data={provenance} />
    </>
  );
}

/**
 * Shown when the database is unreachable or empty.
 *
 * A real, actionable state rather than a stack trace — this is the first thing
 * a new contributor sees before their local stack is running.
 */
function SetupNotice({ detail }: { detail: string }) {
  return (
    <section className="setup">
      <h2>The database is not reachable yet</h2>
      <p>
        The ingestion layer runs independently of the database and writes
        snapshots to <code>data/snapshots/</code>. To serve them, start the
        local Supabase stack and load the latest snapshot:
      </p>
      <pre>
        <code>{`npx supabase start
npx supabase db reset            # applies migrations + RLS
npm run ingest -- --source=psgc
npm run ingest -- --source=infrastructure
npm run load                     # snapshot → Postgres`}</code>
      </pre>
      <p>
        Supabase is self-hosted for this project, so{' '}
        <code>supabase/migrations/</code> is the source of truth for schema and
        the stack needs Docker running.
      </p>
      <details>
        <summary>Underlying error</summary>
        <pre>
          <code>{detail}</code>
        </pre>
      </details>
    </section>
  );
}
