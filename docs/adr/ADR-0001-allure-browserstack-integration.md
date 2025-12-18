# ADR-0001: Allure and BrowserStack Integration Strategy

## Status

Accepted

## Context

The framework uses **WebdriverIO with Appium** to test a mobile application across multiple execution environments:

- local Android emulators
- future local iOS simulators
- BrowserStack App Automate (remote devices)

BrowserStack serves as:

- an execution backend
- a provider of runtime artifacts (video, screenshots)

Allure is used as a **unified reporting layer** across all environments.

BrowserStack SDK internally manages parts of the WebdriverIO lifecycle.

---

## Decision

We do **not** override or hook into Allure internal lifecycle events.

Instead:

- Allure is used only for semantic steps and metadata
- BrowserStack SDK is allowed to manage its internal hooks
- Session naming is done defensively via `browserstack_executor`

No attempt is made to enforce perfect Allure step hierarchy.

---

## Consequences

### Positive

- stable execution in CI
- predictable BrowserStack sessions
- no race conditions between SDKs
- environment-independent tests

### Negative

- Allure step nesting may appear visually inconsistent
- some runtime metadata is merged or omitted

These consequences are accepted as architectural trade-offs.

---

## Rationale

Stability and transparency are prioritized over cosmetic report tuning.

The framework avoids fragile integrations that depend on undocumented SDK behavior.

---

## Notes

Known limitations are documented in:
➡️ `docs/known-limitations.md`
