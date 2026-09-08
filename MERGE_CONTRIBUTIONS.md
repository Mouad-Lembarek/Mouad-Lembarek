# Merging two accounts' contributions (optional)

GitHub does not let two accounts share one native contribution graph — each
graph is tied to the account that's currently authenticated. The two
realistic options:

## Option A — two stats cards side by side (already in README.md)
Zero setup beyond swapping in your second username. This is what's wired up
in the README already. Reliable, no secrets, no hosting.

## Option B — one real merged calendar (this folder)
If you want an actual single heatmap that adds both accounts' daily commits
together, use the script + workflow below. It pulls each account's daily
contribution counts via the GitHub GraphQL API, sums them by date, and draws
a custom SVG calendar that gets committed to an `output` branch — same
pattern as the snake animation.

### 1. Create a token for each account
Each account needs its own **classic PAT** with just the `read:user` scope
(from Settings → Developer settings → Personal access tokens), since private
contribution counts are only visible to a token that belongs to that
account.

### 2. Add repo secrets
In the repo hosting this README, add:
- `PRIMARY_TOKEN` — PAT for `Mouad-Lembarek`
- `SECOND_TOKEN` — PAT for your second account
- `SECOND_USERNAME` — that account's handle (repo variable or secret)

### 3. Files
- `scripts/merge_contributions.mjs` — fetches both accounts, merges, renders SVG
- `.github/workflows/merge-contributions.yml` — runs it daily and commits the result

### 4. Embed it
Once the workflow has run once, add this to README.md wherever you want the
merged graph:

```md
![merged contributions](https://raw.githubusercontent.com/Mouad-Lembarek/Mouad-Lembarek/output/merged-contributions.svg)
```
