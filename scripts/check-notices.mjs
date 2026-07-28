import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const dependencyNames = Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies });
const failures = [];
const findings = [];

for (const name of dependencyNames) {
  const packagePath = join(root, 'node_modules', ...name.split('/'), 'package.json');
  if (!existsSync(packagePath)) {
    failures.push(`${name}: package metadata is not installed`);
    continue;
  }
  const metadata = JSON.parse(readFileSync(packagePath, 'utf8'));
  const license = typeof metadata.license === 'string'
    ? metadata.license
    : Array.isArray(metadata.licenses)
      ? metadata.licenses.map((entry) => entry.type || entry.name).filter(Boolean).join(', ')
      : 'UNKNOWN';
  const packageDir = join(packagePath, '..');
  const licenseFiles = readdirSync(packageDir)
    .filter((entry) => /^(license|licence|notice|copying)(\.|$)/i.test(entry))
    .filter((entry) => statSync(join(packageDir, entry)).isFile());
  findings.push(`${name}@${metadata.version || 'unknown'} | ${license} | ${licenseFiles.join(', ') || 'no license file found'}`);
if (license === 'UNKNOWN') {
    failures.push(`${name}: license metadata is missing or unknown`);
  } else if (licenseFiles.length === 0) {
    console.warn(`${name}: ${license} is declared in package metadata, but no license file is bundled; verify the upstream source URL in docs/third_party/THIRD_PARTY_NOTICES.md`);
  }
}

for (const requiredPath of ['NOTICE', join('docs', 'third_party', 'THIRD_PARTY_NOTICES.md'), 'docs/legal/dependency-license-inventory.md']) {
  if (!existsSync(join(root, requiredPath))) failures.push(`missing ${requiredPath}`);
}

console.log('Direct dependency license evidence:');
console.log(findings.join('\n'));
if (failures.length > 0) {
  console.error('\nLicense/notice review required:');
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('\nBasic direct-dependency evidence is present. Review transitive and Gradle dependencies when dependency metadata changes.');
}

