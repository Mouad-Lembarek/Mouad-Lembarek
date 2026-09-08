// Merges the daily contribution counts of two GitHub accounts into one
// custom SVG calendar heatmap (same visual language as GitHub's own graph).
//
// Env vars required:
//   PRIMARY_USERNAME, PRIMARY_TOKEN
//   SECOND_USERNAME,  SECOND_TOKEN
//
// Run with: node scripts/merge_contributions.mjs
// Node 18+ (built-in fetch).

import { writeFileSync, mkdirSync } from "node:fs";

const QUERY = `
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}`;

async function fetchDaily(login, token) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 370);

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { login, from: from.toISOString(), to: to.toISOString() },
    }),
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL error for ${login}: ${JSON.stringify(json.errors)}`);
  }

  const weeks = json.data.user.contributionsCollection.contributionCalendar.weeks;
  const byDate = new Map();
  for (const week of weeks) {
    for (const day of week.contributionDays) {
      byDate.set(day.date, day.contributionCount);
    }
  }
  return byDate;
}

function mergeCounts(mapA, mapB) {
  const merged = new Map();
  const dates = new Set([...mapA.keys(), ...mapB.keys()]);
  for (const date of dates) {
    merged.set(date, (mapA.get(date) || 0) + (mapB.get(date) || 0));
  }
  return merged;
}

function levelFor(count) {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

function renderSvg(merged) {
  const dates = [...merged.keys()].sort();
  const first = new Date(dates[0]);
  // Align to the preceding Sunday so columns are full weeks.
  const start = new Date(first);
  start.setDate(start.getDate() - start.getDay());

  const cell = 12;
  const gap = 3;
  const colWidth = cell + gap;
  const rowHeight = cell + gap;
  const weeks = Math.ceil((dates.length + start.getDay()) / 7) + 1;

  const palette = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

  let cells = "";
  const cursor = new Date(start);
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const iso = cursor.toISOString().slice(0, 10);
      const count = merged.get(iso) || 0;
      const color = palette[levelFor(count)];
      const x = w * colWidth;
      const y = d * rowHeight;
      cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${color}"><title>${iso}: ${count} contributions</title></rect>`;
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const width = weeks * colWidth;
  const height = 7 * rowHeight;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height + 4}" viewBox="0 0 ${width} ${height + 4}">
  <rect width="100%" height="100%" fill="transparent" />
  <g transform="translate(0,2)">${cells}</g>
</svg>`;
}

async function main() {
  const primaryUser = process.env.PRIMARY_USERNAME;
  const primaryToken = process.env.PRIMARY_TOKEN;
  const secondUser = process.env.SECOND_USERNAME;
  const secondToken = process.env.SECOND_TOKEN;

  if (!primaryUser || !primaryToken || !secondUser || !secondToken) {
    console.error(
      "Missing one of PRIMARY_USERNAME, PRIMARY_TOKEN, SECOND_USERNAME, SECOND_TOKEN"
    );
    process.exit(1);
  }

  const [a, b] = await Promise.all([
    fetchDaily(primaryUser, primaryToken),
    fetchDaily(secondUser, secondToken),
  ]);

  const merged = mergeCounts(a, b);
  const svg = renderSvg(merged);

  mkdirSync("dist", { recursive: true });
  writeFileSync("dist/merged-contributions.svg", svg);
  console.log("Wrote dist/merged-contributions.svg");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
