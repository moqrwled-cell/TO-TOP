# Handoff Report: notificationService Fix Strategy (Explorer M1-Iteration 2, Agent 2)

**Author**: Explorer M1-Iteration 2 (Agent 2: notificationService Fix Strategy)  
**Target Milestone**: Milestone 1 (Defensive Hardening - Iteration 2)  
**Date**: 2026-10-06T00:02:30Z  
**Target File**: `src/services/notificationService.js`  
**Status**: Complete (Hard Handoff)  

---

## 1. Observation

### 1.1 Out-of-Range Time Acceptance in `schedulePrayerNotifications` (Defect 4)
- **File**: `src/services/notificationService.js`, lines 261–272:
  ```javascript
  for (const item of prayerDefs) {
    const timeStr = prayerTimes[item.key] || prayerTimes[item.key.toLowerCase()];
    if (!timeStr || typeof timeStr !== 'string') continue;

    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) continue;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    let target = new Date();
    target.setHours(hours, minutes, 0, 0);
  ```
- **Observed Behavior**:
  The regular expression `/^(\d{1,2}):(\d{2})$/` only checks digit counts; it does not check whether `hours <= 23` or `minutes <= 59`.
  When `'25:99'` is passed for `Asr`:
  - `parseInt(match[1], 10)` yields `25`.
  - `parseInt(match[2], 10)` yields `99`.
  - In JavaScript, `Date.prototype.setHours(25, 99, 0, 0)` wraps forward mathematically (adding 1 day, 2 hours, and 39 minutes).
  - Consequently, `schedulePrayerNotifications({ Asr: '25:99' })` schedules an alarm with ID `80004` rather than rejecting the invalid time.
- **Empirical Execution & Failure in `tests/challenger_m1_2.test.js:554`**:
  ```bash
  node -e "import('./src/services/notificationService.js').then(m => m.schedulePrayerNotifications({ Asr: '25:99' }).then(console.log))"
  # Output: [ 80004 ]
  ```
  ```
  ✖ FAILING/DEFECT: schedulePrayerNotifications must reject out-of-range times (e.g. Asr: 25:99) (7.5271ms)
    AssertionError [ERR_ASSERTION]: schedulePrayerNotifications must reject out-of-bounds times like "25:99", but scheduled IDs: [80004]
    + actual - expected
    + [ 80004 ]
    - []
  ```
- **Comparison with `scheduleTaskNotification` (lines 148–152)**:
  `scheduleTaskNotification` already contains explicit boundary guards:
  ```javascript
  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  ```
  `schedulePrayerNotifications` omitted this exact boundary validation.

### 1.2 Channel Initialization Timing & Lifecycle
- **File**: `src/services/notificationService.js`, lines 35–51, 84–86:
  ```javascript
  let channelsInitialized = false;

  export async function initializeNotificationChannels() {
    if (channelsInitialized) return;
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.createChannel(NOTIFICATION_CHANNELS.TASKS);
        await LocalNotifications.createChannel(NOTIFICATION_CHANNELS.PRAYERS);
        channelsInitialized = true;
      } catch (err) {
        console.warn('[notificationService] Error creating notification channels:', err);
      }
    }
  }
  ```
- **Observed Behavior**:
  `initializeNotificationChannels()` is currently invoked **only** inside `requestNotificationPermission()` when `granted === true` (line 85).
  If a user has already granted notification permissions on a prior launch:
  1. `requestNotificationPermission()` is never called upon startup.
  2. When the user adds a task or prayer times are recalculated, `scheduleTaskNotification()` or `schedulePrayerNotifications()` is called.
  3. Because the current process's `channelsInitialized` in-memory boolean is `false`, the native channels (`tasks`, `prayers`) may not have been created in the current Android runtime session.
  4. On Android 8.0+ (API 26+), scheduling a notification targeting an uncreated channel can cause notifications to be silently dropped by the Android OS.

---

## 2. Logic Chain

1. **Root Cause Analysis of Defect 4**:
   - `schedulePrayerNotifications` relies solely on `/^(\d{1,2}):(\d{2})$/` to validate input times.
   - Any time string where `hours >= 24` or `minutes >= 60` (such as `'24:00'`, `'25:99'`, `'12:60'`) is treated as a syntactically valid string.
   - JavaScript's `Date.prototype.setHours` does not throw or return `NaN` when passed out-of-range arguments; it automatically wraps overflow into subsequent days/hours.
   - Therefore, invalid hours and minutes must be rejected before calling `target.setHours()`.
   - In `schedulePrayerNotifications`, the appropriate response to an invalid prayer time is to skip scheduling that specific prayer (`continue;`).
   - If all provided prayer times are invalid (as in the Challenger test `{ Fajr: 'invalid', Asr: '25:99', ... }`), `notificationsToSchedule` remains empty, and `schedulePrayerNotifications` resolves to `[]`, directly satisfying the test requirement.

2. **Root Cause Analysis of Channel Lifecycle Risk**:
   - Android notification channels are persistent across app launches, but Capacitor's plugin bridge `LocalNotifications.createChannel` establishes the channel definition with proper importance, sound, and vibration settings.
   - A single-point initialization inside `requestNotificationPermission()` creates a lifecycle hazard if permissions are pre-granted.
   - Calling `await initializeNotificationChannels()` lazily right before native dispatch in `scheduleTaskNotification`, `schedulePrayerNotifications`, and `testNotification`:
     - Ensures channels always exist prior to native alarm registration.
     - Does zero extra work in web/test environments because `Capacitor.isNativePlatform()` guards native calls.
     - Introduces zero overhead on subsequent calls because `channelsInitialized` short-circuits execution.

3. **Concurrency Hardening in `initializeNotificationChannels()`**:
   - Multiple scheduling calls happening in parallel during initial startup could trigger simultaneous calls to `LocalNotifications.createChannel`.
   - Adding an in-flight promise variable `channelsInitPromise` guarantees idempotency and deduplicates parallel channel creation calls across async microtasks.

---

## 3. Caveats

- **Scope Boundary**: This report focuses strictly on `src/services/notificationService.js`. The companion defects in `src/services/prayerService.js` (Defects 1, 2, and 3) are handled by Explorer M1-Iteration 2 Agent 1.
- **Explicit Past Dates in `scheduleTaskNotification`**:
  Lines 176–178 currently adjust past times for today:
  `if (triggerAt.getTime() <= Date.now()) triggerAt = new Date(Date.now() + 5000);`.
  Existing tests in `tests/challenger_m1_2.test.js` line 488 explicitly pass boundary dates (e.g. `{ id: 104, text: '...', time: '09:00', date: 2026 }`) and assert that a valid 32-bit integer is returned. Therefore, the existing 5-second bumper should be preserved as-is so as not to break existing boundary date test assertions.
- **Audio Assets**: Custom sounds `sound: 'beep.wav'` and `sound: 'adhan.wav'` fallback to default system notification sounds on Android when raw resources are not packaged. This is expected and non-blocking for Milestone 1.

---

## 4. Conclusion & Recommended Implementation

The fix requires two concise, surgical changes in `src/services/notificationService.js`:

### Change 1: Add Hour and Minute Range Validation to `schedulePrayerNotifications`
In `src/services/notificationService.js`, immediately after parsing `hours` and `minutes`:

```javascript
<<<<
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    let target = new Date();
====
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      continue;
    }

    let target = new Date();
>>>>
```

### Change 2: Harden `initializeNotificationChannels` with Deduplication & In-Flight Promise
In `src/services/notificationService.js`, update lines 35–51:

```javascript
<<<<
let channelsInitialized = false;

/**
 * Initialize Android notification channels for Tasks and Prayers
 */
export async function initializeNotificationChannels() {
  if (channelsInitialized) return;
  if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.createChannel(NOTIFICATION_CHANNELS.TASKS);
      await LocalNotifications.createChannel(NOTIFICATION_CHANNELS.PRAYERS);
      channelsInitialized = true;
    } catch (err) {
      console.warn('[notificationService] Error creating notification channels:', err);
    }
  }
}
====
let channelsInitialized = false;
let channelsInitPromise = null;

/**
 * Initialize Android notification channels for Tasks and Prayers
 */
export async function initializeNotificationChannels() {
  if (channelsInitialized) return;
  if (channelsInitPromise) return channelsInitPromise;

  if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
    channelsInitPromise = (async () => {
      try {
        await LocalNotifications.createChannel(NOTIFICATION_CHANNELS.TASKS);
        await LocalNotifications.createChannel(NOTIFICATION_CHANNELS.PRAYERS);
        channelsInitialized = true;
      } catch (err) {
        console.warn('[notificationService] Error creating notification channels:', err);
      } finally {
        channelsInitPromise = null;
      }
    })();
    return channelsInitPromise;
  }
}
>>>>
```

### Change 3: Lazily Invoke `initializeNotificationChannels` inside Scheduling Methods
1. In `scheduleTaskNotification` (around line 198):
```javascript
<<<<
  // Native scheduling
  try {
    if (typeof Capacitor !== 'undefined' && (Capacitor.isNativePlatform() || typeof window !== 'undefined')) {
      await LocalNotifications.schedule({
        notifications: [notificationPayload]
      });
    }
  } catch (err) {
====
  // Native scheduling
  try {
    await initializeNotificationChannels();
    if (typeof Capacitor !== 'undefined' && (Capacitor.isNativePlatform() || typeof window !== 'undefined')) {
      await LocalNotifications.schedule({
        notifications: [notificationPayload]
      });
    }
  } catch (err) {
>>>>
```

2. In `schedulePrayerNotifications` (around line 296):
```javascript
<<<<
  if (notificationsToSchedule.length > 0) {
    try {
      if (typeof Capacitor !== 'undefined' && (Capacitor.isNativePlatform() || typeof window !== 'undefined')) {
        await LocalNotifications.schedule({
          notifications: notificationsToSchedule
        });
      }
    } catch (err) {
====
  if (notificationsToSchedule.length > 0) {
    try {
      await initializeNotificationChannels();
      if (typeof Capacitor !== 'undefined' && (Capacitor.isNativePlatform() || typeof window !== 'undefined')) {
        await LocalNotifications.schedule({
          notifications: notificationsToSchedule
        });
      }
    } catch (err) {
>>>>
```

3. In `testNotification` (around line 316):
```javascript
<<<<
export async function testNotification() {
  try {
    const testId = 99999;
====
export async function testNotification() {
  try {
    await initializeNotificationChannels();
    const testId = 99999;
>>>>
```

---

## 5. Verification Method

To verify the effectiveness and safety of this fix strategy:

1. **Reproduction Before Fix**:
   ```bash
   node -e "import('./src/services/notificationService.js').then(m => m.schedulePrayerNotifications({ Asr: '25:99' }).then(console.log))"
   ```
   *Expected Current Output*: `[ 80004 ]` (Defect reproduced).

2. **Verification After Fix**:
   - Run isolated prayer notification check:
     ```bash
     node -e "import('./src/services/notificationService.js').then(m => m.schedulePrayerNotifications({ Asr: '25:99' }).then(r => console.log('Result:', JSON.stringify(r))))"
     ```
     *Expected Output*: `Result: []`
   - Run Challenger M1-2 Notification Suite:
     ```bash
     node --test --test-name-pattern="Notification Error Tolerance" tests/challenger_m1_2.test.js
     ```
     *Expected Output*: 8 / 8 tests pass (100% pass rate in Notification suite, zero failures).
   - Run full Challenger M1-2 suite (together with prayerService fixes from Agent 1):
     ```bash
     node --test tests/challenger_m1_2.test.js
     ```
     *Expected Output*: 20 / 20 pass, 0 fail.

3. **Invalidation Condition**:
   If passing `{ Asr: '25:99' }` or any out-of-range hour/minute still returns an array containing ID `80004`, or if `initializeNotificationChannels` throws an unhandled rejection when invoked concurrently, this conclusion is invalidated.
