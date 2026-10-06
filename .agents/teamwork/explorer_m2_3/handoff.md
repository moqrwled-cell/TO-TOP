# Handoff Report: Explorer M2-3 (Startup Permissions Flow & Settings Fallbacks)

## 1. Observation
1. **`src/App.jsx`**:
   - Lines 18–20:
     ```javascript
     import { Capacitor } from '@capacitor/core'
     import { Geolocation } from '@capacitor/geolocation'
     import { LocalNotifications } from '@capacitor/local-notifications'
     ```
   - Lines 27–50:
     ```javascript
     useEffect(() => {
       const requestPermissions = async () => {
         try {
           if (Capacitor.isNativePlatform()) {
             const permNav = await Geolocation.checkPermissions();
             if (permNav.location !== 'granted') await Geolocation.requestPermissions();
             
             const permNotif = await LocalNotifications.checkPermissions();
             if (permNotif.display !== 'granted') await LocalNotifications.requestPermissions();
           } else {
             // Web Fallbacks
             if ("Notification" in window && Notification.permission === "default") {
               Notification.requestPermission();
             }
             if ("geolocation" in navigator) {
               navigator.geolocation.getCurrentPosition(() => {}, () => {});
             }
           }
         } catch (e) {
           console.warn("Permission request failed", e);
         }
       };
       requestPermissions();
     }, []);
     ```
   - Observed that `App.jsx` bypasses the centralized services `src/services/notificationService.js` and `src/services/locationService.js`, does not call `initializeNotificationChannels()`, executes requests sequentially in a potential blocking waterfall, and does not schedule initial prayer alarms on startup.

2. **`src/features/settings/SettingsView.jsx`**:
   - Lines 1–103: Contains only theme controls (dark/light), language controls (ar/en), and UI scale buttons (0.85, 1, 1.15).
   - Entirely lacks notification permission indicators, re-request triggers, test notification buttons, location permission indicators, and fallback city selector controls.

3. **`src/services/notificationService.js`**:
   - Lines 79–123: Implements `requestNotificationPermission()` and `checkNotificationPermission()` with Capacitor native handling and browser fallback.
   - Lines 318–346: Implements `testNotification()` scheduling an alert at `Date.now() + 1000`.
   - Verified that all contract methods pass existing test suite and adversarial test suites.

4. **`src/services/locationService.js`**:
   - Lines 12–19: Canonical default is defined as Holy Kaaba, Makkah Al-Mukarramah (`latitude: 21.4225, longitude: 39.8262`).
   - Lines 170–235: `getCurrentLocation()` implements a 4-tier cascade: native GPS -> browser navigator -> cached location -> default Makkah. It never throws and always resolves valid coordinates.
   - Currently lacks a structured catalog of alternative Arab/Islamic fallback cities for user selection in settings.

5. **Build and Verification Commands**:
   - Executed `node tests/run-all.js`: 17 passed, 6 failed (failures isolated to M2 OrganizerView task hooks and M3 UI tokens/navigation).
   - Executed `node --test tests/adversarial_m1_challenge.test.js tests/challenger_m1_2.test.js`: 33 tests passed, 0 failed.
   - Executed `npm run build`: Exit code 0, `built in 4.57s`, production chunks generated cleanly.
   - Executed `npm run lint`: Exit code 0, 0 errors.

---

## 2. Logic Chain
1. *From Observation 1 & 3*: `notificationService.js` contains platform-agnostic permission requests and Android channel setup (`initializeNotificationChannels()`). Calling raw `@capacitor/local-notifications` in `App.jsx` creates code duplication and risks missed channel initialization on Android 8+ (API 26+).
2. *From Observation 1 & 4*: `locationService.getCurrentLocation()` contains a 4-tier non-throwing fallback cascade. Bypassing it in `App.jsx` with direct `Geolocation.requestPermissions()` forfeits the automatic fallback to Makkah and cached coordinates.
3. *From Observation 1*: Sequential awaiting of location before notification permission introduces unnecessary latency and could stall the notification prompt if GPS retrieval or the location prompt times out. Wrapping both in `Promise.allSettled` decouples them completely and ensures non-blocking startup.
4. *From Observation 2*: The user currently has no visibility into their permission state or an in-app path to test notifications or pick their city. Adding a dedicated Notifications section with `checkNotificationPermission()`, `requestNotificationPermission()`, and `testNotification()` satisfies R2 & R3.
5. *From Observation 4 & Dispatch Brief*: When GPS permission is denied or device GPS is unavailable, users need a way to select their home city (Riyadh, Cairo, Dubai, etc.). Adding `FALLBACK_CITIES` and `setManualLocation()` to `locationService.js` and exposing a dropdown selector in `SettingsView.jsx` guarantees accurate prayer times even in 100% offline or GPS-disabled states.

---

## 3. Caveats
1. **Web Notification User-Gesture Policies**: Modern desktop browsers (Chrome, Safari) restrict `Notification.requestPermission()` if called outside of a direct user gesture (e.g., clicking a button). On startup in Web mode, browser notifications may resolve to `'default'` without popping a prompt; the in-app "طلب إذن الإشعارات" button in `SettingsView.jsx` serves as the compliant user-gesture trigger.
2. **Android 13+ POST_NOTIFICATIONS**: If the user permanently denies notification permissions on Android ("Don't ask again"), `requestPermissions()` will return `'denied'` without displaying a system dialog. An explanatory note in `SettingsView.jsx` guides the user to system settings.
3. **OrganizerView Integration**: Task scheduling hooks (`scheduleTaskNotification`, `cancelTaskNotification`) in `OrganizerView.jsx` belong to Milestone 2 Task M2-1/M2-2 and were surveyed for compatibility but left for their respective implementer.

---

## 4. Conclusion
1. **Startup Flow**: `App.jsx` must be refactored to consume `notificationService` and `locationService` via non-blocking parallel `Promise.allSettled`, initialize Android notification channels, and trigger background prayer calculation and scheduling via `getPrayerTimes()` and `schedulePrayerNotifications()`.
2. **SettingsView**: `SettingsView.jsx` must be enriched with two cards:
   - *Notification Permissions & Test*: Real-time status indicator pill, permission request button, test notification trigger with visual toast feedback.
   - *Location & Fallback Cities*: GPS status indicator pill, GPS refresh button, and a dropdown selector populated with 20 major Arab/Islamic cities (`FALLBACK_CITIES`) that immediately recalculates and updates prayer schedules.
3. **Artifacts Provided**: Complete drop-in implementations have been written to `.agents/teamwork/explorer_m2_3/`:
   - `proposed_App.jsx`
   - `proposed_SettingsView.jsx`
   - `proposed_locationService.js`
   - `analysis.md`

---

## 5. Verification Method
1. **Build Validation**:
   ```bash
   npm run build
   ```
   *Expected result*: Exit code 0, successful Vite bundle generation.

2. **Linter Validation**:
   ```bash
   npm run lint
   ```
   *Expected result*: Exit code 0, 0 errors.

3. **Adversarial & Unit Verification**:
   ```bash
   node --test tests/adversarial_m1_challenge.test.js tests/challenger_m1_2.test.js
   ```
   *Expected result*: 33/33 tests passing with 0 unhandled rejections.

4. **Interactive Invalidation Conditions**:
   - If app shows a blocking modal or blank screen when GPS/Notifications are denied -> Invalid.
   - If clicking "إرسال إشعار تجريبي" crashes the app or does not queue an alert -> Invalid.
   - If selecting a fallback city does not recalculate prayer times -> Invalid.
