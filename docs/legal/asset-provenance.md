# Asset provenance

This inventory records ownership and redistribution evidence for project assets.

AI generation does not by itself establish that an asset is free of copyright,
trademark, publicity, or provider-term restrictions. Every public asset needs a
record of its source and the right to redistribute it in the web app, Android
app, source repository, and Play Store listing.

## Project assets to review

| Asset group | Examples | Current classification | Required evidence |
| --- | --- | --- | --- |
| Game/app icons | `public/*icon*`, `android/app/src/main/res/mipmap-*` | Project-owned asset; provenance record | Creator, generation tool, date, source prompt, provider terms, trademark review. |
| Android splash resources | `android/app/src/main/res/drawable*/splash.png` | Project-owned asset; provenance record | Same as icons; confirm no third-party mark. |
| Play Store artwork | `docs/android/play-store/assets/` | Project-owned asset; provenance record | Source image, generation/editing tool, prompt, date, font rights, device/UI screenshot ownership. |
| Screenshots/contact sheets | `docs/android/play-store/assets/source/screens/`, marketing output | Project-owned asset; provenance review | Confirm no personal data, private URLs, or third-party UI. |
| Translations and copy | `locales/`, SEO content, store listing | Project-owned or contributor-created pending review | Confirm authorship and translation rights. |
| Fonts | System/Segoe UI fallbacks in render scripts and web CSS | Environment-dependent | Do not bundle proprietary fonts without redistribution rights. |
| Logos and names | Connect 4, Vier Gewinnt, project branding | Trademark/branding review | Record ownership and allowed use separately from software license. |

## AI asset record

For each generated or edited asset, record:

- File path and SHA-256 hash.
- Tool/provider and account type.
- Creation and editing dates.
- Prompt or source material reference.
- Whether a human supplied copyrighted or trademarked input.
- Applicable commercial-use and redistribution terms.
- Human review for logos, likenesses, brands, copied UI, and watermarks.
- Final approval for web, Android, repository, and Play Store use.

Until this record is complete, classify the asset as **Unknown** rather than
claiming it is copyright-free.

