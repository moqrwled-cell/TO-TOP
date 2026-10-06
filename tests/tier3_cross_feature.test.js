import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  readProjectFile,
  fileExists,
  parseCssVariables,
  calculateContrastRatio,
  createMockCapacitor,
} from './helpers/test-utils.js';

describe('Tier 3: Cross-Feature Combinations & Integration', () => {

  test('3.1 Adding a task with time triggers LocalNotifications.schedule with valid payload', async () => {
    assert.ok(
      fileExists('src/services/notificationService.js'),
      'src/services/notificationService.js must exist'
    );

    const notifService = await import('../src/services/notificationService.js');
    assert.ok(
      typeof notifService.scheduleTaskNotification === 'function',
      'scheduleTaskNotification must be a function'
    );

    // Call scheduleTaskNotification with realistic task
    const mockTask = {
      id: 42,
      text: 'قراءة ورد القرآن اليومي',
      time: '18:30',
      date: new Date().toISOString().split('T')[0],
      isImportant: true,
    };

    const scheduleResult = await notifService.scheduleTaskNotification(mockTask).catch(err => ({ error: err }));
    assert.ok(
      scheduleResult !== null && !scheduleResult?.error,
      'scheduleTaskNotification must successfully schedule without unhandled rejection'
    );

    // Verify OrganizerView code integrates notificationService
    const organizerCode = readProjectFile('src/features/organizer/OrganizerView.jsx') || '';
    const hasNotificationIntegration =
      organizerCode.includes('scheduleTaskNotification') ||
      organizerCode.includes('notificationService') ||
      organizerCode.includes('LocalNotifications');

    assert.ok(
      hasNotificationIntegration,
      'OrganizerView must integrate notificationService when adding or modifying tasks'
    );
  });

  test('3.2 Completing or deleting a task triggers cancelTaskNotification', async () => {
    assert.ok(
      fileExists('src/services/notificationService.js'),
      'src/services/notificationService.js must exist'
    );

    const notifService = await import('../src/services/notificationService.js');
    assert.ok(
      typeof notifService.cancelTaskNotification === 'function',
      'cancelTaskNotification must be a function'
    );

    const organizerCode = readProjectFile('src/features/organizer/OrganizerView.jsx') || '';
    const hasCancelIntegration =
      organizerCode.includes('cancelTaskNotification') ||
      organizerCode.includes('notificationService.cancel') ||
      organizerCode.includes('LocalNotifications.cancel');

    assert.ok(
      hasCancelIntegration,
      'OrganizerView must call cancelTaskNotification when a task is completed or deleted'
    );
  });

  test('3.3 Location denial falls back to Makkah coords and schedules all 5 daily prayer alarms', async () => {
    assert.ok(
      fileExists('src/services/locationService.js'),
      'src/services/locationService.js must exist'
    );
    assert.ok(
      fileExists('src/services/prayerService.js'),
      'src/services/prayerService.js must exist'
    );
    assert.ok(
      fileExists('src/services/notificationService.js'),
      'src/services/notificationService.js must exist'
    );

    const locService = await import('../src/services/locationService.js');
    const prayerService = await import('../src/services/prayerService.js');
    const notifService = await import('../src/services/notificationService.js');

    // 1. Get fallback location
    const defaultCoords = locService.getDefaultLocation();
    assert.ok(defaultCoords.latitude && defaultCoords.longitude, 'Fallback coordinates must be valid');

    // 2. Calculate prayer times with fallback
    const times = prayerService.calculatePrayerTimes(defaultCoords);
    assert.ok(times, 'Prayer times must be calculated from fallback coordinates');
    assert.ok(times.Fajr || times.fajr, 'Fajr prayer must be present');
    assert.ok(times.Dhuhr || times.dhuhr, 'Dhuhr prayer must be present');
    assert.ok(times.Asr || times.asr, 'Asr prayer must be present');
    assert.ok(times.Maghrib || times.maghrib, 'Maghrib prayer must be present');
    assert.ok(times.Isha || times.isha, 'Isha prayer must be present');

    // 3. Schedule prayer notifications
    const prayerScheduleRes = await notifService.schedulePrayerNotifications(times, defaultCoords)
      .catch(err => ({ error: err }));
    assert.ok(
      prayerScheduleRes !== null && !prayerScheduleRes?.error,
      'schedulePrayerNotifications must successfully schedule all 5 prayers'
    );
  });

  test('3.4 RTL Logical Properties Compliance in dashboard and views', () => {
    const dashboardCode = readProjectFile('src/components/Dashboard.jsx') || '';
    const organizerCode = readProjectFile('src/features/organizer/OrganizerView.jsx') || '';
    const worshipCode = readProjectFile('src/features/worship/WorshipView.jsx') || '';

    // Check that Dashboard cards do NOT use physical borderLeft for RTL accent indicators
    // In RTL, borderLeft is visually on the wrong side. border-inline-start or borderRight should be used.
    const hasPhysicalBorderLeft =
      dashboardCode.includes("borderLeft: '4px solid") ||
      dashboardCode.includes('borderLeft: "4px solid') ||
      dashboardCode.includes('border-left: 4px solid');

    assert.ok(
      !hasPhysicalBorderLeft,
      'Dashboard metric cards must use RTL logical properties (border-inline-start or borderInlineStart) instead of physical borderLeft'
    );
  });

  test('3.5 Light & Dark Theme Contrast Ratios comply with eye comfort standards (WCAG AA/AAA)', () => {
    const cssContent = readProjectFile('src/index.css') || '';
    const tokens = parseCssVariables(cssContent);

    const darkTokens = tokens['dark'] || tokens['default'] || {};
    const lightTokens = tokens['light'] || {};

    const darkBg = darkTokens['--bg-color'] || '#0c0f17';
    const darkText = darkTokens['--text-primary'] || '#f1f5f9';

    // Verify dark mode contrast: must be at least 4.5:1 (readable), but not harsh glare (e.g., pure #000000 with #ffffff is 21:1)
    const darkRatio = calculateContrastRatio(darkBg, darkText);
    assert.ok(
      darkRatio >= 4.5,
      `Dark mode contrast ratio must be >= 4.5:1 for accessibility (measured: ${darkRatio.toFixed(2)}:1)`
    );

    // If light tokens exist, verify light mode contrast
    if (lightTokens['--bg-color'] && lightTokens['--text-primary']) {
      const lightBg = lightTokens['--bg-color'];
      const lightText = lightTokens['--text-primary'];
      const lightRatio = calculateContrastRatio(lightBg, lightText);
      assert.ok(
        lightRatio >= 4.5,
        `Light mode contrast ratio must be >= 4.5:1 for accessibility (measured: ${lightRatio.toFixed(2)}:1)`
      );
    }

    // Check that mobile-bottom-nav does NOT hardcode pitch black in light mode
    const navRuleRegex = /\.mobile-bottom-nav\s*\{([^}]+)\}/;
    const navMatch = cssContent.match(navRuleRegex);
    if (navMatch) {
      const ruleBody = navMatch[1];
      const hasHardcodedDarkNav = ruleBody.includes('#050505') || ruleBody.includes('rgba(5, 5, 5');
      assert.ok(
        !hasHardcodedDarkNav,
        '.mobile-bottom-nav must use CSS variable --surface-color / --bg-color, not hardcoded pitch-black background'
      );
    }
  });

});
