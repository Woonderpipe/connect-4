# Publication Checklist

Use this checklist when preparing a new public repository. Keep provider accounts, production URLs, signing files, credentials, and instance-specific reverse-proxy configuration outside Git (for example, in the ignored `deploy/vps/` directory).

## Before publishing

- [ ] Create a new repository without copying the existing `.git` directory or history.
- [ ] Review all tracked files for personal data, credentials, production domains, service identifiers, local paths, and private operational notes.
- [ ] Configure `NEXT_PUBLIC_SITE_URL`, contact details, analytics, and search verification only in ignored deployment environment files.
- [ ] Replace the sample Android package ID, deep-link host, icons, and store listing details before publishing a forked app.
- [ ] Review the privacy policy, terms, trademarks, asset provenance, and third-party notices for the intended release.
- [ ] Verify the clean public checkout can install, build, test, and package without ignored files.

## Suggested verification

```text
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm licenses:check
corepack pnpm audit
git diff --check
```
