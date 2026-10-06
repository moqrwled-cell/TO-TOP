import assert from 'node:assert/strict';
import {
  CALCULATION_METHODS,
  PRAYER_NAMES,
  formatTime12Hour
} from '../../../src/services/prayerService.js';
import { getDefaultLocation } from '../../../src/services/locationService.js';
import { NOTIFICATION_CHANNELS, toDeterministicNotificationId } from '../../../src/services/notificationService.js';

// --- PROPOSED FIX 1: getNextPrayer ---
function getNextPrayerFixed(prayerTimes, currentTime = new Date()) {
  const refTime = (currentTime instanceof Date && !Number.isNaN(currentTime.getTime())) ? currentTime : new Date();

  if (!prayerTimes || typeof prayerTimes !== 'object') {
    return {
      key: 'Fajr',
      name: PRAYER_NAMES.Fajr.ar,
      englishName: PRAYER_NAMES.Fajr.en,
      time: '05:00',
      date: refTime,
      timeRemainingMs: 0,
      formattedCountdown: '00:00:00',
      isTomorrow: false
    };
  }

  const prayerKeys = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const todayPrayers = [];

  for (const key of prayerKeys) {
    const rawTime = prayerTimes[key] || prayerTimes[key.toLowerCase()];
    if (!rawTime || typeof rawTime !== 'string') continue;
    const match = rawTime.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) continue;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (h < 0 || h > 23 || m < 0 || m > 59) continue;

    const pDate = new Date(refTime);
    pDate.setHours(h, m, 0, 0);
    todayPrayers.push({
      key,
      name: PRAYER_NAMES[key]?.ar || key,
      englishName: PRAYER_NAMES[key]?.en || key,
      time: rawTime,
      date: pDate
    });
  }

  // Find first prayer in the future today
  let next = todayPrayers.find((p) => p.date.getTime() > refTime.getTime());
  let isTomorrow = false;

  if (!next) {
    // All prayers for today have passed -> Tomorrow's Fajr
    const fajrTime = (typeof prayerTimes.Fajr === 'string' && /^\d{1,2}:\d{2}$/.test(prayerTimes.Fajr))
      ? prayerTimes.Fajr
      : ((typeof prayerTimes.fajr === 'string' && /^\d{1,2}:\d{2}$/.test(prayerTimes.fajr))
          ? prayerTimes.fajr
          : '05:00');
    const [h, m] = fajrTime.split(':').map(Number);
    const tomorrowFajr = new Date(refTime);
    tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
    tomorrowFajr.setHours(h, m, 0, 0);

    next = {
      key: 'Fajr',
      name: PRAYER_NAMES.Fajr.ar,
      englishName: PRAYER_NAMES.Fajr.en,
      time: fajrTime,
      date: tomorrowFajr
    };
    isTomorrow = true;
  }

  const diffMs = Math.max(0, next.date.getTime() - refTime.getTime());
  const countdown = formatCountdownFixed(diffMs);

  return {
    key: next.key,
    name: next.name,
    englishName: next.englishName,
    time: next.time,
    date: next.date,
    timeRemainingMs: diffMs,
    formattedCountdown: countdown.formatted,
    isTomorrow
  };
}

// --- PROPOSED FIX 2: formatCountdown ---
function formatCountdownFixed(ms) {
  const safeMs = (typeof ms === 'number' && Number.isFinite(ms)) ? Math.max(0, ms) : 0;
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours,
    minutes,
    seconds,
    formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  };
}

// --- PROPOSED FIX 3: calculatePrayerTimes (specifically date normalization) ---
// Julian date calculation from Gregorian Date
function getJulianDate(year, month, day) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    b -
    1524.5
  );
}

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const fixAngle = (a) => a - 360 * Math.floor(a / 360);
const fixHour = (h) => {
  let res = h % 24;
  return res < 0 ? res + 24 : res;
};

function getSunPosition(jd) {
  const d = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * d);
  const q = fixAngle(280.459 + 0.98564736 * d);
  const L = fixAngle(q + 1.915 * Math.sin(g * D2R) + 0.020 * Math.sin(2 * g * D2R));
  const e = 23.439 - 0.00000036 * d;

  const dRad = Math.asin(Math.sin(e * D2R) * Math.sin(L * D2R));
  let ra = Math.atan2(Math.cos(e * D2R) * Math.sin(L * D2R), Math.cos(L * D2R)) * R2D;
  ra = fixAngle(ra) / 15;
  const eqt = q / 15 - ra;

  return { declination: dRad * R2D, equationOfTime: eqt };
}

function calculatePrayerTimesFixed(coords, date = new Date(), options = {}) {
  const defaultC = getDefaultLocation();
  const lat = coords?.latitude ?? defaultC.latitude;
  const lng = coords?.longitude ?? defaultC.longitude;

  // Normalized date handling (guards null, undefined, invalid Date)
  const targetDate = (date instanceof Date && !Number.isNaN(date.getTime())) ? date : new Date();

  const timezone = options.timezone !== undefined
    ? options.timezone
    : (coords?.longitude !== undefined ? Math.round(coords.longitude / 15) : -targetDate.getTimezoneOffset() / 60);

  const methodKey = options.method || 'UmmAlQura';
  const method = CALCULATION_METHODS[methodKey] || CALCULATION_METHODS.UmmAlQura;

  const y = targetDate.getFullYear();
  const m = targetDate.getMonth() + 1;
  const d = targetDate.getDate();
  const jd = getJulianDate(y, m, d);
  const sun = getSunPosition(jd);
  const dec = sun.declination;
  const eqt = sun.equationOfTime;

  const dhuhr = fixHour(12 + timezone - lng / 15 - eqt) + 1 / 60;

  function sunAngleTime(angle, direction = 'ccw') {
    const latR = lat * D2R;
    const decR = dec * D2R;
    let cosH = (Math.sin(-angle * D2R) - Math.sin(latR) * Math.sin(decR)) / (Math.cos(latR) * Math.cos(decR));
    cosH = Math.max(-1, Math.min(1, cosH));
    const h = (Math.acos(cosH) * R2D) / 15;
    return direction === 'ccw' ? dhuhr - h : dhuhr + h;
  }

  function asrTime(factor = 1) {
    const latR = lat * D2R;
    const decR = dec * D2R;
    const angle = -Math.atan(1 / (factor + Math.tan(Math.abs(latR - decR)))) * R2D;
    let cosH = (Math.sin(-angle * D2R) - Math.sin(latR) * Math.sin(decR)) / (Math.cos(latR) * Math.cos(decR));
    cosH = Math.max(-1, Math.min(1, cosH));
    const h = (Math.acos(cosH) * R2D) / 15;
    return dhuhr + h;
  }

  const sunrise = sunAngleTime(0.8333, 'ccw');
  const sunset = sunAngleTime(0.8333, 'cw');
  const fajr = sunAngleTime(method.fajrAngle, 'ccw');
  const asr = asrTime(options.asrJuristic === 'Hanafi' ? 2 : 1);
  const maghrib = sunset + 1 / 60;
  const isha = method.ishaInterval !== undefined ? maghrib + method.ishaInterval / 60 : sunAngleTime(method.ishaAngle, 'cw');

  function toHHMM(hours) {
    const fixedHours = fixHour(hours);
    const totalMinutes = Math.round(fixedHours * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const min = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  return {
    Fajr: toHHMM(fajr),
    Sunrise: toHHMM(sunrise),
    Dhuhr: toHHMM(dhuhr),
    Asr: toHHMM(asr),
    Maghrib: toHHMM(maghrib),
    Isha: toHHMM(isha)
  };
}

// --- PROPOSED FIX 4: schedulePrayerNotifications (time component validation) ---
async function schedulePrayerNotificationsFixed(prayerTimes, coords = null) {
  if (!prayerTimes || typeof prayerTimes !== 'object') {
    return [];
  }

  const prayerDefs = [
    { key: 'Fajr', id: 80001, name: 'الفجر' },
    { key: 'Sunrise', id: 80002, name: 'الشروق' },
    { key: 'Dhuhr', id: 80003, name: 'الظهر' },
    { key: 'Asr', id: 80004, name: 'العصر' },
    { key: 'Maghrib', id: 80005, name: 'المغرب' },
    { key: 'Isha', id: 80006, name: 'العشاء' }
  ];

  const scheduledIds = [];
  const now = Date.now();

  for (const item of prayerDefs) {
    const timeStr = prayerTimes[item.key] || prayerTimes[item.key.toLowerCase()];
    if (!timeStr || typeof timeStr !== 'string') continue;

    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) continue;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    // FIX: Range validation
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      continue;
    }

    let target = new Date();
    target.setHours(hours, minutes, 0, 0);

    if (target.getTime() <= now) {
      target.setDate(target.getDate() + 1);
    }

    scheduledIds.push(item.id);
  }

  return scheduledIds;
}

// --- RUN TESTS ON PROPOSED FIXES ---
console.log('Running Verification on Proposed Fixes...');

// Test 1: getNextPrayer guards against null and undefined
assert.doesNotThrow(() => {
  const res = getNextPrayerFixed(null);
  assert.equal(res.key, 'Fajr');
  assert.equal(res.timeRemainingMs, 0);
  assert.equal(res.formattedCountdown, '00:00:00');
});
assert.doesNotThrow(() => {
  const res = getNextPrayerFixed(undefined);
  assert.equal(res.key, 'Fajr');
});
console.log('✔ Test 1: getNextPrayer null/undefined guard passed');

// Test 2: formatCountdown NaN handling
assert.equal(formatCountdownFixed(NaN).formatted, '00:00:00');
assert.equal(formatCountdownFixed(0).formatted, '00:00:00');
assert.equal(formatCountdownFixed(-1000).formatted, '00:00:00');
assert.equal(formatCountdownFixed(3661000).formatted, '01:01:01');
assert.equal(formatCountdownFixed(null).formatted, '00:00:00');
assert.equal(formatCountdownFixed(undefined).formatted, '00:00:00');
console.log('✔ Test 2: formatCountdown NaN handling passed');

// Test 3: calculatePrayerTimes null/undefined date
assert.doesNotThrow(() => {
  const res = calculatePrayerTimesFixed({ latitude: 21.4225, longitude: 39.8262 }, null);
  assert.ok(res.Fajr && /^\d{2}:\d{2}$/.test(res.Fajr));
});
assert.doesNotThrow(() => {
  const res = calculatePrayerTimesFixed({ latitude: 21.4225, longitude: 39.8262 }, new Date('invalid'));
  assert.ok(res.Fajr && /^\d{2}:\d{2}$/.test(res.Fajr));
});
console.log('✔ Test 3: calculatePrayerTimes null/invalid date passed');

// Test 4: schedulePrayerNotifications out-of-range rejection
(async () => {
  const malformedTimes = {
    Fajr: 'invalid',
    Sunrise: null,
    Dhuhr: '',
    Asr: '25:99',
    Maghrib: 12345,
    Isha: 'bad'
  };
  const scheduled = await schedulePrayerNotificationsFixed(malformedTimes);
  assert.deepEqual(scheduled, []);

  const validTimes = {
    Fajr: '04:45',
    Sunrise: '06:05',
    Dhuhr: '12:20',
    Asr: '15:40',
    Maghrib: '18:30',
    Isha: '20:00'
  };
  const scheduledValid = await schedulePrayerNotificationsFixed(validTimes);
  assert.deepEqual(scheduledValid, [80001, 80002, 80003, 80004, 80005, 80006]);
  console.log('✔ Test 4: schedulePrayerNotifications out-of-range rejection passed');

  console.log('All 4 proposed fixes successfully verified!');
})();
