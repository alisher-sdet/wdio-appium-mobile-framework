// src/utils/selectorMonitor.js
import path from "path";
import fs from "fs";
import { SelectorMonitorContract as C } from "./selectorMonitorContract.js";

// const ENABLE = !!(process.env.SELECTOR_MONITOR || process.env.DEBUG_SELECTORS);
const ENABLE = process.env.SELECTOR_MONITOR === "1";

// default to ./artifacts unless overridden
// const OUT_DIR = process.env.SELECTOR_MONITOR_PATH || path.join(process.cwd(), "artifacts");
const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd(); // fallback для safety

const OUT_DIR =
	process.env.SELECTOR_MONITOR_PATH || path.join(PROJECT_ROOT, "artifacts");

const WORKER_ID = process.env.WDIO_WORKER_ID || String(process.pid || "main");

function safeWriteFile(filePath, obj) {
	const tmp = filePath + ".tmp";
	// sync to avoid race in worker flush
	fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf8");
	fs.renameSync(tmp, filePath);
}

const emptyTemplate = {
	totalCalls: 0,
	byPlatform: { android: 0, ios: 0, unknown: 0 },
	// legacy simple map kept for backward compatibility,
	// but main info will be in bySelectedMeta
	bySelected: {},
	bySelectedMeta: {},
	lastUpdated: null,
};

function ensureDir(dir) {
	try {
		fs.mkdirSync(dir, { recursive: true });
	} catch (e) {
		// ignore
	}
}

const NOOP_MONITOR = {
	record() {},
	dump() {
		return null;
	},
};

class SelectorMonitor {
	constructor() {
		// this.enabled = ENABLE;
		this.enabled = C.isEnabled();
		if (!this.enabled) return; // ⛔️ НИЧЕГО НЕ ДЕЛАЕМ

		this.OUT_DIR = C.artifactsDir();
		// ensure base artifacts directory exists (so writer can create worker files there)
		// ensureDir(OUT_DIR);
		ensureDir(this.OUT_DIR);
		// worker file placed inside OUT_DIR
		this.workerFile = path.resolve(
			OUT_DIR,
			`selector-monitor-worker-${WORKER_ID}.json`
		);

		this.data = JSON.parse(JSON.stringify(emptyTemplate));
		// load existing worker file if present
		try {
			if (fs.existsSync(this.workerFile)) {
				const raw = fs.readFileSync(this.workerFile, "utf8");
				const parsed = JSON.parse(raw);
				if (parsed && typeof parsed === "object") this.data = parsed;
			}
		} catch (e) {
			// ignore
		}
	}

	_nowISO() {
		return new Date().toISOString();
	}

	/**
	 * record(entry)
	 * entry: {
	 *   platform: "android"|"ios"|"unknown",
	 *   chosen: "<selector string>",
	 *   input?: "<original selector input>",
	 *   kind?: "s"|"ss"|"$"|"...",
	 *   ctx?: {file,line,stack} // optional
	 * }
	 */
	record(entry = {}) {
		if (!this.enabled) return;
		const now = this._nowISO();
		this.data.totalCalls = (this.data.totalCalls || 0) + 1;

		const platform = entry.platform || "unknown";
		this.data.byPlatform[platform] = (this.data.byPlatform[platform] || 0) + 1;

		const chosen = String(entry.chosen || entry.input || "unknown");
		// legacy simple counter (keeps compatibility)
		this.data.bySelected[chosen] = (this.data.bySelected[chosen] || 0) + 1;

		// rich metadata per selector
		const meta = this.data.bySelectedMeta[chosen] || {
			count: 0,
			firstSeen: now,
			lastSeen: now,
			platforms: { android: 0, ios: 0, unknown: 0 },
			examples: [], // store small examples of input/context
			kinds: {}, // counts by kind (s, ss, $)
		};

		meta.count = (meta.count || 0) + 1;
		meta.lastSeen = now;
		// firstSeen preserved if existed
		if (!meta.firstSeen) meta.firstSeen = now;

		meta.platforms[platform] = (meta.platforms[platform] || 0) + 1;

		const kind = entry.kind || "unknown";
		meta.kinds[kind] = (meta.kinds[kind] || 0) + 1;

		if (entry.input || entry.ctx) {
			const ex = {
				seenAt: now,
				input: entry.input || null,
				kind: kind,
				ctx: entry.ctx || null,
			};
			meta.examples = meta.examples || [];
			// keep at most 3 examples
			meta.examples.unshift(ex);
			if (meta.examples.length > 3) meta.examples.length = 3;
		}

		this.data.bySelectedMeta[chosen] = meta;
		this.data.lastUpdated = now;

		// immediate per-worker flush (atomic)
		try {
			safeWriteFile(this.workerFile, this.data);
		} catch (e) {
			// don't break tests
			// eslint-disable-next-line no-console
			console.warn(
				"[selectorMonitor] write worker file failed:",
				e && e.message
			);
		}
	}

	/**
	 * Merge all worker files into one aggregated file.
	 * Writes summary to ./artifacts/selector-report/selector-report-summary.json
	 * Also keeps legacy `selector-monitor-after-wdio.json` in OUT_DIR for compatibility.
	 */
	dump() {
		const outSummaryDir = path.resolve(OUT_DIR, "selector-report");
		ensureDir(outSummaryDir);

		const legacyOut = path.resolve(OUT_DIR, "selector-monitor-after-wdio.json");
		const summaryOut = path.resolve(
			outSummaryDir,
			"selector-report-summary.json"
		);

		if (!this.enabled) {
			// // write empty summary
			// safeWriteFile(summaryOut, emptyTemplate);
			// // also write legacy file for backward compat
			// safeWriteFile(legacyOut, emptyTemplate);
			// return { summary: summaryOut, legacy: legacyOut };
			return null;
		}

		// read worker files from OUT_DIR
		let files = [];
		try {
			files = fs
				.readdirSync(OUT_DIR)
				.filter(
					(f) => f.startsWith("selector-monitor-worker-") && f.endsWith(".json")
				);
		} catch (e) {
			files = [];
		}

		const agg = {
			totalCalls: 0,
			byPlatform: {},
			bySelected: {},
			bySelectedMeta: {},
			lastUpdated: null,
		};

		for (const f of files) {
			try {
				const raw = fs.readFileSync(path.resolve(OUT_DIR, f), "utf8");
				const parsed = JSON.parse(raw);
				if (!parsed) continue;

				agg.totalCalls += Number(parsed.totalCalls || 0);

				// byPlatform
				for (const k of Object.keys(parsed.byPlatform || {})) {
					agg.byPlatform[k] =
						(agg.byPlatform[k] || 0) + Number(parsed.byPlatform[k] || 0);
				}

				// simple bySelected merge
				for (const s of Object.keys(parsed.bySelected || {})) {
					agg.bySelected[s] =
						(agg.bySelected[s] || 0) + Number(parsed.bySelected[s] || 0);
				}

				// merge rich meta
				for (const s of Object.keys(parsed.bySelectedMeta || {})) {
					const src = parsed.bySelectedMeta[s];
					const cur = agg.bySelectedMeta[s] || {
						count: 0,
						firstSeen: src.firstSeen || null,
						lastSeen: null,
						platforms: {},
						examples: [],
						kinds: {},
					};

					cur.count = (cur.count || 0) + Number(src.count || 0);

					// firstSeen: min
					if (
						!cur.firstSeen ||
						(src.firstSeen && src.firstSeen < cur.firstSeen)
					)
						cur.firstSeen = src.firstSeen;

					// lastSeen: max
					if (!cur.lastSeen || (src.lastSeen && src.lastSeen > cur.lastSeen))
						cur.lastSeen = src.lastSeen || cur.lastSeen;

					// platforms
					for (const p of Object.keys(src.platforms || {})) {
						cur.platforms[p] =
							(cur.platforms[p] || 0) + Number(src.platforms[p] || 0);
					}

					// kinds
					for (const k of Object.keys(src.kinds || {})) {
						cur.kinds[k] = (cur.kinds[k] || 0) + Number(src.kinds[k] || 0);
					}

					// merge examples - keep newest first, unique by input+kind
					const mergedExamples = (cur.examples || []).concat(
						src.examples || []
					);
					const seen = new Set();
					const uniq = [];
					for (const e of mergedExamples) {
						const key = JSON.stringify({ input: e.input, kind: e.kind });
						if (seen.has(key)) continue;
						seen.add(key);
						uniq.push(e);
						if (uniq.length >= 5) break; // keep up to 5 in aggregated file
					}
					cur.examples = uniq;

					agg.bySelectedMeta[s] = cur;
				}

				if (
					!agg.lastUpdated ||
					(parsed.lastUpdated && parsed.lastUpdated > agg.lastUpdated)
				) {
					agg.lastUpdated = parsed.lastUpdated;
				}
			} catch (e) {
				// continue on single-file errors
			}
		}

		// Ensure byPlatform keys exist
		agg.byPlatform.android = agg.byPlatform.android || 0;
		agg.byPlatform.ios = agg.byPlatform.ios || 0;
		agg.byPlatform.unknown = agg.byPlatform.unknown || 0;

		// Write aggregated file to report dir
		try {
			safeWriteFile(summaryOut, agg);
		} catch (e) {
			// eslint-disable-next-line no-console
			console.warn("[selectorMonitor] write summary failed:", e && e.message);
		}

		// Also write legacy file in OUT_DIR for backward compatibility
		try {
			safeWriteFile(legacyOut, agg);
		} catch (e) {
			// ignore
		}

		return { summary: summaryOut, legacy: legacyOut };
	}
}

// export const selectorMonitor = new SelectorMonitor();
// export default selectorMonitor;

let instance = null;

// export function getSelectorMonitor() {
// 	if (!instance) {
// 		instance = new SelectorMonitor();
// 	}
// 	return instance;
// }
export function getSelectorMonitor() {
	if (!ENABLE) return NOOP_MONITOR;

	if (!instance) {
		instance = new SelectorMonitor();
	}
	return instance;
}
