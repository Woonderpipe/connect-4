import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const strictPublicationReview = process.argv.includes('--strict');
const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'connect4-open-source-licenses-'));
const temporaryOutput = path.join(temporaryDirectory, 'open-source-licenses.ts');
const temporaryNotices = path.join(temporaryDirectory, 'THIRD_PARTY_NOTICES.md');
const temporaryReport = path.join(temporaryDirectory, 'license-review-report.md');
const trackedOutput = path.join(root, 'lib', 'generated', 'open-source-licenses.ts');
const trackedNotices = path.join(root, 'docs', 'third_party', 'THIRD_PARTY_NOTICES.md');
const trackedReport = path.join(root, 'docs', 'legal', 'license-review-report.md');
const platformSpecificName = /(?:^|-)(aix|darwin|freebsd|gnu|linux(?:musl)?|musl|netbsd|openbsd|sunos|win32|msvc)(?:-|$)/i;

const normalizeCatalog = (text) => {
  const match = text.match(/OPEN_SOURCE_LICENSES = ([\s\S]*?) as const;/);
  if (!match) return text;
  const entries = JSON.parse(match[1]).filter((entry) => !entry.platformSpecific && !platformSpecificName.test(entry.name));
  return JSON.stringify(entries);
};

const normalizeNotices = (text) => text.split(/\r?\n/).filter((line) => {
  const match = line.match(/^\| ([^|]+) \|/);
  return !match || !platformSpecificName.test(match[1].trim());
}).join('\n');

try {
  execFileSync(process.execPath, ['scripts/generate-open-source-licenses.mjs'], {
    cwd: root,
    env: {
      ...process.env,
      OPEN_SOURCE_LICENSES_OUTPUT: temporaryOutput,
      OPEN_SOURCE_LICENSES_NOTICES_OUTPUT: temporaryNotices,
      OPEN_SOURCE_LICENSES_REPORT_OUTPUT: temporaryReport,
      OPEN_SOURCE_LICENSES_STRICT: strictPublicationReview ? 'true' : 'false',
    },
    stdio: 'inherit',
  });

  const generated = readFileSync(temporaryOutput, 'utf8');
  const tracked = readFileSync(trackedOutput, 'utf8');
  const generatedNotices = readFileSync(temporaryNotices, 'utf8');
  const checkedInNotices = readFileSync(trackedNotices, 'utf8');
  const generatedReport = readFileSync(temporaryReport, 'utf8');
  const checkedInReport = readFileSync(trackedReport, 'utf8');
  const catalogMatches = normalizeCatalog(generated) === normalizeCatalog(tracked);
  const normalizedGeneratedNotices = normalizeNotices(generatedNotices);
  const normalizedCheckedInNotices = normalizeNotices(checkedInNotices);
  const noticesMatch = normalizedGeneratedNotices === normalizedCheckedInNotices;
  const reportMatches = generatedReport === checkedInReport;
  if (!catalogMatches || !noticesMatch || !reportMatches) {
    throw new Error('The checked-in license catalog, notices, or review report are stale. Run `pnpm licenses:generate` and review the result.');
  }

  console.log('Open-source license catalog, notices, and review report are current.');
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
