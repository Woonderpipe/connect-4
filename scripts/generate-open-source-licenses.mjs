import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const packageJsonPath = path.join(root, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const outputPath = path.join(root, 'lib', 'generated', 'open-source-licenses.ts');
const temporaryOutputPath = process.env.OPEN_SOURCE_LICENSES_OUTPUT || outputPath;

const TEST_PACKAGE_PATTERNS = [
  /^@playwright\//,
  /^playwright$/,
  /^@types\//,
  /^eslint($|-)/,
  /^typescript$/,
  /^archiver$/,
];

const BUILD_PACKAGE_PATTERNS = [
  /^@tailwindcss\//,
  /^tailwindcss$/,
  /^postcss$/,
  /^autoprefixer$/,
  /^tw-animate-css$/,
  /^typescript$/,
  /^eslint($|-)/,
];

const WEB_ATTRIBUTION_FALLBACKS = {
  '@unrs/resolver-binding-win32-x64-msvc': { copyright: 'unrs-resolver contributors', sourceUrl: 'https://github.com/unrs/unrs-resolver' },
  'unrs-resolver': { copyright: 'unrs-resolver contributors', sourceUrl: 'https://github.com/unrs/unrs-resolver' },
  'esrecurse': { copyright: 'estools contributors', sourceUrl: 'https://github.com/estools/esrecurse' },
  'language-subtag-registry': { copyright: 'Matthew Caruana Galizia; Guillaume Gerard', sourceUrl: 'https://github.com/mattcg/language-subtag-registry' },
  'postcss-selector-parser': { copyright: 'Ben Briggs; Chris Eppstein; PostCSS contributors', sourceUrl: 'https://github.com/postcss/postcss-selector-parser' },
  '@next/eslint-plugin-next': {
    copyright: 'Copyright (c) 2025 Vercel, Inc.',
    sourceUrl: 'https://github.com/vercel/next.js',
  },
  '@next/swc-win32-x64-msvc': {
    copyright: 'Copyright (c) 2025 Vercel, Inc.',
    sourceUrl: 'https://github.com/vercel/next.js',
  },
  'client-only': {
    copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates.',
    sourceUrl: 'https://github.com/facebook/react',
  },
  'eslint-config-next': {
    copyright: 'Copyright (c) 2025 Vercel, Inc.',
    sourceUrl: 'https://github.com/vercel/next.js',
  },
};
const ANDROID_LICENSES = {
  androidx: {
    license: 'Apache-2.0',
    sourceUrl: 'https://developer.android.com/jetpack/androidx',
    fallbackCopyright: 'The Android Open Source Project',
  },
  'com.google.guava': {
    license: 'Apache-2.0',
    sourceUrl: 'https://github.com/google/guava',
    fallbackCopyright: 'Google',
  },
  'org.apache.cordova': {
    license: 'Apache-2.0',
    sourceUrl: 'https://github.com/apache/cordova-android',
    fallbackCopyright: 'Apache Software Foundation',
  },
  'org.jetbrains.kotlin': {
    license: 'Apache-2.0',
    sourceUrl: 'https://github.com/JetBrains/kotlin',
    fallbackCopyright: 'JetBrains s.r.o.',
  },
  'org.jetbrains.kotlinx': {
    license: 'Apache-2.0',
    sourceUrl: 'https://github.com/Kotlin/kotlinx.coroutines',
    fallbackCopyright: 'JetBrains s.r.o. and Kotlin contributors',
  },
  'org.jetbrains': {
    license: 'Apache-2.0',
    sourceUrl: 'https://github.com/JetBrains/intellij-community',
    fallbackCopyright: 'JetBrains s.r.o.',
  },
  'org.jspecify': {
    license: 'Apache-2.0',
    sourceUrl: 'https://github.com/jspecify/jspecify',
    fallbackCopyright: 'JSpecify contributors',
  },
};

const CAPACITOR_ANDROID = {
  'project:capacitor-android': {
    name: '@capacitor/android',
    version: packageJson.dependencies['@capacitor/android'].replace(/^\^/, ''),
    license: 'MIT',
    sourceUrl: 'https://github.com/ionic-team/capacitor',
    copyright: 'Copyright (c) 2017-present Drifty Co.',
  },
  'project:capacitor-app': {
    name: '@capacitor/app',
    version: packageJson.dependencies['@capacitor/app'],
    license: 'MIT',
    sourceUrl: 'https://github.com/ionic-team/capacitor-plugins',
    copyright: 'Copyright 2020-present Ionic',
  },
};

const normalizeSourceUrl = (value) => {
  if (!value) return null;
  const normalized = value.replace(/^scm:/, '').replace(/^git\+/, '').replace(/\.git$/, '');
  if (/^[\w.-]+\/[\w.-]+$/.test(normalized)) return `https://github.com/${normalized}`;
  if (normalized.startsWith('github:')) return `https://github.com/${normalized.slice('github:'.length)}`;
  if (normalized.startsWith('git://github.com/')) return normalized.replace('git://', 'https://');
  return normalized;
};

const xmlTag = (xml, tag) => {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return match?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').trim() || null;
};

const findAndroidPom = (group, artifact, version) => {
  const gradleRoot = process.env.GRADLE_USER_HOME || path.join(process.env.USERPROFILE || process.env.HOME || '', '.gradle');
  const moduleRoot = path.join(gradleRoot, 'caches', 'modules-2', 'files-2.1', group, artifact, version);
  if (!existsSync(moduleRoot)) return null;
  for (const hashDirectory of readdirSync(moduleRoot)) {
    const candidate = path.join(moduleRoot, hashDirectory, `${artifact}-${version}.pom`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
};

const readAndroidPom = (group, artifact, version) => {
  const pomPath = findAndroidPom(group, artifact, version);
  if (!pomPath) return null;
  const xml = readFileSync(pomPath, 'utf8');
  const licenseName = xmlTag(xml, 'name');
  const licenseUrl = xml.match(/<licenses>[\s\S]*?<license>[\s\S]*?<url>([\s\S]*?)<\/url>/i)?.[1]?.trim() || null;
  const developers = [...xml.matchAll(/<developer>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/developer>/gi)]
    .map((match) => match[1].trim()).filter(Boolean);
  return {
    copyright: xml.match(/<organization>[\s\S]*?<name>([\s\S]*?)<\/name>/i)?.[1]?.trim() || developers.join('; ') || null,
    sourceUrl: normalizeSourceUrl(xmlTag(xml, 'scm') ? xml.match(/<scm>[\s\S]*?<url>([\s\S]*?)<\/url>/i)?.[1] : null) || normalizeSourceUrl(xmlTag(xml, 'url')),
    licenseUrl,
    licenseName,
  };
};
const normalizeLicense = (metadata) => {
  if (typeof metadata.license === 'string') return metadata.license;
  if (Array.isArray(metadata.licenses)) {
    const licenses = metadata.licenses.map((entry) => entry.type || entry.name).filter(Boolean);
    if (licenses.length > 0) return licenses.join(' OR ');
  }
  return 'UNKNOWN';
};

const packageAttributionFallback = (metadata) => WEB_ATTRIBUTION_FALLBACKS[metadata.name] ||
  (metadata.name.startsWith('@next/swc-') ? { copyright: 'Copyright (c) 2025 Vercel, Inc.', sourceUrl: 'https://github.com/vercel/next.js' } : null) ||
  (metadata.name.startsWith('@tailwindcss/oxide-') ? { copyright: 'Copyright (c) Tailwind Labs, Inc.', sourceUrl: 'https://github.com/tailwindlabs/tailwindcss' } : null) ||
  (metadata.name.startsWith('@unrs/resolver-binding-') ? { copyright: 'unrs-resolver contributors', sourceUrl: 'https://github.com/unrs/unrs-resolver' } : null);

const packageSourceUrl = (metadata) => {
  const repository = typeof metadata.repository === 'string'
    ? metadata.repository
    : metadata.repository?.url;
  if (repository) return normalizeSourceUrl(repository);
  if (metadata.homepage) return normalizeSourceUrl(metadata.homepage);
  return `https://www.npmjs.com/package/${metadata.name}/v/${metadata.version}`;
};

const platformSpecificPackage = (metadata) => Array.isArray(metadata.os) || Array.isArray(metadata.cpu) ||
  /(?:^|-)(aix|darwin|freebsd|gnu|linux(?:musl)?|musl|netbsd|openbsd|sunos|win32|msvc)(?:-|$)/i.test(metadata.name);

const cleanText = (text) => text.replace(/[ \\t]+$/gm, '').trim();

const findLicenseFiles = (packageDirectory) => readdirSync(packageDirectory)
  .filter((entry) => /^(license|licence|notice|copying)(\.|$)/i.test(entry))
  .filter((entry) => statSync(path.join(packageDirectory, entry)).isFile());

const extractCopyright = (text, metadata) => {
  const lines = text.split(/\r?\n/).filter((line) => /copyright|©/i.test(line));
  if (lines.length > 0) return lines.slice(0, 8).join('\n');
  if (typeof metadata.author === 'string') return metadata.author;
  if (metadata.author?.name) return metadata.author.name;
  return null;
};

const packageEntries = () => {
  const pnpmRoot = path.join(root, 'node_modules', '.pnpm');
  if (!existsSync(pnpmRoot)) throw new Error('node_modules/.pnpm is missing; run pnpm install first.');

  const directRuntime = new Set(Object.keys(packageJson.dependencies || {}));
  const directDev = new Set(Object.keys(packageJson.devDependencies || {}));
  const packages = new Map();

  for (const storeDirectory of readdirSync(pnpmRoot)) {
    const packageNodeModules = path.join(pnpmRoot, storeDirectory, 'node_modules');
    if (!existsSync(packageNodeModules)) continue;

    const packageDirectories = [];
    for (const entry of readdirSync(packageNodeModules)) {
      if (entry.startsWith('@')) {
        const scopeDirectory = path.join(packageNodeModules, entry);
        if (existsSync(scopeDirectory)) {
          for (const scopedPackage of readdirSync(scopeDirectory)) {
            packageDirectories.push(path.join(scopeDirectory, scopedPackage));
          }
        }
      } else {
        packageDirectories.push(path.join(packageNodeModules, entry));
      }
    }

    for (const packageDirectory of packageDirectories) {
      const metadataPath = path.join(packageDirectory, 'package.json');
      if (!existsSync(metadataPath)) continue;
      const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
      if (!metadata.name || !metadata.version) continue;

      const key = `${metadata.name}@${metadata.version}`;
      if (packages.has(key)) continue;
      const licenseFiles = findLicenseFiles(packageDirectory);
      const licenseText = licenseFiles.length > 0
        ? cleanText(readFileSync(path.join(packageDirectory, licenseFiles[0]), 'utf8'))
        : null;
      const license = normalizeLicense(metadata);
      const fallback = packageAttributionFallback(metadata);
      const copyright = extractCopyright(licenseText || '', metadata) || fallback?.copyright || null;
      const sourceUrl = fallback?.sourceUrl || packageSourceUrl(metadata);
      const scope = directRuntime.has(metadata.name)
        ? 'web-runtime'
        : directDev.has(metadata.name) && TEST_PACKAGE_PATTERNS.some((pattern) => pattern.test(metadata.name))
          ? 'web-test'
          : directDev.has(metadata.name) || BUILD_PACKAGE_PATTERNS.some((pattern) => pattern.test(metadata.name))
            ? 'web-build'
            : 'web-runtime';

      packages.set(key, {
        id: `npm:${metadata.name}@${metadata.version}`,
        name: metadata.name,
        version: metadata.version,
        ecosystem: 'web',
        scope,
        license,
        sourceUrl,
        copyright,
        attributionStatus: copyright ? 'recorded' : 'missing',
        noticeText: licenseFiles.find((file) => /^notice/i.test(file))
          ? cleanText(readFileSync(path.join(packageDirectory, licenseFiles.find((file) => /^notice/i.test(file))), 'utf8'))
          : null,
        licenseText,
        bundled: scope === 'web-runtime',
        manualReview: license === 'UNKNOWN' || !sourceUrl || !copyright,
        platformSpecific: platformSpecificPackage(metadata),
      });
    }
  }

  return [...packages.values()];
};

const androidEntries = (licenseTextByLicense) => {
  const androidRoot = path.join(root, 'android');
  const gradleCommand = process.platform === 'win32' ? 'gradlew.bat' : 'bash';
  const gradleArguments = process.platform === 'win32'
    ? [':app:dependencies', '--configuration', 'releaseRuntimeClasspath', '--no-daemon']
    : ['./gradlew', ':app:dependencies', '--configuration', 'releaseRuntimeClasspath', '--no-daemon'];
  const androidStudioJbr = 'C:\\Program Files\\Android\\Android Studio\\jbr';
  const javaHome = existsSync(path.join(androidStudioJbr, 'bin', 'java.exe'))
    ? androidStudioJbr
    : process.env.JAVA_HOME;
  const output = execFileSync(gradleCommand, gradleArguments, {
    cwd: androidRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(javaHome ? { JAVA_HOME: javaHome, PATH: `${path.join(javaHome, 'bin')}${path.delimiter}${process.env.PATH || ''}` } : {}),
    },
    shell: process.platform === 'win32',
    maxBuffer: 10 * 1024 * 1024,
  });
  const entries = new Map();
  const coordinatePattern = /(?:\+---|\\---|\|\s+\+---|\|\s+\\---)\s+([\w.-]+):([\w.-]+):([^\s(]+(?:\s+->\s+[^\s(]+)?)/g;

  for (const match of output.matchAll(coordinatePattern)) {
    const [, group, artifact, versionExpression] = match;
    const version = versionExpression.split('->').pop().trim();
    const override = ANDROID_LICENSES[group] || (group.startsWith('androidx.') ? ANDROID_LICENSES.androidx : null);
    if (!override) throw new Error(`Missing Android license mapping for ${group}:${artifact}:${version}`);
    const pom = readAndroidPom(group, artifact, version);
    const license = override.license;
    const copyright = pom?.copyright || override.fallbackCopyright || null;
    const sourceUrl = pom?.sourceUrl || override.sourceUrl;
    const id = `maven:${group}:${artifact}:${version}`;
    entries.set(id, {
      id,
      name: `${group}:${artifact}`,
      version,
      ecosystem: 'android',
      scope: 'android-runtime',
      license,
      sourceUrl,
      copyright,
      attributionStatus: copyright ? 'recorded' : 'missing',
      noticeText: null,
      licenseText: licenseTextByLicense.get(license) || null,
      bundled: true,
      manualReview: !sourceUrl || !copyright,
    });
  }

  for (const [projectId, entry] of Object.entries(CAPACITOR_ANDROID)) {
    if (output.includes(`project :${projectId.split(':')[1]}`)) {
      entries.set(projectId, {
        id: projectId,
        name: entry.name,
        version: entry.version,
        ecosystem: 'android',
        scope: 'android-runtime',
        license: entry.license,
        sourceUrl: entry.sourceUrl,
        copyright: entry.copyright,
        attributionStatus: entry.copyright ? 'recorded' : 'missing',
        noticeText: null,
        licenseText: licenseTextByLicense.get(entry.license) || null,
        bundled: true,
        manualReview: !entry.copyright || !entry.sourceUrl,
        platformSpecific: false,
      });
    }
  }

  return [...entries.values()];
};

const webEntries = packageEntries();
const licenseTextByLicense = new Map(webEntries.filter((entry) => entry.licenseText && !entry.platformSpecific && !platformSpecificPackage({ name: entry.name })).map((entry) => [entry.license, entry.licenseText]));
const entries = [...webEntries, ...androidEntries(licenseTextByLicense)]
  .sort((a, b) => `${a.ecosystem}:${a.name}:${a.version}`.localeCompare(`${b.ecosystem}:${b.name}:${b.version}`));

const failures = entries.flatMap((entry) => {
  const issues = [];
  if (entry.license === 'UNKNOWN') issues.push(`${entry.id}: unknown license`);
  if (!entry.sourceUrl) issues.push(`${entry.id}: missing source URL`);
  return issues;
});

if (failures.length > 0) {
  throw new Error(`Open-source license catalog is incomplete:\n${failures.join('\n')}`);
}

if (process.env.OPEN_SOURCE_LICENSES_STRICT === 'true') {
  const reviewFailures = entries.filter((entry) => entry.bundled && (entry.attributionStatus === 'missing' || entry.manualReview));
  if (reviewFailures.length > 0) {
    throw new Error(`Strict publication license review failed for ${reviewFailures.length} bundled entries. Resolve attribution and manual-review items in docs/legal/license-review-report.md.`);
  }
}
const licenseTexts = Object.fromEntries(
  [...new Set(entries.map((entry) => [entry.license, entry.licenseText]).filter(([, text]) => text).map(([license, text]) => [license, text]))],
);

const generated = `// Generated by scripts/generate-open-source-licenses.mjs. Do not edit manually.\n\nexport type OpenSourceLicenseEntry = {
  id: string;
  name: string;
  version: string;
  ecosystem: 'web' | 'android';
  scope: 'web-runtime' | 'web-build' | 'web-test' | 'android-runtime';
  license: string;
  sourceUrl: string;
  copyright: string | null;
  attributionStatus: 'recorded' | 'missing';
  noticeText: string | null;
  licenseText: string | null;
  bundled: boolean;
  manualReview: boolean;
  platformSpecific: boolean;
};\n\nexport const LICENSE_TEXTS = ${JSON.stringify(licenseTexts, null, 2)} as const;\n\nexport const OPEN_SOURCE_LICENSES = ${JSON.stringify(entries, null, 2)} as const;\n`;

const noticeOutputPath = process.env.OPEN_SOURCE_LICENSES_NOTICES_OUTPUT || path.join(root, 'docs', 'third_party', 'THIRD_PARTY_NOTICES.md');
const reportOutputPath = process.env.OPEN_SOURCE_LICENSES_REPORT_OUTPUT || path.join(root, 'docs', 'legal', 'license-review-report.md');
const markdownValue = (value) => (value || 'Not provided').replace(/\r?\n/g, '<br>').replace(/\|/g, '\\|');
const noticeSections = Object.entries(licenseTexts)
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([license, text]) => [
    `### ${license}`,
    '',
    '<details><summary>License text</summary>',
    '',
    text,
    '',
    '</details>',
  ].join('\n'))
  .join('\n\n');
const noticeEntries = entries.filter((entry) => !entry.platformSpecific && !platformSpecificPackage({ name: entry.name }));
const componentRows = noticeEntries.map((entry) => `| ${markdownValue(entry.name)} | ${markdownValue(entry.version)} | ${markdownValue(entry.scope)} | ${markdownValue(entry.license)} | [source](${entry.sourceUrl}) | ${markdownValue(entry.copyright || entry.noticeText)} | ${entry.attributionStatus === 'missing' ? 'Not provided' : 'Recorded'} | ${entry.manualReview ? 'Needs review' : 'Generated'} |`).join('\n');
const notices = [
  '# Third-party notices',
  '',
  '> Generated by scripts/generate-open-source-licenses.mjs. Review manual-review entries against upstream metadata.',
  '',
  'This catalog covers resolved JavaScript packages and the Android release runtime dependency graph. Build and test tools are labeled and are not necessarily bundled into the production app.',
  '',
  '## Resolved components',
  '',
  '| Component | Version | Scope | License | Source | Attribution | Attribution status | Catalog review |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
  componentRows,
  '',
  '## License texts',
  '',
  noticeSections,
  '',
].join('\n');

const scopeCounts = Object.entries(Object.groupBy(noticeEntries, (entry) => entry.scope))
  .map(([scope, scopedEntries]) => `| ${scope} | ${scopedEntries.length} | ${scopedEntries.filter((entry) => entry.bundled).length} |`)
  .join('\n');
const licenseCounts = Object.entries(Object.groupBy(noticeEntries, (entry) => entry.license))
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([license, licensedEntries]) => `| ${license} | ${licensedEntries.length} | ${[...new Set(licensedEntries.map((entry) => entry.scope))].join(', ')} |`)
  .join('\n');
const missingAttribution = noticeEntries.filter((entry) => entry.attributionStatus === 'missing');
const manualReviewEntries = noticeEntries.filter((entry) => entry.manualReview);
const reviewReport = [
  '# Automated license review report',
  '',
  '> Generated by `scripts/generate-open-source-licenses.mjs`. This is evidence for review, not a legal certification or waiver.',
  '',
  `- Total resolved entries: ${noticeEntries.length}`,
  `- Entries with recorded attribution metadata: ${noticeEntries.length - missingAttribution.length}`,
  `- Entries missing recorded attribution metadata: ${missingAttribution.length}`,
  `- Entries requiring manual catalog review: ${manualReviewEntries.length}`,
  '',
  '## Entries by scope',
  '',
  '| Scope | Entries | Bundled |',
  '| --- | ---: | ---: |',
  scopeCounts,
  '',
  '## License identifiers',
  '',
  '| License | Entries | Scopes |',
  '| --- | ---: | --- |',
  licenseCounts,
  '',
  '## Missing attribution metadata',
  '',
  missingAttribution.length === 0 ? 'None detected by the generator.' : missingAttribution.map((entry) => `- \`${entry.id}\` — ${entry.name} ${entry.version} (${entry.scope})`).join('\n'),
  '',
  '## Manual review entries',
  '',
  manualReviewEntries.length === 0 ? 'None detected by the generator.' : manualReviewEntries.map((entry) => `- \`${entry.id}\` — ${entry.name} ${entry.version}: verify license text, source, and attribution against upstream metadata.`).join('\n'),
  '',
].join('\n');
mkdirSync(path.dirname(temporaryOutputPath), { recursive: true });
writeFileSync(temporaryOutputPath, generated, 'utf8');
mkdirSync(path.dirname(noticeOutputPath), { recursive: true });
writeFileSync(noticeOutputPath, notices, 'utf8');
mkdirSync(path.dirname(reportOutputPath), { recursive: true });
writeFileSync(reportOutputPath, reviewReport, 'utf8');
console.log(`Generated ${entries.length} open-source license entries at ${path.relative(root, temporaryOutputPath)}`);
