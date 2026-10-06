import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { fileExists } from './helpers/test-utils.js';

/**
 * Robust utility to safely mock configurable global properties in Node.js 26+
 */
function mockGlobal(name, value) {
  const origDesc = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
    enumerable: true
  });
  return () => {
    if (origDesc) {
      Object.defineProperty(globalThis, name, origDesc);
    } else {
      delete globalThis[name];
    }
  };
}

describe('Milestone 1 Adversarial Challenge & Stress Tests (Challenger M1-1)', () => {

  // =========================================================================
  // Challenge 1: Notification Concurrency & 32-Bit Positive Integer Stress
  // =========================================================================
  describe('Challenge 1: Notification Concurrency & 32-Bit Integer Stress', () => {
    test('1.1 100 simultaneous tasks with sequential integer IDs yield unique 32-bit positive integer IDs [1, 2147483647]', async () => {
      assert.ok(fileExists('src/services/notificationService.js'), 'notificationService.js must exist');
      const notifService = await import('../src/services/notificationService.js');

      const tasks = Array.from({ length: 100 }, (_, i) => ({
        id: 1001 + i,
        text: `مهمة تجريبية متزامنة رقم ${i + 1}`,
        time: `${String((i % 12) + 8).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
        isImportant: i % 3 === 0,
        category: 'work'
      }));

      const start = performance.now();
      const results = await Promise.all(
        tasks.map(t => notifService.scheduleTaskNotification(t))
      );
      const duration = performance.now() - start;

      assert.equal(results.length, 100, 'Must return exactly 100 notification IDs');
      const seenIds = new Set();

      for (let i = 0; i < results.length; i++) {
        const notifId = results[i];
        assert.ok(
          typeof notifId === 'number' && Number.isInteger(notifId),
          `Notification ID for task #${tasks[i].id} must be an integer, got: ${typeof notifId} (${notifId})`
        );
        assert.ok(
          notifId >= 1 && notifId <= 2147483647,
          `Notification ID must be within 32-bit signed positive integer range [1, 2147483647], got: ${notifId}`
        );
        assert.ok(!seenIds.has(notifId), `Collision detected! ID ${notifId} was already generated`);
        seenIds.add(notifId);
      }

      assert.equal(seenIds.size, 100, 'All 100 notification IDs must be completely unique');
      assert.ok(duration < 2000, `Scheduling 100 concurrent tasks must complete in < 2000ms (took ${duration.toFixed(2)}ms)`);

      // Adversarial teardown: cancel all 100 tasks simultaneously
      await assert.doesNotReject(
        Promise.all(tasks.map(t => notifService.cancelTaskNotification(t.id))),
        'Cancelling 100 tasks simultaneously must not throw or cause race conditions'
      );
    });

    test('1.2 100 simultaneous tasks with string/UUID identifiers yield valid, unique 32-bit positive integer IDs', async () => {
      const notifService = await import('../src/services/notificationService.js');

      const stringTasks = Array.from({ length: 100 }, (_, i) => ({
        id: `uuid-task-${i}-${Math.random().toString(36).substring(2, 9)}`,
        text: `مهمة نصية معرفة #${i + 1}`,
        time: '14:30',
        date: '2026-11-15'
      }));

      const results = await Promise.all(
        stringTasks.map(t => notifService.scheduleTaskNotification(t))
      );

      const seenIds = new Set();
      for (let i = 0; i < results.length; i++) {
        const notifId = results[i];
        assert.ok(
          typeof notifId === 'number' && Number.isInteger(notifId),
          `String ID hashing must produce an integer, got: ${notifId}`
        );
        assert.ok(
          notifId >= 1 && notifId <= 2147483647,
          `String ID hashing must clamp within [1, 2147483647], got: ${notifId}`
        );
        seenIds.add(notifId);
      }

      assert.equal(
        seenIds.size,
        100,
        `Hash function must avoid collisions for 100 random UUID tasks (found ${seenIds.size}/100 unique)`
      );

      // Clean up
      await Promise.all(stringTasks.map(t => notifService.cancelTaskNotification(t.id)));
    });

    test('1.3 Boundary ID handling: large timestamp IDs (> 2147483647) clamped safely into [1, 2147483647]', async () => {
      const notifService = await import('../src/services/notificationService.js');

      // Common pattern: Date.now() millisecond timestamps e.g. 1775400000000
      const largeTimestamps = Array.from({ length: 50 }, (_, i) => Date.now() + i * 1000);
      const results = largeTimestamps.map(ts => notifService.toDeterministicNotificationId(ts));

      const seen = new Set();
      for (const id of results) {
        assert.ok(typeof id === 'number' && Number.isInteger(id), `Must be integer: ${id}`);
        assert.ok(id >= 1 && id <= 2147483647, `Must clamp within [1, 2147483647], received: ${id}`);
        seen.add(id);
      }
      assert.equal(seen.size, 50, 'Deterministic hashing must avoid collisions for 50 timestamp inputs');
    });

    test('1.4 Extreme edge inputs to toDeterministicNotificationId always return integers in [1, 2147483647]', async () => {
      const notifService = await import('../src/services/notificationService.js');

      const extremeInputs = [
        0,
        -1,
        -9999999,
        1,
        2147483647,
        2147483648,
        Number.MAX_SAFE_INTEGER,
        null,
        undefined,
        '',
        '   ',
        NaN,
        Infinity,
        -Infinity,
        {},
        []
      ];

      for (const input of extremeInputs) {
        const id = notifService.toDeterministicNotificationId(input);
        assert.ok(
          typeof id === 'number' && Number.isInteger(id),
          `Input ${String(input)} must produce integer, received: ${id}`
        );
        assert.ok(
          id >= 1 && id <= 2147483647,
          `Input ${String(input)} must produce integer in [1, 2147483647], received: ${id}`
        );
      }
    });
  });

  // =========================================================================
  // Challenge 2: Geolocation Adversarial Simulation (Permission Denial & Timeouts)
  // =========================================================================
  describe('Challenge 2: Geolocation Adversarial Simulation (Permission Denial & Timeouts)', () => {
    let restoreNavigator;
    let restoreLocalStorage;
    let restoreCapacitor;

    afterEach(() => {
      if (restoreNavigator) { restoreNavigator(); restoreNavigator = null; }
      if (restoreLocalStorage) { restoreLocalStorage(); restoreLocalStorage = null; }
      if (restoreCapacitor) { restoreCapacitor(); restoreCapacitor = null; }
    });

    test('2.1 Native Geolocation permission denial returns default Makkah coordinates with isFallback: true without crashing', async () => {
      assert.ok(fileExists('src/services/locationService.js'), 'locationService.js must exist');
      const locService = await import('../src/services/locationService.js');

      // Clear cached location to ensure true fallback
      restoreLocalStorage = mockGlobal('localStorage', {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      });

      // Mock native Capacitor platform
      restoreCapacitor = mockGlobal('Capacitor', {
        isNativePlatform: () => true
      });

      const { Geolocation } = await import('@capacitor/geolocation');
      const origCheck = Geolocation.checkPermissions;
      const origReq = Geolocation.requestPermissions;

      Geolocation.checkPermissions = async () => ({ location: 'denied', coarseLocation: 'denied' });
      Geolocation.requestPermissions = async () => ({ location: 'denied', coarseLocation: 'denied' });

      try {
        const result = await locService.getCurrentLocation();
        assert.ok(result, 'Must return a result object without throwing');
        assert.equal(result.isFallback, true, 'isFallback must be true on permission denial');
        assert.ok(
          Math.abs(result.latitude - 21.4225) < 0.001,
          `Expected Makkah latitude ~21.4225, got: ${result.latitude}`
        );
        assert.ok(
          Math.abs(result.longitude - 39.8262) < 0.001,
          `Expected Makkah longitude ~39.8262, got: ${result.longitude}`
        );
        assert.equal(result.city, 'مكة المكرمة', 'City must default to Makkah');
      } finally {
        Geolocation.checkPermissions = origCheck;
        Geolocation.requestPermissions = origReq;
      }
    });

    test('2.2 Native Geolocation timeout/error returns default Makkah coordinates with isFallback: true without crashing', async () => {
      const locService = await import('../src/services/locationService.js');

      restoreLocalStorage = mockGlobal('localStorage', {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      });

      restoreCapacitor = mockGlobal('Capacitor', {
        isNativePlatform: () => true
      });

      const { Geolocation } = await import('@capacitor/geolocation');
      const origCheck = Geolocation.checkPermissions;
      const origPos = Geolocation.getCurrentPosition;

      // Granted permissions, but GPS hardware throws timeout error
      Geolocation.checkPermissions = async () => ({ location: 'granted', coarseLocation: 'granted' });
      Geolocation.getCurrentPosition = async () => {
        throw new Error('Location request timed out (code 3)');
      };

      try {
        const result = await locService.getCurrentLocation({ timeout: 1000 });
        assert.ok(result, 'Must return fallback location without unhandled rejection');
        assert.equal(result.isFallback, true, 'isFallback must be true on GPS timeout');
        assert.ok(
          Math.abs(result.latitude - 21.4225) < 0.001,
          `Expected Makkah latitude ~21.4225, got: ${result.latitude}`
        );
        assert.ok(
          Math.abs(result.longitude - 39.8262) < 0.001,
          `Expected Makkah longitude ~39.8262, got: ${result.longitude}`
        );
      } finally {
        Geolocation.checkPermissions = origCheck;
        Geolocation.getCurrentPosition = origPos;
      }
    });

    test('2.3 Browser navigator.geolocation error (code 1 denied and code 3 timeout) returns Makkah fallback without crashing', async () => {
      const locService = await import('../src/services/locationService.js');

      restoreLocalStorage = mockGlobal('localStorage', {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      });

      restoreCapacitor = mockGlobal('Capacitor', {
        isNativePlatform: () => false
      });

      // Scenario 1: User denies browser permission (code 1)
      restoreNavigator = mockGlobal('navigator', {
        geolocation: {
          getCurrentPosition: (success, error) => {
            error({ code: 1, message: 'User denied Geolocation' });
          }
        }
      });

      const deniedRes = await locService.getCurrentLocation();
      assert.ok(deniedRes, 'Must return fallback without error');
      assert.equal(deniedRes.isFallback, true);
      assert.ok(Math.abs(deniedRes.latitude - 21.4225) < 0.001);
      assert.ok(Math.abs(deniedRes.longitude - 39.8262) < 0.001);

      // Scenario 2: Network / GPS timeout in browser (code 3)
      if (restoreNavigator) restoreNavigator();
      restoreNavigator = mockGlobal('navigator', {
        geolocation: {
          getCurrentPosition: (success, error) => {
            error({ code: 3, message: 'Timeout expired' });
          }
        }
      });

      const timeoutRes = await locService.getCurrentLocation();
      assert.ok(timeoutRes, 'Must return fallback on timeout');
      assert.equal(timeoutRes.isFallback, true);
      assert.ok(Math.abs(timeoutRes.latitude - 21.4225) < 0.001);
      assert.ok(Math.abs(timeoutRes.longitude - 39.8262) < 0.001);
    });

    test('2.4 Corrupted localStorage cache does not cause crash and falls back to Makkah default', async () => {
      const locService = await import('../src/services/locationService.js');

      restoreLocalStorage = mockGlobal('localStorage', {
        getItem: (k) => k === 'to_top_last_known_location' ? '{broken-json: corrupted-data-payload' : null,
        setItem: () => {},
        removeItem: () => {}
      });

      restoreCapacitor = mockGlobal('Capacitor', { isNativePlatform: () => false });
      restoreNavigator = mockGlobal('navigator', {});

      const result = await locService.getCurrentLocation();
      assert.ok(result, 'Must handle corrupted localStorage gracefully');
      assert.equal(result.isFallback, true);
      assert.ok(Math.abs(result.latitude - 21.4225) < 0.001);
      assert.ok(Math.abs(result.longitude - 39.8262) < 0.001);
      assert.equal(result.city, 'مكة المكرمة');
    });
  });

  // =========================================================================
  // Challenge 3: 100% Offline Prayer Calculations Without HTTP Calls
  // =========================================================================
  describe('Challenge 3: 100% Offline Prayer Calculations Without Network', () => {
    let restoreFetch;
    let restoreNavigator;

    afterEach(() => {
      if (restoreFetch) { restoreFetch(); restoreFetch = null; }
      if (restoreNavigator) { restoreNavigator(); restoreNavigator = null; }
    });

    test('3.1 calculatePrayerTimes computes accurately across international coordinates with 0 HTTP calls', async () => {
      assert.ok(fileExists('src/services/prayerService.js'), 'prayerService.js must exist');
      const prayerService = await import('../src/services/prayerService.js');

      // Intercept fetch: any network call must immediately fail the test
      let fetchCallCount = 0;
      restoreFetch = mockGlobal('fetch', () => {
        fetchCallCount++;
        throw new Error('NETWORK_VIOLATION: calculatePrayerTimes must not make HTTP calls');
      });

      const testLocations = [
        { name: 'Makkah Al-Mukarramah', latitude: 21.4225, longitude: 39.8262 },
        { name: 'Medina', latitude: 24.4672, longitude: 39.6111 },
        { name: 'Riyadh', latitude: 24.7136, longitude: 46.6753 },
        { name: 'Cairo', latitude: 30.0444, longitude: 31.2357 },
        { name: 'London', latitude: 51.5074, longitude: -0.1278 },
        { name: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
        { name: 'Sydney', latitude: -33.8688, longitude: 151.2093 },
        { name: 'Equator', latitude: 0.0, longitude: 0.0 }
      ];

      for (const loc of testLocations) {
        const timings = prayerService.calculatePrayerTimes(loc, new Date('2026-05-15T12:00:00Z'));
        assert.ok(timings, `Timings returned for ${loc.name}`);
        assert.equal(fetchCallCount, 0, `Zero network calls allowed, detected: ${fetchCallCount}`);

        const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        for (const p of prayers) {
          const t = timings[p];
          assert.ok(t, `Prayer ${p} must exist for ${loc.name}`);
          assert.match(t, /^([01]\d|2[0-3]):([0-5]\d)$/, `Time for ${p} in ${loc.name} must be valid HH:mm, got: ${t}`);
          assert.ok(!t.includes('NaN'), `Time for ${p} in ${loc.name} must not be NaN`);
        }
      }

      assert.equal(fetchCallCount, 0, 'Confirmed 0 network calls for all 8 international locations');
    });

    test('3.2 getPrayerTimes operates completely offline when navigator.onLine is false', async () => {
      const prayerService = await import('../src/services/prayerService.js');

      let fetchCallCount = 0;
      restoreFetch = mockGlobal('fetch', () => {
        fetchCallCount++;
        throw new Error('NETWORK_VIOLATION: Should not attempt fetch when navigator.onLine is false');
      });

      restoreNavigator = mockGlobal('navigator', {
        onLine: false
      });

      const result = await prayerService.getPrayerTimes({ forceRefresh: true });
      assert.ok(result, 'Must return prayer times in offline mode');
      assert.equal(result.isOffline, true, 'isOffline flag must be true');
      assert.equal(result.source, 'offline-astronomical', 'Source must be offline-astronomical');
      assert.equal(fetchCallCount, 0, 'No HTTP fetch should be made when offline');

      const { timings } = result;
      assert.ok(timings?.Fajr && timings?.Dhuhr && timings?.Asr && timings?.Maghrib && timings?.Isha);
    });

    test('3.3 getPrayerTimes gracefully falls back to offline calculation if network fetch fails/times out', async () => {
      const prayerService = await import('../src/services/prayerService.js');

      restoreNavigator = mockGlobal('navigator', {
        onLine: true
      });

      let fetchAttempts = 0;
      restoreFetch = mockGlobal('fetch', async () => {
        fetchAttempts++;
        throw new Error('Failed to fetch (DNS lookup error)');
      });

      const result = await prayerService.getPrayerTimes({ forceRefresh: true });
      assert.ok(result, 'Must return prayer times despite network failure');
      assert.equal(result.isOffline, true, 'isOffline must become true when fetch fails');
      assert.equal(result.source, 'offline-astronomical', 'Source must fall back to offline-astronomical');
      assert.ok(fetchAttempts > 0, 'Must have attempted network call before falling back');

      const { timings } = result;
      assert.ok(timings?.Fajr && timings?.Dhuhr && timings?.Asr && timings?.Maghrib && timings?.Isha);
    });

    test('3.4 getNextPrayer accurately transitions across midnight and computes positive countdowns', async () => {
      const prayerService = await import('../src/services/prayerService.js');

      const mockPrayers = {
        Fajr: '04:45',
        Sunrise: '06:05',
        Dhuhr: '12:20',
        Asr: '15:45',
        Maghrib: '18:35',
        Isha: '20:05'
      };

      // Subtest A: At 23:00 (after Isha) -> Next prayer should be tomorrow's Fajr
      const lateNight = new Date();
      lateNight.setHours(23, 0, 0, 0);

      const nextLate = prayerService.getNextPrayer(mockPrayers, lateNight);
      assert.equal(nextLate.key, 'Fajr');
      assert.equal(nextLate.isTomorrow, true);
      assert.ok(nextLate.timeRemainingMs > 0, 'Countdown to tomorrow Fajr must be positive');
      assert.equal(nextLate.time, '04:45');

      // Subtest B: At 02:00 (before Fajr) -> Next prayer should be today's Fajr
      const earlyMorning = new Date();
      earlyMorning.setHours(2, 0, 0, 0);

      const nextEarly = prayerService.getNextPrayer(mockPrayers, earlyMorning);
      assert.equal(nextEarly.key, 'Fajr');
      assert.equal(nextEarly.isTomorrow, false);
      assert.ok(nextEarly.timeRemainingMs > 0);

      // Subtest C: At 13:00 (between Dhuhr and Asr) -> Next prayer should be Asr
      const afternoon = new Date();
      afternoon.setHours(13, 0, 0, 0);

      const nextAfternoon = prayerService.getNextPrayer(mockPrayers, afternoon);
      assert.equal(nextAfternoon.key, 'Asr');
      assert.equal(nextAfternoon.time, '15:45');
      assert.ok(nextAfternoon.timeRemainingMs > 0);
    });

    test('3.5 formatTime12Hour formats correctly in Arabic and English locales', async () => {
      const prayerService = await import('../src/services/prayerService.js');

      assert.equal(prayerService.formatTime12Hour('04:45', 'ar'), '4:45 ص');
      assert.equal(prayerService.formatTime12Hour('12:00', 'ar'), '12:00 م');
      assert.equal(prayerService.formatTime12Hour('15:30', 'ar'), '3:30 م');
      assert.equal(prayerService.formatTime12Hour('23:59', 'ar'), '11:59 م');
      assert.equal(prayerService.formatTime12Hour('00:15', 'ar'), '12:15 ص');

      assert.equal(prayerService.formatTime12Hour('04:45', 'en'), '4:45 AM');
      assert.equal(prayerService.formatTime12Hour('15:30', 'en'), '3:30 PM');
    });
  });

});
