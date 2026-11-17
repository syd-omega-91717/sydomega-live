# Main branch ruleset activation

**Status:** proposed automation; the live ruleset remains disabled until the protected workflow is run successfully.

## What this changes

The existing repository ruleset `sydomega_merged` (ID `20176798`) is configured to:

- apply only to `refs/heads/main`;
- use active enforcement;
- require changes to enter through a pull request;
- require the reviewed blocking check contexts in `config/github-main-ruleset.json`, with strict up-to-date checks;
- require review-thread resolution;
- block branch deletion and force pushes;
- configure no bypass actors.

The approval count is deliberately zero because the current repository is maintained by one primary maintainer; requiring an independent approval would make the release process impossible. Once a second independent maintainer is available, raise `required_approving_review_count` to one and add CODEOWNERS coverage where appropriate.

## Required owner setup

1. In GitHub repository **Settings → Environments**, create or inspect `github-repository-admin`.
2. Add at least one required reviewer to that environment. Do not leave this privileged environment unprotected.
3. Add environment secret `GH_REPO_ADMIN_TOKEN`. Use a fine-grained PAT or GitHub App token scoped to this repository with **Administration: write** (and the standard metadata read permission). Do not use a classic broad-scope token if a fine-grained token is available.
4. Review `config/github-main-ruleset.json` and the required check contexts against the latest successful PR run before execution.
5. Open [Activate GitHub Main Ruleset](https://github.com/syd-omega-91717/sydomega-live/actions/workflows/github-main-ruleset-activation.yml), select `main`, and run it after the environment approval.
6. Confirm the workflow reports `GITHUB_MAIN_RULESET=ACTIVE`, then independently re-read the ruleset in GitHub Settings. It must show active enforcement, target only main, and no bypass actors.

The helper performs GET → guarded PUT → GET. It refuses to overwrite a different ruleset identity and fails if the provider does not return the reviewed target, enforcement state, PR rule, deletion/force-push rules, strict status checks, or all required check contexts. It never prints or stores the token.

## Safety and limitations

- The connected GitHub integration in this session is read-only for rulesets, so the live settings cannot be changed directly from this conversation.
- The workflow is manual-only and main-only; it cannot be triggered by a PR or ordinary push.
- The environment approval and token are owner-managed prerequisites.
- The check contexts must continue to exist in PR workflows. If a workflow is renamed or removed, update the ruleset configuration and tests in a reviewed PR before changing the live ruleset.
- The automation's existence is not proof that the live ruleset is active. Keep issue #1338 open until post-write verification succeeds.
