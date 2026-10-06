import assert from 'node:assert/strict';
import { calculatePrayerTimes, getNextPrayer, formatCountdown, formatTime12Hour, CALCULATION_METHODS } from '../../../src/services/prayerService.js';
import { toDeterministicNotificationId, scheduleTaskNotification, cancelTaskNotification, schedulePrayerNotifications, getPendingNotifications, testNotification } from '../../../src/services/notificationService.js';
import { getDefaultLocation, getCurrentLocation, DEFAULT_LOCATION } from '../../../src/services/locationService.js';

console.log('--- STARTING ADVERSARIAL INTEGRITY VERIFICATION ---');

// 1. ASTRONOMICAL DYNAMICS VERIFICATION (ensure no hardcoded static prayer times)
console.log('Testing Astronomical Dynamics...');
const makkahCoords = { latitude: 21.4225, longitude: 39.8262 };
const summerSolstice = new Date('2026-06-21T12:00:00Z');
const winterSolstice = new Date('2026-12-21T12:00:00Z');

const summerTimes = calculatePrayerTimes(makkahCoords, summerSolstice);
const winterTimes = calculatePrayerTimes(makkahCoords, winterSolstice);

console.log('Summer Makkah:', summerTimes);
console.log('Winter Makkah:', winterTimes);

// Fajr in summer in Makkah must be earlier than Fajr in winter
assert.notEqual(summerTimes.Fajr, winterTimes.Fajr, 'Fajr must differ between summer and winter');
assert.notEqual(summerTimes.Maghrib, winterTimes.Maghrib, 'Maghrib must differ between summer and winter');
assert.ok(summerTimes.Fajr < winterTimes.Fajr, `Summer Fajr (${summerTimes.Fajr}) should be earlier than Winter Fajr (${winterTimes.Fajr})`);
assert.ok(summerTimes.Maghrib > winterTimes.Maghrib, `Summer Maghrib (${summerTimes.Maghrib}) should be later than Winter Maghrib (${winterTimes.Maghrib})`);

// 2. GEOGRAPHICAL DYNAMICS (different cities have different prayer times)
console.log('Testing Geographic Calculation Differences...');
const cairoCoords = { latitude: 30.0444, longitude: 31.2357 };
const tokyoCoords = { latitude: 35.6762, longitude: 139.6503 };

const cairoTimes = calculatePrayerTimes(cairoCoords, summerSolstice);
const tokyoTimes = calculatePrayerTimes(tokyoCoords, summerSolstice);

console.log('Cairo Summer:', cairoTimes);
console.log('Tokyo Summer:', tokyoTimes);

assert.notEqual(cairoTimes.Dhuhr, tokyoTimes.Dhuhr, 'Dhuhr in Cairo and Tokyo must differ');
assert.notEqual(cairoTimes.Fajr, tokyoTimes.Fajr, 'Fajr in Cairo and Tokyo must differ');

// 3. CALCULATION METHOD DYNAMICS
console.log('Testing Calculation Method Parameters...');
const ummAlQuraTimes = calculatePrayerTimes(makkahCoords, summerSolstice, { method: 'UmmAlQura' });
const isnaTimes = calculatePrayerTimes(makkahCoords, summerSolstice, { method: 'ISNA' });

console.log('UmmAlQura Fajr:', ummAlQuraTimes.Fajr, 'ISNA Fajr:', isnaTimes.Fajr);
// Umm Al-Qura uses 18.5 deg, ISNA uses 15 deg -> Fajr times must differ
assert.notEqual(ummAlQuraTimes.Fajr, isnaTimes.Fajr, 'UmmAlQura and ISNA should compute different Fajr times');

// 4. MIDNIGHT ROLLOVER & COUNTDOWN
console.log('Testing Next Prayer & Rollover...');
// Simulate 23:45 at night (after Isha)
const lateNight = new Date('2026-06-21T23:45:00');
const nextAfterIsha = getNextPrayer(summerTimes, lateNight);
console.log('Next prayer late night:', nextAfterIsha.name, nextAfterIsha.englishName, 'isTomorrow:', nextAfterIsha.isTomorrow, 'timeRemainingMs:', nextAfterIsha.timeRemainingMs);
assert.equal(nextAfterIsha.key, 'Fajr', 'After Isha, next prayer must be Fajr');
assert.equal(nextAfterIsha.isTomorrow, true, 'Next prayer should be flagged as tomorrow');
assert.ok(nextAfterIsha.timeRemainingMs > 0, 'Time remaining must be positive');

// 5. DETERMINISTIC NOTIFICATION ID GENERATION & STRESS TEST
console.log('Testing Hash Function & Collision Resilience...');
const id1 = toDeterministicNotificationId('task-abc-1');
const id2 = toDeterministicNotificationId('task-abc-1');
assert.equal(id1, id2, 'Same string must produce deterministic identical ID');
assert.ok(id1 >= 1 && id1 <= 2147483647, 'ID must be positive 32-bit integer');

// Integer preservation
assert.equal(toDeterministicNotificationId(12345), 12345, 'Positive integer IDs should be preserved');
assert.equal(toDeterministicNotificationId(2147483647), 2147483647, 'Max 32-bit signed int should be preserved');

// Hash 1000 distinct strings, verify uniqueness and valid range
const hashes = new Set();
for (let i = 0; i < 1000; i++) {
  const h = toDeterministicNotificationId(`task-unique-${i}`);
  assert.ok(h >= 1 && h <= 2147483647, `Hash out of 32-bit range: ${h}`);
  hashes.add(h);
}
console.log(`Generated 1000 IDs, unique count: ${hashes.size}`);
assert.ok(hashes.size >= 995, 'Hash collision rate must be negligible (< 0.5%)');

// 6. NOTIFICATION SCHEDULING & CANCELLATION LOGIC
console.log('Testing Notification Scheduling...');
const scheduledTask = await scheduleTaskNotification({
  id: 'adversarial-task-1',
  text: 'تحدي المراجع الجنائي',
  time: '15:45',
  date: '2026-10-06'
});
console.log('Scheduled Task ID:', scheduledTask);
assert.ok(typeof scheduledTask === 'number' && scheduledTask > 0, 'Scheduled task must return positive number');

let pending = await getPendingNotifications();
console.log('Pending count after task schedule:', pending.length);
assert.ok(pending.some(p => p.id === scheduledTask), 'Task must be in pending list');

await cancelTaskNotification('adversarial-task-1');
pending = await getPendingNotifications();
assert.ok(!pending.some(p => p.id === scheduledTask), 'Task must be removed from pending list after cancel');

// Prayer scheduling
const prayerIds = await schedulePrayerNotifications(summerTimes);
console.log('Scheduled Prayer IDs:', prayerIds);
assert.equal(prayerIds.length, 6, 'Must schedule 6 prayers (including Sunrise)');
pending = await getPendingNotifications();
assert.ok(prayerIds.every(id => pending.some(p => p.id === id)), 'All prayers must be in pending list');

// 7. LOCATION SERVICE FALLBACK VERIFICATION
console.log('Testing Location Fallback...');
const defLoc = getDefaultLocation();
assert.equal(defLoc.latitude, 21.4225);
assert.equal(defLoc.longitude, 39.8262);
assert.equal(defLoc.isFallback, true);

const curLoc = await getCurrentLocation();
console.log('Current Location resolved:', curLoc);
assert.ok(typeof curLoc.latitude === 'number');
assert.ok(typeof curLoc.longitude === 'number');
assert.equal(curLoc.isFallback, true); // Headless Node has no GPS -> falls back gracefully

console.log('--- ALL ADVERSARIAL INTEGRITY CHECKS PASSED CLEANLY ---');
