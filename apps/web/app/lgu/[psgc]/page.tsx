import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatCentavos } from '@pcrm/types/money';
import { Disclaimer } from '../../../components/ui/Disclaimer';
import { Provenance } from '../../../components/ui/Provenance';
import {
  getLgu,
  getProjectsForLgu,
  getProvenance,
  type ProjectRow,
} from '../../../features/lgu/data';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ psgc: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { psgc } = await params;
  const lgu = await getLgu(psgc).catch(() => null);

  return {
    title: lgu ? lgu.name : 'Locality',
    description: lgu
      ? `Public infrastructure contract records attributed to ${lgu.name}.`
      : undefined,
  };
}

export default async function LguProfilePage({ params }: PageProps) {
  const { psgc } = await params;

  const lgu = await getLgu(psgc);
  if (!lgu) notFound();

  const [projects, provenance] = await Promise.all([
    getProjectsForLgu(psgc),
    getProvenance('infrastructure'),
  ]);

  const totalBudget = projects.reduce((sum, p) => sum + (p.budget ?? 0), 0);
  const totalPaid = projects.reduce((sum, p) => sum + (p.amountPaid ?? 0), 0);

  return (
    <>
      <nav aria-label="Breadcrumb" style={{ fontSize: '0.8125rem', marginBottom: 8 }}>
        <Link href="/">All localities</Link>
        {lgu.parentName ? (
          <>
            {' / '}
            <Link href={`/lgu/${lgu.parentCode}`}>{lgu.parentName}</Link>
          </>
        ) : null}
      </nav>

      <h1>{lgu.name}</h1>
      <p className="lede">
        {describeLevel(lgu.level, lgu.cityClass)}
        {lgu.parentName ? ` in ${lgu.parentName}` : ''} · PSGC {lgu.code}
      </p>

      <Disclaimer />

      <dl className="meta-grid">
        <div className="meta-cell">
          <dt className="meta-label">Income class</dt>
          <dd className="meta-value">{lgu.incomeClassification ?? '—'}</dd>
        </div>
        <div className="meta-cell">
          <dt className="meta-label">
            Population {lgu.latestPopulationYear ? `(${lgu.latestPopulationYear})` : ''}
          </dt>
          <dd className="meta-value">
            {lgu.latestPopulation?.toLocaleString('en-PH') ?? '—'}
          </dd>
        </div>
        <div className="meta-cell">
          <dt className="meta-label">Island group</dt>
          <dd className="meta-value">{lgu.islandRegion ?? '—'}</dd>
        </div>
        <div className="meta-cell">
          <dt className="meta-label">PSGC version</dt>
          <dd className="meta-value">{lgu.psgcVersion}</dd>
        </div>
      </dl>

      <h2>Attributed infrastructure projects</h2>

      {projects.length === 0 ? (
        <div className="empty">
          <p>
            No project records resolved to this locality. That is not a finding
            about {lgu.name} — the source feed identifies projects by DPWH
            implementing office rather than by locality, so many records cannot
            be attributed to an LGU until boundary geometry is in place.
          </p>
        </div>
      ) : (
        <>
          <dl className="meta-grid">
            <div className="meta-cell">
              <dt className="meta-label">Projects shown</dt>
              <dd className="meta-value">{projects.length.toLocaleString('en-PH')}</dd>
            </div>
            <div className="meta-cell">
              <dt className="meta-label">Total contract value</dt>
              <dd className="meta-value">{formatCentavos(totalBudget as never)}</dd>
            </div>
            <div className="meta-cell">
              <dt className="meta-label">Total disbursed</dt>
              <dd className="meta-value">{formatCentavos(totalPaid as never)}</dd>
            </div>
          </dl>

          <ProjectsTable projects={projects} lguName={lgu.name} />
        </>
      )}

      <Provenance data={provenance} />
    </>
  );
}

function ProjectsTable({ projects, lguName }: { projects: ProjectRow[]; lguName: string }) {
  return (
    <div className="table-wrap">
      <table>
        <caption>
          Public contract records attributed to {lguName}, highest contract value
          first. Attribution method is shown for every row so it can be checked.
        </caption>
        <thead>
          <tr>
            <th scope="col">Contract</th>
            <th scope="col">Description</th>
            <th scope="col">Contractor</th>
            <th scope="col">Year</th>
            <th scope="col">Contract value</th>
            <th scope="col">Disbursed</th>
            <th scope="col">Progress</th>
            <th scope="col">Attribution</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.contractId}>
              <td>
                <code>{project.contractId}</code>
              </td>
              <td>
                {truncate(project.description, 140)}
                {project.qualityFlags.length > 0 ? (
                  <div>
                    {project.qualityFlags.map((flag) => (
                      <span className="flag" key={flag} title={explainFlag(flag)}>
                        {flag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </td>
              <td>{project.contractor ?? '—'}</td>
              <td>{project.infraYear ?? '—'}</td>
              <td className="num">{formatCentavos(project.budget)}</td>
              <td className="num">{formatCentavos(project.amountPaid)}</td>
              <td className="num">
                {project.progress === null ? '—' : `${project.progress}%`}
              </td>
              <td>
                {project.resolutionMethod ?? '—'}
                {project.sourceProvince ? (
                  <div style={{ color: 'var(--text-faint)', fontSize: '0.75rem' }}>
                    via {project.sourceProvince}
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function describeLevel(level: string, cityClass: string | null): string {
  if (level === 'Prov') return 'Province';
  if (level === 'Mun') return 'Municipality';
  if (level === 'Reg') return 'Region';
  if (level === 'City') {
    if (cityClass === 'HUC') return 'Highly urbanised city';
    if (cityClass === 'ICC') return 'Independent component city';
    if (cityClass === 'CC') return 'Component city';
    return 'City';
  }
  return level;
}

/** Plain-language explanations — FR-13 requires every indicator to carry one. */
function explainFlag(flag: string): string {
  switch (flag) {
    case 'complete-but-unpaid':
      return 'Source reports 100% progress with nothing disbursed. Contradictory in the source record.';
    case 'paid-exceeds-budget':
      return 'Disbursed amount exceeds the recorded contract value.';
    case 'budget-missing':
      return 'No contract value recorded in the source.';
    case 'coordinates-missing':
      return 'No coordinates recorded, so the project cannot be placed on a map.';
    case 'coordinates-out-of-bounds':
      return 'Coordinates fall outside the Philippines.';
    case 'progress-out-of-range':
      return 'Reported progress is outside 0–100%.';
    case 'pseudo-location':
      return 'Implementing office is an administrative unit, not a place.';
    default:
      return flag;
  }
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}
