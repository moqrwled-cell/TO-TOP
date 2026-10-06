import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  FALLBACK_CITIES,
  setManualLocation,
  getDefaultLocation,
  getLastKnownLocation,
  saveLastKnownLocation,
  getCurrentLocation,
  DEFAULT_LOCATION
} from '../src/services/locationService.js';
import { calculatePrayerTimes, getPrayerTimes, getNextPrayer } from '../src/services/prayerService.js';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  scheduleTaskNotification,
  schedulePrayerNotifications,
  cancelTaskNotification,
  testNotification
} from '../src/services/notificationService.js';

describe('Reviewer M2-2 Adversarial Stress Suite', () => {

  test('ADV-1: Fallback Cities Geographic Coordinate Validation (All 20 Cities)', () => {
    assert.equal(FALLBACK_CITIES.length, 20, 'Must have exactly 20 fallback cities');
    assert.ok(Object.isFrozen(FALLBACK_CITIES), 'FALLBACK_CITIES must be deeply or shallowly frozen');

    const seenIds = new Set();
    for (const city of FALLBACK_CITIES) {
      assert.ok(city.id && typeof city.id === 'string', `City ${city.name} must have a string id`);
      assert.ok(!seenIds.has(city.id), `Duplicate city ID: ${city.id}`);
      seenIds.add(city.id);

      assert.ok(typeof city.name === 'string' && city.name.length > 0, `City ${city.id} must have Arabic name`);
      assert.ok(typeof city.englishName === 'string' && city.englishName.length > 0, `City ${city.id} must have English name`);
      assert.ok(typeof city.country === 'string' && city.country.length > 0, `City ${city.id} must have country`);

      // Geographic bounds: Lat [-90, 90], Long [-180, 180]
      assert.ok(
        Number.isFinite(city.latitude) && city.latitude >= -90 && city.latitude <= 90,
        `City ${city.id} latitude out of bounds: ${city.latitude}`
      );
      assert.ok(
        Number.isFinite(city.longitude) && city.longitude >= -180 && city.longitude <= 180,
        `City ${city.id} longitude out of bounds: ${city.longitude}`
      );

      // Verify prayer calculation succeeds for EVERY city without NaN or error
      const timings = calculatePrayerTimes({ latitude: city.latitude, longitude: city.longitude });
      assert.ok(timings, `Failed to calculate prayer times for ${city.id}`);
      for (const prayer of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
        const time = timings[prayer];
        assert.match(time, /^\d{2}:\d{2}$/, `Prayer ${prayer} in ${city.id} has invalid format: ${time}`);
      }
    }
  });

  test('ADV-2: setManualLocation Edge Cases and Adversarial Fuzzing', () => {
    // 1. Valid by ID
    const cairo = setManualLocation('cairo');
    assert.equal(cairo.city, 'القاهرة');
    assert.equal(cairo.latitude, 30.0444);
    assert.equal(cairo.isFallback, true);
    assert.equal(cairo.source, 'manual-city');

    // 2. Valid by Arabic Name
    const riyadh = setManualLocation('الرياض');
    assert.equal(riyadh.city, 'الرياض');
    assert.equal(riyadh.latitude, 24.7136);

    // 3. Valid by Object input
    const custom = setManualLocation({
      latitude: 25.0,
      longitude: 55.0,
      name: 'Custom City',
      country: 'Test'
    });
    assert.equal(custom.city, 'Custom City');
    assert.equal(custom.latitude, 25.0);

    // 4. Invalid inputs should return null without throwing
    assert.equal(setManualLocation('non_existent_city'), null);
    assert.equal(setManualLocation(null), null);
    assert.equal(setManualLocation(undefined), null);
    assert.equal(setManualLocation(''), null);
    assert.equal(setManualLocation(12345), null);
    assert.equal(setManualLocation({}), null);
    assert.equal(setManualLocation({ latitude: 'not-a-number', longitude: 50 }), null);
    assert.equal(setManualLocation({ latitude: NaN, longitude: 50 }), null);
    assert.equal(setManualLocation('<script>alert("xss")</script>'), null);
    assert.equal(setManualLocation("'; DROP TABLE cities; --"), null);
  });

  test('ADV-3: Startup Non-blocking Flow Simulation & Timeout Resilience', async () => {
    // Simulate App.jsx startup flow with timing inspection
    const start = Date.now();
    
    // Simulate timeout parameter (e.g. 50ms fast timeout)
    const locPromise = getCurrentLocation({ timeout: 50 });
    const notifPromise = requestNotificationPermission();

    const results = await Promise.allSettled([notifPromise, locPromise]);
    const duration = Date.now() - start;

    assert.equal(results.length, 2);
    assert.equal(results[0].status, 'fulfilled', 'requestNotificationPermission should fulfill');
    assert.equal(results[1].status, 'fulfilled', 'getCurrentLocation should fulfill (never reject)');

    // Resolved location must have valid coordinates
    const locResult = results[1].value;
    assert.ok(Number.isFinite(locResult.latitude), 'Resolved latitude must be finite');
    assert.ok(Number.isFinite(locResult.longitude), 'Resolved longitude must be finite');
    assert.ok(locResult.isFallback !== undefined, 'isFallback flag must be defined');

    // Ensure downstream prayer scheduling with resolved location does not throw
    const prayers = calculatePrayerTimes(locResult);
    assert.ok(prayers.Fajr && prayers.Dhuhr && prayers.Asr && prayers.Maghrib && prayers.Isha);
    const scheduleRes = await schedulePrayerNotifications(prayers, locResult);
    assert.ok(Array.isArray(scheduleRes));
  });

  test('ADV-4: Corrupted / Tampered Cache in locationService Recovery', () => {
    // Tamper with corrupted JSON or malformed coordinates in memory/cache
    const badCacheEntries = [
      '{"latitude": "invalid", "longitude": 39.8}',
      '{"latitude": NaN, "longitude": 39.8}',
      '{"latitude": null, "longitude": null}',
      '{"latitude": 21.42}', // missing longitude
      '{ corrupt json...',
      '12345',
      'true'
    ];

    for (const bad of badCacheEntries) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('to_top_last_known_location', bad);
        const retrieved = getLastKnownLocation();
        assert.equal(retrieved, null, `Corrupted cache "${bad}" must return null`);
      }
    }
  });

  test('ADV-5: Permission Status Synchronization and State Integrity', async () => {
    const notifPerm = await checkNotificationPermission();
    assert.ok(typeof notifPerm.granted === 'boolean');
    assert.ok(typeof notifPerm.status === 'string');

    // Multiple rapid checks do not crash
    const promises = Array.from({ length: 10 }, () => checkNotificationPermission());
    const statuses = await Promise.all(promises);
    assert.equal(statuses.length, 10);
    for (const s of statuses) {
      assert.ok(typeof s.granted === 'boolean');
    }
  });

});
