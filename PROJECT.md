# Project: نحو الأفضل (To Top) — Comprehensive Overhaul

## Architecture
- **Framework & Runtime**: React 19 SPA, Vite 8, JavaScript (ESM, JSX).
- **Mobile Container**: Capacitor 8 for Android (`@capacitor/android`, `@capacitor/core`, `@capacitor/local-notifications`, `@capacitor/geolocation`).
- **Backend & Storage**: Firebase Authentication + Cloud Firestore with offline persistence, plus browser `localStorage`.
- **Styling Architecture**: Semantic design tokens in `src/index.css` (soothing slate dark theme `#0c0f17`, refined light theme, responsive CSS logical properties).
- **Core Services**:
  - `src/services/notificationService.js`: Centralized native `@capacitor/local-notifications` wrapper with web notification fallback, permissions management, task and prayer notification scheduling.
  - `src/services/locationService.js`: Centralized `@capacitor/geolocation` wrapper with fallback coordinates (Makkah/Riyadh) on permission denial or offline state.
  - `src/services/prayerService.js`: Offline/online prayer calculation engine using `adhan` library or astronomical formulas, providing prayer times and triggering local notification schedules.
- **Navigation Architecture**: 5-Tab mobile bottom bar (Home, Worship, Organizer, Focus & Goals, More) in `src/App.jsx`.

## Code Layout
```
c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\
├── android/
│   └── app/src/main/AndroidManifest.xml     # Native Android permissions (M1)
├── src/
│   ├── services/
│   │   ├── notificationService.js          # Local notifications core service (M1)
│   │   ├── locationService.js              # Geolocation & fallback coords service (M1)
│   │   └── prayerService.js                # Offline prayer engine & scheduling (M1)
│   ├── components/
│   │   ├── Dashboard.jsx                   # Modernized compact dashboard (M3)
│   │   ├── MoreModal.jsx                   # Secondary navigation sheet for More tab (M3)
│   │   └── MessageModal.jsx                # Refined non-intrusive inspirational modal (M3)
│   ├── features/
│   │   ├── organizer/OrganizerView.jsx     # Task scheduler with notification hooks (M2, M3)
│   │   ├── worship/WorshipView.jsx         # Prayer hero card & offline calculation (M2, M3)
│   │   ├── goals/GoalsView.jsx             # Incremental progress tracker (M3)
│   │   ├── pomodoro/PomodoroView.jsx       # Calibrated timer & forest store (M3)
│   │   ├── thoughts/ThoughtsView.jsx       # Refined typography notes (M3)
│   │   ├── wisdom/WisdomView.jsx           # Clean books grid & takeaway cards (M3)
│   │   └── settings/SettingsView.jsx       # Permissions manager & theme controls (M2, M3)
│   ├── index.css                           # Unified design tokens & typography (M3)
│   ├── App.jsx                             # 5-tab navigation & global permission flows (M2, M3)
│   └── App.css                             # Cleaned / removed dead Vite template code (M3)
└── tests/
    └── e2e/                                # E2E automated test suite (Testing Track)
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Android Native Permissions | Declare POST_NOTIFICATIONS, ACCESS_FINE_LOCATION, SCHEDULE_EXACT_ALARM, RECEIVE_BOOT_COMPLETED in AndroidManifest.xml | M1 | Survey (Explorer 2) |
| 2 | Capacitor Gradle Sync | Run `npx cap sync android` to bind local-notifications & geolocation plugins to native Android Gradle | M1 | Survey (Explorer 2) |
| 3 | Local Notification Service | Create `notificationService.js` calling `@capacitor/local-notifications` `schedule`, `cancel`, `requestPermissions` | M1 | ORIGINAL_REQUEST §R2 |
| 4 | Location & Fallback Service | Create `locationService.js` wrapping `@capacitor/geolocation` with default coordinates fallback on denial | M1 | ORIGINAL_REQUEST §R3 |
| 5 | Offline Prayer Calculation Engine | Create `prayerService.js` with offline calculation (`adhan` formula) and sync with local notification scheduler | M1 | Survey (Explorer 2) |
| 6 | Task Notification Scheduling | Explicitly trigger `LocalNotifications.schedule` when tasks with time are added/edited in OrganizerView; cancel on delete/complete | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Prayer Time Notification Scheduling | Schedule daily prayer notifications (Fajr, Dhuhr, Asr, Maghrib, Isha) via `LocalNotifications.schedule` | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Comprehensive Permissions & Fallbacks | In-app permission prompts with graceful fallback UI, settings controls, and non-blocking error handling | M2 | ORIGINAL_REQUEST §R3 |
| 9 | Calibrated Dark & Light Color Palette | Deep slate background (`#0c0f17`), soft text (`#f1f5f9`), eliminate OLED pitch black glare and fix light mode contrast breaks | M3 | ORIGINAL_REQUEST §R1 |
| 10 | Ergonomic 5-Tab Mobile Navigation | Replace 10-item scrolling bottom bar with 5 clear tabs (Home, Worship, Organizer, Focus/Goals, More) | M3 | ORIGINAL_REQUEST §R1 |
| 11 | Typography & Padding Modernization | Scale down oversized headings (`h1` 1.5rem, timers 2.2rem), eliminate 88px nested paddings, sleek cards | M3 | ORIGINAL_REQUEST §R1 |
| 12 | RTL Logical CSS Compliance | Replace `borderLeft` and physical margins with CSS Logical Properties (`border-inline-start`, `margin-inline-end`) | M3 | Survey (Explorer 3) |
| 13 | Prayer View Next-Prayer Hero Card | Live countdown to next prayer, clean pill cards, pleasant daily spiritual experience | M3 | Survey (Explorer 3) |
| 14 | E2E Automated Verification & Finish Gate | Automated test suite verifying scheduling, permissions, build, and UI Finish-Gate Reviewer sign-off | M4 | ORIGINAL_REQUEST §Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Native Config & Core Services | AndroidManifest permissions, cap sync, notificationService, locationService, prayerService | None | PLANNED |
| M2 | Feature Integration & Logic | Hook notificationService into OrganizerView & WorshipView; permissions & fallback handling in App and Settings | M1 | PLANNED |
| M3 | UI/UX Comprehensive Overhaul | Palette calibration, 5-tab mobile navigation, typography/padding scaling, RTL logical styles, screen polish | M2 | PLANNED |
| M4 | Final Milestone: E2E Verification & Hardening | Pass 100% of E2E tests (Tiers 1-4) published in TEST_READY.md; adversarial hardening (Tier 5); UI Finish-Gate | M3, E2E-Track | PLANNED |

## Interface Contracts
### `notificationService` ↔ Features (`OrganizerView`, `WorshipView`, `SettingsView`)
```javascript
// Function Signatures
async function requestNotificationPermission(): Promise<{ granted: boolean, status: string }>
async function scheduleTaskNotification(task: { id: number|string, text: string, time: string, date?: string }): Promise<number|null>
async function cancelTaskNotification(taskId: number|string): Promise<void>
async function schedulePrayerNotifications(prayerTimes: Record<string, string>, coords?: { lat: number, lng: number }): Promise<number[]>
async function testNotification(): Promise<boolean>
async function getPendingNotifications(): Promise<any[]>
```

### `locationService` ↔ `prayerService` & `WorshipView`
```javascript
// Function Signatures
async function getCurrentLocation(): Promise<{ latitude: number, longitude: number, isFallback: boolean, city?: string }>
function getDefaultLocation(): { latitude: number, longitude: number, city: string } // Makkah default
```

### `prayerService` ↔ `WorshipView` & `Dashboard`
```javascript
// Function Signatures
function calculatePrayerTimes(coords: { latitude: number, longitude: number }, date?: Date): Record<string, string>
function getNextPrayer(prayerTimes: Record<string, string>): { name: string, time: string, timeRemainingMs: number }
```
