# Test Infrastructure & Philosophy — "نحو الأفضل" (To Top)

## 1. Test Philosophy & Core Principles

The test architecture for **نحو الأفضل** adheres to modern end-to-end and integration testing standards:

1. **Determinism over Flakiness**:
   - Zero tolerance for `sleep()` or arbitrary wall-clock timers.
   - Tests assert on contract state, deterministic astronomical calculations, CSS token evaluations, and mock event hooks.
2. **Authoritative Expected Output Derivation**:
   - Every expectation is derived strictly from `ORIGINAL_REQUEST.md` and `PROJECT.md`.
   - Test oracles include standard astronomical prayer calculation formulas, Android 14+ permission manifests, and WCAG 2.1 color contrast standards.
3. **Progressive Testability & Milestone Alignment**:
   - Tests are structured so that implementing agents (M1, M2, M3) can run targeted tiers (`--tier <N>`) or the full suite (`node tests/run-all.js`) to get instant, pinpointed feedback on remaining requirements.
   - When all milestones are complete, 100% of tests pass to satisfy Milestone 4 (Final E2E Verification).
4. **Isolated Native Emulation**:
   - Native Capacitor plugins (`@capacitor/local-notifications` and `@capacitor/geolocation`) are validated both via native Android manifest/Gradle configurations and through lightweight in-memory spies and contract runners, guaranteeing test execution on any CI/CD environment without requiring a physical Android device or emulator.

---

## 2. Test Architecture & Directory Layout

```
tests/
├── helpers/
│   └── test-utils.js                 # Project file reader, CSS variable parser, WCAG contrast calculator, Capacitor mock harness
├── tier1_feature_coverage.test.js    # Tier 1: Feature Coverage & Interface Contracts (8 tests)
├── tier2_boundary_corner.test.js     # Tier 2: Boundary & Corner Cases (6 tests)
├── tier3_cross_feature.test.js       # Tier 3: Cross-Feature Combinations & Integration (5 tests)
├── tier4_real_world_scenarios.test.js# Tier 4: Real-World Scenarios & Full Lifecycles (4 tests)
└── run-all.js                        # Unified test runner with CLI tier filtering & ANSI reporting
```

---

## 3. The 4-Tier Test Taxonomy

### Tier 1: Feature Coverage & Interface Contracts (8 Tests)
Evaluates foundational declarations, configuration files, service exports, and structural layout:
- **1.1 Android Native Permissions**: Asserts `AndroidManifest.xml` declares `POST_NOTIFICATIONS`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM`, and `RECEIVE_BOOT_COMPLETED`.
- **1.2 Capacitor Plugins Gradle & Settings**: Asserts that `capacitor-local-notifications` and `capacitor-geolocation` are linked in Android build configurations.
- **1.3 notificationService Contract**: Asserts `src/services/notificationService.js` exists and exports `requestNotificationPermission`, `scheduleTaskNotification`, `cancelTaskNotification`, `schedulePrayerNotifications`, `testNotification`, `getPendingNotifications`.
- **1.4 locationService Contract**: Asserts `src/services/locationService.js` exists and exports `getCurrentLocation`, `getDefaultLocation`.
- **1.5 prayerService Contract**: Asserts `src/services/prayerService.js` exists and exports `calculatePrayerTimes`, `getNextPrayer`.
- **1.6 UI/UX Soothing Slate Palette**: Asserts `src/index.css` defines dark mode background as deep soothing slate (`#0c0f17`) rather than OLED pitch black (`#030303`), and soft primary text (`#f1f5f9`) rather than stark white glare.
- **1.7 Ergonomic 5-Tab Mobile Navigation**: Asserts `src/App.jsx` adopts a 5-tab mobile structure (Dashboard/Home, Worship, Organizer, Goals/Focus, More) eliminating 10-item scrolling bottom navigation.
- **1.8 Local Notification Scheduling Logic**: Asserts codebase contains explicit calls to `@capacitor/local-notifications` `schedule` method for tasks and prayer times.

### Tier 2: Boundary & Corner Cases (6 Tests)
Evaluates input validation, failure edges, and boundary behavior:
- **2.1 Notification Scheduling Boundary Inputs**: Asserts `scheduleTaskNotification` gracefully handles empty task text, null or missing times, and invalid time strings without unhandled crashes.
- **2.2 Task Cancellation Boundary IDs**: Asserts `cancelTaskNotification` handles non-existent IDs, string IDs, and null IDs without throwing.
- **2.3 Geolocation Failure & Fallback**: Asserts `getCurrentLocation` falls back gracefully to default Makkah coordinates (`lat: ~21.4225, lng: ~39.8262`) with `isFallback: true` upon permission denial or offline timeout.
- **2.4 Prayer Calculation Edge Dates & Coordinates**: Asserts `calculatePrayerTimes` produces valid formatted times (`HH:MM`) across solstices, leap days, Equator, and northern latitudes.
- **2.5 Next Prayer Midnight Wrap-Around**: Asserts `getNextPrayer` correctly rolls over to Fajr of tomorrow with positive `timeRemainingMs` when current time is after Isha.
- **2.6 Typography Scale & Padding Boundaries**: Asserts `h1` does not exceed `2.2rem` and eliminates cumulative `88px` nested panel paddings that cause mobile overflow.

### Tier 3: Cross-Feature Combinations & Integration (5 Tests)
Evaluates inter-module data pipelines and rendering fidelity:
- **3.1 Task Addition -> Local Notification Scheduling**: Verifies adding a task with a time in Organizer dispatches a local notification schedule request with valid Android 32-bit ID and future trigger timestamp.
- **3.2 Task Completion/Deletion -> Notification Cancellation**: Verifies completing or removing a task cancels the scheduled notification.
- **3.3 Location Denial -> Fallback Coords -> Prayer Calculation -> Schedule 5 Alarms**: Verifies full chain from denied location to default Makkah calculation and scheduling of 5 daily prayer notifications.
- **3.4 RTL Logical Properties Compliance**: Verifies that cards and status indicators use RTL logical properties (`border-inline-start`, `margin-inline`) rather than physical `borderLeft` or `margin-left`.
- **3.5 Light & Dark Theme Contrast Ratios**: Measures WCAG 2.1 contrast ratios for both dark mode (`#0c0f17` / `#f1f5f9`) and light mode to ensure >= 4.5:1 readability and eye comfort.

### Tier 4: Real-World Scenarios & Full Lifecycles (4 Tests)
Simulates end-to-end user workflows and resilience:
- **4.1 Simulated Complete Daily Lifecycle**: Boots app, requests permissions, resolves location, computes 5 prayers, schedules alarms, schedules high-priority frog task ("مهمة الضفدع"), and marks task complete.
- **4.2 100% Offline Resilience**: Verifies prayer calculations execute completely offline with zero external network HTTP latency (< 500ms).
- **4.3 Concurrency & Notification ID Stress**: Adds 50 simultaneous tasks and verifies all generated notification IDs are positive 32-bit integers (`1 <= id <= 2147483647`) without collisions.
- **4.4 Navigation & App Shell State**: Verifies seamless view switching across primary and secondary tabs via `MoreModal`.

---

## 4. Test Runner & CLI Usage

### Running the Entire Suite
```bash
node tests/run-all.js
```
Or with native Node test runner:
```bash
node --test tests/*.test.js
```

### Running a Specific Tier
```bash
# Tier 1: Feature Coverage & Contracts
node tests/run-all.js --tier 1

# Tier 2: Boundary & Corner Cases
node tests/run-all.js --tier 2

# Tier 3: Cross-Feature Integration
node tests/run-all.js --tier 3

# Tier 4: Real-World Scenarios
node tests/run-all.js --tier 4
```

---

## 5. Milestone Verification Gates

| Milestone | Target Scope | Passing Tests Required |
|---|---|---|
| **M1: Native Config & Core Services** | AndroidManifest, cap sync, notificationService, locationService, prayerService | Tier 1 (1.1, 1.2, 1.3, 1.4, 1.5) & Tier 2 (2.1, 2.2, 2.3, 2.4, 2.5) |
| **M2: Feature Integration & Logic** | OrganizerView & WorshipView hooks, local notification scheduling, permission fallbacks | Tier 1 (1.8) & Tier 3 (3.1, 3.2, 3.3) & Tier 4 (4.1, 4.2, 4.3) |
| **M3: UI/UX Comprehensive Overhaul** | Deep slate palette (`#0c0f17`), 5-tab mobile nav, typography scaling, RTL logical styles | Tier 1 (1.6, 1.7) & Tier 2 (2.6) & Tier 3 (3.4, 3.5) & Tier 4 (4.4) |
| **M4: Final Verification & Hardening** | Full repository verification | **100% Green (23 / 23 Tests)** |

---

## 6. Coverage & Quality Thresholds

- **Interface Contract Coverage**: 100% of service methods exported and callable.
- **Contrast Comfort Ratio**: WCAG AA/AAA compliant (>= 4.5:1), without OLED pitch-black eye fatigue.
- **Android ID Compatibility**: 100% of notification IDs conform to Android 32-bit signed integer limits (`[1, 2147483647]`).
- **Sleep Discipline**: Exactly 0 `sleep()` or `waitForTimeout()` calls in test code.
