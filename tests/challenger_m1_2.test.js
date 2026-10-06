import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Import services directly
import {
  calculatePrayerTimes,
  getNextPrayer,
  formatCountdown,
  formatTime12Hour,
  CALCULATION_METHODS,
  PRAYER_NAMES
} from '../src/services/prayerService.js';

import {
  scheduleTaskNotification,
  cancelTaskNotification,
  schedulePrayerNotifications,
  toDeterministicNotificationId,
  testNotification,
  getPendingNotifications,
  initializeNotificationChannels,
  NOTIFICATION_CHANNELS
} from '../src/services/notificationService.js';

import {
  getCurrentLocation,
  getDefaultLocation,
  DEFAULT_LOCATION
} from '../src/services/locationService.js';

describe('Adversarial Challenge M1-2: Native Manifest & targetSdk 36', () => {

  test('Manifest: All 6 required permissions and pairings are explicitly declared', () => {
    const manifestPath = path.resolve(PROJECT_ROOT, 'android/app/src/main/AndroidManifest.xml');
    assert.ok(fs.existsSync(manifestPath), 'AndroidManifest.xml must exist');
    const content = fs.readFileSync(manifestPath, 'utf8');

    // 6 Core Permissions required by specs + paired requirements
    const requiredPermissions = [
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.INTERNET',
    ];

    for (const perm of requiredPermissions) {
      assert.ok(
        content.includes(`android:name="${perm}"`),
        `AndroidManifest.xml is missing mandatory permission: ${perm}`
      );
    }

    // Exact Alarm fallback for Android 13/14+ (USE_EXACT_ALARM)
    assert.ok(
      content.includes('android:name="android.permission.USE_EXACT_ALARM"'),
      'AndroidManifest.xml must declare USE_EXACT_ALARM for automatic exact alarm grant'
    );

    // Wake lock for background alarm processing
    assert.ok(
      content.includes('android:name="android.permission.WAKE_LOCK"'),
      'AndroidManifest.xml should declare WAKE_LOCK for reliable alarm triggering'
    );
  });

  test('targetSdk 36: Gradle variables and component export flags meet Android 16/14 requirements', () => {
    const variablesPath = path.resolve(PROJECT_ROOT, 'android/variables.gradle');
    assert.ok(fs.existsSync(variablesPath), 'variables.gradle must exist');
    const variablesContent = fs.readFileSync(variablesPath, 'utf8');

    // Assert targetSdkVersion = 36 and compileSdkVersion = 36
    const compileSdkMatch = variablesContent.match(/compileSdkVersion\s*=\s*(\d+)/);
    const targetSdkMatch = variablesContent.match(/targetSdkVersion\s*=\s*(\d+)/);

    assert.ok(compileSdkMatch, 'compileSdkVersion must be defined in variables.gradle');
    assert.ok(targetSdkMatch, 'targetSdkVersion must be defined in variables.gradle');

    assert.equal(
      parseInt(compileSdkMatch[1], 10),
      36,
      `compileSdkVersion must be 36, received: ${compileSdkMatch[1]}`
    );
    assert.equal(
      parseInt(targetSdkMatch[1], 10),
      36,
      `targetSdkVersion must be 36, received: ${targetSdkMatch[1]}`
    );

    // Check app/build.gradle delegates to variables.gradle
    const appBuildPath = path.resolve(PROJECT_ROOT, 'android/app/build.gradle');
    const appBuildContent = fs.readFileSync(appBuildPath, 'utf8');
    assert.ok(
      appBuildContent.includes('targetSdkVersion rootProject.ext.targetSdkVersion'),
      'app/build.gradle must use rootProject.ext.targetSdkVersion'
    );
    assert.ok(
      appBuildContent.includes('compileSdk = rootProject.ext.compileSdkVersion'),
      'app/build.gradle must use rootProject.ext.compileSdkVersion'
    );

    // In Android 12+ (targetSdk >= 31, including 36):
    // MainActivity with intent-filter MUST declare android:exported="true"
    const manifestPath = path.resolve(PROJECT_ROOT, 'android/app/src/main/AndroidManifest.xml');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');

    assert.ok(
      manifestContent.includes('android:exported="true"'),
      'MainActivity must explicitly declare android:exported="true" for targetSdk >= 31/36'
    );

    // FileProvider must NOT be exported
    assert.ok(
      manifestContent.includes('android:exported="false"'),
      'FileProvider must be configured with android:exported="false"'
    );
  });

  test('Capacitor Gradle sync: plugins are linked in android settings and plugin json', () => {
    const settingsPath = path.resolve(PROJECT_ROOT, 'android/capacitor.settings.gradle');
    const pluginsJsonPath = path.resolve(PROJECT_ROOT, 'android/app/src/main/assets/capacitor.plugins.json');

    assert.ok(fs.existsSync(settingsPath), 'capacitor.settings.gradle must exist');
    const settingsContent = fs.readFileSync(settingsPath, 'utf8');

    assert.ok(
      settingsContent.includes(':capacitor-geolocation'),
      'capacitor.settings.gradle must include :capacitor-geolocation'
    );
    assert.ok(
      settingsContent.includes(':capacitor-local-notifications'),
      'capacitor.settings.gradle must include :capacitor-local-notifications'
    );

    if (fs.existsSync(pluginsJsonPath)) {
      const pluginsJsonContent = fs.readFileSync(pluginsJsonPath, 'utf8');
      assert.ok(
        pluginsJsonContent.includes('LocalNotifications'),
        'capacitor.plugins.json must register LocalNotifications'
      );
      assert.ok(
        pluginsJsonContent.includes('Geolocation'),
        'capacitor.plugins.json must register Geolocation'
      );
    }
  });

});

describe('Adversarial Challenge M1-2: Prayer Math Robustness & Zero NaNs/Negatives', () => {

  const testCoordinates = [
    { name: 'Makkah', lat: 21.4225, lng: 39.8262 },
    { name: 'Madinah', lat: 24.5247, lng: 39.5692 },
    { name: 'Riyadh', lat: 24.7136, lng: 46.6753 },
    { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
    { name: 'Jerusalem', lat: 31.7683, lng: 35.2137 },
    { name: 'Istanbul', lat: 41.0082, lng: 28.9784 },
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { name: 'Cape Town', lat: -33.9249, lng: 18.4241 },
    { name: 'Equator', lat: 0.0, lng: 0.0 },
    { name: 'Tromso (High North)', lat: 69.6492, lng: 18.9553 },
    { name: 'Ushuaia (Far South)', lat: -54.8019, lng: -68.3030 },
  ];

  test('Solstices & Equinoxes: Zero NaNs across all solstices and international cities', () => {
    const astronomicalDates = [
      // Summer Solstices (maximum northern declination)
      new Date('2024-06-20T12:00:00Z'),
      new Date('2025-06-21T12:00:00Z'),
      new Date('2026-06-21T12:00:00Z'),
      new Date('2027-06-21T12:00:00Z'),
      new Date('2028-06-20T12:00:00Z'),
      // Winter Solstices (maximum southern declination)
      new Date('2024-12-21T12:00:00Z'),
      new Date('2025-12-21T12:00:00Z'),
      new Date('2026-12-21T12:00:00Z'),
      new Date('2027-12-22T12:00:00Z'),
      new Date('2028-12-21T12:00:00Z'),
      // Equinoxes (zero declination)
      new Date('2026-03-20T12:00:00Z'),
      new Date('2026-09-22T12:00:00Z'),
    ];

    const methods = Object.keys(CALCULATION_METHODS);
    const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    for (const city of testCoordinates) {
      for (const date of astronomicalDates) {
        for (const method of methods) {
          const times = calculatePrayerTimes(
            { latitude: city.lat, longitude: city.lng },
            date,
            { method }
          );

          assert.ok(times, `Result must exist for ${city.name} on ${date.toISOString()} [${method}]`);

          for (const p of prayers) {
            const timeStr = times[p];
            assert.ok(
              typeof timeStr === 'string' && timeStr.length === 5,
              `Prayer ${p} for ${city.name} must be 5-character string, got: ${timeStr}`
            );
            assert.ok(
              !timeStr.includes('NaN'),
              `CRITICAL: Prayer ${p} returned NaN for ${city.name} on ${date.toISOString()}: ${timeStr}`
            );
            assert.ok(
              !timeStr.includes('-'),
              `CRITICAL: Prayer ${p} returned negative time for ${city.name} on ${date.toISOString()}: ${timeStr}`
            );

            const [hh, mm] = timeStr.split(':').map(Number);
            assert.ok(
              Number.isInteger(hh) && hh >= 0 && hh <= 23,
              `Invalid hour ${hh} in ${p} (${timeStr}) for ${city.name}`
            );
            assert.ok(
              Number.isInteger(mm) && mm >= 0 && mm <= 59,
              `Invalid minute ${mm} in ${p} (${timeStr}) for ${city.name}`
            );
          }
        }
      }
    }
  });

  test('Leap Years & Century Boundaries: Zero NaNs on Feb 29 and across century transitions', () => {
    const leapDates = [
      new Date('2000-02-29T12:00:00Z'), // 400-year leap year
      new Date('2020-02-29T12:00:00Z'),
      new Date('2024-02-29T12:00:00Z'),
      new Date('2028-02-29T12:00:00Z'),
      new Date('2032-02-29T12:00:00Z'),
      new Date('2400-02-29T12:00:00Z'),
      // Non-leap century ends
      new Date('1900-02-28T12:00:00Z'),
      new Date('2100-02-28T12:00:00Z'),
    ];

    const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    for (const d of leapDates) {
      for (const city of testCoordinates.slice(0, 6)) {
        const times = calculatePrayerTimes({ latitude: city.lat, longitude: city.lng }, d);
        for (const p of prayers) {
          const timeStr = times[p];
          assert.ok(
            /^\d{2}:\d{2}$/.test(timeStr),
            `Leap date ${d.toISOString()} prayer ${p} must match HH:mm, got: ${timeStr}`
          );
          assert.ok(!timeStr.includes('NaN'), `Leap date returned NaN: ${timeStr}`);
        }
      }
    }
  });

  test('Exhaustive 366-day leap year run (2028): Zero NaNs on any day of the year', () => {
    const makkah = { latitude: 21.4225, longitude: 39.8262 };
    const riyadh = { latitude: 24.7136, longitude: 46.6753 };
    const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    const startDate = new Date('2028-01-01T12:00:00Z');
    for (let dayOffset = 0; dayOffset < 366; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + dayOffset);

      for (const loc of [makkah, riyadh]) {
        const times = calculatePrayerTimes(loc, currentDate);
        for (const p of prayers) {
          const val = times[p];
          assert.ok(
            /^\d{2}:\d{2}$/.test(val),
            `Day ${dayOffset} (${currentDate.toISOString()}) prayer ${p} invalid: ${val}`
          );
        }
      }
    }
  });

  test('Extreme & Adversarial Coordinates: Graceful handling with zero crashes or NaNs', () => {
    const extremeCases = [
      { coords: { latitude: 90.0, longitude: 0.0 }, name: 'North Pole exact' },
      { coords: { latitude: -90.0, longitude: 0.0 }, name: 'South Pole exact' },
      { coords: { latitude: 89.999, longitude: 180.0 }, name: 'North Pole + DateLine' },
      { coords: { latitude: -89.999, longitude: -180.0 }, name: 'South Pole + DateLine' },
      { coords: { latitude: 0.0, longitude: 0.0 }, name: 'Null Island' },
      { coords: { latitude: 21.4225 }, name: 'Missing longitude' },
      { coords: { longitude: 39.8262 }, name: 'Missing latitude' },
      { coords: {}, name: 'Empty coords' },
      { coords: null, name: 'Null coords' },
      { coords: undefined, name: 'Undefined coords' },
      { coords: { latitude: null, longitude: null }, name: 'Null lat/lng' },
      { coords: { latitude: undefined, longitude: undefined }, name: 'Undefined lat/lng' },
    ];

    const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    for (const { coords, name } of extremeCases) {
      assert.doesNotThrow(() => {
        const times = calculatePrayerTimes(coords, new Date());
        assert.ok(times, `Must return times for ${name}`);
        for (const p of prayers) {
          const val = times[p];
          assert.ok(
            typeof val === 'string' && /^\d{2}:\d{2}$/.test(val),
            `Extreme case ${name} prayer ${p} must be valid HH:mm, received: ${val}`
          );
          assert.ok(!val.includes('NaN'), `Extreme case ${name} prayer ${p} had NaN: ${val}`);
        }
      }, `calculatePrayerTimes must not throw on extreme coords: ${name}`);
    }
  });

  test('Chronological ordering in temperate zones (Makkah & Riyadh)', () => {
    const makkah = { latitude: 21.4225, longitude: 39.8262 };
    const date = new Date('2026-06-21T12:00:00Z');
    const times = calculatePrayerTimes(makkah, date);

    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const fajr = toMinutes(times.Fajr);
    const sunrise = toMinutes(times.Sunrise);
    const dhuhr = toMinutes(times.Dhuhr);
    const asr = toMinutes(times.Asr);
    const maghrib = toMinutes(times.Maghrib);
    const isha = toMinutes(times.Isha);

    assert.ok(fajr < sunrise, `Fajr (${times.Fajr}) must be before Sunrise (${times.Sunrise})`);
    assert.ok(sunrise < dhuhr, `Sunrise (${times.Sunrise}) must be before Dhuhr (${times.Dhuhr})`);
    assert.ok(dhuhr < asr, `Dhuhr (${times.Dhuhr}) must be before Asr (${times.Asr})`);
    assert.ok(asr < maghrib, `Asr (${times.Asr}) must be before Maghrib (${times.Maghrib})`);
    assert.ok(maghrib < isha, `Maghrib (${times.Maghrib}) must be before Isha (${times.Isha})`);
  });

  // CHALLENGE FINDING: getNextPrayer null crash
  test('FAILING/DEFECT: getNextPrayer must guard against null and undefined inputs without uncaught TypeError', () => {
    assert.doesNotThrow(
      () => {
        getNextPrayer(null);
      },
      TypeError,
      'getNextPrayer(null) currently throws unhandled TypeError: Cannot read properties of null (reading "Fajr")'
    );
  });

  // CHALLENGE FINDING: formatCountdown NaN handling
  test('FAILING/DEFECT: formatCountdown must return "00:00:00" when passed NaN instead of "NaN:NaN:NaN"', () => {
    const formatted = formatCountdown(NaN).formatted;
    assert.equal(
      formatted,
      '00:00:00',
      `formatCountdown(NaN) must safely clamp to '00:00:00', but returned '${formatted}'`
    );
  });

  // CHALLENGE FINDING: calculatePrayerTimes null date crash
  test('FAILING/DEFECT: calculatePrayerTimes must not crash when date parameter is explicitly null', () => {
    assert.doesNotThrow(
      () => {
        calculatePrayerTimes({ latitude: 21.4225, longitude: 39.8262 }, null);
      },
      TypeError,
      'calculatePrayerTimes(coords, null) currently throws TypeError: Cannot read properties of null (reading "getTimezoneOffset")'
    );
  });

  test('getNextPrayer & formatCountdown: Standard midnight boundary and formatted strings', () => {
    const mockTimes = {
      Fajr: '04:30',
      Sunrise: '05:50',
      Dhuhr: '12:15',
      Asr: '15:30',
      Maghrib: '18:10',
      Isha: '19:40',
    };

    // Right after midnight (00:05): Next prayer is Fajr of today
    const earlyMorning = new Date();
    earlyMorning.setHours(0, 5, 0, 0);
    const resEarly = getNextPrayer(mockTimes, earlyMorning);
    assert.equal(resEarly.key, 'Fajr');
    assert.equal(resEarly.isTomorrow, false);
    assert.ok(resEarly.timeRemainingMs > 0);

    // Right before midnight (23:55): Next prayer is Fajr of tomorrow
    const lateNight = new Date();
    lateNight.setHours(23, 55, 0, 0);
    const resLate = getNextPrayer(mockTimes, lateNight);
    assert.equal(resLate.key, 'Fajr');
    assert.equal(resLate.isTomorrow, true);
    assert.ok(resLate.timeRemainingMs > 0);

    // formatCountdown valid edge cases
    assert.equal(formatCountdown(0).formatted, '00:00:00');
    assert.equal(formatCountdown(-1000).formatted, '00:00:00');
    assert.equal(formatCountdown(3661000).formatted, '01:01:01');

    // formatTime12Hour edge cases
    assert.equal(formatTime12Hour('00:00', 'en'), '12:00 AM');
    assert.equal(formatTime12Hour('12:00', 'en'), '12:00 PM');
    assert.equal(formatTime12Hour('13:30', 'en'), '1:30 PM');
    assert.equal(formatTime12Hour('13:30', 'ar'), '1:30 م');
    assert.equal(formatTime12Hour('04:30', 'ar'), '4:30 ص');
    assert.equal(formatTime12Hour(null), '');
    assert.equal(formatTime12Hour(''), '');
    assert.equal(formatTime12Hour('invalid'), 'invalid');
  });

});

describe('Adversarial Challenge M1-2: Notification Error Tolerance & Fuzzing', () => {

  test('scheduleTaskNotification: Rejects null, undefined, and non-object inputs gracefully', async () => {
    const invalidInputs = [
      null,
      undefined,
      0,
      123,
      '',
      'string-task',
      true,
      false,
      [],
      [1, 2, 3],
      Symbol('task'),
    ];

    for (const input of invalidInputs) {
      const res = await scheduleTaskNotification(input);
      assert.equal(
        res,
        null,
        `scheduleTaskNotification must return null for invalid input: ${String(input)}`
      );
    }
  });

  test('scheduleTaskNotification: Fuzzing malformed task objects (text, time, date)', async () => {
    const malformedTasks = [
      // Empty / whitespace text
      { id: 1, text: '', time: '12:00' },
      { id: 2, text: '    ', time: '12:00' },
      { id: 3, text: '\t\n', time: '12:00' },
      { id: 4, text: null, time: '12:00' },
      { id: 5, text: undefined, time: '12:00' },
      { id: 6, text: 12345, time: '12:00' },
      { id: 7, text: {}, time: '12:00' },

      // Missing / invalid time
      { id: 8, text: 'مهمة', time: null },
      { id: 9, text: 'مهمة', time: undefined },
      { id: 10, text: 'مهمة', time: '' },
      { id: 11, text: 'مهمة', time: 'invalid' },
      { id: 12, text: 'مهمة', time: '25:00' },
      { id: 13, text: 'مهمة', time: '12:60' },
      { id: 14, text: 'مهمة', time: '-01:00' },
      { id: 15, text: 'مهمة', time: '12:-05' },
      { id: 16, text: 'مهمة', time: '12:00:00' },
      { id: 17, text: 'مهمة', time: '99:99' },
    ];

    for (const task of malformedTasks) {
      const res = await scheduleTaskNotification(task);
      assert.equal(
        res,
        null,
        `scheduleTaskNotification must reject malformed task: ${JSON.stringify(task)}`
      );
    }
  });

  test('scheduleTaskNotification: Accepts boundary dates and varied ID formats safely', async () => {
    const validBoundaryTasks = [
      { id: 1, text: 'Valid Task 1', time: '14:00' },
      { id: 2147483647, text: 'Max 32-bit ID Task', time: '15:00' },
      { id: 'uuid-550e8400-e29b-41d4-a716-446655440000', text: 'UUID ID Task', time: '16:00' },
      { id: 'task-alphanumeric-99', text: 'String ID Task', time: '17:00' },
      { id: -99, text: 'Negative ID Task', time: '18:00' },
      { id: 0, text: 'Zero ID Task', time: '19:00' },
      { id: null, text: 'Null ID Task', time: '20:00' },
      { id: undefined, text: 'Undefined ID Task', time: '21:00' },

      { id: 101, text: 'With future date', time: '09:00', date: '2028-12-31' },
      { id: 102, text: 'With invalid date format', time: '09:00', date: 'not-a-date' },
      { id: 103, text: 'With null date', time: '09:00', date: null },
      { id: 104, text: 'With non-string date', time: '09:00', date: 2026 },
    ];

    for (const task of validBoundaryTasks) {
      const notifId = await scheduleTaskNotification(task);
      assert.ok(
        typeof notifId === 'number',
        `Returned ID must be numeric, got: ${typeof notifId} for task ${JSON.stringify(task)}`
      );
      assert.ok(
        Number.isInteger(notifId),
        `Returned ID must be integer for task ${JSON.stringify(task)}`
      );
      assert.ok(
        notifId >= 1 && notifId <= 2147483647,
        `Returned ID must be positive 32-bit integer [1, 2147483647], got: ${notifId}`
      );
    }
  });

  test('cancelTaskNotification: Completely immune to null, undefined, strings, and missing IDs', async () => {
    const adversarialIds = [
      null,
      undefined,
      '',
      '   ',
      0,
      -1,
      -2147483648,
      99999999999999,
      NaN,
      Infinity,
      -Infinity,
      'non-existent-id',
      'uuid-does-not-exist',
      {},
      [],
      true,
      false,
    ];

    for (const id of adversarialIds) {
      await assert.doesNotReject(
        async () => {
          await cancelTaskNotification(id);
        },
        `cancelTaskNotification threw on adversarial input: ${String(id)}`
      );
    }
  });

  // CHALLENGE FINDING: schedulePrayerNotifications validation omission
  test('FAILING/DEFECT: schedulePrayerNotifications must reject out-of-range times (e.g. Asr: 25:99)', async () => {
    const malformedTimes = {
      Fajr: 'invalid',
      Sunrise: null,
      Dhuhr: '',
      Asr: '25:99', // Out-of-bounds hour & minute
      Maghrib: 12345,
      Isha: 'bad'
    };
    const scheduled = await schedulePrayerNotifications(malformedTimes);
    assert.deepEqual(
      scheduled,
      [],
      `schedulePrayerNotifications must reject out-of-bounds times like "25:99", but scheduled IDs: ${JSON.stringify(scheduled)}`
    );
  });

  test('schedulePrayerNotifications: Schedules valid times and ignores missing/empty prayers', async () => {
    const partialTimes = {
      Fajr: '05:00',
      Dhuhr: 'invalid'
    };
    const partialRes = await schedulePrayerNotifications(partialTimes);
    assert.equal(partialRes.length, 1);
    assert.equal(partialRes[0], 80001);

    const validTimes = {
      Fajr: '04:45',
      Sunrise: '06:05',
      Dhuhr: '12:20',
      Asr: '15:40',
      Maghrib: '18:30',
      Isha: '20:00'
    };

    const adversarialCoords = [null, undefined, {}, { lat: 'bad' }, { latitude: 21.4225, longitude: 39.8262 }];
    for (const coords of adversarialCoords) {
      const scheduledIds = await schedulePrayerNotifications(validTimes, coords);
      assert.equal(scheduledIds.length, 6, 'Must schedule all 6 prayers');
      for (const id of scheduledIds) {
        assert.ok(
          Number.isInteger(id) && id >= 1 && id <= 2147483647,
          `Prayer notification ID must be valid 32-bit positive integer: ${id}`
        );
      }
    }
  });

  test('toDeterministicNotificationId: Exhaustive Invariant Property Test (500 variations)', () => {
    const testCases = [
      1, 2, 42, 1000, 2147483647,
      0, -1, -42, -2147483648, -1000000,
      0.5, 1.2, 3.14159, -0.7, -99.99,
      2147483648, 2147483649, 1e12, 1e15, Number.MAX_SAFE_INTEGER,
      NaN, Infinity, -Infinity,
      null, undefined, true, false,
      '', ' ', '0', '1', '-1', 'task_1', 'uuid-1234-abcd',
      'arabic_نص_عربي', '🌟emoji_task',
      {}, { id: 1 }, [], [1, 2, 3],
    ];

    for (const val of testCases) {
      const result = toDeterministicNotificationId(val);
      assert.equal(typeof result, 'number', `Must return number for ${String(val)}`);
      assert.ok(Number.isInteger(result), `Must return integer for ${String(val)}`);
      assert.ok(
        result >= 1 && result <= 2147483647,
        `Invariant violated: result ${result} is outside [1, 2147483647] for input ${String(val)}`
      );
      assert.ok(!Number.isNaN(result), `Result must not be NaN for ${String(val)}`);
    }

    for (let i = 0; i < 500; i++) {
      const randomStr = Math.random().toString(36).substring(2) + '-' + Date.now();
      const res = toDeterministicNotificationId(randomStr, i % 10);
      assert.ok(
        Number.isInteger(res) && res >= 1 && res <= 2147483647,
        `Fuzzed string failed invariant: ${randomStr} -> ${res}`
      );
    }
  });

  test('General service queries: channels, pending, testNotification do not throw', async () => {
    await assert.doesNotReject(async () => {
      await initializeNotificationChannels();
      await initializeNotificationChannels();
    });

    const testResult = await testNotification();
    assert.equal(typeof testResult, 'boolean');

    const pending = await getPendingNotifications();
    assert.ok(Array.isArray(pending), 'getPendingNotifications must return an array');
    assert.ok(pending.length > 0, 'Pending notifications should contain recently scheduled items');
  });

});
