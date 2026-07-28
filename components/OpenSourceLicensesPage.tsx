import Link from 'next/link';
import { OPEN_SOURCE_LICENSES } from '@/lib/generated/open-source-licenses';
import { OpenSourceLicenseSearch } from './OpenSourceLicenseSearch';

type LicenseLocale = 'de' | 'en';

const COPY = {
  de: {
    back: '← Zurück zum Spiel',
    title: 'Open-Source-Lizenzen',
    intro: 'Diese Seite listet die Open-Source-Komponenten, die in der Web- und Android-Version verwendet werden.',
    project: 'Dieses Projekt',
    projectText: 'Connect 4 ist unter Apache-2.0 lizenziert. Namen, Logos und Marken sind davon nicht umfasst.',
    dependencies: 'Drittanbieter-Komponenten',
    searchLabel: 'Open-Source-Komponenten suchen',
    placeholder: 'Nach Name, Version oder Lizenz suchen …',
    empty: 'Keine passenden Komponenten gefunden.',
    source: 'Quelle',
    copyright: 'Copyright / attribution',
    attributionMissing: 'Attribution text is not recorded in the package metadata; verify it against the upstream license and NOTICE.',
    fullLicense: 'Lizenztext anzeigen',
    runtime: 'In der App enthalten',
    notRuntime: 'Nur Build- oder Testwerkzeug',
    manualReview: 'Lizenztext muss noch anhand der Upstream-Quelle geprüft werden.',
    web: 'Web',
    android: 'Android',
  },
  en: {
    back: '← Back to the game',
    title: 'Open Source Licenses',
    intro: 'This page lists the open-source components used by the web and Android versions.',
    project: 'This project',
    projectText: 'Connect 4 is licensed under Apache-2.0. Names, logos, and trademarks are not included in that license.',
    dependencies: 'Third-party components',
    searchLabel: 'Search open-source components',
    placeholder: 'Search by name, version, or license …',
    empty: 'No matching components found.',
    source: 'Source',
    copyright: 'Copyright / attribution',
    attributionMissing: 'Attribution text is not recorded in the package metadata; verify it against the upstream license and NOTICE.',
    fullLicense: 'Show license text',
    runtime: 'Bundled in the app',
    notRuntime: 'Build or test tool only',
    manualReview: 'License text still requires verification against the upstream source.',
    web: 'Web',
    android: 'Android',
  },
  ar: {
    back: '← العودة إلى اللعبة',
    title: 'تراخيص البرمجيات مفتوحة المصدر',
    intro: 'تسرد هذه الصفحة مكوّنات البرمجيات مفتوحة المصدر المستخدمة في نسختي الويب وأندرويد.',
    project: 'هذا المشروع',
    projectText: 'لعبة Connect 4 مرخّصة بموجب Apache-2.0. الأسماء والشعارات والعلامات التجارية غير مشمولة بهذه الرخصة.',
    dependencies: 'مكوّنات الجهات الخارجية',
    searchLabel: 'البحث في المكوّنات مفتوحة المصدر',
    placeholder: 'ابحث بالاسم أو الإصدار أو الرخصة …',
    empty: 'لم يتم العثور على مكوّنات مطابقة.',
    source: 'المصدر',
    copyright: 'حقوق النشر / النَسب',
    attributionMissing: 'لم يتم تسجيل نص النَسب بعد؛ يجب التحقق من الرخصة وملف NOTICE من المصدر الأصلي قبل النشر.',
    fullLicense: 'عرض نص الرخصة',
    runtime: 'مضمّن في التطبيق',
    notRuntime: 'أداة بناء أو اختبار فقط',
    manualReview: 'يجب التحقق من نص الرخصة عبر المصدر الأصلي.',
    web: 'الويب',
    android: 'أندرويد',
  },
} as const;

const PROJECT_LICENSE = {
  name: 'Connect 4',
  version: '1.0.0',
  license: 'Apache-2.0',
  sourceUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
};

const scopeOrder = ['web-runtime', 'android-runtime', 'web-build', 'web-test'] as const;

export function OpenSourceLicensesPage({ locale }: { locale: LicenseLocale }) {
  const copy = COPY[locale];
  const entriesByScope = scopeOrder.map((scope) => ({
    scope,
    entries: OPEN_SOURCE_LICENSES.filter((entry) => entry.scope === scope),
  })).filter(({ entries }) => entries.length > 0);

  return (
    <main className="min-h-screen overflow-hidden bg-white px-4 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 sm:py-14">
      <article className="mx-auto max-w-5xl rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-900/5 sm:p-10 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20">
        <Link className="inline-flex rounded-full px-3 py-2 text-sm font-black text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white" href={locale === 'de' ? '/de' : '/'}>
          {copy.back}
        </Link>
        <h1 className="mt-7 text-4xl font-black tracking-tight sm:text-6xl">{copy.title}</h1>
        <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-zinc-600 dark:text-zinc-300">{copy.intro}</p>

        <section className="mt-8 rounded-3xl border border-cyan-300/40 bg-gradient-to-br from-cyan-100/80 to-yellow-50 p-6 dark:border-cyan-300/20 dark:from-cyan-400/10 dark:to-zinc-950" aria-labelledby="project-license">
          <h2 className="text-lg font-black text-zinc-950 dark:text-cyan-100" id="project-license">{copy.project}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-200">{copy.projectText}</p>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
            <strong>{PROJECT_LICENSE.name}</strong> · {PROJECT_LICENSE.version} · {PROJECT_LICENSE.license} ·{' '}
            <a className="underline hover:text-white" href={PROJECT_LICENSE.sourceUrl} rel="noreferrer" target="_blank">{copy.source}</a>
          </p>
        </section>

        <section className="mt-10" aria-labelledby="dependency-licenses">
          <h2 className="text-2xl font-black" id="dependency-licenses">{copy.dependencies}</h2>
          <div className="mt-5">
            <OpenSourceLicenseSearch
              emptyLabel={copy.empty}
              label={copy.searchLabel}
              placeholder={copy.placeholder}
            >
              {entriesByScope.map(({ scope, entries }) => (
                <section key={scope} aria-labelledby={`scope-${scope}`}>
                  <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-zinc-500" id={`scope-${scope}`}>
                    {scope === 'android-runtime' ? copy.android : scope === 'web-runtime' ? copy.web : scope === 'web-build' ? `${copy.web} · build` : `${copy.web} · test`}
                  </h3>
                  <div className="space-y-3">
                    {entries.map((entry) => (
                      <article
                        className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-5 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950/70"
                        data-license-entry
                        data-search={`${entry.name} ${entry.version} ${entry.license} ${entry.ecosystem}`.toLocaleLowerCase()}
                        key={entry.id}
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{entry.name}</h4>
                          <span className="text-xs text-zinc-500">{entry.version}</span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                          <span className="font-semibold text-cyan-700 dark:text-cyan-200">{entry.license}</span> · {entry.bundled ? copy.runtime : copy.notRuntime}
                        </p>
                        {entry.copyright && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-500"><strong>{copy.copyright}:</strong> {entry.copyright}</p>}
                        {String(entry.attributionStatus) === 'missing' && <p className="mt-2 text-xs text-amber-200/90">{copy.attributionMissing}</p>}
                        <div className="mt-3 flex flex-wrap gap-4 text-sm">
                          <a className="underline hover:text-white" href={entry.sourceUrl} rel="noreferrer" target="_blank">{copy.source}</a>
                          {entry.licenseText && (
                            <details>
                              <summary className="cursor-pointer underline">{copy.fullLicense}</summary>
                              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-zinc-900 p-3 text-xs leading-5 text-zinc-400">{entry.licenseText}</pre>
                            </details>
                          )}
                        </div>
                        {entry.manualReview && <p className="mt-3 text-xs text-amber-200/80">{copy.manualReview}</p>}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </OpenSourceLicenseSearch>
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap gap-4 border-t border-zinc-200 pt-5 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <Link className="underline hover:text-white" href="/LICENSE">LICENSE</Link>
          <Link className="underline hover:text-white" href="/NOTICE">NOTICE</Link>
          <Link className="underline hover:text-white" href="/open-source">THIRD_PARTY_NOTICES.md</Link>
        </footer>
      </article>
    </main>
  );
}
