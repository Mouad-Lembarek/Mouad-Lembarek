# Combined GitHub activity — setup

GitHub ties each contribution graph to whichever account is authenticated, so
there's no native way to show two accounts as one calendar. The closest real
technique — and what's wired into the README — is a small GitHub Action that
reads both accounts' daily contribution counts via the GraphQL API, adds them
together per day, and renders a custom SVG calendar that gets committed to an
`output` branch. That's `scripts/merge_contributions.mjs` +
`.github/workflows/merge-contributions.yml`.

## 1. Create a token for each account
Each account needs its own **classic PAT** with the `read:user` scope
(Settings → Developer settings → Personal access tokens → Tokens classic),
since private contribution counts are only visible to a token belonging to
that account:

- One token for `Mouad-Lembarek`
- One token for `Mouad-Cylindrique`

## 2. Add these to the `Mouad-Lembarek/Mouad-Lembarek` repo
- **Secret** `PRIMARY_TOKEN` → the Mouad-Lembarek PAT
- **Secret** `SECOND_TOKEN` → the Mouad-Cylindrique PAT

(`PRIMARY_USERNAME` and `SECOND_USERNAME` are already set in the workflow —
no need to add them separately.)

## 3. Run it
It runs automatically every day, or trigger it once manually from the
**Actions** tab → *Merge contributions from both accounts* → **Run workflow**.
After the first successful run, `dist/merged-contributions.svg` is published
to the `output` branch and the image in README.md will render.

## 4. Files
- `scripts/merge_contributions.mjs` — fetches both accounts, merges daily counts, renders SVG
- `.github/workflows/merge-contributions.yml` — runs it daily and publishes the result
