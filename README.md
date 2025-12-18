# UI Mobile Automation (WDIO + Appium)

## 📌 Overview

This repository contains an automated test framework for **Android mobile UI testing** based on:

- **WebdriverIO**
- **Appium**
- **Mocha**

The project also includes an optional **Selector Monitoring system** that collects selector usage during test runs and generates analytical reports.

## 📎 Documentation Notes

Some reporting and lifecycle behaviors are influenced by the interaction between WebdriverIO, Appium, BrowserStack SDK, and Allure.

Known and accepted limitations are documented here:  
➡️ **[Known Limitations](docs/known-limitations.md)**

---

## 🗂 Project Structure

```text
UI_MA_WD/
├─ app/android/                 # APK files
├─ config/                      # WDIO configuration files
│  ├─ wdio.android.conf.js
│  ├─ wdio.android.bs.conf.js
│  └─ wdio.shared.conf.js
├─ scripts/                     # Post-run scripts
│  └─ generate-selector-report.js
├─ src/
│  ├─ config/                   # Runtime configs (timeouts, etc.)
│  ├─ data/                     # Test data
│  ├─ screens/                  # Page / Screen Objects
│  ├─ selectors/                # Centralized selectors
│  └─ utils/
│     ├─ selector.js
│     ├─ selectorMonitor.js
│     └─ selectorMonitorContract.js
├─ test/specs/                  # Test specs
├─ artifacts/                   # Generated at runtime (ignored by git)
├─ package.json
└─ README.md
```

---

## ▶️ Running Tests

### Standard run (no selector monitoring)

```bash
npm run android
```

## ▶️ Execution Modes

The framework supports multiple execution and reporting modes depending on
environment and analysis needs:

- Local Android Emulator
- Local Android Emulator with Selector Monitoring
- BrowserStack App Automate
- BrowserStack App Automate with Enhanced Allure Layer

Each mode provides a different level of observability and artifacts.
Detailed commands and report differences are documented in:

- 📄 docs/execution-modes.md
- 📊 docs/reporting.md
- ⚠️ docs/known-limitations.md

### Run with selector monitoring enabled

```bash
SELECTOR_MONITOR=1 npm run android
```

What changes when monitoring is enabled:

- `artifacts/` directory is created
- per-worker selector JSON files are written
- aggregated selector reports are generated on completion

---

## 🧩 Selector Monitor — Concept

Selector Monitor is **opt-in infrastructure** used to:

- track how selectors are resolved at runtime
- detect selector instability
- collect examples for refactoring decisions

It is **disabled by default** and has **zero side effects** when turned off.

---

## 📜 Selector Monitor Contract

The contract defines **how selector monitoring is enabled and used**.

### Source

```
src/utils/selectorMonitorContract.js
```

### Responsibilities

- Single source of truth for feature toggle
- No WDIO or browser dependencies
- Used by configs, utils, and scripts

### Contract API (simplified)

```js
export const SelectorMonitorContract = {
	isEnabled() {
		return Boolean(process.env.SELECTOR_MONITOR || process.env.DEBUG_SELECTORS);
	},

	artifactsDir() {
		return process.env.SELECTOR_MONITOR_PATH || "artifacts";
	},
};
```

### Rules

- ❌ No direct `process.env.SELECTOR_MONITOR` checks outside the contract
- ✅ All guards must use `SelectorMonitorContract.isEnabled()`

---

## 🧠 selectorMonitor.js — Runtime Behavior

```js
import { getSelectorMonitor } from "./selectorMonitor.js";
```

Behavior:

- Lazy initialization (singleton per process)
- Writes **per-worker JSON files**
- Safe even in parallel runs
- Never throws — failures do not break tests

When disabled:

- No directories created
- No files written
- All calls are no-ops

---

## 📊 Reports

Generated only when selector monitoring is enabled.

Location:

```
artifacts/selector-report/
```

Includes:

- `selector-report-summary.json`
- `selector-report.csv`
- `selector-report.md`
- `selector-report.html`

Reports show:

- selector usage count
- instability percentage
- distinct inputs
- first / last seen timestamps

---

## ⚙️ WDIO Integration

### onPrepare

```js
if (!SelectorMonitorContract.isEnabled()) return;
process.env.PROJECT_ROOT = PROJECT_ROOT;
await fs.mkdir("artifacts", { recursive: true });
```

### onComplete

```js
if (!SelectorMonitorContract.isEnabled()) return;
execSync("node scripts/generate-selector-report.js", { stdio: "inherit" });
```

---

## 🧪 Design Principles

- **Opt-in infrastructure**
- **Single responsibility** per module
- **No globals** exposed to tests
- **No impact** on execution when disabled
- **Predictable artifacts**

---

## 📝 Notes

- `artifacts/` should be gitignored
- Selector Monitor is safe to keep enabled in CI
- Contract exists to prevent env-flag sprawl

---

## ✅ Status

- Selector monitoring: **implemented**
- Contract enforced: **yes**
- CI-safe: **yes**
- Parallel-safe: **yes**

---

> This README is intentionally kept fully Markdown without mixed shell/output blocks to ensure clean rendering in GitHub and VS Code.
