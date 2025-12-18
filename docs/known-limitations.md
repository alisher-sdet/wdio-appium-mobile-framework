# Known Limitations

This framework integrates **WebdriverIO**, **Appium**, **BrowserStack App Automate SDK**, and **Allure Reporter**.

Due to the interaction between these tools, several limitations exist. They are **known, documented, and accepted by design**, not accidental shortcomings.

The purpose of this document is to ensure **architectural transparency** and set correct expectations for test execution and reporting behavior.

---

## Allure Step Hierarchy Is Not Fully Deterministic

Allure supports only **one active step at a time**.  
At the same time, BrowserStack SDK internally executes technical commands (for example `executeScript`) that may implicitly open infrastructure-level steps.

As a result, user-defined Allure steps may appear:

- nested under SDK-related steps
- visually misaligned compared to source code order

This behavior is **not a bug** and cannot be fully overridden without breaking BrowserStack SDK integration.

**Design decision:**  
Allure steps are treated as **semantic markers**, not as a strict execution tree.

---

## BrowserStack SDK Partially Controls the Test Lifecycle

When running via BrowserStack App Automate, the SDK:

- manages session lifecycle
- injects internal hooks
- wraps WebdriverIO commands
- may skip or override certain WDIO hooks

Because of this:

- low-level Allure lifecycle hooks are intentionally **not used**
- custom lifecycle interception was removed to avoid race conditions
- reporting logic is kept declarative and defensive

**Design decision:**  
Prefer WDIO-native hooks and high-level Allure helpers over deep lifecycle manipulation.

---

## Runtime Labels Are Merged by Allure

Runtime metadata such as device, platform, or OS version may originate from multiple sources:

- BrowserStack
- WebdriverIO
- custom runtime labels

Allure may merge or deduplicate these labels, which can result in:

- visible `device` label
- missing or merged `platform` / `os_version` labels

This behavior is expected and does **not affect report correctness or traceability**.

---

## Perfect Step Flatness Is Explicitly Not a Goal

Forcing a perfectly flat Allure step tree would require:

- intrusive lifecycle hacks
- SDK interception
- unstable workarounds

This leads to fragile tests and inconsistent CI behavior.

**Architectural stance:**  
Stability, readability, and semantic clarity are prioritized over visual perfection.

---

## Summary

These limitations are a direct consequence of integrating mature but opinionated tools.

They are documented intentionally to ensure:

- predictable behavior
- stable CI execution
- transparent reporting semantics

The framework favors **robust architecture** over cosmetic report tuning.

---

## Multiple Reporting Modes

Currently, the framework supports multiple reporting modes depending on
execution environment.

This is intentional but has trade-offs:

- Allure reports differ slightly between local and BrowserStack runs
- BrowserStack videos are available only in cloud executions
- Selector monitoring is local-only at the moment

Unification of reporting layers is planned as part of Phase B/C.
