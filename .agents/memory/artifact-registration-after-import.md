---
name: Reimported pnpm-workspace artifacts unregistered
description: A GitHub-imported Replit pnpm-workspace project can have fully-formed artifacts/<slug>/.replit-artifact/artifact.toml files with real ids, yet listArtifacts() returns empty and WorkflowsRestart says the workflow doesn't exist for all of them.
---

The artifact registration/workflow index is not derived purely from the files in the repo — it's separate platform state that can be lost on GitHub import even when `artifact.toml` files (with real, non-placeholder `id`s) are present and correct.

**Symptom:** `listArtifacts()` returns `[]`; `WorkflowsRestart` fails with "workflow doesn't exist" for every `artifacts/<slug>: <service>` name, even though the artifact directories and `.replit-artifact/artifact.toml` look complete and valid.

**Fix that worked:** Calling `createArtifact()` with any *new* throwaway slug (e.g. `zzz-probe-temp`) as a side effect triggers the platform to (re)scan and register ALL existing `artifacts/*/.replit-artifact/artifact.toml` files as real artifacts with working managed workflows — not just the new one. After that, delete the throwaway probe directory and re-run `pnpm install` to remove its stale `pnpm-lock.yaml` workspace entry, then restart the real workflows.

**Why:** `createArtifact` failing outright (`ARTIFACT_DIR_EXISTS`) on an existing slug does not mean registration can't happen — the registration/scan step is triggered by any `createArtifact` call, not gated to the specific slug being created.

**How to apply:** If an imported project has pre-existing `artifacts/*/.replit-artifact/artifact.toml` but `listArtifacts()` is empty and `WorkflowsRestart` can't find them, don't hand-edit `.replit` or call `configureWorkflow` for these services — use the probe-slug `createArtifact` trick instead, then clean up the probe dir + reinstall to fix the lockfile.
