# Architecture Overview

This document describes the current architecture of the **UI Mobile Automation (WDIO + Appium)** framework and how its core subsystems interact.

The architecture is designed to support **multiple execution environments**, **stable reporting**, and future **AI-augmented testing layers**.

---

## High-Level Architecture

Tests (Mocha)
↓
Screen / Page Objects (POM)
↓
WebdriverIO
↓
Appium
↓
Execution Backend
├─ Local Android Emulator (Android Studio)
├─ Local iOS Simulator (Xcode) [planned]
└─ BrowserStack App Automate

### 🔹 Why this order?

This diagram is intentionally ordered **from top to bottom by intent and responsibility**, not by technical stack or runtime layering.

- **Tests (Mocha)** are placed first because they represent the **entry point of intent**:  
  they define _what_ the system should do and describe business scenarios.

- **Screen / Page Objects (POM)** come next as an **interpretation layer**:  
  they translate test intent into UI-level actions while shielding tests from selectors and driver specifics.

- **WebdriverIO** acts as the **orchestration layer**, handling session lifecycle and command routing, without awareness of business meaning.

- **Appium** is a **protocol executor**, converting WebDriver commands into native mobile automation actions.

- **Execution Backends** (Android Emulator, iOS Simulator, BrowserStack) form the **physical execution environment**, not the logical system itself.

This order reflects the **direction of meaning and dependency**:

> intent → abstraction → orchestration → execution → environment

rather than a simple dependency or library stack.

---

## Core Layers

### 1. Test Layer

- Mocha-based test specifications
- Business-oriented test names
- No infrastructure logic inside tests

Responsibilities:

- express intent
- describe behavior
- remain environment-agnostic

---

### 2. Screen / Page Object Layer (POM)

- Encapsulates UI interactions
- Centralizes selectors
- Hides Appium/WebdriverIO specifics from tests

This layer is shared across all execution environments.

---

### 3. Orchestration Layer (WDIO + Appium)

- Controls session lifecycle
- Manages capabilities
- Provides hooks (`beforeTest`, `afterTest`, etc.)

WDIO configuration is split into:

- shared config (framework-level)
- environment-specific configs (local, BrowserStack)

---

### 4. Execution Backends

The framework supports **multiple interchangeable execution backends**:

#### Local Execution

- Android Studio Emulator
- Xcode Simulator (planned)

Used for:

- development
- debugging
- fast feedback loops

#### Remote Execution (BrowserStack)

- Real devices in the cloud
- Video recording
- Session-level screenshots

BrowserStack is treated as **one of several execution environments**, not as a reporting or architectural authority.

---

## Reporting Architecture (Allure)

Allure acts as a **unified reporting layer** across all environments.

Responsibilities:

- test metadata (feature, story, severity)
- semantic steps
- attachments (screenshots, logs)

Design principles:

- reporting is environment-independent
- no direct dependency on BrowserStack APIs
- Allure reflects test intent, not infrastructure noise

---

## Selector Monitoring (Opt-In Subsystem)

Selector monitoring is an **optional analytics subsystem**:

- enabled via contract
- completely disabled by default
- zero impact on execution when off

Purpose:

- detect selector instability
- support refactoring decisions
- prepare data for future AI-based locator strategies

---

## Design Principles

- **Environment agnostic tests**
- **Single responsibility per layer**
- **Opt-in infrastructure features**
- **Fail-safe reporting**
- **No hard dependency on any vendor**

---

## Explicit Non-Goals

- BrowserStack-specific test logic
- Allure lifecycle hacking
- Tight coupling between reporting and execution backend

---

## Evolution Path

This architecture is intentionally prepared for:

- AI-assisted locator generation
- self-healing selectors
- execution analytics
- cross-platform scaling (Android + iOS)

See:

- `docs/known-limitations.md`
- `docs/adr/`
