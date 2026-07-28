# Play Store publishing

This directory holds the public, reviewable material for publishing the Android app on Google Play. It is intentionally separate from the [Android development guide](../README.md), which covers building and testing the Capacitor project.

## What belongs here

- [Store listing copy](store-listing.md)
- [Open-source notices](open-source-notices.md)
- Public instructions needed to reproduce the store listing

Publisher-console settings, signing credentials, release notes, and final store-upload files must stay outside the repository. The private working copy may retain local store artwork under `assets/`; the public source repository deliberately ignores that publishing collateral.

## Release checklist

Before submitting, build a signed AAB from the documented Android release flow, verify the current privacy policy and Data Safety answers, and confirm that the in-app open-source licenses screen matches the generated notices. Follow the official [Google Play Console Help](https://support.google.com/googleplay/android-developer/) for requirements that can change independently of this project.