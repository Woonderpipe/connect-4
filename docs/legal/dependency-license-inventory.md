# Dependency license inventory

This inventory is generated from the resolved dependency graph and should be refreshed when dependencies change.

This inventory covers code that can be included in the web build, source ZIP,
or Android release. It is intentionally not a substitute for running the
license check after a clean install.

## Classification rules

| Classification | Meaning |
| --- | --- |
| Project-owned | Code or documentation authored for this project, subject to the final project license. |
| Permissively licensed | MIT, BSD, ISC, Apache-2.0, or a comparable license after verification. |
| Copyleft | GPL, LGPL, MPL, EPL, or another reciprocal license requiring special review. |
| Attribution-required | License requires copyright, license, NOTICE, or attribution text to travel with a distribution. |
| Non-commercial/restricted | Terms restrict commercial use, redistribution, modification, or field of use. |
| Unknown | Metadata or provenance is incomplete; do not publish until resolved. |

## Direct JavaScript dependencies

The authoritative package list is `package.json`; versions are pinned by
`pnpm-lock.yaml`. Run `corepack pnpm install --frozen-lockfile` followed by
`pnpm licenses:generate`, `pnpm licenses:check`, and `pnpm notices:check` to
refresh and validate the generated catalog below. The checked-in catalog at
`lib/generated/open-source-licenses.ts` and `docs/legal/license-review-report.md` are the detailed resolved inventory.

The generated catalog is the authoritative resolved inventory. It records exact versions, scopes, sources, license identifiers, and attribution evidence.

| Package family | Used for | Initial classification | Required follow-up |
| --- | --- | --- | --- |
| Next.js, React, React DOM | Web application runtime | Permissively licensed after verification | Record exact package versions and license URLs. |
| Capacitor core, Android, App, CLI | Android wrapper and native lifecycle | Permissively licensed after verification | Preserve package license/NOTICE material in Android distribution. |
| PeerJS | Browser/WebRTC signaling client | Permissively licensed after verification | Verify package license and PeerJS Cloud service terms separately. |
| PocketBase | Dormant future account/backend client | Permissively licensed after verification | Re-audit if enabled in a production release. |
| Tailwind, PostCSS, ESLint, TypeScript | Build and development tooling | Permissively licensed after verification | Include source inventory even when not shipped at runtime. |
| Motion, lucide-react, class utilities | UI and animation | Permissively licensed after verification | Confirm exact package licenses and icon attribution terms. |
| Playwright, archiver, type packages | Testing and release tooling | Permissively licensed after verification | Check source ZIP and CI distributions separately. |

## Android and Gradle dependencies

The Android graph is resolved by Gradle and includes AndroidX, Capacitor, JUnit,
Espresso, the Android Gradle Plugin, Gradle wrapper code, and transitive Maven
artifacts. Run the Android license/dependency report from a clean environment;
do not infer licenses from dependency names alone.

| Surface | Evidence location | Initial classification | Required follow-up |
| --- | --- | --- | --- |
| Gradle wrapper | `android/gradle/wrapper/` and wrapper headers | Attribution-required | Preserve Apache-2.0 text and wrapper notices. |
| AndroidX | `android/app/build.gradle`, `android/variables.gradle` | Permissively licensed after verification | Capture resolved versions and Maven license metadata. |
| Capacitor Android/App | `android/capacitor.settings.gradle`, `android/app/capacitor.build.gradle` | Permissively licensed after verification | Include upstream notices where required. |
| JUnit/Espresso | `android/app/build.gradle` | Permissively licensed after verification | Include test/development dependency inventory. |
| Local JAR/AAR files | `android/**/libs/` | Unknown until inspected | Reject untracked binaries or record their source/license. |

## Prohibited unresolved results

Treat GPL/AGPL, SSPL, Commons Clause, Business Source, non-commercial, no-license, or unknown components as manual compatibility-review results. Record the decision and source/notice obligations before distributing an affected build.

