// scripts/generate-selector-report.js
// artifacts/generate-report.js
// ESM script — requires Node.js modern (and package.json "type": "module")
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";
import process from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// const OUT_DIR = path.join("artifacts", "selector-report");
const projectRoot =
	process.argv[2] || process.env.PROJECT_ROOT || process.cwd();

const ARTIFACTS_DIR = path.join(projectRoot, "artifacts");
const OUT_DIR = path.join(ARTIFACTS_DIR, "selector-report");

function heatColorFromPercent(p) {
	if (p < 25) return "hsl(120 70% 55%)"; // green
	if (p < 50) return "hsl(90 70% 55%)"; // yellow-green
	if (p < 75) return "hsl(45 80% 55%)"; // orange
	return "hsl(10 75% 50%)"; // red
}

// async function findMonitorFiles() {
// 	const candidateDirs = [
// 		path.join(process.cwd(), "artifacts"),
// 		process.cwd(),
// 		__dirname,
// 		path.join(__dirname, ".."),
// 	];

// 	const byName = new Map();
// 	for (const dir of candidateDirs) {
// 		try {
// 			const files = await fs.readdir(dir);
// 			for (const f of files) {
// 				if (!/^selector-monitor.*\.json$/.test(f)) continue;
// 				const full = path.resolve(dir, f);
// 				const name = path.basename(f);
// 				const existing = byName.get(name);
// 				if (!existing) {
// 					byName.set(name, full);
// 				} else {
// 					if (existing.includes(path.sep + "artifacts" + path.sep)) {
// 						// keep existing
// 					} else if (full.includes(path.sep + "artifacts" + path.sep)) {
// 						byName.set(name, full);
// 					}
// 				}
// 			}
// 		} catch (e) {
// 			// ignore
// 		}
// 	}

// 	return Array.from(byName.values());
// }
async function findMonitorFiles() {
	try {
		const files = await fs.readdir(ARTIFACTS_DIR);
		return files
			.filter((f) => /^selector-monitor.*\.json$/.test(f))
			.map((f) => path.join(ARTIFACTS_DIR, f));
	} catch {
		return [];
	}
}

function normalizeExampleInput(ex) {
	if (!ex) return "";
	if (Array.isArray(ex.input)) return ex.input.join("||");
	if (typeof ex.input === "string") return ex.input;
	return "";
}

function isoDay(ts) {
	try {
		return new Date(ts).toISOString().slice(0, 10);
	} catch (e) {
		return ts || "";
	}
}

function csvEscape(v) {
	if (v == null) return "";
	const s = String(v);
	if (s.includes(",") || s.includes('"') || s.includes("\n")) {
		return `"${s.replace(/"/g, '""')}"`;
	}
	return s;
}

function escapeHtml(s) {
	if (s == null) return "";
	return String(s)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

async function main() {
	const found = await findMonitorFiles();
	if (!found.length) {
		console.error(`No selector-monitor JSON files found in ${ARTIFACTS_DIR}`);
		process.exitCode = 1;
		return;
	}

	await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
	await fs.mkdir(OUT_DIR, { recursive: true });

	console.log("[selectorReport] Will aggregate the following files:");
	for (const f of found) console.log("  - " + f);

	for (const f of found) {
		const base = path.basename(f);
		const dst = path.join(ARTIFACTS_DIR, base);
		try {
			if (path.resolve(f) !== path.resolve(dst)) {
				await fs.copyFile(f, dst);
			}
		} catch (e) {
			// ignore
		}
	}

	// const monitorFiles = (await fs.readdir("artifacts"))
	// 	.filter((n) => /^selector-monitor.*\.json$/.test(n))
	// 	.map((n) => path.join("artifacts", n));
	const monitorFiles = await findMonitorFiles();

	if (!monitorFiles.length) {
		console.error("No selector-monitor JSON files found inside artifacts/.");
		process.exitCode = 1;
		return;
	}

	const aggregate = {
		totalCalls: 0,
		byPlatform: { android: 0, ios: 0, unknown: 0 },
		bySelected: {},
		bySelectedMeta: {},
		lastUpdated: null,
	};

	// NEW: track sum of raw examples occurrences across all worker files (this yields 27 in your case)
	let examplesOccurrencesSum = 0;

	for (const file of monitorFiles) {
		let raw;
		try {
			raw = await fs.readFile(file, "utf8");
		} catch (e) {
			continue;
		}
		let j;
		try {
			j = JSON.parse(raw);
		} catch (e) {
			console.warn("skip invalid json", file);
			continue;
		}

		aggregate.totalCalls += Number(j.totalCalls || 0);

		for (const k of Object.keys(j.byPlatform || {})) {
			aggregate.byPlatform[k] =
				(aggregate.byPlatform[k] || 0) + (j.byPlatform[k] || 0);
		}
		for (const s of Object.keys(j.bySelected || {})) {
			aggregate.bySelected[s] =
				(aggregate.bySelected[s] || 0) + (j.bySelected[s] || 0);
		}

		const meta = j.bySelectedMeta || {};
		for (const s of Object.keys(meta)) {
			const src = meta[s];

			// Count raw occurrences from worker file (sum of examples lengths) -> contributes to examplesOccurrencesSum
			if (Array.isArray(src.examples)) {
				examplesOccurrencesSum += src.examples.length;
			}

			const cur = aggregate.bySelectedMeta[s] || {
				count: 0,
				firstSeen: src.firstSeen || null,
				lastSeen: src.lastSeen || null,
				platforms: {},
				examples: [],
				kinds: {},
			};

			cur.count = (cur.count || 0) + Number(src.count || 0);

			if (src.firstSeen && (!cur.firstSeen || src.firstSeen < cur.firstSeen))
				cur.firstSeen = src.firstSeen;
			if (src.lastSeen && (!cur.lastSeen || src.lastSeen > cur.lastSeen))
				cur.lastSeen = src.lastSeen;

			for (const p of Object.keys(src.platforms || {})) {
				cur.platforms[p] =
					(cur.platforms[p] || 0) + Number(src.platforms[p] || 0);
			}

			if (Array.isArray(src.examples) && src.examples.length) {
				cur.examples = (cur.examples || []).concat(src.examples || []);
				if (cur.examples.length > 200) cur.examples.length = 200;
			}

			for (const k of Object.keys(src.kinds || {})) {
				cur.kinds[k] = (cur.kinds[k] || 0) + Number(src.kinds[k] || 0);
			}

			aggregate.bySelectedMeta[s] = cur;
		}

		if (
			!aggregate.lastUpdated ||
			(j.lastUpdated && j.lastUpdated > aggregate.lastUpdated)
		) {
			aggregate.lastUpdated = j.lastUpdated;
		}
	}

	aggregate.byPlatform.android = aggregate.byPlatform.android || 0;
	aggregate.byPlatform.ios = aggregate.byPlatform.ios || 0;
	aggregate.byPlatform.unknown = aggregate.byPlatform.unknown || 0;
	aggregate.lastUpdated = aggregate.lastUpdated || new Date().toISOString();

	const rows = [];
	const globalDistinctSet = new Set();

	for (const sel of Object.keys(aggregate.bySelectedMeta)) {
		const m = aggregate.bySelectedMeta[sel];
		const examples = Array.isArray(m.examples) ? m.examples : [];

		const normalized = examples.map((ex) => ({
			seenAt: ex && ex.seenAt ? ex.seenAt : "",
			key: normalizeExampleInput(ex),
		}));

		const distinctMap = new Map();
		for (const ex of normalized) {
			const k = ex.key || "(empty)";
			if (!distinctMap.has(k)) {
				distinctMap.set(k, {
					input: k,
					firstSeen: ex.seenAt || "",
					lastSeen: ex.seenAt || "",
					count: 1,
				});
			} else {
				const cur = distinctMap.get(k);
				cur.count = (cur.count || 0) + 1;
				if (ex.seenAt && (!cur.firstSeen || ex.seenAt < cur.firstSeen))
					cur.firstSeen = ex.seenAt;
				if (ex.seenAt && (!cur.lastSeen || ex.seenAt > cur.lastSeen))
					cur.lastSeen = ex.seenAt;
			}
		}

		const distinctArray = Array.from(distinctMap.values()).sort(
			(a, b) => (b.count || 0) - (a.count || 0)
		);
		const distinctCount = distinctArray.length;
		const mostCommon = distinctArray[0] ? distinctArray[0].input : "";

		for (const d of distinctArray) {
			if (d && d.input) globalDistinctSet.add(d.input);
		}

		const firstDistinct = distinctArray.reduce(
			(acc, c) =>
				c.firstSeen && (!acc || c.firstSeen < acc) ? c.firstSeen : acc,
			null
		);
		const lastDistinct = distinctArray.reduce(
			(acc, c) => (c.lastSeen && (!acc || c.lastSeen > acc) ? c.lastSeen : acc),
			null
		);

		const instabilityPercent = normalized.length
			? Math.round((distinctCount / normalized.length) * 100)
			: 0;

		const tsMap = {};
		for (const d of distinctArray) {
			if (!d.firstSeen) continue;
			const day = isoDay(d.firstSeen);
			tsMap[day] = (tsMap[day] || 0) + 1;
		}
		const tsArr = Object.keys(tsMap)
			.sort()
			.map((day) => ({ day, newVariants: tsMap[day] }));

		const count = aggregate.bySelected[sel] || m.count || 0;
		const flagged = instabilityPercent >= 40 && count >= 3;

		rows.push({
			selector: sel,
			count,
			distinctCount,
			mostCommon,
			instabilityPercent,
			firstSeen: m.firstSeen || "",
			lastSeen: m.lastSeen || "",
			firstSeenDistinct: firstDistinct || "",
			lastSeenDistinct: lastDistinct || "",
			examples: normalized
				.slice(0, 10)
				.map((n) => `${n.key}${n.seenAt ? ` (${n.seenAt})` : ""}`),
			heatPercent: Math.round(
				(count / Math.max(1, aggregate.totalCalls)) * 100
			),
			flagged,
			timeSeries: tsArr,
		});
	}

	rows.sort((a, b) => b.count - a.count);

	const reportedTotalCalls = aggregate.totalCalls || 0;
	const uniqueSelectorsCount = rows.length;
	const uniqueExamplesTotal = globalDistinctSet.size;
	const sumDistinctPerSelector = rows.reduce(
		(acc, r) => acc + (r.distinctCount || 0),
		0
	);

	// NEW: examplesOccurrencesSum is sum of all src.examples.length as read from worker files
	// (represents "raw examples occurrences" across workers — that's the 27 you saw)
	const summary = {
		generatedAt: new Date().toISOString(),
		reportedTotalCalls,
		examplesOccurrencesSum, // <-- raw examples occurrences (e.g. 27)
		uniqueExamplesTotal, // <-- global deduped signatures (e.g. 8)
		sumDistinctPerSelector,
		uniqueSelectorsCount,
		lastUpdated: aggregate.lastUpdated,
		rows,
	};

	await fs.mkdir(OUT_DIR, { recursive: true });

	await fs.writeFile(
		path.join(OUT_DIR, "selector-report-summary.json"),
		JSON.stringify(summary, null, 2),
		"utf8"
	);

	const csvCols = [
		"Selector",
		"Count",
		"DistinctInputsCount",
		"MostCommonInput",
		"InstabilityPercent",
		"FirstSeen",
		"LastSeen",
		"firstSeenDistinct",
		"lastSeenDistinct",
		"ExamplesSample",
		"Flagged",
		"TimeSeries",
	];
	const csvRows = [csvCols.join(",")];
	for (const r of rows) {
		const timeSeriesStr = r.timeSeries
			.map((t) => `${t.day}:${t.newVariants}`)
			.join(";");
		csvRows.push(
			[
				csvEscape(r.selector),
				csvEscape(r.count),
				csvEscape(r.distinctCount),
				csvEscape(r.mostCommon),
				csvEscape(r.instabilityPercent + "%"),
				csvEscape(r.firstSeen),
				csvEscape(r.lastSeen),
				csvEscape(r.firstSeenDistinct),
				csvEscape(r.lastSeenDistinct),
				csvEscape(r.examples.join(" | ")),
				csvEscape(r.flagged ? "1" : "0"),
				csvEscape(timeSeriesStr),
			].join(",")
		);
	}
	await fs.writeFile(
		path.join(OUT_DIR, "selector-report.csv"),
		csvRows.join("\n"),
		"utf8"
	);

	const mdLines = [];
	mdLines.push(`# Selector monitor report`);
	mdLines.push("");
	mdLines.push(`Generated: ${summary.generatedAt}`);
	mdLines.push("");
	mdLines.push(
		`Total calls: **Reported ${summary.reportedTotalCalls} · Raw examples occurrences ${summary.examplesOccurrencesSum} · Globally unique ${summary.uniqueExamplesTotal} · Sum distinct per-selector ${summary.sumDistinctPerSelector} · Selectors ${summary.uniqueSelectorsCount}**`
	);
	mdLines.push("");
	mdLines.push(
		"|Selector|CountReported|CountUnique|DistinctInputsCount|MostCommonInput|InstabilityPercent|FirstSeen|LastSeen|firstSeenDistinct|lastSeenDistinct|Flagged|ExamplesSample|"
	);
	mdLines.push("|---|---:|---:|---:|---|---:|---|---:|---|---:|---:|");

	function mdEscapeCell(s) {
		if (s == null) return "";
		return String(s).replace(/\|/g, "&#124;");
	}

	for (const r of rows) {
		const examplesMd = (r.examples || [])
			.map((s) => mdEscapeCell(s))
			.join("<br/>");
		mdLines.push(
			`|${mdEscapeCell(r.selector)}|${r.count}|${
				r.distinctCount
			}|${mdEscapeCell(r.mostCommon)}|${r.instabilityPercent}%|${mdEscapeCell(
				r.firstSeen
			)}|${mdEscapeCell(r.lastSeen)}|${mdEscapeCell(
				r.firstSeenDistinct
			)}|${mdEscapeCell(r.lastSeenDistinct)}|${
				r.flagged ? "⚑" : ""
			}|${examplesMd}|`
		);
	}

	await fs.writeFile(
		path.join(OUT_DIR, "selector-report.md"),
		mdLines.join("\n"),
		"utf8"
	);

	await fs.writeFile(
		path.join(OUT_DIR, "selector-report.html"),
		buildHTML(summary),
		"utf8"
	);

	console.log("Reports written to", OUT_DIR);
	console.log("reportedTotalCalls (sum of workers):", reportedTotalCalls);
	console.log(
		"examplesOccurrencesSum (raw examples occurrences across workers):",
		examplesOccurrencesSum
	);
	console.log(
		"uniqueExamplesTotal (globally unique signatures):",
		uniqueExamplesTotal
	);
	console.log(
		"sumDistinctPerSelector (sum of distinctCount across selectors):",
		sumDistinctPerSelector
	);
	console.log("uniqueSelectors (distinct selectors):", uniqueSelectorsCount);
	console.log("per-worker files:");
	for (const f of monitorFiles) {
		try {
			const raw = await fs.readFile(f, "utf8");
			const j = JSON.parse(raw);
			console.log(`  - ${f} -> reportedTotalCalls=${j.totalCalls || 0}`);
		} catch (e) {
			console.log(`  - ${f} -> (error reading)`);
		}
	}
	console.log("per-selector unique examples (for debug):");
	for (const r of rows) {
		console.log(
			`  selector ${r.selector} -> uniqueExamples=${r.distinctCount}`
		);
	}

	console.log("[selectorReport] Report generated");
}

function buildHTML(summary) {
	const rows = summary.rows;
	const flagRule = "Instability >= 40% AND count >= 3";

	const header = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Selector Monitor Report</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;margin:18px;color:#111}
  h1{margin-bottom:6px}
  .small{font-size:13px;color:#555}
  table{border-collapse:collapse;width:100%}
  th,td{border:1px solid #efefef;padding:8px;vertical-align:top}
  th{background:#fafafa;text-align:left;position:sticky;top:0;z-index:2}
  .legend{display:flex;gap:12px;align-items:center;margin-top:8px;flex-wrap:wrap}
  .legend .box{width:18px;height:18px;border-radius:3px}
  .flagged { background: #fff2f2; }
  .controls{position:fixed;right:12px;top:80px; background:#fff;padding:8px;border:1px solid #eee;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.06);max-width:260px}
  td.examples{max-width:300px;white-space:normal;word-break:break-word}
  pre{max-height:320px;overflow:auto;background:#f6f7f8;padding:8px}
  .heatbar{width:20px;height:140px;border-radius:4px;display:inline-block;vertical-align:middle;margin-right:6px}
  @media (max-width:1000px){ .controls{position:static;margin-bottom:12px}}
</style>
</head>
<body>
<h1>Selector Monitor Report</h1>
<div class="small">Generated: ${
		summary.generatedAt
	} · Reported calls: <strong>${
		summary.reportedTotalCalls
	}</strong> · Raw examples occurrences: <strong>${
		summary.examplesOccurrencesSum
	}</strong> · Globally unique signatures: <strong>${
		summary.uniqueExamplesTotal
	}</strong> · Sum distinct per-selector: <strong>${
		summary.sumDistinctPerSelector
	}</strong> · Unique selectors: <strong>${
		summary.uniqueSelectorsCount
	}</strong> · lastUpdated: ${summary.lastUpdated}</div>

<div style="margin-top:8px">
  <strong>Legend & thresholds</strong>
  <div class="legend" style="margin-top:6px">
    <div style="display:flex;gap:8px;align-items:center"><div class="box" style="background:${heatColorFromPercent(
			12
		)}"></div><div class="small">0–25% — low (green)</div></div>
    <div style="display:flex;gap:8px;align-items:center"><div class="box" style="background:${heatColorFromPercent(
			30
		)}"></div><div class="small">25–50% — medium (yellow)</div></div>
    <div style="display:flex;gap:8px;align-items:center"><div class="box" style="background:${heatColorFromPercent(
			60
		)}"></div><div class="small">50–75% — high (orange)</div></div>
    <div style="display:flex;gap:8px;align-items:center"><div class="box" style="background:${heatColorFromPercent(
			90
		)}"></div><div class="small">75–100% — critical (red)</div></div>
  </div>
  <div class="small" style="margin-top:6px">Flag rule: <strong>${flagRule}</strong></div>
</div>

<div class="controls" id="controls">
  <div style="margin-bottom:6px"><strong>Sort by:</strong></div>
  <div style="display:flex;gap:6px;flex-wrap:wrap">
    <button data-sort="count">count</button>
    <button data-sort="instability">instability</button>
    <button data-sort="heat">heat</button>
    <button data-sort="selector">selector</button>
  </div>
  <div style="margin-top:8px">
    <label><input type="checkbox" id="showFlaggedOnly"> show flagged only</label>
    <span id="flagCount" style="margin-left:8px"></span>
  </div>
</div>

<table id="reportTable" style="margin-top:12px">
<thead><tr>
  <th>Selector</th>
  <th>Count</th>
  <th>DistinctInputs</th>
  <th>MostCommonInput</th>
  <th>Instability%</th>
  <th>First seen</th>
  <th>Last seen</th>
  <th>firstSeenDistinct</th>
  <th>lastSeenDistinct</th>
  <th>Examples (sample)</th>
  <th>Heat</th>
  <th>Flag</th>
  <th>TimeSeries</th>
</tr></thead>
<tbody>
`;

	const bodyRows = rows
		.map((r) => {
			const color = heatColorFromPercent(r.instabilityPercent);
			const examplesHtml = (r.examples || [])
				.map((e) => `<div>${escapeHtml(e)}</div>`)
				.join("");
			const tsHtml = (r.timeSeries || [])
				.map((t) => `${escapeHtml(t.day)}:${t.newVariants}`)
				.join("<br/>");
			return `<tr data-flag="${r.flagged ? "1" : "0"}" class="${
				r.flagged ? "flagged" : ""
			}">
<td>${escapeHtml(r.selector)}</td>
<td style="text-align:right">${r.count}</td>
<td style="text-align:right">${r.distinctCount}</td>
<td>${escapeHtml(r.mostCommon)}</td>
<td style="text-align:right">${r.instabilityPercent}%</td>
<td>${escapeHtml(r.firstSeen)}</td>
<td>${escapeHtml(r.lastSeen)}</td>
<td>${escapeHtml(r.firstSeenDistinct)}</td>
<td>${escapeHtml(r.lastSeenDistinct)}</td>
<td class="examples">${examplesHtml}</td>
<td style="text-align:center">
  <div style="display:flex;align-items:center;gap:6px;justify-content:center">
    <div class="heatbar" style="background:${color}"></div><div class="small">${
				r.instabilityPercent
			}%</div>
  </div>
</td>
<td style="text-align:center">${r.flagged ? "⚑" : ""}</td>
<td>${tsHtml}</td>
</tr>`;
		})
		.join("\n");

	const footer = `
</tbody>
</table>

<h3 class="small">Raw summary (JSON)</h3>
<pre>${escapeHtml(JSON.stringify(summary, null, 2))}</pre>

<script>
(function(){
  const tbody = document.querySelector('#reportTable tbody');
  const rowsArr = Array.from(tbody.rows);
  const flagCountEl = document.getElementById('flagCount');
  const showFlaggedOnly = document.getElementById('showFlaggedOnly');

  function updateFlagCount(){
    const count = rowsArr.filter(r => r.getAttribute('data-flag') === '1').length;
    flagCountEl.textContent = 'flagged: ' + count;
  }
  updateFlagCount();

  function showOnlyFlagged(on){
    rowsArr.forEach(r => {
      const flagged = r.getAttribute('data-flag') === '1';
      r.style.display = (!on || flagged) ? '' : 'none';
    });
  }
  showFlaggedOnly.addEventListener('change', e => showOnlyFlagged(e.target.checked));

  document.querySelectorAll('[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-sort');
      const sorted = rowsArr.slice().sort((a,b) => {
        const aCells = Array.from(a.cells).map(c => c.textContent.trim());
        const bCells = Array.from(b.cells).map(c => c.textContent.trim());
        if (key === 'count') return (+bCells[1]) - (+aCells[1]);
        if (key === 'instability') return parseInt(bCells[4]) - parseInt(aCells[4]);
        if (key === 'heat') {
          return parseInt(bCells[10]) - parseInt(aCells[10]);
        }
        if (key === 'selector') return aCells[0].localeCompare(bCells[0]);
        return 0;
      });
      sorted.forEach(r => tbody.appendChild(r));
    });
  });
})();
</script>
</body>
</html>
`;

	return header + bodyRows + footer;
}

if (
	import.meta.url === `file://${process.argv[1]}` ||
	import.meta.url.endsWith(path.basename(process.argv[1] || ""))
) {
	main().catch((err) => {
		console.error(err && err.stack ? err.stack : err);
		process.exit(1);
	});
}

export { main };
