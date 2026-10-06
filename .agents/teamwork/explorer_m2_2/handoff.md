# Handoff Report: Explorer M2-2 (WorshipView Prayer & Notification Integration)

## 1. Observation

Direct code and environment observations:

1. **`src/features/worship/WorshipView.jsx` lines 53–86 (Legacy Prayer Loading & Offline Block)**:
   ```javascript
   useEffect(() => {
     if (activeTab === 'prayers' && !timings) {
       if (!isOnline) {
         setLocationError("أنت الآن في وضع عدم الاتصال (بدون إنترنت). يرجى الاتصال لجلب أوقات الصلاة.");
         setLoadingPrayers(false);
         return;
       }
       if ("geolocation" in navigator) {
         navigator.geolocation.getCurrentPosition(
           (position) => {
             const { latitude, longitude } = position.coords;
             fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=4`)
               .then(res => res.json())
               .then(data => {
                 setTimings(data.data.timings);
                 setLoadingPrayers(false);
               })
               ...
   ```
   - **Flaw**: Halts with an error if offline (`!isOnline`), directly invokes raw browser `navigator.geolocation` instead of `locationService`, and directly fetches external AlAdhan API rather than using the centralized `prayerService`.

2. **`src/features/worship/WorshipView.jsx` lines 88–123 (Legacy Browser-Only Polling Notification)**:
   ```javascript
   useEffect(() => {
     if (!timings) return;
     if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
       Notification.requestPermission();
     }
     const interval = setInterval(() => {
       const now = new Date();
       const currentHour = now.getHours();
       const currentMin = now.getMinutes();

       const prayerKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
       prayerKeys.forEach(key => {
         const timeStr = timings[key];
         if (timeStr) {
           const match = timeStr.match(/(\d{2}):(\d{2})/);
           if (match) {
             let p_hour = parseInt(match[1], 10);
             let p_min = parseInt(match[2], 10);
             p_min -= 10;
             if (p_min < 0) { p_min += 60; p_hour -= 1; }
             if (currentHour === p_hour && currentMin === p_min) {
               const notifyKey = `${key}-${now.toDateString()}`;
               if (!notifiedPrayers.current[notifyKey]) {
                 if (Notification.permission === "granted") {
                   new Notification("تنبيه الصلاة 🕌", { body: `متبقي 10 دقائق على أذان صلاة ${t('worship.' + key.toLowerCase())}` });
                 }
                 notifiedPrayers.current[notifyKey] = true;
               }
             }
           }
         }
       });
     }, 60000);
     return () => clearInterval(interval);
   }, [timings, t]);
   ```
   - **Flaw**: Does not invoke `@capacitor/local-notifications` or `schedulePrayerNotifications`. Only works if the browser tab is actively kept open in memory at the exact minute match. Does not work in Android background or terminated state.

3. **`src/features/worship/WorshipView.jsx` lines 252–262 (Missing Hero Card)**:
   - There is no live next-prayer hero card or live countdown timer anywhere in `WorshipView.jsx`. It only renders a static cards grid.

4. **`src/features/worship/WorshipView.jsx` line 358 (RTL Property Violation)**:
   ```jsx
   <div key={dhikr.id} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: isCompleted ? '4px solid #4caf50' : '1px solid var(--surface-border)', opacity: isCompleted ? 0.7 : 1 }}>
   ```
   - Uses physical `borderLeft` which violates RTL conventions and fails automated RTL compliance checks (e.g., test 3.4).

5. **`src/services/prayerService.js` Exports & Capabilities**:
   - `getPrayerTimes(options)`: Resolves location via `getCurrentLocation()` (Makkah fallback cascade), checks cache, fetches AlAdhan API if online, or computes pure astronomical calculations offline via `calculatePrayerTimes()`. Returns `{ timings, source, isOffline, location }`.
   - `calculatePrayerTimes(coords, date, options)`: Pure offline calculation (Umm Al-Qura convention), runs in <1ms without network.
   - `getNextPrayer(prayerTimes, currentTime)`: Determines upcoming prayer (handles midnight rollover to tomorrow's Fajr), returns `{ key, name, englishName, time, date, timeRemainingMs, formattedCountdown, isTomorrow }`.
   - `formatTime12Hour(timeStr, locale)`: Formats `15:30` into `3:30 م` / `3:30 PM`.

6. **`src/services/notificationService.js` Exports & Capabilities**:
   - `schedulePrayerNotifications(prayerTimes, coords)`: Deterministically schedules all 5 prayers + sunrise with deterministic IDs (`80001` to `80006`) on Android channel `prayers` (`adhan.wav`), using Capacitor `LocalNotifications.schedule()`.
   - `requestNotificationPermission()`: Handles native Android and Web permission prompts.

7. **Test Assertions (`tests/tier4_real_world_scenarios.test.js` lines 86–95)**:
   ```javascript
   const worshipCode = readProjectFile('src/features/worship/WorshipView.jsx') || '';
   const hasOfflineIntegration =
     worshipCode.includes('prayerService') ||
     worshipCode.includes('calculatePrayerTimes') ||
     worshipCode.includes('offline');
   assert.ok(hasOfflineIntegration, 'WorshipView must integrate offline prayer calculation engine rather than relying solely on network fetch');
   ```

---

## 2. Logic Chain

1. **Root Problem in Prayer Retrieval**: Observation #1 shows that `WorshipView.jsx` halts when offline and bypasses `prayerService`. By replacing lines 53–86 with `getPrayerTimes({ forceRefresh })` and a fallback to `calculatePrayerTimes(getDefaultLocation())`, the app achieves 100% offline autonomy (supporting Observation #5 & #7).
2. **Next-Prayer Hero Card**: Observation #3 highlights the absence of a next-prayer hero card. Hooking `getNextPrayer(timings, new Date())` inside a 1-second `setInterval` provides real-time countdown (`hh:mm:ss`) to the upcoming prayer, displaying it prominently at the top of the prayers tab.
3. **Local Notification Scheduling**: Observation #2 shows fragile in-memory web notifications. By removing the 60-second polling loop and calling `schedulePrayerNotifications(timings, location)` both automatically upon prayer time resolution and manually via an interactive toggle button, notifications are natively registered with Android's AlarmManager / Capacitor LocalNotifications plugin (satisfying Observation #6 & ORIGINAL_REQUEST §R2).
4. **User Control & Feedback**: Introducing a notification toggle (`prayerNotifsEnabled`, persisted in `localStorage`) with `requestNotificationPermission()` gives the user clear feedback and controls. A "Refresh" button (`RefreshCw`) allows re-querying coordinates and times on demand.
5. **RTL Compliance & Visual Finish**: Observation #4 highlights `borderLeft`. Replacing this with `borderInlineStart` ensures proper display in Arabic RTL layout. Scaling down headers and paddings aligns with the eye-comfort design contract of Milestone 3.

---

## 3. Caveats

- **Time Sync across Day Boundary**: When the live countdown passes midnight, `getNextPrayer` automatically calculates tomorrow's Fajr (`isTomorrow: true`). When the date changes, a fresh calculation of daily timings should be triggered; calling `loadPrayerTimes()` or recalculating ensures times for the new day are displayed.
- **Notification Sounds on Web vs. Android**: On Android, sound channel `prayers` uses `adhan.wav`. On desktop web browsers, system sounds are governed by the OS browser notification daemon.
- **Scope Boundary**: Task notification scheduling in `OrganizerView.jsx` is handled by Explorer M2-1. Startup permission prompts in `App.jsx` and settings controls in `SettingsView.jsx` are handled by Explorer M2-3.

---

## 4. Conclusion

`WorshipView.jsx` requires three core integrations:
1. **Prayer Times Engine Hook**: Replace direct AlAdhan fetch and browser geolocation with `getPrayerTimes({ forceRefresh })` and offline fallback to `calculatePrayerTimes(getDefaultLocation())`.
2. **Next-Prayer Hero Card with Live Countdown**: Add a 1-second interval calculating `getNextPrayer(timings, new Date())` and render a high-visibility hero card featuring the upcoming prayer name, formatted time (12-hour), and live `hh:mm:ss` countdown.
3. **Capacitor Prayer Notification Scheduling**: Remove the legacy `setInterval` `new Notification` loop; replace it with `schedulePrayerNotifications(timings, locationInfo)` and a toggle button backed by `requestNotificationPermission()`.
4. **RTL & Design Polish**: Replace `borderLeft` in Adhkar items with `borderInlineStart`, scale down `h1` and excessive margins.

Complete artifacts have been authored and verified:
- **Drop-in Proposed File**: `.agents/teamwork/explorer_m2_2/proposed_WorshipView.jsx` (Linter verified: 0 errors, 0 warnings).
- **Unified Diff Patch**: `.agents/teamwork/explorer_m2_2/worship_view_integration.patch`.

### Summary of Key Code Diffs

#### A. Imports
```diff
-import { useState, useEffect, useRef } from 'react';
-import { Compass, BookOpen, Heart, ArrowRight, CheckCircle2 } from 'lucide-react';
+import { useState, useEffect, useCallback } from 'react';
+import { 
+  Compass, BookOpen, Heart, ArrowRight, CheckCircle2, 
+  Bell, BellOff, RefreshCw, MapPin, Clock 
+} from 'lucide-react';
+import { 
+  getPrayerTimes, 
+  calculatePrayerTimes, 
+  getNextPrayer, 
+  formatTime12Hour 
+} from '../../services/prayerService';
+import { getDefaultLocation } from '../../services/locationService';
+import { 
+  schedulePrayerNotifications, 
+  requestNotificationPermission 
+} from '../../services/notificationService';
```

#### B. State Variables
```javascript
  const [timings, setTimings] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [_prayerSource, setPrayerSource] = useState('offline-astronomical');
  const [locationError, setLocationError] = useState(null);
  const [loadingPrayers, setLoadingPrayers] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextPrayerInfo, setNextPrayerInfo] = useState(null);
  const [prayerNotifsEnabled, setPrayerNotifsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('to_top_prayer_notifs_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [isSchedulingNotifs, setIsSchedulingNotifs] = useState(false);
  const [notificationFeedback, setNotificationFeedback] = useState(null);
```

#### C. Prayer Loading Hook (`loadPrayerTimes`)
```javascript
  const loadPrayerTimes = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) setIsRefreshing(true);
      else setLoadingPrayers(true);
      setLocationError(null);

      const result = await getPrayerTimes({ forceRefresh });
      if (result?.timings) {
        setTimings(result.timings);
        setLocationInfo(result.location);
        setPrayerSource(result.source || 'offline-astronomical');
        
        const next = getNextPrayer(result.timings, new Date());
        setNextPrayerInfo(next);

        if (prayerNotifsEnabled) {
          schedulePrayerNotifications(result.timings, result.location).catch((err) => {
            console.warn('[WorshipView] Auto-schedule prayer notifications warning:', err);
          });
        }
      }
    } catch (err) {
      console.warn('[WorshipView] getPrayerTimes error, falling back to pure offline calculation:', err);
      const fallbackLoc = getDefaultLocation();
      const offlineTimings = calculatePrayerTimes(fallbackLoc);
      setTimings(offlineTimings);
      setLocationInfo(fallbackLoc);
      setPrayerSource('offline-astronomical');
      const next = getNextPrayer(offlineTimings, new Date());
      setNextPrayerInfo(next);
      if (prayerNotifsEnabled) {
        schedulePrayerNotifications(offlineTimings, fallbackLoc).catch(() => {});
      }
    } finally {
      setLoadingPrayers(false);
      setIsRefreshing(false);
    }
  }, [prayerNotifsEnabled]);

  useEffect(() => {
    if (activeTab === 'prayers' && !timings) {
      loadPrayerTimes();
    }
  }, [activeTab, timings, loadPrayerTimes]);
```

#### D. Live 1-Second Countdown Hook
```javascript
  useEffect(() => {
    if (!timings || activeTab !== 'prayers') return;

    setNextPrayerInfo(getNextPrayer(timings, new Date()));

    const timer = setInterval(() => {
      const next = getNextPrayer(timings, new Date());
      setNextPrayerInfo(next);
    }, 1000);

    return () => clearInterval(timer);
  }, [timings, activeTab]);
```

#### E. Prayer Notification Toggle Handler
```javascript
  const handleTogglePrayerNotifications = async () => {
    if (isSchedulingNotifs) return;
    setIsSchedulingNotifs(true);

    try {
      if (!prayerNotifsEnabled) {
        const perm = await requestNotificationPermission();
        if (perm.granted) {
          setPrayerNotifsEnabled(true);
          try { localStorage.setItem('to_top_prayer_notifs_enabled', 'true'); } catch {}

          if (timings) {
            const scheduled = await schedulePrayerNotifications(timings, locationInfo);
            setNotificationFeedback({
              type: 'success',
              msg: t('worship.notifs_scheduled', `تم تفعيل وجدولة تنبيهات الأذان (${scheduled.length} صلوات) بنجاح!`)
            });
          }
        } else {
          setNotificationFeedback({
            type: 'error',
            msg: t('worship.notifs_denied', 'يرجى تفعيل صلاحية الإشعارات من إعدادات جهازك لتلقي تنبيهات الأذان.')
          });
        }
      } else {
        setPrayerNotifsEnabled(false);
        try { localStorage.setItem('to_top_prayer_notifs_enabled', 'false'); } catch {}
        setNotificationFeedback({
          type: 'info',
          msg: t('worship.notifs_disabled', 'تم إيقاف تنبيهات الأذان.')
        });
      }
    } catch (err) {
      console.warn('[WorshipView] handleTogglePrayerNotifications error:', err);
    } finally {
      setIsSchedulingNotifs(false);
      setTimeout(() => setNotificationFeedback(null), 4000);
    }
  };
```

---

## 5. Verification Method

### 1. Code Inspection
- Confirm `WorshipView.jsx` imports `prayerService`, `locationService`, and `notificationService`.
- Verify absence of direct `navigator.geolocation` or raw AlAdhan URL calls.
- Verify absence of legacy `setInterval` `new Notification` loop.
- Confirm presence of `borderInlineStart` in `ADHKAR_DB` card styling instead of `borderLeft`.

### 2. Automated Test Verification
Run the project test suite:
```powershell
node tests/run-all.js
```
Specifically verify:
- **Tier 4 Test 4.2 (`100% Offline Capability`)**:
  Validates that `WorshipView.jsx` references `prayerService` or `calculatePrayerTimes` and functions offline.
- **Tier 1 Test 1.8 (`Explicit LocalNotifications.schedule calls`)**:
  Validates that `WorshipView.jsx` references `schedulePrayerNotifications`.
- **Tier 3 Test 3.3 (`Location denial fallback & prayer scheduling`)**:
  Confirms prayer times resolve with fallback and triggers scheduling of all daily prayer alarms.
- **Tier 3 Test 3.4 (`RTL Logical Properties Compliance`)**:
  Confirms `borderInlineStart` is used.

### 3. Build & Linter Verification
```powershell
npx oxlint .agents/teamwork/explorer_m2_2/proposed_WorshipView.jsx
node --max-old-space-size=4096 ./node_modules/vite/bin/vite.js build
```
- Must produce **0 errors and 0 warnings**.
