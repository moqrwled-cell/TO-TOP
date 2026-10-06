# Codebase & Architecture Survey Report

## 1. Observation

### 1.1 Tech Stack & Languages
- **Runtime / Framework**: React 19 (`react` ^19.2.7, `react-dom` ^19.2.7) running in client-side SPA mode (`index.html:10`, `src/main.jsx:10`).
- **Build Tool / Bundler**: Vite 8.1.5 (`vite` ^8.1.1, `@vitejs/plugin-react` ^6.0.3, `vite-plugin-pwa` ^1.3.0).
- **Language**: JavaScript (ES Modules `type: "module"` in `package.json:5`). Source files are `.jsx` and `.js`. TypeScript is not used for source implementation, although `@types/react` (^19.2.17) and `@types/react-dom` (^19.2.3) exist under `devDependencies` in `package.json:29-30`.
- **Hybrid / Mobile Wrapper**: Capacitor 8 (`@capacitor/android` ^8.5.2, `@capacitor/core` ^8.5.2, `@capacitor/cli` ^8.5.2, `@capacitor/geolocation` ^8.2.3, `@capacitor/local-notifications` ^8.3.1, `@capacitor/assets` ^3.0.5). Configured in `capacitor.config.json` with appId `"com.totop.app"`, appName `"نحو الأفضل"`, webDir `"dist"`.
- **Linter**: Oxlint (`oxlint` ^1.71.0 configured in `.oxlintrc.json`).
- **Icons**: Lucide React (`lucide-react` ^1.27.0).
- **Internationalization**: `i18next` (^26.3.6), `react-i18next` (^17.0.11), `i18next-browser-languagedetector` (^8.2.1).
- **Backend / Database**: Firebase Client SDK (`firebase` ^12.17.0) utilizing Firebase Authentication and Cloud Firestore with offline cache enabled (`src/firebase.js:25-28`).

### 1.2 Package Scripts & Test Infrastructure
From `package.json:6-11`:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "oxlint",
  "preview": "vite preview"
}
```
- `npm run build`: **EXISTS** and passes cleanly (`vite build` exited 0, producing PWA service worker and production bundles in `dist/` in 5.96s).
- `npm run lint`: **EXISTS** (`oxlint` exited 0 with 0 errors and 34 warnings across 24 files).
- `npm test`: **DOES NOT EXIST**. There is no test runner (such as Vitest, Jest, or Playwright) defined in `package.json` scripts or dependencies.
- Package Manager: `npm` with `package-lock.json` (387 KB).

### 1.3 Project Directory Structure
```
c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\
├── .agents/
├── .oxlintrc.json
├── android/                   # Native Android Capacitor wrapper project
├── assets/                    # Project source graphic assets
├── capacitor.config.json      # Capacitor configuration
├── dev-dist/                  # Vite PWA dev distribution cache
├── dist/                      # Production build output
├── generate-icon.cjs          # Sharp script generating public/icon.jpg & PWA icons
├── index.html                 # HTML root with RTL direction and error boundary script
├── package.json               # Manifest & dependencies
├── package-lock.json          # Lockfile
├── public/                    # Static assets (icon.jpg, icon-192x192.jpg, icon-512x512.jpg)
├── refine-css.cjs             # Utility script adjusting UI padding/typography in index.css
├── src/                       # Application source root
│   ├── assets/                # hero.png, react.svg, vite.svg
│   ├── components/            # Shared view components
│   │   ├── Dashboard.jsx      # Main dashboard / landing screen
│   │   ├── ErrorBoundary.jsx  # React Class error boundary fallback
│   │   ├── LoginView.jsx      # Firebase Auth login/signup/reset UI
│   │   └── MessageModal.jsx   # 4-hour periodic inspirational modal
│   ├── contexts/              # Global state contexts
│   │   ├── AuthContext.jsx    # Auth state + Firestore user data sync
│   │   └── SettingsContext.jsx# Theme, language, and UI scale settings
│   ├── features/              # Feature modules
│   │   ├── goals/GoalsView.jsx           # Goal tracking & progress
│   │   ├── organizer/OrganizerView.jsx   # Task scheduling, routines, time blocking
│   │   ├── pomodoro/PomodoroView.jsx     # Focus timer, tree store, gamification
│   │   ├── prayers/                      # (Empty folder; prayers are in WorshipView)
│   │   ├── settings/SettingsView.jsx     # Settings UI
│   │   ├── support/SupportView.jsx       # Telegram bot support form
│   │   ├── thoughts/ThoughtsView.jsx     # Idea log (stored in localStorage)
│   │   ├── wisdom/WisdomView.jsx         # Book summaries & productivity insights
│   │   └── worship/WorshipView.jsx       # Prayer times, Quran reader, Adhkar counter
│   ├── locales/               # Translation JSON files
│   │   ├── ar.json            # Arabic strings
│   │   └── en.json            # English strings
│   ├── App.css                # Unused Vite template CSS
│   ├── App.jsx                # Root container, navigation tabs, native permission checks
│   ├── firebase.js            # Firebase App & Firestore config
│   ├── i18n.js                # i18next configuration
│   ├── index.css              # Global styles, CSS variables, glassmorphism, responsive styles
│   └── main.jsx               # React DOM entry point
└── vite.config.js             # Vite configuration with React and VitePWA plugins
```

### 1.4 Detailed Module Responsibilities
1. **Application Shell & Navigation (`src/App.jsx`, `src/main.jsx`)**:
   - `main.jsx`: Mounts React DOM with `<StrictMode>`, wrapped in `<ErrorBoundary>`, `<SettingsProvider>`, and `<AuthProvider>`.
   - `App.jsx`: Controls view switching with internal state (`activeTab` defaulted to `'dashboard'`). Features a desktop sidebar (`.sidebar.desktop-sidebar`) and a mobile bottom navigation bar (`.mobile-bottom-nav`).
   - Renders `LoginView` if unauthenticated, or an email verification prompt if email is not verified for password accounts.
   - On mount (`useEffect` lines 27-50), checks and requests permissions for `Geolocation` and `LocalNotifications`.
2. **Contexts (`src/contexts/`)**:
   - `AuthContext.jsx`: Handles user login, registration, password reset, and Google sign-in. Listens to Firestore `users/{uid}` via `onSnapshot` and provides `userData` (points, unlockedTrees, selectedTree, goals, tasks, routines, adhkarCounts) and `updateUserData` with optimistic local state update.
   - `SettingsContext.jsx`: Manages `theme` ('dark' / 'light'), `language` ('ar' / 'en'), and `uiScale` (0.85, 1, 1.15) with `localStorage` persistence and updates HTML attributes (`data-theme`, `dir`, `lang`, `--ui-scale`).
3. **Features (`src/features/`)**:
   - `Dashboard.jsx`: Shows dynamic time greeting (morning, noon, afternoon, evening, night), daily date in Arabic, stats cards (focus points, streak, completed tasks ratio), and navigation cards to Worship, Organizer, and Goals.
   - `WorshipView.jsx`: Contains 3 sub-tabs:
     - Prayer Times: Queries Aladhan API (`https://api.aladhan.com/v1/timings`) using user coordinates. Formats times in 12-hour AM/PM format.
     - Quran: Queries Alquran Cloud API (`https://api.alquran.cloud/v1/surah`) for list and specific surahs.
     - Adhkar: Pre-defined Morning, Evening, and General adhkar with click-increment counters synced to Firestore.
   - `OrganizerView.jsx`: Time-blocking task manager and daily routine tracker. Tasks are categorized by Daily, Weekly, Monthly with time assignment and "Eat that Frog" star priority.
   - `GoalsView.jsx`: Goal creator and achievement tracker with daily/weekly/monthly filters and deadline alerts.
   - `PomodoroView.jsx`: 25m, 40m, 60m, or custom minute focus timer with tree growth animation. Completing sessions awards focus points (1 pt/min) spendable in the "Forest Store" to unlock tree varieties.
   - `ThoughtsView.jsx`: Private notes/ideas capture categorized by reflections, project, inspiration, future task, stored in `localStorage` under `totop_thoughts`.
   - `WisdomView.jsx`: Curated summaries of 20 self-help/productivity books with actionable takeaways.
   - `SettingsView.jsx`: UI for toggling dark/light mode, language (Arabic/English), and font scale.
   - `SupportView.jsx`: Form sending support feedback directly to Telegram via Telegram Bot API (`sendMessage`).
   - `MessageModal.jsx`: Modal popup displaying random inspirational quotes every 4 hours using `localStorage` timestamp tracking.

### 1.5 Findings Relevant to User Requirements (R1, R2, R3)
1. **Notification System (R2 Requirement Gap)**:
   - `@capacitor/local-notifications` is imported in `App.jsx:20` solely for permission check/request (`checkPermissions()`, `requestPermissions()`).
   - Nowhere in the codebase is `@capacitor/local-notifications` `schedule` called!
   - In `OrganizerView.jsx:28-57`, notification alerting is implemented via a browser `setInterval` checking every 60 seconds using `new Notification(...)`, and only for `routine`, NOT for scheduled tasks!
   - In `WorshipView.jsx:89-123`, prayer notification alerting also uses a browser `setInterval` with `new Notification(...)` when the tab is open, which fails when the app is in the background or closed.
2. **Permissions Handling (R3 Requirement Status)**:
   - In `App.jsx:28-50`, startup permission requests exist for native platforms (`Geolocation.requestPermissions()` and `LocalNotifications.requestPermissions()`), but in `WorshipView.jsx:61-64`, prayer fetching uses `navigator.geolocation.getCurrentPosition(...)` directly instead of `@capacitor/geolocation`.
3. **UI/UX Design (R1 Requirement Status)**:
   - Styling is based on pure CSS (`src/index.css`) with glassmorphism panels, CSS variables, and Lucide icons.
   - There are some unused styling files (`src/App.css` contains unused boilerplate from default Vite template).
   - Some components have inline styles mixed with classes (`.glass-panel`, `.cards-grid`).

---

## 2. Logic Chain

1. **Premise**: Determining the build, dependency, and framework landscape requires analyzing configuration files and running build tooling.
   - **Evidence**: `package.json` specifies React 19, Vite 8, Capacitor 8, Firebase 12; `npm run build` ran successfully in 5.96s with exit code 0; `npm run lint` completed with 0 errors.
   - **Inference**: The project is a healthy, working React 19 + Vite SPA packaged for Android via Capacitor 8 with PWA capabilities.
2. **Premise**: Determining routing and state architecture requires inspecting entry points and feature modules.
   - **Evidence**: `App.jsx:23` uses `const [activeTab, setActiveTab] = useState('dashboard')`; no `react-router` package exists in `package.json`.
   - **Inference**: Navigation is tab/state-driven without client-side URL routing.
3. **Premise**: Evaluating requirement readiness for Local Notifications (R2) and Permissions (R3) requires auditing usage of `@capacitor/local-notifications` and `@capacitor/geolocation`.
   - **Evidence**: Grep search for `LocalNotifications` across `src/` revealed hits only in `App.jsx:20,34,35`. No calls to `LocalNotifications.schedule` exist. Grep search in `OrganizerView.jsx` and `WorshipView.jsx` revealed `new Notification()` calls inside `setInterval(..., 60000)` web timers.
   - **Inference**: The local notification requirement is currently unsatisfied in the codebase; the app relies on ephemeral web Notification polling rather than persistent native background scheduling.

---

## 3. Caveats

- **Native Android Build**: Only the web build (`npm run build`) was tested. Android studio / `./gradlew assembleDebug` inside the `android/` directory was not executed as Capacitor builds from `dist/`.
- **Empty Directory**: `src/features/prayers/` is currently an empty directory because prayer times functionality was placed inside `src/features/worship/WorshipView.jsx`.
- **Offline Data Boundary**: `userData` (tasks, routines, goals, points) syncs to Firestore with local cache, but `thoughts` (`ThoughtsView.jsx`) are stored strictly in browser `localStorage`.

---

## 4. Conclusion

1. **Framework & Language**: React 19.2.7 with JavaScript (JSX), built using Vite 8.1.1 and wrapped with Capacitor 8 for Android.
2. **Build & Test**: `npm run build` is operational and succeeds. `npm run lint` passes with 0 errors. `npm test` does not exist.
3. **Structure & Organization**: Well-organized directory with `src/components`, `src/contexts`, `src/features`, `src/locales`. State is managed via Context API (`AuthContext`, `SettingsContext`) and Firebase Firestore.
4. **Actionable Implementation Guidance for Team**:
   - To fulfill **R2 (Local Notifications)**: A dedicated notification service (e.g. `src/services/notificationService.js`) should be introduced using `@capacitor/local-notifications` `LocalNotifications.schedule(...)` for both scheduled organizer tasks and daily prayer times.
   - To fulfill **R3 (Permissions)**: Unify geolocation retrieval in `WorshipView.jsx` to use `@capacitor/geolocation` with web fallback, aligning with `App.jsx`.
   - To fulfill **R1 (UI/UX overhaul)**: Streamline `index.css`, eliminate unused `App.css`, refine typography and spacing on mobile/desktop.

---

## 5. Verification Method

- **Build verification**:
  ```powershell
  npm run build
  ```
  Expected output: Vite production build succeeds and outputs bundle to `dist/` without errors.
- **Lint verification**:
  ```powershell
  npm run lint
  ```
  Expected output: Oxlint reports 0 errors.
- **Inspection points**:
  - `package.json`: Lines 6-11 (scripts), 12-25 (dependencies), 26-35 (devDependencies).
  - `src/App.jsx`: Lines 22-50 (state and permission requests).
  - `src/features/organizer/OrganizerView.jsx`: Lines 28-58 (web notification polling).
  - `src/features/worship/WorshipView.jsx`: Lines 61-86 and 89-123 (geolocation and prayer alert polling).
