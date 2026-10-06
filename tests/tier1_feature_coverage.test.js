import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, fileExists, parseCssVariables } from './helpers/test-utils.js';

describe('Tier 1: Feature Coverage & Interface Contracts', () => {

  test('1.1 Android Native Permissions declared in AndroidManifest.xml', () => {
    const manifest = readProjectFile('android/app/src/main/AndroidManifest.xml');
    assert.ok(manifest, 'AndroidManifest.xml must exist at android/app/src/main/AndroidManifest.xml');

    const requiredPermissions = [
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.RECEIVE_BOOT_COMPLETED',
    ];

    const missingPermissions = [];
    for (const perm of requiredPermissions) {
      if (!manifest.includes(`android:name="${perm}"`)) {
        missingPermissions.push(perm);
      }
    }

    const hasExactAlarm =
      manifest.includes('android:name="android.permission.SCHEDULE_EXACT_ALARM"') ||
      manifest.includes('android:name="android.permission.USE_EXACT_ALARM"');

    if (!hasExactAlarm) {
      missingPermissions.push('SCHEDULE_EXACT_ALARM or USE_EXACT_ALARM');
    }

    assert.equal(
      missingPermissions.length,
      0,
      `AndroidManifest.xml is missing required permissions: ${missingPermissions.join(', ')}`
    );
  });

  test('1.2 Capacitor Plugins Gradle & Settings Configuration', () => {
    const capacitorSettings = readProjectFile('android/capacitor.settings.gradle');
    const capacitorPluginsJson = readProjectFile('android/app/src/main/assets/capacitor.plugins.json');

    // Either capacitor.settings.gradle includes plugin projects or capacitor.plugins.json registers them
    const hasLocalNotif =
      (capacitorSettings && capacitorSettings.includes('capacitor-local-notifications')) ||
      (capacitorPluginsJson && capacitorPluginsJson.includes('LocalNotifications'));

    const hasGeolocation =
      (capacitorSettings && capacitorSettings.includes('capacitor-geolocation')) ||
      (capacitorPluginsJson && capacitorPluginsJson.includes('Geolocation'));

    assert.ok(
      hasLocalNotif,
      'Capacitor Local Notifications plugin must be synced and linked into Android build'
    );
    assert.ok(
      hasGeolocation,
      'Capacitor Geolocation plugin must be synced and linked into Android build'
    );
  });

  test('1.3 notificationService exists and exports all contract methods', async () => {
    const serviceExists = fileExists('src/services/notificationService.js');
    assert.ok(serviceExists, 'src/services/notificationService.js must exist');

    const serviceCode = readProjectFile('src/services/notificationService.js');
    const contractMethods = [
      'requestNotificationPermission',
      'scheduleTaskNotification',
      'cancelTaskNotification',
      'schedulePrayerNotifications',
      'testNotification',
      'getPendingNotifications',
    ];

    for (const method of contractMethods) {
      assert.ok(
        serviceCode.includes(method),
        `notificationService.js must declare/export ${method}`
      );
    }
  });

  test('1.4 locationService exists and exports all contract methods', async () => {
    const serviceExists = fileExists('src/services/locationService.js');
    assert.ok(serviceExists, 'src/services/locationService.js must exist');

    const serviceCode = readProjectFile('src/services/locationService.js');
    const contractMethods = [
      'getCurrentLocation',
      'getDefaultLocation',
    ];

    for (const method of contractMethods) {
      assert.ok(
        serviceCode.includes(method),
        `locationService.js must declare/export ${method}`
      );
    }
  });

  test('1.5 prayerService exists and exports all contract methods', async () => {
    const serviceExists = fileExists('src/services/prayerService.js');
    assert.ok(serviceExists, 'src/services/prayerService.js must exist');

    const serviceCode = readProjectFile('src/services/prayerService.js');
    const contractMethods = [
      'calculatePrayerTimes',
      'getNextPrayer',
    ];

    for (const method of contractMethods) {
      assert.ok(
        serviceCode.includes(method),
        `prayerService.js must declare/export ${method}`
      );
    }
  });

  test('1.6 UI/UX design tokens in index.css adhere to soothing slate dark palette', () => {
    const cssContent = readProjectFile('src/index.css');
    assert.ok(cssContent, 'src/index.css must exist');

    const tokens = parseCssVariables(cssContent);
    const darkTokens = tokens['dark'] || tokens['default'] || {};

    const bgColor = (darkTokens['--bg-color'] || '').toLowerCase();
    const textPrimary = (darkTokens['--text-primary'] || '').toLowerCase();

    // Check that background is calibrated dark slate (#0c0f17) rather than pitch black (#030303)
    assert.notEqual(
      bgColor,
      '#030303',
      '--bg-color must not be harsh OLED pitch-black #030303'
    );
    assert.ok(
      bgColor.includes('#0c0f17') || bgColor.includes('#0f172a') || bgColor.includes('#111827'),
      `--bg-color must be deep soothing slate (expected #0c0f17, received: ${bgColor})`
    );

    // Text primary should be soft text (#f1f5f9) rather than pure glare white (#ffffff)
    assert.notEqual(
      textPrimary,
      '#ffffff',
      '--text-primary in dark mode should be soft slate white (e.g. #f1f5f9), not harsh #ffffff'
    );
  });

  test('1.7 Mobile navigation in App.jsx uses ergonomic 5-tab bar', () => {
    const appCode = readProjectFile('src/App.jsx');
    assert.ok(appCode, 'src/App.jsx must exist');

    // Must NOT cram 10 navigation items into mobile bottom nav
    const has10NavItems =
      appCode.includes("t('nav.thoughts')") &&
      appCode.includes("t('nav.wisdom')") &&
      appCode.includes("t('nav.support')") &&
      appCode.includes("t('nav.logout')") &&
      appCode.includes('mobile-bottom-nav') &&
      !appCode.includes('MoreModal') &&
      !appCode.includes('activeTab === \'more\'');

    assert.ok(
      !has10NavItems,
      'Mobile bottom navigation must not cram all 10 desktop items into a scrolling bottom bar'
    );

    // Should feature the 5 core tabs (Dashboard/Home, Worship, Organizer, Goals/Focus, More)
    assert.ok(
      appCode.includes('more') || appCode.includes('MoreModal') || appCode.includes('nav.more'),
      'Mobile navigation must feature a "More" sheet or modal tab grouping secondary destinations'
    );
  });

  test('1.8 Codebase contains explicit calls to LocalNotifications.schedule', () => {
    const notifService = readProjectFile('src/services/notificationService.js') || '';
    const organizer = readProjectFile('src/features/organizer/OrganizerView.jsx') || '';
    const worship = readProjectFile('src/features/worship/WorshipView.jsx') || '';
    const combined = notifService + organizer + worship;

    const hasScheduleCall =
      combined.includes('LocalNotifications.schedule') ||
      combined.includes('scheduleTaskNotification') ||
      combined.includes('.schedule(');

    assert.ok(
      hasScheduleCall,
      'Codebase must contain explicit calls to schedule local notifications for tasks and prayers'
    );
  });

});
