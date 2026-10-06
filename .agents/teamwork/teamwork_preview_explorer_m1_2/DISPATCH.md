## 2026-10-05T20:04:14Z
You are Explorer M1-2 (Notification Service Architecture).
Your working directory is: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\teamwork_preview_explorer_m1_2
The project root directory is: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل
Read the original request at: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\ORIGINAL_REQUEST.md
Read the project master plan at: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\PROJECT.md

Your mission:
Design the concrete implementation specification for `src/services/notificationService.js`:
1. Full API contract:
   - `requestNotificationPermission()`
   - `scheduleTaskNotification(task)`
   - `cancelTaskNotification(taskId)`
   - `schedulePrayerNotifications(prayerTimes, coords)`
   - `testNotification()`
   - `getPendingNotifications()`
2. How to wrap `@capacitor/local-notifications` cleanly with web browser `Notification` fallback so it works seamlessly in development and on native Android.
3. Notification channel creation (`LocalNotifications.createChannel`) for Android (e.g. 'tasks', 'prayers').
4. Deterministic 32-bit integer ID generation for tasks and prayers to avoid ID collisions on Android.
Write your full report to `handoff.md` in your working directory and send a message when complete.
