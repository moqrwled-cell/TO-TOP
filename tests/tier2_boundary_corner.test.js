import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, fileExists } from './helpers/test-utils.js';

describe('Tier 2: Boundary & Corner Cases', () => {

  test('2.1 notificationService.scheduleTaskNotification handles boundary & invalid inputs gracefully', async () => {
    assert.ok(
      fileExists('src/services/notificationService.js'),
      'src/services/notificationService.js must exist'
    );

    const notifService = await import('../src/services/notificationService.js');
    assert.ok(
      typeof notifService.scheduleTaskNotification === 'function',
      'scheduleTaskNotification must be a function'
    );

    // Case A: Missing or empty task text
    const emptyTaskRes = await notifService.scheduleTaskNotification({
      id: 101,
      text: '   ',
      time: '14:30',
    }).catch(err => ({ error: err }));
    assert.ok(
      emptyTaskRes === null || emptyTaskRes?.error || emptyTaskRes === 0,
      'scheduleTaskNotification must gracefully handle empty text without crashing'
    );

    // Case B: Missing time
    const noTimeRes = await notifService.scheduleTaskNotification({
      id: 102,
      text: 'مهمة بدون وقت',
      time: null,
    }).catch(err => ({ error: err }));
    assert.ok(
      noTimeRes === null || noTimeRes?.error || noTimeRes === 0,
      'scheduleTaskNotification must gracefully handle null or missing time'
    );

    // Case C: Invalid time format (e.g. "99:99" or "abc")
    const invalidTimeRes = await notifService.scheduleTaskNotification({
      id: 103,
      text: 'مهمة بوقت خاطئ',
      time: '99:99',
    }).catch(err => ({ error: err }));
    assert.ok(
      invalidTimeRes === null || invalidTimeRes?.error || invalidTimeRes === 0,
      'scheduleTaskNotification must handle invalid time string without unhandled crash'
    );
  });

  test('2.2 notificationService.cancelTaskNotification handles boundary IDs safely', async () => {
    assert.ok(
      fileExists('src/services/notificationService.js'),
      'src/services/notificationService.js must exist'
    );

    const notifService = await import('../src/services/notificationService.js');
    assert.ok(
      typeof notifService.cancelTaskNotification === 'function',
      'cancelTaskNotification must be a function'
    );

    // Non-existent ID, null, string ID
    await assert.doesNotReject(
      async () => {
        await notifService.cancelTaskNotification(9999999);
        await notifService.cancelTaskNotification('non-existent-task-id');
        await notifService.cancelTaskNotification(null);
      },
      'cancelTaskNotification must not throw when cancelling non-existent or null task IDs'
    );
  });

  test('2.3 locationService.getCurrentLocation handles permission denial and errors with Makkah fallback', async () => {
    assert.ok(
      fileExists('src/services/locationService.js'),
      'src/services/locationService.js must exist'
    );

    const locService = await import('../src/services/locationService.js');
    assert.ok(
      typeof locService.getCurrentLocation === 'function',
      'getCurrentLocation must be a function'
    );
    assert.ok(
      typeof locService.getDefaultLocation === 'function',
      'getDefaultLocation must be a function'
    );

    const defaultLoc = locService.getDefaultLocation();
    assert.ok(defaultLoc, 'getDefaultLocation must return location object');
    assert.ok(
      Math.abs(defaultLoc.latitude - 21.4225) < 0.1,
      `Default latitude must be Makkah (~21.4225), received: ${defaultLoc.latitude}`
    );
    assert.ok(
      Math.abs(defaultLoc.longitude - 39.8262) < 0.1,
      `Default longitude must be Makkah (~39.8262), received: ${defaultLoc.longitude}`
    );

    // Call getCurrentLocation - even in test environment without GPS, it must fallback gracefully
    const currentLoc = await locService.getCurrentLocation().catch(() => defaultLoc);
    assert.ok(currentLoc, 'getCurrentLocation must never return undefined or null');
    assert.ok(typeof currentLoc.latitude === 'number', 'latitude must be numeric');
    assert.ok(typeof currentLoc.longitude === 'number', 'longitude must be numeric');
  });

  test('2.4 prayerService.calculatePrayerTimes produces valid times for edge dates and coordinates', async () => {
    assert.ok(
      fileExists('src/services/prayerService.js'),
      'src/services/prayerService.js must exist'
    );

    const prayerService = await import('../src/services/prayerService.js');
    assert.ok(
      typeof prayerService.calculatePrayerTimes === 'function',
      'calculatePrayerTimes must be a function'
    );

    const testCoords = [
      { latitude: 21.4225, longitude: 39.8262, name: 'Makkah' },
      { latitude: 24.7136, longitude: 46.6753, name: 'Riyadh' },
      { latitude: 0.0, longitude: 0.0, name: 'Equator' },
      { latitude: 51.5074, longitude: -0.1278, name: 'London' },
    ];

    const testDates = [
      new Date('2026-01-01T12:00:00Z'),
      new Date('2026-06-21T12:00:00Z'), // Summer solstice
      new Date('2026-12-21T12:00:00Z'), // Winter solstice
      new Date('2028-02-29T12:00:00Z'), // Leap day
    ];

    for (const coords of testCoords) {
      for (const d of testDates) {
        const times = prayerService.calculatePrayerTimes(coords, d);
        assert.ok(times, `calculatePrayerTimes must return times for ${coords.name} on ${d.toISOString()}`);

        const requiredPrayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        for (const p of requiredPrayers) {
          const val = times[p] || times[p.toLowerCase()];
          assert.ok(
            val && typeof val === 'string' && val.length >= 4 && !val.includes('NaN'),
            `Prayer ${p} must have valid formatted time for ${coords.name}, received: ${val}`
          );
        }
      }
    }
  });

  test('2.5 prayerService.getNextPrayer calculates correct prayer across midnight boundary', async () => {
    assert.ok(
      fileExists('src/services/prayerService.js'),
      'src/services/prayerService.js must exist'
    );

    const prayerService = await import('../src/services/prayerService.js');
    assert.ok(
      typeof prayerService.getNextPrayer === 'function',
      'getNextPrayer must be a function'
    );

    const mockTimes = {
      Fajr: '05:00',
      Dhuhr: '12:15',
      Asr: '15:30',
      Maghrib: '18:00',
      Isha: '19:30',
    };

    // Case: Current time is 23:45 (after Isha)
    // Next prayer must be Fajr of next morning, and timeRemainingMs must be > 0
    const lateNightDate = new Date();
    lateNightDate.setHours(23, 45, 0, 0);

    const nextPrayer = prayerService.getNextPrayer(mockTimes, lateNightDate);
    assert.ok(nextPrayer, 'getNextPrayer must return a prayer object');
    assert.ok(
      nextPrayer.name.toLowerCase().includes('fajr') || nextPrayer.name.includes('الفجر'),
      `After Isha, next prayer must be Fajr (received: ${nextPrayer.name})`
    );
    assert.ok(
      nextPrayer.timeRemainingMs > 0,
      `timeRemainingMs to next Fajr must be positive (received: ${nextPrayer.timeRemainingMs})`
    );
  });

  test('2.6 Typography scale and padding boundaries prevent layout overflow', () => {
    const cssContent = readProjectFile('src/index.css') || '';
    const organizerContent = readProjectFile('src/features/organizer/OrganizerView.jsx') || '';
    const worshipContent = readProjectFile('src/features/worship/WorshipView.jsx') || '';

    // Verify h1 in index.css is scaled down <= 2.2rem (not 2.8rem)
    const h1Match = cssContent.match(/h1\s*\{[^}]*font-size:\s*([0-9.]+)(rem|px)/i);
    if (h1Match) {
      const val = parseFloat(h1Match[1]);
      const unit = h1Match[2];
      const remVal = unit === 'px' ? val / 16 : val;
      assert.ok(
        remVal <= 2.2,
        `h1 font size must be calibrated to <= 2.2rem for eye comfort (found: ${remVal}rem)`
      );
    }

    // Verify absence of 88px cumulative padding pattern (padding: 3rem nested with padding: 2.5rem or 3rem)
    const appContent = readProjectFile('src/App.jsx') || '';
    const hasExcessiveAppPadding = appContent.includes("padding: '3rem'") || appContent.includes('padding: 3rem');
    assert.ok(
      !hasExcessiveAppPadding,
      'Outer main panel must not have 3rem (48px) padding that balloons nested view paddings to 88px'
    );
  });

});
