# Test Suite Ready — "نحو الأفضل" (To Top)

## 1. Test Suite Status
- **Status**: **READY FOR EXECUTION**
- **Test Framework**: Node.js Native Test Runner (`node:test`, `node:assert/strict`) — Zero external runtime dependencies.
- **Node Version**: v26.4.0+
- **Total Test Files**: 4 test files + 1 helper utility + 1 unified runner.
- **Total Automated Tests**: **23 Tests across 4 Tiers**.

---

## 2. Runner Commands

### Run Full 4-Tier Test Suite
```bash
node tests/run-all.js
```
Or via standard Node runner:
```bash
node --test tests/*.test.js
```

### Run Individual Tiers
```bash
# Tier 1: Feature Coverage & Interface Contracts (8 tests)
node tests/run-all.js --tier 1

# Tier 2: Boundary & Corner Cases (6 tests)
node tests/run-all.js --tier 2

# Tier 3: Cross-Feature Combinations & Integration (5 tests)
node tests/run-all.js --tier 3

# Tier 4: Real-World Scenarios & Full Lifecycles (4 tests)
node tests/run-all.js --tier 4
```

---

## 3. Tier Breakdown & Test Inventory

| Tier | Focus | Test Count | Key Invariants Verified |
|---|---|---|---|
| **Tier 1** | Feature Coverage | **8** | Android permissions in `AndroidManifest.xml`, Gradle plugin linking, `notificationService` contract, `locationService` contract, `prayerService` contract, Deep slate `#0c0f17` tokens, 5-tab mobile nav, explicit calls to `@capacitor/local-notifications` `schedule`. |
| **Tier 2** | Boundary & Corner | **6** | Graceful rejection/handling of null/empty/invalid times & tasks, safe non-existent ID cancellation, geolocation denial with Makkah fallback (`isFallback: true`), prayer calculation edge dates & high latitudes, midnight next-prayer rollover to Fajr, typography scaling (`h1 <= 2.2rem`) and absence of 88px nested padding. |
| **Tier 3** | Cross-Feature Combinations | **5** | Organizer task creation -> `LocalNotifications.schedule` invocation, task completion/deletion -> `cancelTaskNotification` invocation, location denial -> fallback coords -> prayer calculation -> 5 prayer notifications scheduled, RTL logical properties (`border-inline-start`), WCAG 2.1 contrast ratios (>= 4.5:1) for dark & light themes. |
| **Tier 4** | Real-World Scenarios | **4** | Full daily user lifecycle simulation, 100% offline prayer engine resilience (< 500ms synchronous math, 0 external network requests), concurrency stress test (50 concurrent tasks generating valid 32-bit positive integer IDs `[1, 2147483647]`), multi-view navigation & modal sheet switching. |
| **TOTAL** | **Comprehensive Suite** | **23** | **Full Milestone Coverage** |

---

## 4. Milestone Verification Mapping

Workers and reviewing agents should run these tiers to verify milestone completion:

- **Milestone 1 (Native Config & Core Services)**:
  - Run `node tests/run-all.js --tier 1` and `node tests/run-all.js --tier 2`
  - Targets: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5
- **Milestone 2 (Feature Integration & Logic)**:
  - Run `node tests/run-all.js --tier 3` and `node tests/run-all.js --tier 4`
  - Targets: 1.8, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3
- **Milestone 3 (UI/UX Comprehensive Overhaul)**:
  - Run `node tests/run-all.js --tier 1`, `--tier 2`, and `--tier 3`
  - Targets: 1.6, 1.7, 2.6, 3.4, 3.5, 4.4
- **Milestone 4 (Final Verification & Hardening Gate)**:
  - Run `node tests/run-all.js`
  - Target: **23 / 23 Tests PASSING (100% Green)**.
