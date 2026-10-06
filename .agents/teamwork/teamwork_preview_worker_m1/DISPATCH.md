## 2026-10-05T20:31:04Z
You are Worker M1 (Native Config & Core Services Implementation Specialist).
Your working directory is: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\teamwork_preview_worker_m1
The project root directory is: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل

Read the original request at: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\ORIGINAL_REQUEST.md
Read the project master plan at: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\PROJECT.md
Read the test infrastructure at: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\TEST_INFRA.md
Read Explorer M1-3 architecture at: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\teamwork_preview_explorer_m1_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusive Write Ownership:
You own exclusively:
- android/app/src/main/AndroidManifest.xml
- src/services/locationService.js
- src/services/prayerService.js
- src/services/notificationService.js
- capacitor.config.json

Your Implementation Tasks for Milestone 1:
1. Update `android/app/src/main/AndroidManifest.xml` to declare the 6 required native permissions:
   - android.permission.POST_NOTIFICATIONS
   - android.permission.ACCESS_FINE_LOCATION
   - android.permission.ACCESS_COARSE_LOCATION
   - android.permission.SCHEDULE_EXACT_ALARM
   - android.permission.RECEIVE_BOOT_COMPLETED
   - android.permission.WAKE_LOCK
2. Run `npx cap sync android` (or powershell equivalent) to ensure Capacitor Android Gradle plugins are synced.
3. Implement `src/services/locationService.js`:
   - 4-tier resolution cascade (Capacitor Geolocation -> Browser Navigator Geolocation -> Cached localStorage -> Canonical Makkah Fallback: 21.4225, 39.8262).
   - Export `getCurrentLocation()` and `getDefaultLocation()`.
4. Implement `src/services/prayerService.js`:
   - Self-contained, zero-dependency mathematical astronomical calculation engine using Umm Al-Qura convention matching AlAdhan timings.
   - Fallback coordinates support, online AlAdhan background sync, `calculatePrayerTimes(coords, date)`, `getNextPrayer(prayerTimes)`.
5. Implement `src/services/notificationService.js`:
   - Native Capacitor `@capacitor/local-notifications` implementation with browser `Notification` fallback.
   - Configure Android notification channels ('tasks', 'prayers').
   - Deterministic 32-bit positive integer IDs `[1, 2147483647]`.
   - Export `requestNotificationPermission()`, `scheduleTaskNotification(task)`, `cancelTaskNotification(taskId)`, `schedulePrayerNotifications(prayerTimes, coords)`, `testNotification()`, `getPendingNotifications()`.
6. Run builds and tests:
   - Run `node tests/run-all.js --tier 1`
   - Run `node tests/run-all.js --tier 2`
   - Run `npm run build`
   Ensure all M1 tests pass and the build succeeds cleanly.
7. Record progress in `progress.md` and deliver your completion report in `handoff.md` in your working directory. Then send a message back.
