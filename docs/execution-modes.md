Execution Modes

This document describes how tests can be executed in different environments and
what level of observability and reporting each mode provides.

The framework intentionally supports multiple execution modes.
They are not variants of the same thing, but different operational layers
used at different stages of development and CI.

Conceptual Overview

Execution modes differ along three axes:

Execution environment
(local emulator vs real device in the cloud)

Instrumentation level
(plain test execution vs selector monitoring)

Reporting depth
(standard Allure vs enhanced, domain-oriented Allure)

Not all combinations are valid or useful.
The supported modes are deliberately constrained to avoid ambiguity.

Supported Modes
Summary
Mode Environment Selector Monitoring Allure Layer External Artifacts
Local Android Emulator No Standard None
Local Android + Monitoring Emulator Yes Standard Selector reports
BrowserStack Real device (cloud) No Standard Video, screenshots
BrowserStack + Enhanced Allure Real device (cloud) No Enhanced Video, screenshots
Local Android Emulator

This is the default development mode.

It is optimized for fast feedback, local debugging, and writing new tests.

Command

npm run android

Characteristics

Runs on a local Android emulator

Uses standard WebdriverIO + Allure integration

Produces a basic Allure report

No external artifacts (video, device metadata)

This mode is intentionally minimal.

Local Android Emulator with Selector Monitoring

This mode extends local execution with selector-level instrumentation.

It exists exclusively to support selector analysis and refactoring decisions.

Command

npm run android-monitor

Additional Behavior

Collects selector resolution data at runtime

Writes per-worker JSON artifacts

Generates aggregated selector reports on completion

Selector monitoring is fully opt-in and has no effect when disabled.

BrowserStack App Automate

This mode executes tests on real Android devices in the cloud.

It is used to validate behavior against real hardware and OS versions.

Command

npx wdio config/wdio.android.bs.conf.js

Characteristics

Runs on BrowserStack App Automate

Uses standard Allure reporting

BrowserStack provides:

session video

screenshots

device metadata

At this level, Allure is primarily a test result viewer, not a domain report.

BrowserStack with Enhanced Allure Layer

This is the highest observability mode in the framework.

It adds a thin, explicit Allure abstraction layer on top of BrowserStack execution.

Command

npx wdio config/wdio.android.bs.allure.conf.js

Additional Capabilities

Explicit domain-level steps (step(...))

Structured feature / story / severity metadata

Runtime labels (device, platform)

BrowserStack session name synchronized with test title

The enhanced Allure layer is purely additive:

no test logic changes

no WebdriverIO monkey-patching

no BrowserStack reporter coupling

Report Generation

For all modes that produce Allure results, reports are generated manually:

npx allure generate reports/allure-results -o reports/allure-report --clean
npx allure open reports/allure-report

BrowserStack videos and screenshots remain hosted by BrowserStack
and are linked via session metadata.

Why Multiple Modes Exist

Each execution mode serves a different lifecycle phase:

Local Android → fast feedback during development

Local + Monitoring → selector stability and maintenance

BrowserStack → real-device validation

BrowserStack + Enhanced Allure → production-grade reporting

Attempting to merge all of them into a single “universal” mode
would increase complexity without real benefit.

Related Documentation

📊 Reporting details: docs/reporting.md

⚠️ Known limitations: docs/known-limitations.md

🏗 Architecture overview: docs/architecture.md

📜 Architectural decision record: docs/adr/ADR-0001-allure-browserstack.md

Why this version is not rванный

One continuous story

Clear progression: concept → modes → details → rationale

No repeated command blocks scattered randomly

Tables used once, then explained

Each section answers one question only
