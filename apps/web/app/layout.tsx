import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Philippine Corruption Risk Map',
    template: '%s · Philippine Corruption Risk Map',
  },
  description:
    'Public procurement and budget records for every Philippine province, city ' +
    'and municipality, traceable to their primary sources.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to main content
        </a>

        <header className="masthead">
          <div className="masthead-inner">
            <Link href="/" className="wordmark">
              Philippine Corruption Risk Map
            </Link>
            <span className="tagline">
              Public records, traceable to source · pre-release
            </span>
          </div>
        </header>

        <main id="main" className="shell">
          {children}
        </main>

        <footer className="site-footer">
          <p>
            Built on the open APIs of the BetterGov.ph family. Originating data
            belongs to the DBM, DPWH, PSA, COMELEC and DILG. Geographic
            classification from the Philippine Statistics Authority (PSGC
            Q2_2024).
          </p>
          <p>
            This is a pre-release build. No risk score is published yet, and no
            data here has been through editorial or legal review.
          </p>
        </footer>
      </body>
    </html>
  );
}
