/**
 * src/services/prayerService.js
 * Offline Astronomical Prayer Engine with AlAdhan API background sync & countdown tracker.
 * Zero-network requirement for offline calculation; accurate to official Umm Al-Qura convention.
 */

import { getCurrentLocation, getDefaultLocation } from './locationService.js';

// Trigonometric constants & helpers
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const fixAngle = (a) => a - 360 * Math.floor(a / 360);
const fixHour = (h) => {
  let res = h % 24;
  return res < 0 ? res + 24 : res;
};

export const PRAYER_NAMES = Object.freeze({
  Fajr: { ar: 'الفجر', en: 'Fajr' },
  Sunrise: { ar: 'الشروق', en: 'Sunrise' },
  Dhuhr: { ar: 'الظهر', en: 'Dhuhr' },
  Asr: { ar: 'العصر', en: 'Asr' },
  Maghrib: { ar: 'المغرب', en: 'Maghrib' },
  Isha: { ar: 'العشاء', en: 'Isha' }
});

export const CALCULATION_METHODS = Object.freeze({
  UmmAlQura: { name: 'أم القرى (مكة المكرمة)', fajrAngle: 18.5, ishaInterval: 90 },
  MWL: { name: 'رابطة العالم الإسلامي', fajrAngle: 18.0, ishaAngle: 17.0 },
  Egypt: { name: 'الهيئة المصرية العامة للمساحة', fajrAngle: 19.5, ishaAngle: 17.5 },
  Karachi: { name: 'جامعة العلوم الإسلامية بكراتشي', fajrAngle: 18.0, ishaAngle: 18.0 },
  ISNA: { name: 'الجمعية الإسلامية لأمريكا الشمالية', fajrAngle: 15.0, ishaAngle: 15.0 }
});

/**
 * Astronomical Julian Date calculation from Gregorian Date
 */
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

/**
 * Calculate Sun Declination and Equation of Time for a given Julian Date
 */
function getSunPosition(jd) {
  const d = jd - 2451545.0; // days since J2000.0
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

/**
 * Pure offline mathematical calculation of Islamic prayer times.
 *
 * @param {Object} coords - { latitude: number, longitude: number }
 * @param {Date} [date=new Date()] - Target calculation date
 * @param {Object} [options={}] - Calculation parameters
 * @returns {Record<string, string>} { Fajr: 'HH:mm', Sunrise: 'HH:mm', Dhuhr: 'HH:mm', Asr: 'HH:mm', Maghrib: 'HH:mm', Isha: 'HH:mm' }
 */
export function calculatePrayerTimes(coords, date = new Date(), options = {}) {
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

  // Dhuhr: solar meridian transit + 1 min safety buffer
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
  const maghrib = sunset + 1 / 60; // 1 min buffer
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

/**
 * Fetch online timings from AlAdhan API with strict 3.5s timeout
 */
export async function fetchAlAdhanTimings(coords, date = new Date()) {
  const targetDate = (date instanceof Date && !Number.isNaN(date.getTime())) ? date : new Date();
  const d = String(targetDate.getDate()).padStart(2, '0');
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  const y = targetDate.getFullYear();
  const dateStr = `${d}-${m}-${y}`;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

  try {
    const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${coords.latitude}&longitude=${coords.longitude}&method=4`;
    const res = await fetch(url, controller ? { signal: controller.signal } : {});
    if (timeoutId) clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`AlAdhan HTTP ${res.status}`);
    const data = await res.json();
    if (data?.data?.timings) {
      const clean = {};
      ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach((key) => {
        const raw = data.data.timings[key];
        const match = String(raw).match(/(\d{1,2}):(\d{2})/);
        if (match) {
          clean[key] = `${match[1].padStart(2, '0')}:${match[2]}`;
        }
      });
      return clean;
    }
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Primary high-level service function.
 * Resolves location, checks daily cache, syncs online if available,
 * or computes instantly offline.
 */
export async function getPrayerTimes(options = {}) {
  const date = (options.date instanceof Date && !Number.isNaN(options.date.getTime())) ? options.date : new Date();
  const forceRefresh = options.forceRefresh || false;

  // 1. Resolve Location
  const location = await getCurrentLocation();
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const cacheKey = `to_top_prayers_${dateKey}_${location.latitude.toFixed(2)}_${location.longitude.toFixed(2)}`;

  // 2. Check Cache
  if (!forceRefresh && typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          timings: parsed.timings,
          source: parsed.source,
          isOffline: parsed.isOffline,
          location
        };
      }
    } catch (err) {
      console.warn('[prayerService] Cache read error:', err);
    }
  }

  // 3. Online enhancement attempt
  let timings = null;
  let source = 'offline-astronomical';
  let isOffline = true;

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      timings = await fetchAlAdhanTimings(location, date);
      source = 'aladhan-online';
      isOffline = false;
    } catch (err) {
      console.info('[prayerService] Online AlAdhan sync skipped/failed, using offline math:', err?.message);
    }
  }

  // 4. Offline calculation
  if (!timings) {
    timings = calculatePrayerTimes(location, date);
    source = 'offline-astronomical';
    isOffline = true;
  }

  // 5. Cache result
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ timings, source, isOffline }));
    } catch (err) {
      console.warn('[prayerService] Cache write error:', err);
    }
  }

  return {
    timings,
    source,
    isOffline,
    location
  };
}

/**
 * Determine the next upcoming prayer, target timestamp, and remaining countdown.
 *
 * @param {Record<string, string>} prayerTimes - Dictionary of prayer times ('HH:mm')
 * @param {Date} [currentTime=new Date()] - Reference time
 * @returns {Object} Next prayer metadata with formatted countdown
 */
export function getNextPrayer(prayerTimes, currentTime = new Date()) {
  const refTime = (currentTime instanceof Date && !Number.isNaN(currentTime.getTime())) ? currentTime : new Date();

  // Defensive guard: reject null, undefined, primitives, or invalid prayer objects
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
  const countdown = formatCountdown(diffMs);

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

/**
 * Format remaining milliseconds into hours, minutes, seconds and string
 */
export function formatCountdown(ms) {
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

/**
 * Format HH:mm string into localized 12-hour format ('3:33 م' / '3:33 PM')
 */
export function formatTime12Hour(timeStr, locale = 'ar') {
  if (!timeStr) return '';
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return timeStr;
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const isPM = hour >= 12;
  hour = hour % 12 || 12;

  const suffix = locale === 'ar' ? (isPM ? 'م' : 'ص') : (isPM ? 'PM' : 'AM');
  return `${hour}:${minute} ${suffix}`;
}
