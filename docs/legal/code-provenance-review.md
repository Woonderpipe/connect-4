# Code provenance review

AI-assisted authorship does not remove the need to review code provenance. The
project reviewers must review generated or copied code for recognizable third-party
snippets, license headers, attribution requirements, and incompatible terms.

## Review procedure

1. Search source and history for license/copyright headers and copied URLs.
2. Compare suspicious snippets against their referenced upstream source.
3. Record the upstream project, version/commit, license, and required notices.
4. Replace or reimplement code with incompatible or unknown provenance.
5. Re-run the dependency and secret scans after cleanup.

This review is separate from dependency metadata because generated application
code can contain copied material even when package metadata is clean.

